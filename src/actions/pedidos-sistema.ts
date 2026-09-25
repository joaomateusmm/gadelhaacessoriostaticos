"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { clientes, itensPedido, pedidos, product } from "@/db/schema";

export type Corporacao = "Polícia Militar" | "Polícia Penal";
export type StatusPagamento = "Pago" | "Não pago";
export type StatusPedido = "Devendo" | "Entregue";
export type StatusPacote = "Criado" | "Não criado" | "Lacrado";

export interface ItemPedidoItem {
  id?: string;
  produtoId?: string;
  nome: string;
  tamanho: string;
  cor?: string;
  quantidade: number;
  precoUnitario: number;
  separado?: boolean;
  observacao?: string;
}

export interface PedidoSistema {
  id: string;
  codigo: string;
  cliente: string;
  corporacao: Corporacao;
  unidade: string;
  contato: string;
  dataPedido: string;
  horarioRegistrado: string;
  observacao?: string;
  saldoVolus: number;
  saldoPorFora: number;
  statusPagamento: StatusPagamento;
  statusPedido: StatusPedido;
  statusPacote: StatusPacote;
  itens: ItemPedidoItem[];
}

export interface CriarPedidoInput {
  observacao?: string;
  clienteNome: string;
  corporacao: Corporacao;
  unidade: string;
  contato: string;
  dataPedido?: string;
  horarioRegistrado?: string;
  saldoVolus: number;
  saldoPorFora: number;
  statusPagamento: StatusPagamento;
  statusPacote: StatusPacote;
  itens: {
    produtoId?: string;
    nome: string;
    tamanho: string;
    cor?: string;
    quantidade: number;
    precoUnitario: number;
  }[];
}

export interface EditarPedidoInput {
  observacao?: string;
  clienteNome: string;
  corporacao: Corporacao;
  unidade: string;
  contato: string;
  dataPedido?: string;
  horarioRegistrado?: string;
  saldoVolus: number;
  saldoPorFora: number;
  statusPagamento: StatusPagamento;
  statusPedido: StatusPedido;
  statusPacote: StatusPacote;
  itens: {
    produtoId?: string;
    nome: string;
    tamanho: string;
    cor?: string;
    quantidade: number;
    precoUnitario: number;
    separado?: boolean;
  }[];
}

function converterBRparaISO(dataBR: string): string {
  const partes = dataBR.split("/");
  if (partes.length === 3) {
    return `${partes[2]}-${partes[1].padStart(2, "0")}-${partes[0].padStart(2, "0")}T12:00:00Z`;
  }
  return dataBR;
}

export async function obterProdutosParaPedidoAction() {
  try {
    const list = await db.select().from(product).where(eq(product.status, "active"));
    return list.map((p) => ({
      id: p.id,
      nome: p.name,
      preco: p.price / 100, // Converte de centavos para R$ reais
      tamanhos: p.tamanhos || ["M"],
      cores: p.cores || ["Preto"],
    }));
  } catch (error) {
    console.error("Erro ao buscar produtos para pedido:", error);
    return [];
  }
}

export async function obterPedidosSistemaAction(): Promise<PedidoSistema[]> {
  try {
    const resultado = await db.query.pedidos.findMany({
      orderBy: [desc(pedidos.createdAt)],
      with: {
        itens: true,
      },
    });

    return resultado.map((p) => {
      const dataStr = p.dataPedido
        ? `${String(p.dataPedido.getUTCDate()).padStart(2, "0")}/${String(
            p.dataPedido.getUTCMonth() + 1,
          ).padStart(2, "0")}/${p.dataPedido.getUTCFullYear()}`
        : "";

      return {
        id: p.id,
        codigo: p.codigo,
        cliente: p.clienteNome,
        corporacao: p.corporacao as Corporacao,
        unidade: p.unidade,
        contato: p.contato,
        dataPedido: dataStr,
        horarioRegistrado: p.horarioRegistrado,
        observacao: p.observacao || "",
        saldoVolus: Number(p.saldoVolus),
        saldoPorFora: Number(p.saldoPorFora),
        statusPagamento: p.statusPagamento as StatusPagamento,
        statusPedido: p.statusPedido as StatusPedido,
        statusPacote: p.statusPacote as StatusPacote,
        itens: p.itens.map((item) => ({
          id: item.id,
          produtoId: item.produtoId || undefined,
          nome: item.nome,
          tamanho: item.tamanho,
          cor: item.cor || "",
          quantidade: item.quantidade,
          precoUnitario: Number(item.precoUnitario),
          separado: item.separado,
          observacao: item.observacao || undefined,
        })),
      };
    });
  } catch (error) {
    console.error("Erro ao buscar pedidos:", error);
    return [];
  }
}

