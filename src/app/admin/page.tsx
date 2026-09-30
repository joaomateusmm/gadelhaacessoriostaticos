import { count, eq, sql, sum } from "drizzle-orm";
import {
  Activity,
  DollarSign,
  Layers,
  MessageSquare,
  Package,
  Star,
  Users,
} from "lucide-react";

import { RevenueChart } from "@/components/admin/revenue-chart";
import { db } from "@/db";
import { category, order, product, review, user } from "@/db/schema";

// AJUSTE DE MOEDA PARA LIBRAS (GBP)
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(value / 100);
};

export default async function AdminDashboard() {
  const [
    totalRevenueRes,
    totalSalesRes,
    activeProductsRes,
    totalUsersRes,
    avgRatingRes,
    totalCategoriesRes,
    totalReviewsRes,
    ordersForChart,
  ] = await Promise.all([
    // 1. Receita Total
    db
      .select({ value: sum(order.amount) })
      .from(order)
      .where(eq(order.status, "paid")),

    // 2. Total de Vendas
    db.select({ count: count() }).from(order).where(eq(order.status, "paid")),

    // 3. Produtos Ativos
    db
      .select({ count: count() })
      .from(product)
      .where(eq(product.status, "active")),

    // 4. Usuários
    db.select({ count: count() }).from(user),

    // 5. Avaliação Média
    db.select({ avg: sql<number>`avg(${review.rating})` }).from(review),

    // 6. Categorias
    db.select({ count: count() }).from(category),

    // 7. Reviews (Avaliações)
    db.select({ count: count() }).from(review),

    // 8. Dados para o Gráfico
    db
      .select({ amount: order.amount, createdAt: order.createdAt })
      .from(order)
      .where(eq(order.status, "paid")),
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
    reviews: totalReviewsRes[0]?.count || 0,
  };

  // --- LÓGICA DOS GRÁFICOS (Revenue + Sales) ---
  const dailyRevenueMap = new Map<string, number>();
  const dailySalesMap = new Map<string, number>();

  ordersForChart.forEach((o) => {
    const dateKey = new Date(o.createdAt).toISOString().split("T")[0];

    // Receita (convertendo centavos para libras)
    const currentRev = dailyRevenueMap.get(dateKey) || 0;
    dailyRevenueMap.set(dateKey, currentRev + o.amount / 100);

    // Vendas (Quantidade)
    const currentSales = dailySalesMap.get(dateKey) || 0;
    dailySalesMap.set(dateKey, currentSales + 1);
  });

  const revenueChartData = [];
  const salesChartData = [];
  const today = new Date();

  // Loop para preencher os últimos 95 dias
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
    <div className="space-y-8 p-4 md:p-8">
      <div>
        <h1 className="font-clash-display text-3xl font-semibold tracking-tight text-white">
          Dashboard
        </h1>
        <p className="text-sm font-medium text-neutral-400">
          Visão geral e métricas da sua loja em tempo real.
        </p>
      </div>

      {/* --- SEÇÃO 1: CARDS MAIORES (KPIs) --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Receita */}
        <div className="relative overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-sm transition-all hover:border-neutral-700">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-400">
              Receita Total
            </span>
            <div className="rounded-full bg-orange-500/15 p-2 text-orange-400 border border-orange-500/20">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {formatCurrency(totalRevenue)}
            </span>
          </div>
        </div>

        {/* Vendas */}
        <div className="relative overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-sm transition-all hover:border-neutral-700">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-400">
              Vendas Concluídas
            </span>
            <div className="rounded-full bg-blue-500/15 p-2 text-blue-400 border border-blue-500/20">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-extrabold text-white">
            {totalSales}
          </div>
        </div>

        {/* Produtos Ativos */}
        <div className="relative overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-sm transition-all hover:border-neutral-700">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-400">
              Produtos Ativos
            </span>
            <div className="rounded-full bg-purple-500/15 p-2 text-purple-400 border border-purple-500/20">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-extrabold text-white">
            {activeProducts}
          </div>
        </div>

        {/* Clientes */}
        <div className="relative overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-sm transition-all hover:border-neutral-700">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-400">
              Contas Criadas
            </span>
            <div className="rounded-full bg-pink-500/15 p-2 text-pink-400 border border-pink-500/20">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-extrabold text-white">
            {totalUsers}
          </div>
        </div>
      </div>

      {/* --- SEÇÃO 2: CARDS MENORES (Operacional) --- */}
      <div>
        <h3 className="mb-4 text-xs font-bold tracking-wider text-neutral-400 uppercase">
          Detalhes Operacionais
        </h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
          {/* Avaliação Média */}
          <div className="flex flex-col justify-center rounded-lg border border-neutral-800 bg-neutral-900 p-4 transition-colors hover:bg-neutral-800/80">
            <div className="mb-2 flex items-center gap-2 text-yellow-400">
              <Star className="h-4 w-4 fill-current" />
              <span className="text-xs font-semibold text-neutral-300">Média</span>
            </div>
            <span className="text-xl font-bold text-white">
              {avgRating}
            </span>
            <span className="text-[10px] text-neutral-400">Geral da loja</span>
          </div>

          {/* Categorias */}
          <div className="flex flex-col justify-center rounded-lg border border-neutral-800 bg-neutral-900 p-4 transition-colors hover:bg-neutral-800/80">
            <div className="mb-2 text-neutral-400">
              <Layers className="h-4 w-4" />
            </div>
            <span className="text-xl font-bold text-white">
              {stats.categories}
            </span>
            <span className="text-[10px] text-neutral-400">Categorias</span>
          </div>

          {/* Reviews */}
          <div className="flex flex-col justify-center rounded-lg border border-neutral-800 bg-neutral-900 p-4 transition-colors hover:bg-neutral-800/80">
            <div className="mb-2 text-neutral-400">
              <MessageSquare className="h-4 w-4" />
            </div>
            <span className="text-xl font-bold text-white">
              {stats.reviews}
            </span>
            <span className="text-[10px] text-neutral-400">Reviews</span>
          </div>
        </div>
      </div>

      {/* --- SEÇÃO 3: GRÁFICOS --- */}
      <div className="w-full rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-bold text-white">
          Receita Diária
        </h3>
        <RevenueChart data={revenueChartData} />
      </div>
    </div>
  );
}
