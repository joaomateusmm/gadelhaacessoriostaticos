import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { obterPedidosSistemaAction } from "@/actions/pedidos-sistema";
import { Button } from "@/components/ui/button";

import { ExportJsonPedidosButton } from "./components/export-json-button";
import { ImportJsonPedidosButton } from "./components/import-json-button";
import { TabelaPedidosSistema } from "./components/pedidos-table";

export const dynamic = "force-dynamic";

export default async function AdminPedidosPage() {
  const pedidosList = await obterPedidosSistemaAction();

  return (
    <div className="space-y-8 p-2 pt-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-clash-display text-3xl font-medium text-white">
            Pedidos de Clientes
          </h1>
          <p className="text-sm text-neutral-400">
            Gerencie os pedidos presenciais e sob encomenda da sua loja.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ImportJsonPedidosButton />
          <ExportJsonPedidosButton pedidos={pedidosList} />
          <Link href="/admin/pedidos/novo">
            <Button className="flex items-center gap-2 border border-white/10 bg-white/5 text-white hover:bg-white/10">
              <Plus className="h-4 w-4" /> Registrar Pedido
            </Button>
          </Link>
        </div>
      </div>

      <Suspense fallback={<div className="text-white">Carregando pedidos...</div>}>
        <TabelaPedidosSistema initialPedidos={pedidosList} />
      </Suspense>
    </div>
  );
}
