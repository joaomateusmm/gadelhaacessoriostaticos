"use server";

import { asc, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { db } from "@/db";
import { clientes, itensPedido, pedidos, product } from "@/db/schema";
import { auth } from "@/lib/auth";

// ─── Admin guard ────────────────────────────────────────────────────────────

async function exigirAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") {
    throw new Error("Não autorizado");
  }
  return session;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function gerarCodigo() {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `PED-${n}`;
}

const dataBR = (d: Date | string) => {
  const dt = typeof d === "string" ? new Date(d + "T12:00:00Z") : d;
  return `${String(dt.getUTCDate()).padStart(2, "0")}/${String(dt.getUTCMonth() + 1).padStart(2, "0")}/${dt.getUTCFullYear()}`;
};

function converterBRparaISO(dataBRStr: string): string {
  const [dia, mes, ano] = dataBRStr.split("/");
  return `${ano}-${mes}-${dia}`;
}

// ─── Schemas de validação ─────────────────────────────────────────────────────

const itemInputSchema = z.object({
  produtoId: z.string().nullish(),
  nome: z.string().min(1),
  tamanho: z.string().default("M"),
  cor: z.string().default(""),
  quantidade: z.number().int().positive(),
  precoUnitario: z.number().min(0),
  separado: z.boolean().default(false),
  observacao: z.string().nullish(),
});

const pedidoInputSchema = z.object({
  clienteNome: z.string().trim().min(1),
  corporacao: z.enum(["Polícia Militar", "Polícia Penal"]),
  unidade: z.string().default(""),
  contato: z.string().default(""),
  dataPedido: z
    .string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, "Data no formato DD/MM/AAAA"),
  horarioRegistrado: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .default("10:00"),
  saldoVolus: z.number().min(0).default(0),
  saldoPorFora: z.number().min(0).default(0),
  statusPagamento: z.enum(["Pago", "Não pago"]).default("Não pago"),
  statusPedido: z.enum(["Devendo", "Entregue"]).default("Devendo"),
  statusPacote: z
    .enum(["Criado", "Não criado", "Lacrado"])
    .default("Não criado"),
  tipoPagamento: z.string().nullish(),
  tipoEntrega: z.string().nullish(),
  observacao: z.string().nullish(),
  itens: z.array(itemInputSchema).default([]),
});

// ─── Tipos exportados ─────────────────────────────────────────────────────────

export type PedidoInput = z.input<typeof pedidoInputSchema>;
export type ItemInput = z.input<typeof itemInputSchema>;

export type PedidoSistema = {
  id: string;
  codigo: string;
  clienteId: string | null;
  clienteNome: string;
  corporacao: "Polícia Militar" | "Polícia Penal";
  unidade: string | null;
  contato: string | null;
  dataPedido: string; // ISO date string YYYY-MM-DD
  horarioRegistrado: string;
  saldoVolus: string;
  saldoPorFora: string;
  statusPagamento: "Pago" | "Não pago";
  statusPedido: "Devendo" | "Entregue";
  statusPacote: "Criado" | "Não criado" | "Lacrado";
  tipoPagamento: string | null;
  tipoEntrega: string | null;
  observacao: string | null;
  createdAt: Date;
  updatedAt: Date;
  itens: ItemSistema[];
};

export type ItemSistema = {
  id: string;
  pedidoId: string;
  produtoId: string | null;
  nome: string;
  tamanho: string;
  cor: string | null;
  quantidade: number;
  precoUnitario: string;
  separado: boolean;
  observacao: string | null;
};

// ─── CRUD ─────────────────────────────────────────────────────────────────────

/** Busca todos os pedidos (com itens) */
export async function listarPedidos(filtro?: {
  statusPedido?: string;
  search?: string;
}) {
  await exigirAdmin();

  const all = await db.query.pedidos.findMany({
    orderBy: [desc(pedidos.createdAt)],
    with: { itens: true },
  });

  let resultado = all as PedidoSistema[];

  if (filtro?.statusPedido && filtro.statusPedido !== "todos") {
    resultado = resultado.filter((p) => p.statusPedido === filtro.statusPedido);
  }

  if (filtro?.search) {
    const q = filtro.search.toLowerCase();
    resultado = resultado.filter(
      (p) =>
        p.codigo.toLowerCase().includes(q) ||
        p.clienteNome.toLowerCase().includes(q) ||
        (p.unidade ?? "").toLowerCase().includes(q),
    );
  }

  return resultado;
}

