import { count, eq, sql, sum } from "drizzle-orm";
import {
  Activity,
  Award,
  DollarSign,
  Layers,
  MessageSquare,
  Package,
  Star,
  Users,
} from "lucide-react";
import { Fragment } from "react";

import { obterPedidosSistemaAction } from "@/actions/pedidos-sistema";
import { RevenueChart } from "@/components/admin/revenue-chart";
// IMPORTANTE: Importe o novo gráfico de vendas
import { SalesChart } from "@/components/admin/sales-chart";
import { db } from "@/db";
import { brand, category, order, product, review, user } from "@/db/schema";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
};

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
    return num;
  }

  // 2. Mapeamento para tamanhos em letras
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

  return 0;
}

/**
 * Mapeia nomes de cores em português para valores CSS.
 * Retorna null se a cor não for reconhecida.
 */
function corParaCss(cor: string): string | null {
  const mapa: Record<string, string> = {
    preto: "#000",
    branco: "#fff",
    cinza: "#9ca3af",
    caqui: "#c8a97e",
    bege: "#e8d9b5",
    areia: "#d4b896",
    marrom: "#92400e",
    vermelho: "#ef4444",
    vinho: "#7f1d1d",
    bordo: "#881337",
    rosa: "#f472b6",
    roxo: "#a855f7",
    lilas: "#c084fc",
    azul: "#3b82f6",
    "azul marinho": "#1e3a5f",
    "azul royal": "#1d4ed8",
    verde: "#22c55e",
    "verde militar": "#4b5320",
    "verde musgo": "#556b2f",
    laranja: "#f97316",
    amarelo: "#facc15",
    dourado: "#d4a017",
    prata: "#c0c0c0",
  };
  return mapa[cor.toLowerCase()] ?? null;
}