export async function obterPedidoSistemaPorIdAction(id: string): Promise<PedidoSistema | null> {
  try {
    const p = await db.query.pedidos.findFirst({
      where: eq(pedidos.id, id),
      with: {
        itens: true,
      },
    });

    if (!p) return null;

    const dataStr = p.dataPedido
      ? `${String(p.dataPedido.getUTCDate()).padStart(2, "0")}/${String(
          p.dataPedido.getUTCMonth() + 1,
        ).padStart(2, "0")}/${p.dataPedido.getUTCFullYear()}`
      : "";

    return {
      id: p.id,
      codigo: p.codigo,
      cliente: p.clienteNome,
      corporacao: p.corporacao as Corporacao,
      unidade: p.unidade,
      contato: p.contato,
      dataPedido: dataStr,
      horarioRegistrado: p.horarioRegistrado,
      observacao: p.observacao || "",
      saldoVolus: Number(p.saldoVolus),
      saldoPorFora: Number(p.saldoPorFora),
      statusPagamento: p.statusPagamento as StatusPagamento,
      statusPedido: p.statusPedido as StatusPedido,
      statusPacote: p.statusPacote as StatusPacote,
      itens: p.itens.map((item) => ({
        id: item.id,
        produtoId: item.produtoId || undefined,
        nome: item.nome,
        tamanho: item.tamanho,
        cor: item.cor || "",
        quantidade: item.quantidade,
        precoUnitario: Number(item.precoUnitario),
        separado: item.separado,
        observacao: item.observacao || undefined,
      })),
    };
  } catch (error) {
    console.error("Erro ao buscar pedido por ID:", error);
    return null;
  }
}

export async function alternarStatusPacoteAction(pedidoId: string, novoStatus: StatusPacote) {
  try {
    await db
      .update(pedidos)
      .set({
        statusPacote: novoStatus,
        updatedAt: new Date(),
      })
      .where(eq(pedidos.id, pedidoId));

    revalidatePath("/admin/pedidos");
    return { success: true };
  } catch (error) {
    console.error("Erro ao alternar status do pacote:", error);
    return { success: false };
  }
}

export async function alternarItemSeparadoAction(itemId: string, novoValor: boolean) {
  try {
    await db
      .update(itensPedido)
      .set({ separado: novoValor })
      .where(eq(itensPedido.id, itemId));
    revalidatePath("/admin/pedidos");
    return { success: true };
  } catch (error) {
    console.error("Erro ao alternar item:", error);
    return { success: false };
  }
}

export async function concluirPedidoSistemaAction(pedidoId: string) {
  try {
    await db
      .update(itensPedido)
      .set({ separado: true })
      .where(eq(itensPedido.pedidoId, pedidoId));

    await db
      .update(pedidos)
      .set({
        statusPedido: "Entregue",
        statusPacote: "Criado",
        updatedAt: new Date(),
      })
      .where(eq(pedidos.id, pedidoId));

    revalidatePath("/admin/pedidos");
    return { success: true };
  } catch (error) {
    console.error("Erro ao concluir pedido:", error);
    return { success: false };
  }
}

export async function reverterPedidoSistemaAction(pedidoId: string) {
  try {
    await db
      .update(pedidos)
      .set({
        statusPedido: "Devendo",
        updatedAt: new Date(),
      })
      .where(eq(pedidos.id, pedidoId));

    revalidatePath("/admin/pedidos");
    return { success: true };
  } catch (error) {
    console.error("Erro ao reverter pedido:", error);
    return { success: false };
  }
}

