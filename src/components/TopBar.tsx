"use client";

import {
  ChevronDown,
  HeartHandshake,
  Package,
  ShieldQuestionMark,
  Truck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/language-context";

const LANGUAGES = [
  { code: "pt", label: "Português", flag: "https://flagcdn.com/w40/br.png" },
  { code: "en", label: "English", flag: "https://flagcdn.com/w40/us.png" },
  { code: "es", label: "Español", flag: "https://flagcdn.com/w40/es.png" },
] as const;

export function TopBar() {
  const { t, language, setLanguage } = useLanguage();

  const lang = language as string;
  let currentFlag = "https://flagcdn.com/w40/br.png";
  let currentLabel = "BR / BRL";

  if (lang === "en") {
    currentFlag = "https://flagcdn.com/w40/us.png";
    currentLabel = "EN / USD";
  } else if (lang === "es") {
    currentFlag = "https://flagcdn.com/w40/es.png";
    currentLabel = "ES / EUR";
  }

  return (
    <div className="h-10 w-full bg-neutral-900 px-4 text-xs font-medium text-white md:px-8">
      <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between gap-4">
        {/* Idioma */}
        <div className="flex shrink-0 items-center lg:w-64">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Idioma"
                className="flex cursor-pointer items-center gap-2 transition-opacity outline-none hover:text-white/80"
              >
                <div className="relative h-3 w-4 overflow-hidden shadow-sm">
                  <Image
                    src={currentFlag}
                    alt="Flag"
                    fill
                    className="object-cover"
                  />
                </div>
                <span className="hidden sm:inline">{currentLabel}</span>
                <ChevronDown className="h-3 w-3 opacity-80" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="animate-in fade-in zoom-in-95 min-w-[140px] rounded-md border border-neutral-100 bg-white p-1 text-black shadow-lg">
              {LANGUAGES.map((l) => (
                <DropdownMenuItem
                  key={l.code}
                  onClick={() => setLanguage(l.code)}
                  className="cursor-pointer gap-3 rounded-sm px-3 py-2 transition-colors hover:bg-neutral-50 focus:bg-neutral-50"
                >
                  <div className="relative h-3 w-4 overflow-hidden border border-neutral-200 shadow-sm">
                    <Image
                      src={l.flag}
                      alt={l.code.toUpperCase()}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <span className="text-sm font-medium">{l.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

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
            <ShieldQuestionMark className="h-4 w-4" /> {t.topBar.storeLocator}
          </Link>
          <div className="h-3 w-[1px] bg-white/30" />
          <Link
            href="/faq"
            className="flex cursor-pointer items-center gap-1 duration-300 hover:text-white/80"
          >
            <HeartHandshake className="h-4 w-4" />
            {t.topBar.help}
          </Link>
        </div>
      </div>
    </div>
  );
}
