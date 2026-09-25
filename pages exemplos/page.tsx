"use client";

import Link from "next/link";
import { TabelaPedidos } from "@/components/pedidos/tabela-pedidos";
import { BotaoPrimario, BotaoSecundario } from "@/components/ui/botoes";
import { useContextPedidos } from "@/context/pedidos-context";
import { brl, totalPedido } from "@/lib/format";

/* -------------------------------------------------------------------------- */
/*                         FUNÇÃO AUXILIAR DE ORDENAÇÃO                       */
/* -------------------------------------------------------------------------- */

/**
 * Atribui um peso numérico ao tamanho para permitir a ordenação decrescente
 * (maiores tamanhos no topo, menores tamanhos no final).
 */
function obterPesoTamanho(tamanho: string): number {
  if (!tamanho) return -1;
  const tamUpper = tamanho.trim().toUpperCase();

  // 1. Caso seja um tamanho numérico (ex: "54", "42", "38")
  const num = parseInt(tamUpper, 10);
  if (!isNaN(num) && String(num) === tamUpper) {
    return num; // Retorna o próprio número como peso (ex: 54 > 42)
  }

  // 2. Mapeamento para tamanhos em letras (quanto maior a letra, maior o peso)
  const ordemLetras: Record<string, number> = {
    "3XG": 107,
    XXG: 106,
    "2XG": 106,
    XG: 105,
    EXG: 105,
    GG: 104,
    G: 103,
    M: 102,
    P: 101,
    PP: 100,
    PPP: 99,
  };

  if (ordemLetras[tamUpper] !== undefined) {
    return ordemLetras[tamUpper];
  }

  return 0; // Para tamanhos não mapeados ou únicos
}