export async function editarPedidoSistemaAction(pedidoId: string, input: EditarPedidoInput) {
  try {
    let dataObj: Date | undefined;
    if (input.dataPedido) {
      const isoTentativa = new Date(converterBRparaISO(input.dataPedido));
      if (!isNaN(isoTentativa.getTime())) dataObj = isoTentativa;
    }

    await db
      .update(pedidos)
      .set({
        clienteNome: input.clienteNome,
        corporacao: input.corporacao,
        unidade: input.unidade,
        contato: input.contato,
        ...(dataObj ? { dataPedido: dataObj } : {}),
        horarioRegistrado: input.horarioRegistrado,
        observacao: input.observacao || "",
        saldoVolus: input.saldoVolus.toString(),
        saldoPorFora: input.saldoPorFora.toString(),
        statusPagamento: input.statusPagamento,
        statusPedido: input.statusPedido,
        statusPacote: input.statusPacote,
        updatedAt: new Date(),
      })
      .where(eq(pedidos.id, pedidoId));

    await db.delete(itensPedido).where(eq(itensPedido.pedidoId, pedidoId));

    if (input.itens.length > 0) {
      await db.insert(itensPedido).values(
        input.itens.map((item) => ({
          pedidoId,
          produtoId: item.produtoId || null,
          nome: item.nome,
          tamanho: item.tamanho,
          cor: item.cor || "",
          quantidade: item.quantidade,
          precoUnitario: item.precoUnitario.toString(),
          separado: item.separado ?? false,
        })),
      );
    }

    revalidatePath("/admin/pedidos");
    return { success: true };
  } catch (error) {
    console.error("Erro ao editar pedido:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao editar pedido.",
    };
  }
}

export async function excluirPedidoSistemaAction(pedidoId: string) {
  try {
    await db.delete(itensPedido).where(eq(itensPedido.pedidoId, pedidoId));
    await db.delete(pedidos).where(eq(pedidos.id, pedidoId));
    revalidatePath("/admin/pedidos");
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir pedido:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao excluir pedido.",
    };
  }
}

export async function criarPedidoSistemaAction(input: CriarPedidoInput) {
  try {
    let clienteId: string | undefined = undefined;
    const clientesExistentes = await db
      .select()
      .from(clientes)
      .where(eq(clientes.nome, input.clienteNome))
      .limit(1);

    if (clientesExistentes.length > 0) {
      clienteId = clientesExistentes[0].id;
    } else {
      const [novoCliente] = await db
        .insert(clientes)
        .values({
          nome: input.clienteNome,
          corporacao: input.corporacao,
          unidade: input.unidade,
          contato: input.contato,
        })
        .returning({ id: clientes.id });
      clienteId = novoCliente?.id;
    }

    const codigo = `PED-${Math.floor(1000 + Math.random() * 8999)}`;
    let dataObj = input.dataPedido ? new Date(converterBRparaISO(input.dataPedido)) : new Date();
    if (isNaN(dataObj.getTime())) {
      dataObj = new Date();
    }

    const [novoPedido] = await db
      .insert(pedidos)
      .values({
        codigo,
        clienteId,
        clienteNome: input.clienteNome,
        corporacao: input.corporacao,
        unidade: input.unidade,
        contato: input.contato,
        dataPedido: dataObj,
        horarioRegistrado: input.horarioRegistrado || "10:00",
        saldoVolus: input.saldoVolus.toString(),
        saldoPorFora: input.saldoPorFora.toString(),
        statusPagamento: input.statusPagamento,
        statusPedido: "Devendo",
        statusPacote: input.statusPacote,
        observacao: input.observacao || "",
      })
      .returning();

    if (input.itens.length > 0) {
      await db.insert(itensPedido).values(
        input.itens.map((item) => ({
          pedidoId: novoPedido.id,
          produtoId: item.produtoId || null,
          nome: item.nome,
          tamanho: item.tamanho,
          cor: item.cor || "",
          quantidade: item.quantidade,
          precoUnitario: item.precoUnitario.toString(),
          separado: false,
        })),
      );
    }

    revalidatePath("/admin/pedidos");
    return {
      success: true,
      pedidoId: novoPedido.id,
      codigo: novoPedido.codigo,
    };
  } catch (error) {
    console.error("Erro ao registrar pedido:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao salvar pedido.",
    };
  }
}

export interface JsonPedidoImportItem {
  codigo?: string;
  cliente: string;
  corporacao: Corporacao;
  unidade?: string;
  contato?: string;
  dataPedido?: string;
  horarioRegistrado?: string;
  saldoVolus?: number;
  saldoPorFora?: number;
  statusPagamento?: StatusPagamento;
  statusPedido?: StatusPedido;
  statusPacote?: StatusPacote;
  observacao?: string | null;
  itens?: {
    produtoId?: string;
    nome: string;
    tamanho: string;
    cor?: string;
    quantidade: number;
    precoUnitario: number;
    separado?: boolean;
  }[];
}