/** Registra um novo pedido de balcão */
export async function registrarPedido(input: PedidoInput) {
  await exigirAdmin();

  const parsed = pedidoInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      message: "Dados inválidos.",
      erros: parsed.error.issues,
    };
  }

  const data = parsed.data;

  // Gera código único
  let codigo = gerarCodigo();
  let tentativas = 0;
  while (tentativas < 10) {
    const existente = await db.query.pedidos.findFirst({
      where: eq(pedidos.codigo, codigo),
      columns: { id: true },
    });
    if (!existente) break;
    codigo = gerarCodigo();
    tentativas++;
  }

  const isoData = converterBRparaISO(data.dataPedido);

  return db.transaction(async (tx) => {
    // Resolve ou cria cliente
    let clienteId: string | null = null;
    const clienteExistente = await tx.query.clientes.findFirst({
      where: ilike(clientes.nome, data.clienteNome.trim()),
    });

    if (clienteExistente) {
      clienteId = clienteExistente.id;
    } else {
      const [novoCliente] = await tx
        .insert(clientes)
        .values({
          nome: data.clienteNome.trim(),
          corporacao: data.corporacao,
          unidade: data.unidade,
          contato: data.contato,
        })
        .returning({ id: clientes.id });
      clienteId = novoCliente.id;
    }

    const [novoPedido] = await tx
      .insert(pedidos)
      .values({
        codigo,
        clienteId,
        clienteNome: data.clienteNome.trim(),
        corporacao: data.corporacao,
        unidade: data.unidade,
        contato: data.contato,
        dataPedido: isoData,
        horarioRegistrado: data.horarioRegistrado,
        saldoVolus: String(data.saldoVolus),
        saldoPorFora: String(data.saldoPorFora),
        statusPagamento: data.statusPagamento,
        statusPedido: data.statusPedido,
        statusPacote: data.statusPacote,
        tipoPagamento: data.tipoPagamento,
        tipoEntrega: data.tipoEntrega,
        observacao: data.observacao,
      })
      .returning({ id: pedidos.id, codigo: pedidos.codigo });

    if (data.itens.length > 0) {
      await tx.insert(itensPedido).values(
        data.itens.map((item) => ({
          pedidoId: novoPedido.id,
          produtoId: item.produtoId ?? null,
          nome: item.nome,
          tamanho: item.tamanho,
          cor: item.cor,
          quantidade: item.quantidade,
          precoUnitario: String(item.precoUnitario),
          separado: item.separado,
          observacao: item.observacao ?? null,
        })),
      );
    }

    revalidatePath("/admin/pedidos");
    return {
      success: true as const,
      message: `Pedido ${novoPedido.codigo} registrado!`,
      pedidoId: novoPedido.id,
    };
  });
}

/** Atualiza status de um pedido */
export async function atualizarStatusPedido(
  pedidoId: string,
  campo:
    | "statusPagamento"
    | "statusPedido"
    | "statusPacote"
    | "tipoPagamento"
    | "tipoEntrega",
  valor: string,
) {
  await exigirAdmin();

  try {
    await db
      .update(pedidos)
      .set({ [campo]: valor, updatedAt: new Date() })
      .where(eq(pedidos.id, pedidoId));

    revalidatePath("/admin/pedidos");
    return { success: true as const, message: "Status atualizado!" };
  } catch {
    return { success: false as const, message: "Erro ao atualizar status." };
  }
}

/** Atualiza item: marca como separado */
export async function marcarItemSeparado(itemId: string, separado: boolean) {
  await exigirAdmin();

  try {
    await db
      .update(itensPedido)
      .set({ separado })
      .where(eq(itensPedido.id, itemId));

    revalidatePath("/admin/pedidos");
    return { success: true as const };
  } catch {
    return { success: false as const };
  }
}

/** Exclui pedidos por IDs */
export async function excluirPedidos(ids: string[]) {
  await exigirAdmin();

  try {
    await db.delete(pedidos).where(inArray(pedidos.id, ids));
    revalidatePath("/admin/pedidos");
    return {
      success: true as const,
      message: `${ids.length} pedido(s) excluído(s).`,
    };
  } catch {
    return { success: false as const, message: "Erro ao excluir pedidos." };
  }
}

// ─── EXPORT v2 ────────────────────────────────────────────────────────────────

