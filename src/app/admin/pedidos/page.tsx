import { listarPedidos } from "@/actions/pedidos-balcao";

import { PedidosTable } from "./components/pedidos-table";

export default async function PedidosPage() {
  const pedidos = await listarPedidos();

  // Estatísticas
  const totalPedidos = pedidos.length;
  const devendo = pedidos.filter((p) => p.statusPedido === "Devendo").length;
  const entregues = pedidos.filter((p) => p.statusPedido === "Entregue").length;
  const naoPago = pedidos.filter(
    (p) => p.statusPagamento === "Não pago",
  ).length;
  const totalVolus = pedidos.reduce((a, p) => a + Number(p.saldoVolus), 0);
  const totalFora = pedidos.reduce((a, p) => a + Number(p.saldoPorFora), 0);

  return (
    <div className="w-full space-y-4 text-white">
      {/* Header */}
      <div>
        <h1 className="font-clash-display text-3xl font-medium text-white">
          Pedidos de Balcão
        </h1>
        <p className="mt-1 text-sm text-neutral-400">
          Gerencie os pedidos registrados manualmente no balcão.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-lg border border-neutral-200 bg-white p-3 shadow-sm">
          <p className="text-xs font-medium text-neutral-400">Total</p>
          <p className="mt-1 text-2xl font-bold text-white">{totalPedidos}</p>
          <p className="text-[10px] text-neutral-300">pedidos</p>
        </div>

        <div className="rounded-lg border border-amber-100 bg-amber-50 p-3 shadow-sm">
          <p className="text-xs font-medium text-amber-400">Devendo</p>
          <p className="mt-1 text-2xl font-bold text-amber-300">{devendo}</p>
          <p className="text-[10px] text-amber-300">a entregar</p>
        </div>

        <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 shadow-sm">
          <p className="text-xs font-medium text-blue-400">Entregues</p>
          <p className="mt-1 text-2xl font-bold text-blue-300">{entregues}</p>
          <p className="text-[10px] text-blue-300">concluídos</p>
        </div>

        <div className="rounded-lg border border-red-100 bg-red-50 p-3 shadow-sm">
          <p className="text-xs font-medium text-red-400">Não Pago</p>
          <p className="mt-1 text-2xl font-bold text-red-300">{naoPago}</p>
          <p className="text-[10px] text-red-300">pendentes</p>
        </div>

        <div className="col-span-2 rounded-lg border border-emerald-100 bg-emerald-50 p-3 shadow-sm sm:col-span-1">
          <p className="text-xs font-medium text-emerald-400">Faturamento</p>
          <p className="mt-1 text-xl font-bold text-emerald-300">
            R${" "}
            {(totalVolus + totalFora).toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
            })}
          </p>
          <p className="text-[10px] text-emerald-300">Volus + Por Fora</p>
        </div>
      </div>

      {/* Tabela */}
      <PedidosTable pedidos={pedidos} />
    </div>
  );
}