export async function importPedidosFromJson(items: JsonPedidoImportItem[]) {
  if (!Array.isArray(items) || items.length === 0) {
    return { success: false, message: "O arquivo JSON de pedidos está vazio ou é inválido." };
  }

  try {
    // Carregar catálogo de produtos para relacionar produtoId se possível
    const existingProducts = await db.select().from(product);
    const productMap = new Map<string, string>(); // lowercase name -> id
    existingProducts.forEach((p) => {
      productMap.set(p.name.toLowerCase().trim(), p.id);
      if (p.id) {
        productMap.set(p.id, p.id);
      }
    });

    // Carregar clientes existentes para reutilizar clienteId
    const existingClientes = await db.select().from(clientes);
    const clienteMap = new Map<string, string>(); // lowercase name -> id
    existingClientes.forEach((c) => {
      clienteMap.set(c.nome.toLowerCase().trim(), c.id);
    });

    let importedCount = 0;

    for (const item of items) {
      if (!item.cliente || !item.cliente.trim()) continue;

      const clienteNome = item.cliente.trim();
      const corporacao = item.corporacao || "Polícia Penal";
      const unidade = item.unidade || "";
      const contato = item.contato || "";

      // Verificar ou criar cliente
      let clienteId: string | undefined = clienteMap.get(clienteNome.toLowerCase());

      if (!clienteId) {
        const [novoCliente] = await db
          .insert(clientes)
          .values({
            nome: clienteNome,
            corporacao,
            unidade,
            contato,
          })
          .returning({ id: clientes.id });
        clienteId = novoCliente?.id;
        if (clienteId) {
          clienteMap.set(clienteNome.toLowerCase(), clienteId);
        }
      }

      // Processar data
      let dataObj = item.dataPedido ? new Date(converterBRparaISO(item.dataPedido)) : new Date();
      if (isNaN(dataObj.getTime())) {
        dataObj = new Date();
      }

      const codigo = item.codigo && item.codigo.trim().length > 0
        ? item.codigo.trim()
        : `PED-${Math.floor(1000 + Math.random() * 8999)}`;

      const [novoPedido] = await db
        .insert(pedidos)
        .values({
          codigo,
          clienteId: clienteId || null,
          clienteNome,
          corporacao,
          unidade,
          contato,
          dataPedido: dataObj,
          horarioRegistrado: item.horarioRegistrado || "10:00",
          saldoVolus: typeof item.saldoVolus === "number" ? item.saldoVolus.toString() : "0",
          saldoPorFora: typeof item.saldoPorFora === "number" ? item.saldoPorFora.toString() : "0",
          statusPagamento: item.statusPagamento || "Não pago",
          statusPedido: item.statusPedido || "Devendo",
          statusPacote: item.statusPacote || "Não criado",
          observacao: item.observacao || "",
        })
        .returning();

      if (Array.isArray(item.itens) && item.itens.length > 0) {
        await db.insert(itensPedido).values(
          item.itens.map((it) => {
            let prodId: string | null = null;
            if (it.produtoId && productMap.has(it.produtoId)) {
              prodId = productMap.get(it.produtoId)!;
            } else if (it.nome && productMap.has(it.nome.toLowerCase().trim())) {
              prodId = productMap.get(it.nome.toLowerCase().trim())!;
            }

            return {
              pedidoId: novoPedido.id,
              produtoId: prodId,
              nome: it.nome,
              tamanho: it.tamanho || "M",
              cor: it.cor || "",
              quantidade: typeof it.quantidade === "number" ? it.quantidade : 1,
              precoUnitario: typeof it.precoUnitario === "number" ? it.precoUnitario.toString() : "0",
              separado: typeof it.separado === "boolean" ? it.separado : false,
            };
          })
        );
      }

      importedCount++;
    }

    revalidatePath("/admin/pedidos");
    revalidatePath("/");

    return {
      success: true,
      message: `${importedCount} pedidos importados com sucesso!`,
    };
  } catch (error) {
    console.error("Erro na importação JSON de pedidos:", error);
    return {
      success: false,
      message: "Erro ao importar pedidos do arquivo JSON.",
    };
  }
}