export async function exportarPedidosAction() {
  await exigirAdmin();

  const rows = await db.query.pedidos.findMany({
    orderBy: [asc(pedidos.createdAt)],
    with: { itens: true },
  });

  return {
    versao: 2,
    exportadoEm: new Date().toISOString(),
    total: rows.length,
    pedidos: rows.map((p) => ({
      codigo: p.codigo,
      cliente: p.clienteNome,
      corporacao: p.corporacao,
      unidade: p.unidade,
      contato: p.contato,
      dataPedido: dataBR(p.dataPedido),
      horarioRegistrado: p.horarioRegistrado,
      saldoVolus: Number(p.saldoVolus),
      saldoPorFora: Number(p.saldoPorFora),
      statusPagamento: p.statusPagamento,
      statusPedido: p.statusPedido,
      statusPacote: p.statusPacote,
      tipoPagamento: p.tipoPagamento,
      tipoEntrega: p.tipoEntrega,
      observacao: p.observacao ?? "",
      criadoEm: p.createdAt.toISOString(),
      itens: p.itens.map((i) => ({
        produtoId: i.produtoId,
        nome: i.nome,
        tamanho: i.tamanho,
        cor: i.cor ?? "",
        quantidade: i.quantidade,
        precoUnitario: Number(i.precoUnitario),
        separado: i.separado,
        observacao: i.observacao ?? "",
      })),
    })),
  };
}

// ─── IMPORT v2 (em lotes) ─────────────────────────────────────────────────────

const itemImportSchema = z.object({
  produtoId: z.string().nullish(),
  nome: z.string().min(1),
  tamanho: z.string().default("M"),
  cor: z.string().default(""),
  quantidade: z.number().int().positive(),
  precoUnitario: z.number().min(0),
  separado: z.boolean().default(false),
  observacao: z.string().nullish(),
});

const pedidoImportSchema = z.object({
  codigo: z.string().min(1),
  cliente: z.string().trim().min(1),
  corporacao: z.enum(["Polícia Militar", "Polícia Penal"]),
  unidade: z.string().default(""),
  contato: z.string().default(""),
  dataPedido: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/),
  horarioRegistrado: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .default("10:00"),
  saldoVolus: z.number().min(0).default(0),
  saldoPorFora: z.number().min(0).default(0),
  statusPagamento: z.enum(["Pago", "Não pago"]),
  statusPedido: z.enum(["Devendo", "Entregue"]),
  statusPacote: z.enum(["Criado", "Não criado", "Lacrado"]),
  tipoPagamento: z.string().nullish(),
  tipoEntrega: z.string().nullish(),
  observacao: z.string().nullish(),
  criadoEm: z.string().datetime().optional(),
  itens: z.array(itemImportSchema).default([]),
});

type DuplicadosPolicy = "pular" | "renomear";

