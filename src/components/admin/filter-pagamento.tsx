"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

const filtros = [
  {
    valor: "Pago",
    label: "PAGO",
    activeClass:
      "border-emerald-600 bg-emerald-950/60 font-bold text-emerald-400",
  },
  {
    valor: "Não pago",
    label: "NÃO PAGO",
    activeClass: "border-red-600 bg-red-950/60 font-bold text-red-400",
  },
  {
    valor: "todos",
    label: "TODOS",
    activeClass: "border-neutral-600 bg-neutral-700 font-bold text-white",
  },
] as const;

const inactiveClass =
  "border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-600 hover:text-white";

export function FilterPagamento({
  filtroPagamento,
}: {
  filtroPagamento: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function handleClick(valor: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("pagamento", valor);
    startTransition(() => {
      router.replace(`/admin?${params.toString()}`, { scroll: false });
    });
  }

  return (
    <div
      className={`flex items-center space-x-2 font-mono text-xs transition-opacity ${
        isPending ? "opacity-50" : "opacity-100"
      }`}
    >
      {filtros.map((f) => (
        <button
          key={f.valor}
          onClick={() => handleClick(f.valor)}
          className={`border px-3 py-1.5 uppercase transition-all ${
            filtroPagamento === f.valor ? f.activeClass : inactiveClass
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
