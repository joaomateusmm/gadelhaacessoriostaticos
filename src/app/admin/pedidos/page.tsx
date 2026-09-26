import { Plus } from "lucide-react";
import Link from "next/link";

import { obterPedidosSistemaAction } from "@/actions/pedidos-sistema";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

import { TabelaPedidosSistema } from "./components/tabela-pedidos";

export default async function AdminPedidosPage() {
  const pedidosList = await obterPedidosSistemaAction();

  return (
    <div className="space-y-8 p-2 pt-6">
      <div className="flex flex-row items-center justify-between gap-4">
        <div>
          <h1 className="font-clash-display text-3xl font-medium text-white">
            Pedidos de Clientes
          </h1>
          <p className="text-sm text-neutral-400">
            Gerencie os pedidos presenciais e sob encomenda da sua loja.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/pedidos/novo">
            <Button className="flex items-center gap-2 border border-white/10 bg-white/5 text-white hover:bg-white/10">
              <Plus className="h-4 w-4" /> Registrar Pedido
            </Button>
          </Link>
        </div>
      </div>

      <TabelaPedidosSistema initialPedidos={pedidosList} />
    </div>
  );
}