export async function importarPedidosLoteAction(
  lote: unknown,
  duplicados: DuplicadosPolicy = "pular",
) {
  await exigirAdmin();

  const parsed = z.array(pedidoImportSchema).max(200).safeParse(lote);
  if (!parsed.success) {
    return {
      success: false as const,
      message: "Lote inválido.",
      erros: parsed.error.issues.slice(0, 20),
    };
  }

  const itens = parsed.data;

  return db.transaction(async (tx) => {
    // Verifica quais códigos já existem
    const codigos = itens.map((p) => p.codigo);
    const existentes = new Set(
      (
        await tx
          .select({ c: pedidos.codigo })
          .from(pedidos)
          .where(inArray(pedidos.codigo, codigos))
      ).map((r) => r.c),
    );

    // Carrega catálogo de produtos para resolver produtoId por nome
    const catalogo = await tx
      .select({ id: product.id, name: product.name })
      .from(product);
    const catalogoPorNome = new Map(
      catalogo.map((p) => [p.name.toLowerCase().trim(), p.id]),
    );
    const catalogoPorId = new Map(catalogo.map((p) => [p.id, p.id]));

    // Carrega clientes existentes para deduplicar por nome
    const todosClientes = await tx
      .select({ id: clientes.id, nome: clientes.nome })
      .from(clientes);
    const clientesPorNome = new Map(
      todosClientes.map((c) => [c.nome.toLowerCase().trim(), c.id]),
    );

    let importados = 0;
    let pulados = 0;
    const ignorados: string[] = [];

    for (const p of itens) {
      // Política de duplicidade
      if (existentes.has(p.codigo)) {
        if (duplicados === "pular") {
          pulados++;
          continue;
        }
        // "renomear": gera novo código
        let novoCodigo = gerarCodigo();
        let tentativas = 0;
        while (existentes.has(novoCodigo) && tentativas < 20) {
          novoCodigo = gerarCodigo();
          tentativas++;
        }
        p.codigo = novoCodigo;
        existentes.add(novoCodigo);
      }

      // Resolve cliente
      const nomeNorm = p.cliente.toLowerCase().trim();
      let clienteId: string | null = null;

      if (clientesPorNome.has(nomeNorm)) {
        clienteId = clientesPorNome.get(nomeNorm)!;
      } else {
        const [novoCliente] = await tx
          .insert(clientes)
          .values({
            nome: p.cliente.trim(),
            corporacao: p.corporacao,
            unidade: p.unidade,
            contato: p.contato,
          })
          .returning({ id: clientes.id });
        clienteId = novoCliente.id;
        clientesPorNome.set(nomeNorm, clienteId);
      }

      // Data: DD/MM/AAAA → YYYY-MM-DD
      const isoData = converterBRparaISO(p.dataPedido);

      const [novoPedido] = await tx
        .insert(pedidos)
        .values({
          codigo: p.codigo,
          clienteId,
          clienteNome: p.cliente.trim(),
          corporacao: p.corporacao,
          unidade: p.unidade,
          contato: p.contato,
          dataPedido: isoData,
          horarioRegistrado: p.horarioRegistrado,
          saldoVolus: String(p.saldoVolus),
          saldoPorFora: String(p.saldoPorFora),
          statusPagamento: p.statusPagamento,
          statusPedido: p.statusPedido,
          statusPacote: p.statusPacote,
          tipoPagamento: p.tipoPagamento ?? null,
          tipoEntrega: p.tipoEntrega ?? null,
          observacao: p.observacao ?? null,
          ...(p.criadoEm ? { createdAt: new Date(p.criadoEm) } : {}),
        })
        .returning({ id: pedidos.id });

      if (p.itens.length > 0) {
        await tx.insert(itensPedido).values(
          p.itens.map((i) => {
            // Resolve produtoId por id ou por nome
            let resolvedProdutoId: string | null = null;
            if (i.produtoId && catalogoPorId.has(i.produtoId)) {
              resolvedProdutoId = i.produtoId;
            } else {
              resolvedProdutoId =
                catalogoPorNome.get(i.nome.toLowerCase().trim()) ?? null;
            }

            return {
              pedidoId: novoPedido.id,
              produtoId: resolvedProdutoId,
              nome: i.nome,
              tamanho: i.tamanho,
              cor: i.cor,
              quantidade: i.quantidade,
              precoUnitario: String(i.precoUnitario),
              separado: i.separado,
              observacao: i.observacao ?? null,
            };
          }),
        );
      }

      existentes.add(p.codigo);
      importados++;
    }

    revalidatePath("/admin/pedidos");
    return {
      success: true as const,
      importados,
      pulados,
      ignorados,
    };
  });
}

/** Busca todos os IDs de pedidos para seleção global */
export async function getTodosPedidosIds(search?: string) {
  await exigirAdmin();

  const all = await db
    .select({
      id: pedidos.id,
      codigo: pedidos.codigo,
      nome: pedidos.clienteNome,
    })
    .from(pedidos);

  if (!search) return all.map((p) => p.id);

  const q = search.toLowerCase();
  return all
    .filter(
      (p) =>
        p.codigo.toLowerCase().includes(q) || p.nome.toLowerCase().includes(q),
    )
    .map((p) => p.id);
}

/** Atualiza observação de um pedido */
export async function atualizarObservacaoPedido(
  pedidoId: string,
  observacao: string,
) {
  await exigirAdmin();
  try {
    await db
      .update(pedidos)
      .set({ observacao, updatedAt: new Date() })
      .where(eq(pedidos.id, pedidoId));
    revalidatePath("/admin/pedidos");
    return { success: true as const };
  } catch {
    return { success: false as const };
  }
}

/** Lista produtos ativos para o formulário de pedido */
export async function listarProdutosAtivos() {
  const rows = await db
    .select({
      id: product.id,
      name: product.name,
      price: product.price,
      images: product.images,
    })
    .from(product)
    .where(or(ilike(product.status, "active"), ilike(product.status, "draft")));
  return rows;
}
