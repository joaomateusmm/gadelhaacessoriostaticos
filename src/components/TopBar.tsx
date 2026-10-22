"use client";

import {
  HeartHandshake,
  Package,
  ShieldQuestionMark,
  Truck,
} from "lucide-react";
import Link from "next/link";

export function TopBar() {
  return (
    <div className="h-10 w-full bg-neutral-900 px-4 text-xs font-medium text-white md:px-8">
      <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between gap-4">
        {/* Espaçador para manter o centro alinhado */}
        <div className="hidden shrink-0 lg:block lg:w-64" />

        {/* Promo centralizada */}
        <div className="flex min-w-0 flex-1 items-center justify-center gap-2 text-center">
          <Truck className="h-4 w-4 shrink-0 text-neutral-300" />
          <p className="truncate text-[11px] sm:text-[13px]">
            <span className="font-semibold text-orange-500 uppercase">
              Frete grátis
            </span>
            <span className="text-white"> - Nas compras a partir de R$349</span>
          </p>
        </div>

        {/* Links rápidos */}
        <div className="hidden shrink-0 items-center justify-end gap-5 lg:flex lg:w-64">
          <Link
            href="/rastreio"
            className="flex cursor-pointer items-center gap-1 duration-300 hover:text-white/80"
          >
            <Package className="h-4 w-4" /> Entrega
          </Link>
          <div className="h-3 w-[1px] bg-white/30" />
          <Link
            href="/sobre"
            className="flex cursor-pointer items-center gap-1 duration-300 hover:text-white/80"
          >
            <ShieldQuestionMark className="h-4 w-4" /> Sobre
          </Link>
          <div className="h-3 w-[1px] bg-white/30" />
          <Link
            href="/faq"
            className="flex cursor-pointer items-center gap-1 duration-300 hover:text-white/80"
          >
            <HeartHandshake className="h-4 w-4" />
            Ajuda
          </Link>
        </div>
      </div>
    </div>
  );
}
