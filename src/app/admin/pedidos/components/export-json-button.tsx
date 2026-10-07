"use client";

import { Download } from "lucide-react";

import { PedidoSistema } from "@/actions/pedidos-sistema";
import { Button } from "@/components/ui/button";

const arredondar = (n: number) => Math.round(n * 100) / 100;

// "DD/MM/AAAA" (como vem da tela) -> "AAAA-MM-DD"
function dataBRparaISO(data?: string) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(data ?? "");
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

function montarPedido(p: PedidoSistema, exportadoEm: string) {
  const itens = p.itens.map((i, idx) => {
    const separado = i.separado ?? false;
    return {
      ...i, // leva TUDO que o item tiver (id, produtoId, nome, tamanho, cor, obs...)
      posicao: idx + 1,
      separado,
      situacao: separado ? "Separado" : "Falta comprar",
      subtotal: arredondar(i.quantidade * i.precoUnitario),
    };
  });

  const separados = itens.filter((i) => i.separado);
  const faltando = itens.filter((i) => !i.separado);
  const somaValor = (lista: typeof itens) =>
    arredondar(lista.reduce((acc, i) => acc + i.subtotal, 0));
  const somaPecas = (lista: typeof itens) =>
    lista.reduce((acc, i) => acc + i.quantidade, 0);

  // Versão enxuta só para leitura rápida do que ainda precisa ser comprado
  const resumirItem = (i: (typeof itens)[number]) => ({
    posicao: i.posicao,
    nome: i.nome,
    tamanho: i.tamanho,
    cor: i.cor,
    quantidade: i.quantidade,
    observacao: i.observacao,
  });

  return {
    ...p, // leva TUDO que o pedido tiver, inclusive campos novos no futuro
    dataPedidoISO: dataBRparaISO(p.dataPedido),
    exportadoEm,
    resumo: {
      totalLinhasItens: itens.length,
      totalPecas: somaPecas(itens),
      linhasSeparadas: separados.length,
      linhasFaltando: faltando.length,
      pecasSeparadas: somaPecas(separados),
      pecasFaltando: somaPecas(faltando),
      valorTotal: somaValor(itens),
      valorSeparado: somaValor(separados),
      valorFaltando: somaValor(faltando),
      pedidoCompleto: faltando.length === 0 && itens.length > 0,
    },
    itensFaltando: faltando.map(resumirItem),
    itensSeparados: separados.map(resumirItem),
    itens,
  };
}

export function ExportJsonPedidosButton({
  pedidos,
}: {
  pedidos: PedidoSistema[];
}) {
  const handleBaixarJSON = () => {
    const agora = new Date();
    const exportadoEm = agora.toISOString();

    // O arquivo continua sendo um ARRAY de pedidos, igual ao formato anterior,
    // para que a importação (importPedidosFromJson) siga funcionando.
    const dadosExportacao = pedidos.map((p) => montarPedido(p, exportadoEm));

    // Data e hora no fuso de Fortaleza: pedidos-2026-10-07_14-30-05.json
    const carimbo = agora
      .toLocaleString("sv-SE", { timeZone: "America/Fortaleza" })
      .replace(" ", "_")
      .replace(/:/g, "-");

    const blob = new Blob([JSON.stringify(dadosExportacao, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pedidos-${carimbo}.json`;
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
      disabled={pedidos.length === 0}
      className="border-white/10 bg-white/5 text-white hover:bg-white/10"
    >
      <Download className="mr-2 h-4 w-4" />
      Baixar JSON
    </Button>
  );
}
