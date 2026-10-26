"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { ProductCard } from "@/app/produto/[id]/ProductCard";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  discountPrice?: number | null;
  images: string[] | null;
  thumbnail?: string | null;
  volusPrice?: number | null;
  variants?: Array<{
    images?: string[] | null;
    image?: string | null;
  }> | null;
  stock: number | null;
  isStockUnlimited: boolean;
  currency?: string;
  sku?: string | null;
}

interface ProductCarouselProps {
  products: Product[];
  categoryName: string;
}

const CARD_GAP = 24; // gap-6 = 24px

function getVisibleCount() {
  if (typeof window === "undefined") return 5;
  if (window.innerWidth >= 1280) return 5;
  if (window.innerWidth >= 1024) return 4;
  if (window.innerWidth >= 768) return 3;
  return 2;
}

export function ProductCarousel({
  products,
  categoryName,
}: ProductCarouselProps) {
  const [visibleCount, setVisibleCount] = useState(5);
  const [currentIndex, setCurrentIndex] = useState(products.length);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const trackRef = useRef<HTMLDivElement>(null);
  const animatingRef = useRef(false);

  const needsCarousel = products.length > visibleCount;

  // Clona produtos no início e no fim para loop infinito (só usado no carrossel)
  const cloned = needsCarousel
    ? [...products, ...products, ...products]
    : products;

  useEffect(() => {
    const update = () => setVisibleCount(getVisibleCount());
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Reset index quando visibleCount muda e produtos passam a caber
  useEffect(() => {
    if (!needsCarousel) return;
    setIsTransitioning(false);
    setCurrentIndex(products.length);
  }, [visibleCount, needsCarousel, products.length]);

  const getCardWidth = useCallback(() => {
    if (!trackRef.current) return 0;
    const containerWidth = trackRef.current.parentElement?.clientWidth ?? 0;
    return (containerWidth - CARD_GAP * (visibleCount - 1)) / visibleCount;
  }, [visibleCount]);

  const getOffset = useCallback(
    (index: number) => {
      const cardWidth = getCardWidth();
      return index * (cardWidth + CARD_GAP);
    },
    [getCardWidth],
  );

  const handleTransitionEnd = useCallback(() => {
    if (!animatingRef.current) return;
    animatingRef.current = false;

    if (currentIndex >= products.length * 2) {
      setIsTransitioning(false);
      setCurrentIndex(products.length);
    } else if (currentIndex < products.length) {
      setIsTransitioning(false);
      setCurrentIndex(products.length * 2 - 1);
    }
  }, [currentIndex, products.length]);

  useEffect(() => {
    if (!isTransitioning) {
      const id = requestAnimationFrame(() => setIsTransitioning(true));
      return () => cancelAnimationFrame(id);
    }
  }, [isTransitioning]);

  const slide = useCallback((direction: "prev" | "next") => {
    if (animatingRef.current) return;
    animatingRef.current = true;
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev + (direction === "next" ? 1 : -1));
  }, []);

  // ── GRID SIMPLES quando produtos cabem na tela ──────────────────────────────
  if (!needsCarousel) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 sm:gap-6 md:grid-cols-3 lg:grid-cols-5">
        {products.map((item) => (
          <ProductCard key={item.id} data={item} categoryName={categoryName} />
        ))}
      </div>
    );
  }

  // ── CARROSSEL INFINITO ──────────────────────────────────────────────────────
  return (
    <div className="relative">
      {/* Seta Esquerda — sobreposta sobre a borda esquerda do track */}
      <button
        type="button"
        onClick={() => slide("prev")}
        className="absolute top-1/2 left-[-20px] z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-700 bg-neutral-900/90 text-white shadow-lg transition hover:border-orange-500 hover:text-orange-500 active:scale-95"
        aria-label="Anterior"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {/* Track */}
      <div className="overflow-hidden">
        <div
          ref={trackRef}
          onTransitionEnd={handleTransitionEnd}
          style={{
            display: "flex",
            gap: `${CARD_GAP}px`,
            transform: `translateX(-${getOffset(currentIndex)}px)`,
            transition: isTransitioning
              ? "transform 0.4s cubic-bezier(0.25,0.1,0.25,1)"
              : "none",
          }}
        >
          {cloned.map((item, i) => (
            <div
              key={`${item.id}-${i}`}
              style={{
                flex: `0 0 calc((100% - ${CARD_GAP * (visibleCount - 1)}px) / ${visibleCount})`,
                minWidth: 0,
              }}
            >
              <ProductCard data={item} categoryName={categoryName} />
            </div>
          ))}
        </div>
      </div>

      {/* Seta Direita — sobreposta sobre a borda direita do track */}
      <button
        type="button"
        onClick={() => slide("next")}
        className="absolute top-1/2 right-[-20px] z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-700 bg-neutral-900/90 text-white shadow-lg transition hover:border-orange-500 hover:text-orange-500 active:scale-95"
        aria-label="Próximo"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