export default async function AdminDashboard() {
  const [
    totalRevenueRes,
    totalSalesRes,
    activeProductsRes,
    totalUsersRes,
    avgRatingRes,
    totalCategoriesRes,
    totalBrandsRes,
    totalReviewsRes,
    ordersForChart,
    pedidosSistema,
  ] = await Promise.all([
    db
      .select({ value: sum(order.amount) })
      .from(order)
      .where(eq(order.status, "paid")),

    db.select({ count: count() }).from(order).where(eq(order.status, "paid")),

    db
      .select({ count: count() })
      .from(product)
      .where(eq(product.status, "active")),

    db.select({ count: count() }).from(user),

    db.select({ avg: sql<number>`avg(${review.rating})` }).from(review),

    db.select({ count: count() }).from(category),
    db.select({ count: count() }).from(brand),
    db.select({ count: count() }).from(review),

    db
      .select({ amount: order.amount, createdAt: order.createdAt })
      .from(order)
      .where(eq(order.status, "paid")),

    obterPedidosSistemaAction(),
  ]);

  const totalRevenue = totalRevenueRes[0]?.value
    ? Number(totalRevenueRes[0].value)
    : 0;
  const totalSales = totalSalesRes[0]?.count || 0;
  const activeProducts = activeProductsRes[0]?.count || 0;
  const totalUsers = totalUsersRes[0]?.count || 0;

  const rawAvg = avgRatingRes[0]?.avg || 0;
  const avgRating = Number(rawAvg).toFixed(1);

  const stats = {
    categories: totalCategoriesRes[0]?.count || 0,
    brands: totalBrandsRes[0]?.count || 0,
    reviews: totalReviewsRes[0]?.count || 0,
    cartItems: 0,
    favorites: 0,
  };

  // --- LÓGICA DE DETALHAMENTO DE PRODUTOS A SEPARAR DA PÁGINA DE EXEMPLO ---
  const devendo = pedidosSistema.filter((p) => p.statusPedido === "Devendo");

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

      const chaveVariacao = `${tamanho}_${cor}`;

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

  const resumoProdutos = Array.from(mapaProdutos.entries()).map(
    ([nome, mapaVars]) => {
      const prioridade = (cor: string) =>
        cor.toLowerCase() === "preto" ? 0 : 1;

      const variacoesOrdenadas = Array.from(mapaVars.values()).sort((a, b) => {
        // 1. Preto sempre primeiro
        const pA = prioridade(a.cor || "");
        const pB = prioridade(b.cor || "");
        if (pA !== pB) return pA - pB;
        // 2. Demais cores em ordem alfabética
        const corA = (a.cor || "").toLowerCase();
        const corB = (b.cor || "").toLowerCase();
        if (corA < corB) return -1;
        if (corA > corB) return 1;
        // 3. Dentro da mesma cor, tamanho (maior → menor)
        return obterPesoTamanho(b.tamanho) - obterPesoTamanho(a.tamanho);
      });

      const totalDoProduto = variacoesOrdenadas.reduce(
        (acc, v) => acc + v.quantidadeTotal,
        0,
      );
      const pendentesDoProduto = variacoesOrdenadas.reduce(
        (acc, v) => acc + v.pendente,
        0,
      );

      return {
        nome,
        variacoes: variacoesOrdenadas,
        totalDoProduto,
        pendentesDoProduto,
      };
    },
  );

  // --- LÓGICA DOS GRÁFICOS (Revenue + Sales) ---
  const dailyRevenueMap = new Map<string, number>();
  const dailySalesMap = new Map<string, number>();

  ordersForChart.forEach((o) => {
    const dateKey = new Date(o.createdAt).toISOString().split("T")[0];

    const currentRev = dailyRevenueMap.get(dateKey) || 0;
    dailyRevenueMap.set(dateKey, currentRev + o.amount / 100);

    const currentSales = dailySalesMap.get(dateKey) || 0;
    dailySalesMap.set(dateKey, currentSales + 1);
  });

  const revenueChartData = [];
  const salesChartData = [];
  const today = new Date();

  for (let i = 95; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateKey = d.toISOString().split("T")[0];

    revenueChartData.push({
      date: dateKey,
      revenue: dailyRevenueMap.get(dateKey) || 0,
    });

    salesChartData.push({
      date: dateKey,
      sales: dailySalesMap.get(dateKey) || 0,
    });
  }

  return (
    <div className="space-y-8 px-8 pb-8">
      {/* HEADER */}
      <div>
        <h1 className="font-clash-display text-3xl font-medium text-white">
          Dashboard
        </h1>
        <p className="text-neutral-400">
          Visão geral e métricas da sua loja em tempo real.
        </p>
      </div>

      {/* --- SEÇÃO 1: CARDS MAIORES (KPIs) --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Receita */}
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#0A0A0A] p-6 shadow-lg transition-all hover:border-[#D00000]/30">
          <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-[#D00000]/5 blur-2xl" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-400">
              Receita Total{" "}
              <span className="text-xs text-neutral-500">(valor real)</span>
            </span>
            <div className="rounded-full bg-[#D00000]/10 p-2 text-[#D00000]">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">
              {formatCurrency(totalRevenue)}
            </span>
            <span className="text-xs font-medium text-green-500">
              +12% este mês
            </span>
          </div>
        </div>

        {/* Vendas */}
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#0A0A0A] p-6 shadow-lg transition-all hover:border-[#D00000]/30">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-400">
              Vendas Concluídas
            </span>
            <div className="rounded-full bg-[#D00000]/10 p-2 text-[#D00000]">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-bold text-white">{totalSales}</div>
        </div>

        {/* Produtos Ativos */}
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#0A0A0A] p-6 shadow-lg transition-all hover:border-[#D00000]/30">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-400">
              Produtos Ativos
            </span>
            <div className="rounded-full bg-[#D00000]/10 p-2 text-[#D00000]">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-bold text-white">
            {activeProducts}
          </div>
        </div>

        {/* Clientes */}
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#0A0A0A] p-6 shadow-lg transition-all hover:border-[#D00000]/30">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-400">
              Contas Criadas
            </span>
            <div className="rounded-full bg-[#D00000]/10 p-2 text-[#D00000]">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-bold text-white">{totalUsers}</div>
        </div>
      </div>

      {/* --- SEÇÃO 2: CARDS MENORES (Operacional) --- */}
      <div>
        <h3 className="mb-4 text-sm font-semibold tracking-wider text-neutral-500 uppercase">
          Detalhes Operacionais
        </h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="flex flex-col justify-center rounded-lg border border-white/5 bg-white/[0.02] p-4 hover:bg-white/[0.04]">
            <div className="mb-2 flex items-center gap-2 text-[#D00000]">
              <Star className="h-4 w-4 fill-current" />
              <span className="text-xs font-bold">Média</span>
            </div>
            <span className="text-xl font-bold text-white">{avgRating}</span>
            <span className="text-[10px] text-neutral-500">Geral da loja</span>
          </div>

          <div className="flex flex-col justify-center rounded-lg border border-white/5 bg-white/[0.02] p-4 hover:bg-white/[0.04]">
            <div className="mb-2 text-neutral-400">
              <Layers className="h-4 w-4" />
            </div>
            <span className="text-xl font-bold text-white">
              {stats.categories}
            </span>
            <span className="text-[10px] text-neutral-500">Categorias</span>
          </div>

          <div className="flex flex-col justify-center rounded-lg border border-white/5 bg-white/[0.02] p-4 hover:bg-white/[0.04]">
            <div className="mb-2 text-neutral-400">
              <Award className="h-4 w-4" />
            </div>
            <span className="text-xl font-bold text-white">{stats.brands}</span>
            <span className="text-[10px] text-neutral-500">Marcas</span>
          </div>

          <div className="flex flex-col justify-center rounded-lg border border-white/5 bg-white/[0.02] p-4 hover:bg-white/[0.04]">
            <div className="mb-2 text-neutral-400">
              <MessageSquare className="h-4 w-4" />
            </div>
            <span className="text-xl font-bold text-white">
              {stats.reviews}
            </span>
            <span className="text-[10px] text-neutral-500">Reviews</span>
          </div>
        </div>
      </div>

      {/* --- SEÇÃO 3: GRÁFICOS --- */}
      <div className="flex w-full flex-col gap-5 md:flex-row">
        {/* GRÁFICO 1: RECEITA */}
        <div className="w-full rounded-xl border border-white/10 bg-[#0A0A0A] p-6">
          <RevenueChart data={revenueChartData} />
        </div>

        {/* GRÁFICO 2: VENDAS (Agora funcional!) */}
        <div className="w-full rounded-xl border border-white/10 bg-[#0A0A0A] p-6">
          <SalesChart data={salesChartData} />
        </div>
      </div>

      {/* --- SEÇÃO 4: DETALHAMENTO DE ITENS A SEPARAR (POR TAMANHO / COR) --- */}
      <div className="space-y-4 border-t border-white/10 pt-12">
        <div>
          <h2 className="font-clash-display text-3xl font-medium text-white">
            Itens a Separar
          </h2>
          <p className="text-neutral-400">
            Organizado do maior tamanho para o menor tamanho, baseado nos
            pedidos com status &quot;A Entregar&quot;.
          </p>
        </div>

        {resumoProdutos.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-[#0A0A0A] p-8 text-center font-mono text-sm text-neutral-500">
            Nenhum item pendente de separação no momento.
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resumoProdutos.map((prod) => {
              const pctSeparado = prod.totalDoProduto
                ? Math.round(
                    ((prod.totalDoProduto - prod.pendentesDoProduto) /
                      prod.totalDoProduto) *
                      100,
                  )
                : 100;

              return (
                <div
                  key={prod.nome}
                  className="flex flex-col justify-between rounded-xl border border-white/10 bg-[#0A0A0A] p-5 shadow-lg transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 border-b border-white/5 pb-2">
                      <h3 className="text-sm font-semibold text-white">
                        {prod.nome}
                      </h3>
                      <span className="shrink-0 rounded-md border border-neutral-800 bg-neutral-900 px-2 py-0.5 font-mono text-[10px] text-neutral-400">
                        {prod.pendentesDoProduto} pendentes
                      </span>
                    </div>

                    {/* Barra de Progresso do Produto */}
                    <div className="mt-3">
                      <div className="mb-1 flex items-center justify-between font-mono text-[10px] text-neutral-400">
                        <span>Progresso</span>
                        <span>{pctSeparado}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-900">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                          style={{ width: `${pctSeparado}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-3">
                      {prod.variacoes.map((v, i) => {
                        const prevCor =
                          i > 0 ? prod.variacoes[i - 1].cor : v.cor;
                        const mudouCor = i > 0 && v.cor !== prevCor;
                        return (
                          <Fragment key={v.rotulo}>
                            {mudouCor && (
                              <div className="my-1.5 border-t border-white/[0.06]" />
                            )}
                            <div className="flex items-center justify-between py-2 font-mono text-xs">
                              <span className="flex items-center gap-1.5 text-neutral-300">
                                {v.cor &&
                                  (() => {
                                    const cssColor = corParaCss(v.cor);
                                    return cssColor ? (
                                      <span
                                        className="inline-block h-2 w-2 shrink-0 rounded-full border border-white/10"
                                        style={{ backgroundColor: cssColor }}
                                      />
                                    ) : null;
                                  })()}
                                {v.rotulo}
                              </span>
                              <div className="flex items-center gap-2">
                                {v.pendente > 0 ? (
                                  <span className="rounded border border-neutral-500/20 bg-neutral-500/10 px-2 py-0.5 text-xs font-medium text-neutral-300">
                                    {v.pendente} a separar
                                  </span>
                                ) : (
                                  <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-400">
                                    ok
                                  </span>
                                )}
                              </div>
                            </div>
                          </Fragment>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
