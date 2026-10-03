"use client";

import {
  ChevronDown,
  Drill,
  Hammer,
  Heart,
  LayoutDashboard,
  LifeBuoy,
  Loader2,
  LogOut,
  Package,
  Search,
  ShoppingCart,
  Star,
  User,
  UserRound,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

import { checkAffiliateStatus } from "@/actions/check-affiliate-status";
import { checkStockAvailability } from "@/actions/check-stock";
import { getAllCategories } from "@/actions/get-all-categories";
import { searchProductsAction } from "@/actions/search-products";
import { CartSheet } from "@/components/cart-sheet";
import { MobileMenu } from "@/components/mobile-menu";
import { TopBar } from "@/components/TopBar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/language-context";
import { authClient } from "@/lib/auth-client";
import { useCartStore } from "@/store/cart-store";

import { WishlistSheet } from "./WishlistSheet";

// --- INTERFACES ---
export interface CategoryLink {
  label: string;
  href: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  discountPrice: number | null;
  images: string[] | null;
}

// Altura da barra de frete (h-10 = 2.5rem = 40px).
// Se mudar a altura da barra, ajuste também a classe "-translate-y-10" abaixo.
const SCROLL_THRESHOLD = 10;

// --- COMPONENTE DE ÍCONE ---
function HeaderIconButton({
  icon: Icon,
  onClick,
  badgeCount,
  label,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  onClick?: () => void;
  badgeCount?: number;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="group relative flex cursor-pointer items-center text-white duration-300 hover:scale-105 hover:text-orange-500 active:scale-95"
    >
      <div className="relative">
        <Icon className="h-6 w-6" strokeWidth={1.5} />
        {!!badgeCount && badgeCount > 0 && (
          <div className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-orange-600 text-[10px] font-bold text-white shadow-sm">
            {badgeCount}
          </div>
        )}
      </div>
    </button>
  );
}

// --- CONTEÚDO DO HEADER ---
export function HeaderContent() {
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // ESTADOS UNIFICADOS
  const [categories, setCategories] = useState<CategoryLink[]>([]);
  const [isAffiliate, setIsAffiliate] = useState(false);

  // PESQUISA
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();
  const { data: session } = authClient.useSession();
  const { t } = useLanguage();
  const { items: cartItems, removeItem: removeCartItem } = useCartStore();

  const closeSearch = () => {
    setIsSearchOpen(false);
    setShowResults(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  // 1. CARREGAMENTO DE DADOS INICIAIS
  useEffect(() => {
    setMounted(true);
    const fetchData = async () => {
      try {
        const [cats, affStatus] = await Promise.all([
          getAllCategories(),
          checkAffiliateStatus().catch(() => false),
        ]);

        if (cats && cats.length > 0) {
          setCategories(cats);
        }

        setIsAffiliate(affStatus);
      } catch (error) {
        console.error("Erro ao carregar dados do header", error);
      }
    };
    fetchData();
  }, []);

  // 2. ESCONDER BARRA DE FRETE AO ROLAR A PÁGINA
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 3. VERIFICAÇÃO DE ESTOQUE
  useEffect(() => {
    const verifyStock = async () => {
      if (cartItems.length === 0) return;
      try {
        const { outOfStockItems } = await checkStockAvailability(
          cartItems.map((i) => ({ id: i.id, quantity: i.quantity })),
        );
        if (outOfStockItems.length > 0) {
          outOfStockItems.forEach((item) => removeCartItem(item.id));
        }
      } catch (e) {
        console.error(e);
      }
    };
    verifyStock();
  }, [cartItems, removeCartItem]);

  // 4. PESQUISA (DEBOUNCE)
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        const results = await searchProductsAction(searchQuery);
        setSearchResults(results);
        setIsSearching(false);
        setShowResults(true);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // 5. FECHAR PESQUISA AO CLICAR FORA / ESC
  useEffect(() => {
    if (!isSearchOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
        setShowResults(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsSearchOpen(false);
        setShowResults(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    searchInputRef.current?.focus();
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSearchOpen]);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value / 100);
  };

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: { onSuccess: () => router.refresh() },
    });
  };

  if (!mounted) return null;

  const menuItemClass =
    "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-neutral-600 transition-colors focus:bg-orange-50 focus:text-orange-700";

  const navLinkClass =
    "relative py-2 text-[13px] font-medium tracking-wide whitespace-nowrap text-white uppercase transition-colors duration-200 hover:text-orange-500 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-orange-500 after:transition-transform after:duration-300 hover:after:scale-x-100";

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-transform duration-300 ease-out ${
        scrolled ? "-translate-y-10 shadow-lg" : ""
      }`}
    >
      {/* --- BARRA DE FRETE (some ao rolar) --- */}
      <TopBar />

      {/* --- BARRA PRINCIPAL --- */}
      <div className="relative w-full bg-black px-4 md:px-8">
        <div className="relative mx-auto flex h-20 max-w-[1440px] items-center justify-between gap-4">
          {/* 1. ESQUERDA: Menu mobile + Logo */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="lg:hidden">
              <MobileMenu categories={categories} isAffiliate={isAffiliate} />
            </div>

            {/* Logo desktop/tablet */}
            <Link href="/" className="group hidden items-center gap-2 md:flex">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg">
                <Image
                  src="/icons/logo.png"
                  alt="Logo Gadelha Acessorios Taticos"
                  width={40}
                  height={40}
                  className="h-full w-full object-cover duration-300 group-hover:scale-105 group-active:scale-95"
                />
              </div>
              <span className="font-montserrat text-2xl font-bold tracking-tight text-white duration-200 group-hover:text-orange-500 group-active:scale-95">
                G.A.T
              </span>
            </Link>

            {/* Logo mobile (centralizada) */}
            <Link
              href="/"
              className="absolute left-1/2 flex -translate-x-1/2 items-center justify-center duration-300 active:scale-95 md:hidden"
            >
              <Image
                src="/logo.svg"
                alt="Logo ESG Group"
                width={48}
                height={48}
                className="rounded-full object-cover shadow-lg"
              />
            </Link>

            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {session && (session.user as any).role === "admin" && (
              <Link href="/admin" className="hidden md:block">
                <span className="text-sm font-semibold text-orange-500 duration-200 hover:underline">
                  Admin
                </span>
              </Link>
            )}
          </div>

          {/* 2. CENTRO: Navegação (desktop) */}
          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 lg:flex xl:gap-8">
            {categories.slice(0, 5).map((cat, index) => (
              <Link key={index} href={cat.href || "#"} className={navLinkClass}>
                {cat.label}
              </Link>
            ))}
            <Link href="/servicos" className={navLinkClass}>
              Serviços
            </Link>
            <Link
              href="/categorias/promocoes"
              className={`${navLinkClass} !text-orange-500 hover:!text-orange-400`}
            >
              Sale
            </Link>
          </nav>

          {/* 3. DIREITA: Ícones */}
          <div className="flex items-center gap-4 sm:gap-6">
            {/* PESQUISA */}
            <HeaderIconButton
              icon={Search}
              label="Pesquisar"
              onClick={() =>
                isSearchOpen ? closeSearch() : setIsSearchOpen(true)
              }
            />

            {/* FAVORITOS */}
            <WishlistSheet />

            {/* CARRINHO */}
            <CartSheet />

            {/* USER / MINHA CONTA */}
            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="group flex cursor-pointer items-center gap-1 outline-none">
                    <Avatar className="h-8 w-8 border border-white/60 shadow-sm transition-all duration-300 group-hover:border-orange-500">
                      <AvatarImage src={session.user.image || ""} />
                      <AvatarFallback className="bg-orange-100 text-sm font-bold text-orange-700">
                        {session.user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="hidden h-4 w-4 text-neutral-400 transition-transform duration-300 group-data-[state=open]:rotate-180 sm:block" />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  sideOffset={12}
                  className="z-[150] w-72 rounded-xl border border-neutral-100 bg-white p-2 shadow-xl ring-1 ring-neutral-900/5"
                >
                  {/* CABEÇALHO DO PERFIL */}
                  <div className="mb-2 flex items-center gap-3 rounded-lg bg-neutral-50 p-3">
                    <Avatar className="h-10 w-10 border border-neutral-200">
                      <AvatarImage src={session.user.image || ""} />
                      <AvatarFallback className="bg-white font-bold text-orange-600">
                        {session.user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col overflow-hidden">
                      <span className="truncate text-sm font-bold text-neutral-900">
                        {session.user.name}
                      </span>
                      <span className="truncate text-xs text-neutral-500">
                        {session.user.email}
                      </span>
                    </div>
                  </div>

                  <DropdownMenuSeparator className="my-1 bg-neutral-100" />

                  <DropdownMenuLabel className="px-3 py-1.5 text-[10px] font-semibold tracking-wider text-neutral-400 uppercase">
                    Minha Conta
                  </DropdownMenuLabel>

                  <DropdownMenuItem
                    className={menuItemClass}
                    onClick={() => router.push("/minha-conta/compras")}
                  >
                    <Package className="h-4 w-4" />
                    <span>{t.header.account.orders}</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className={menuItemClass}
                    onClick={() => router.push("/minha-conta/servicos")}
                  >
                    <Drill className="h-4 w-4" />
                    <span>Meus Serviços</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className={menuItemClass}
                    onClick={() => router.push("/minha-conta/favoritos")}
                  >
                    <Heart className="h-4 w-4" />
                    <span>Lista de Desejos</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className={menuItemClass}
                    onClick={() => router.push("/minha-conta/carrinho")}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span>Meu Carrinho</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className={menuItemClass}
                    onClick={() => router.push("/minha-conta/avaliacoes")}
                  >
                    <Star className="h-4 w-4" />
                    <span>Minhas Avaliações</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="my-1 bg-neutral-100" />

                  <DropdownMenuLabel className="px-3 py-1.5 text-[10px] font-semibold tracking-wider text-neutral-400 uppercase">
                    Meu Perfil
                  </DropdownMenuLabel>

                  <DropdownMenuItem
                    className={menuItemClass}
                    onClick={() => router.push("/painel-prestador")}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Painel do Prestador</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className={menuItemClass}
                    onClick={() => router.push("/minha-conta/trabalhe-conosco")}
                  >
                    <Hammer className="h-4 w-4" />
                    <span>Prestar Serviço</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className={menuItemClass}
                    onClick={() => router.push("/minha-conta")}
                  >
                    <User className="h-4 w-4" />
                    <span>Dados Pessoais</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className={menuItemClass}
                    onClick={() => router.push("/faq")}
                  >
                    <LifeBuoy className="h-4 w-4" />
                    <span>Central de Ajuda</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="my-1 bg-neutral-100" />

                  <DropdownMenuItem
                    className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-red-600 transition-colors focus:bg-red-50 focus:text-red-700"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4" />
                    <span>{t.header.account.logout}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/authentication" aria-label="Entrar">
                <HeaderIconButton icon={UserRound} />
              </Link>
            )}
          </div>
        </div>

        {/* --- PAINEL DE PESQUISA (abre ao clicar na lupa) --- */}
        {isSearchOpen && (
          <div
            ref={searchRef}
            className="animate-in fade-in slide-in-from-top-2 absolute inset-x-0 top-full z-40 bg-black px-4 py-4 shadow-xl duration-200 md:px-8"
          >
            <div className="relative mx-auto max-w-3xl">
              <div className="flex h-12 w-full items-center rounded-full border border-neutral-700 bg-neutral-950 pr-2 pl-5 transition-all focus-within:border-orange-600">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="O que você procura hoje?"
                  className="h-full w-full bg-transparent text-sm text-white placeholder:text-neutral-500 focus:outline-none"
                />
                {isSearching && (
                  <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin text-neutral-400" />
                )}
                <button
                  type="button"
                  onClick={closeSearch}
                  aria-label="Fechar pesquisa"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* RESULTADOS */}
              {showResults && searchQuery.length >= 2 && (
                <div className="absolute top-14 right-0 left-0 z-50 max-h-[60vh] overflow-y-auto rounded-xl border border-neutral-200 bg-white shadow-xl">
                  {searchResults.length > 0 ? (
                    <div className="flex flex-col py-2">
                      {searchResults.map((product) => (
                        <Link
                          key={product.id}
                          href={`/produto/${product.id}`}
                          onClick={closeSearch}
                          className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-neutral-50"
                        >
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-neutral-100 bg-neutral-50">
                            {product.images?.[0] ? (
                              <Image
                                src={product.images[0]}
                                alt={product.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <ShoppingCart className="m-auto mt-3 h-6 w-6 text-neutral-300" />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="line-clamp-1 font-medium text-neutral-900">
                              {product.name}
                            </span>
                            <span className="text-sm font-bold text-orange-600">
                              {formatPrice(
                                product.discountPrice || product.price,
                              )}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-sm text-neutral-500">
                      Nenhum produto encontrado.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

// --- EXPORTAR O COMPONENTE PRINCIPAL ENVOLVIDO EM SUSPENSE ---
export function Header() {
  return (
    <Suspense
      fallback={<div className="fixed top-0 z-50 h-[120px] w-full shadow-sm" />}
    >
      <HeaderContent />
    </Suspense>
  );
}