export default function VisaoGeralPage() {
  const { pedidos } = useContextPedidos();

  // 1. Filtros de Pedidos principais
  const devendo = pedidos.filter((p) => p.statusPedido === "Devendo");
  const naoPagos = pedidos.filter((p) => p.statusPagamento === "Não pago");

  // Totais gerais de itens a separar
  const pecasFaltando = devendo.reduce(
    (t, p) =>
      t +
      p.itens.filter((i) => !i.separado).reduce((s, i) => s + i.quantidade, 0),
    0,
  );
  const valorEmAberto = devendo.reduce((t, p) => t + totalPedido(p), 0);
  const itensTotais = devendo.reduce((t, p) => t + p.itens.length, 0);
  const itensSeparados = devendo.reduce(
    (t, p) => t + p.itens.filter((i) => i.separado).length,
    0,
  );
  const progresso = itensTotais
    ? Math.round((itensSeparados / itensTotais) * 100)
    : 100;

  // 2. Agrupamento e Ordenação de Produtos por Tamanho/Cor
  const mapaProdutos = new Map<
    string,
    Map<
      string,
      {
        rotulo: string;
        tamanho: string;
        cor: string;
        quantidadeTotal: number;
        pendente: number;
      }
    >
  >();

  devendo.forEach((pedido) => {
    pedido.itens.forEach((item) => {
      const nomeProduto = item.nome;
      const tamanho = item.tamanho || "";
      const cor = item.cor || "";

      // Chave única para o mapa de variações
      const chaveVariacao = `${tamanho}_${cor}`;

      // Monta a etiqueta exibida na tela
      let rotulo = "";
      if (tamanho && cor) {
        rotulo = `Tam: ${tamanho} | Cor: ${cor}`;
      } else if (tamanho) {
        rotulo = `Tam: ${tamanho}`;
      } else if (cor) {
        rotulo = `Cor: ${cor}`;
      } else {
        rotulo = "Tamanho Único";
      }

      if (!mapaProdutos.has(nomeProduto)) {
        mapaProdutos.set(nomeProduto, new Map());
      }

      const mapaVariacoes = mapaProdutos.get(nomeProduto)!;
      const atual = mapaVariacoes.get(chaveVariacao) || {
        rotulo,
        tamanho,
        cor,
        quantidadeTotal: 0,
        pendente: 0,
      };

      const qtdPendente = item.separado ? 0 : item.quantidade;

      mapaVariacoes.set(chaveVariacao, {
        rotulo,
        tamanho,
        cor,
        quantidadeTotal: atual.quantidadeTotal + item.quantidade,
        pendente: atual.pendente + qtdPendente,
      });
    });
  });

  // Converte o Mapa para Array e aplica a ordenação nos tamanhos de cada produto
  const resumoProdutos = Array.from(mapaProdutos.entries()).map(
    ([nome, mapaVars]) => {
      const variacoesOrdenadas = Array.from(mapaVars.values()).sort((a, b) => {
        const pesoA = obterPesoTamanho(a.tamanho);
        const pesoB = obterPesoTamanho(b.tamanho);
        // Ordenação decrescente: maior peso primeiro
        return pesoB - pesoA;
      });

      return {
        nome,
        variacoes: variacoesOrdenadas,
      };
    },
  );

  // 3. Agrupamento de Clientes Registados
  const mapaClientes = new Map<
    string,
    {
      id: string;
      nome: string;
      corporacao: string;
      unidade: string;
      contato: string;
      totalPedidos: number;
      totalGasto: number;
    }
  >();

  pedidos.forEach((p) => {
    const chave = `${p.cliente}-${p.contato}`;
    const clienteExistente = mapaClientes.get(chave);
    const valorDoPedido = totalPedido(p);

    if (clienteExistente) {
      clienteExistente.totalPedidos += 1;
      clienteExistente.totalGasto += valorDoPedido;
    } else {
      mapaClientes.set(chave, {
        id: chave,
        nome: p.cliente,
        corporacao: p.corporacao,
        unidade: p.unidade,
        contato: p.contato,
        totalPedidos: 1,
        totalGasto: valorDoPedido,
      });
    }
  });

  const clientesRegistados = Array.from(mapaClientes.values());

  return (
    <div className="space-y-8 p-4 md:px-8 md:py-4 lg:p-8">
      {/* SEÇÃO 1: CABEÇALHO DA LOJA */}
      <section className="relative overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900 px-6 py-8 sm:px-10 sm:py-10">
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="text-sm text-neutral-400">Situação da loja hoje</p>
            <p className="mt-3 text-2xl font-semibold leading-snug tracking-tight text-white sm:text-3xl">
              {devendo.length} pedidos em aberto, com {pecasFaltando} peças
              ainda para separar.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/admin/registrar-pedidos">
                <BotaoPrimario>Registrar pedido</BotaoPrimario>
              </Link>
              <Link href="/admin/pedidos">
                <BotaoSecundario>Ver pedidos em aberto</BotaoSecundario>
              </Link>
            </div>
          </div>

          <div className="w-full max-w-xs rounded-2xl border border-neutral-800 bg-neutral-950 p-5">
            <div className="flex items-baseline justify-between">
              <p className="text-sm text-neutral-400">Separação concluída</p>
              <p className="text-2xl font-semibold tabular-nums text-white">
                {progresso}%
              </p>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-neutral-800">
              <div
                className="h-full rounded-full bg-neutral-100 transition-all duration-500"
                style={{ width: `${progresso}%` }}
              />
            </div>
            <p className="mt-3 text-xs text-neutral-500">
              {itensSeparados} de {itensTotais} linhas de produto já foram para
              o pacote.
            </p>
          </div>
        </div>
      </section>

      {/* SEÇÃO 2: INDICADORES RESUMIDOS */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Indicador
          titulo="Pedidos em aberto"
          valor={String(devendo.length)}
          nota="Status devendo"
        />
        <Indicador
          titulo="Peças a separar"
          valor={String(pecasFaltando)}
          nota="Somando todos os pedidos"
        />
        <Indicador
          titulo="Valor em aberto"
          valor={brl(valorEmAberto)}
          nota="Produtos ainda devidos"
        />
        <Indicador
          titulo="Pagamentos pendentes"
          valor={String(naoPagos.length)}
          nota="Cobrança a fazer"
        />
      </section>

      {/* SEÇÃO 3: DETALHAMENTO DE ITENS POR TAMANHO / COR (ORDENADO) */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-white">
            Detalhamento de Itens a Separar (Por Tamanho / Cor)
          </h2>
          <p className="text-xs text-neutral-400">
            Organizado do maior tamanho para o menor tamanho.
          </p>
        </div>

        {resumoProdutos.length === 0 ? (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 text-center text-sm text-neutral-500">
            Nenhum item pendente de separação no momento.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resumoProdutos.map((prod) => (
              <div
                key={prod.nome}
                className="flex flex-col justify-between rounded-2xl border border-neutral-800 bg-neutral-900 p-5"
              >
                <div>
                  <h3 className="font-semibold text-white">{prod.nome}</h3>
                  <div className="mt-3 divide-y divide-neutral-800">
                    {prod.variacoes.map((v) => (
                      <div
                        key={v.rotulo}
                        className="flex items-center justify-between py-2 text-sm"
                      >
                        <span className="text-neutral-300">{v.rotulo}</span>
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-neutral-800 px-2.5 py-0.5 text-xs font-medium text-white">
                            {v.quantidadeTotal} un.
                          </span>
                          {v.pendente > 0 && (
                            <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400 border border-amber-500/20">
                              {v.pendente} a separar
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SEÇÃO 4: PEDIDOS RECENTES */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-base font-semibold tracking-tight text-white">
            Pedidos recentes
          </h2>
          <Link
            href="/admin/pedidos"
            className="text-sm text-neutral-400 transition-colors hover:text-white"
          >
            Ver todos
          </Link>
        </div>
        <TabelaPedidos pedidos={pedidos.slice(0, 4)} />
      </section>

      {/* SEÇÃO 5: TABELA MINIMALISTA DE CLIENTES */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-white">
              Todos os Clientes Registados
            </h2>
            <p className="text-xs text-neutral-400">
              Listagem geral de clientes ativos na plataforma.
            </p>
          </div>
          <span className="rounded-full bg-neutral-800 px-3 py-1 text-xs font-medium text-neutral-300">
            Total: {clientesRegistados.length}
          </span>
        </div>

        <TabelaClientesMinimalista clientes={clientesRegistados} />
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                            COMPONENTES AUXILIARES                          */
/* -------------------------------------------------------------------------- */

function Indicador({
  titulo,
  valor,
  nota,
}: {
  titulo: string;
  valor: string;
  nota: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 px-5 py-5 transition-colors hover:border-neutral-700">
      <p className="text-sm text-neutral-400">{titulo}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
        {valor}
      </p>
      <p className="mt-1 text-xs text-neutral-500">{nota}</p>
    </div>
  );
}

interface ClienteItem {
  id: string;
  nome: string;
  corporacao: string;
  unidade: string;
  contato: string;
  totalPedidos: number;
  totalGasto: number;
}

function TabelaClientesMinimalista({ clientes }: { clientes: ClienteItem[] }) {
  if (clientes.length === 0) {
    return (
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 text-center text-sm text-neutral-500">
        Nenhum cliente registado até ao momento.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-neutral-300">
          <thead className="border-b border-neutral-800 bg-neutral-950/50 text-xs text-neutral-400 uppercase tracking-wider">
            <tr>
              <th scope="col" className="px-6 py-3.5 font-medium">
                Cliente
              </th>
              <th scope="col" className="px-6 py-3.5 font-medium">
                Corporação / Unidade
              </th>
              <th scope="col" className="px-6 py-3.5 font-medium">
                Contato
              </th>
              <th scope="col" className="px-6 py-3.5 font-medium text-center">
                Pedidos
              </th>
              <th scope="col" className="px-6 py-3.5 font-medium text-right">
                Total Acumulado
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {clientes.map((cliente) => (
              <tr
                key={cliente.id}
                className="transition-colors hover:bg-neutral-800/40"
              >
                <td className="px-6 py-4 font-medium text-white whitespace-nowrap">
                  {cliente.nome}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-neutral-400">
                  <span>{cliente.corporacao}</span>
                  <span className="mx-1 text-neutral-600">•</span>
                  <span className="text-xs text-neutral-400">
                    {cliente.unidade}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-neutral-400">
                  {cliente.contato}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className="rounded-full bg-neutral-800 px-2.5 py-1 text-xs text-white">
                    {cliente.totalPedidos}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-white">
                  {brl(cliente.totalGasto)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
