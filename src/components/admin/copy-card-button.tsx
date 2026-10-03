"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

interface Variacao {
  rotulo: string;
  tamanho: string;
  cor: string;
  quantidadeTotal: number;
  pendente: number;
}

interface CopyCardButtonProps {
  nomeProduto: string;
  variacoes: Variacao[];
}

export function CopyCardButton({
  nomeProduto,
  variacoes,
}: CopyCardButtonProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    const pendentes = variacoes.filter((v) => v.pendente > 0);

    if (pendentes.length === 0) return;

    const linhas = pendentes.map((v) => {
      const partes: string[] = [];
      if (v.tamanho) partes.push(`Tam. ${v.tamanho}`);
      if (v.cor) partes.push(`Cor ${v.cor}`);
      const descricao =
        partes.length > 0 ? partes.join(" - ") : "Tamanho Único";
      return `${v.pendente}x - ${descricao}`;
    });

    const texto = `${nomeProduto}:\n${linhas.join("\n")}`;

    navigator.clipboard.writeText(texto).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={handleCopy}
      title="Copiar itens pendentes"
      className={`flex h-8 w-8 items-center justify-center rounded-md border transition-all ${
        copied
          ? "border-emerald-600 bg-emerald-950/60 text-emerald-400"
          : "border-neutral-800 bg-neutral-900 text-neutral-500 hover:border-neutral-600 hover:text-white"
      }`}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}
