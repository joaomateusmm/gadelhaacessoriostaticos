"use client";

import { Download } from "lucide-react";

import { PedidoSistema } from "@/actions/pedidos-sistema";
import { Button } from "@/components/ui/button";

export function ExportJsonPedidosButton({ pedidos }: { pedidos: PedidoSistema[] }) {
  const handleBaixarJSON = () => {
    const dadosExportacao = pedidos.map((p) => ({
      codigo: p.codigo,
      cliente: p.cliente,
      corporacao: p.corporacao,
      unidade: p.unidade,
      contato: p.contato,
      dataPedido: p.dataPedido,
      horarioRegistrado: p.horarioRegistrado,
      saldoVolus: p.saldoVolus,
      saldoPorFora: p.saldoPorFora,
      statusPagamento: p.statusPagamento,
      statusPedido: p.statusPedido,
      statusPacote: p.statusPacote,
      observacao: p.observacao,
      itens: p.itens.map((i) => ({
        produtoId: i.produtoId,
        nome: i.nome,
        tamanho: i.tamanho,
        cor: i.cor,
        quantidade: i.quantidade,
        precoUnitario: i.precoUnitario,
        separado: i.separado,
        observacao: i.observacao,
      })),
    }));

    const blob = new Blob([JSON.stringify(dadosExportacao, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pedidos-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleBaixarJSON}
      className="border-white/10 bg-white/5 text-white hover:bg-white/10"
    >
      <Download className="mr-2 h-4 w-4" />
      Baixar JSON
    </Button>
  );
}
