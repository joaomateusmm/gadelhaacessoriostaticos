"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

import {
  ProductPurchaseCard,
  ProductVariantData,
} from "@/components/product-purchase-card";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface ProductPageClientProps {
  product: {
    id: string;
    name: string;
    price: number;
    discountPrice?: number | null;
    images: string[] | null;
    deliveryMode: string;
    isStockUnlimited: boolean | null;
    stock: number | null;
    paymentMethods: string[] | null;
    currency?: string;
    cores?: string[] | null;
    tamanhos?: string[] | null;
    variants?: ProductVariantData[] | null;
  };
  categoryNames: string[];
  defaultImages: string[];
}

export function ProductPageClient({
  product,
  categoryNames,
  defaultImages,
}: ProductPageClientProps) {
  // activeImages: começa com as imagens do produto pai.
  // Quando o usuário seleciona uma cor com foto própria, exibe ela em destaque.
  const [activeImages, setActiveImages] = useState<string[]>(defaultImages);

  // API do carrossel + índice selecionado (para sincronizar as miniaturas)
  const [api, setApi] = useState<CarouselApi>();
  const [selected, setSelected] = useState(0);

  // Callback chamado pelo ProductPurchaseCard quando a variante muda
  const handleVariantChange = useCallback(
    (variantImages: string[] | null | undefined) => {
      if (variantImages && variantImages.length > 0) {
        setActiveImages(variantImages);
      } else {
        setActiveImages(defaultImages);
      }
    },
    [defaultImages],
  );

  // Mantém o índice selecionado em sincronia com o carrossel
  useEffect(() => {
    if (!api) return;

    const onSelect = () => setSelected(api.selectedScrollSnap());

    api.on("select", onSelect);
    api.on("reInit", onSelect);

    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api]);

  // Ao trocar de variante, volta para a primeira imagem
  useEffect(() => {
    api?.scrollTo(0, true);
  }, [api, activeImages]);

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      {/* --- COLUNA ESQUERDA (Galeria) --- */}
      <div className="lg:col-span-7">
        <div className="w-full rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
          <Carousel setApi={setApi} className="w-full">
            <CarouselContent>
              {activeImages.map((imgSrc, index) => (
                <CarouselItem key={`${imgSrc}-${index}`}>
                  <div className="relative flex aspect-4/3 w-full items-center justify-center overflow-hidden rounded-xl bg-neutral-950 p-4">
                    <Image
                      src={imgSrc}
                      alt={`${product.name} - Imagem ${index + 1}`}
                      fill
                      className="object-contain object-center transition-opacity duration-300"
                      priority={index === 0}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>

            {activeImages.length > 1 && (
              <>
                <CarouselPrevious className="left-4 border-neutral-700 bg-neutral-900/80 text-neutral-100 backdrop-blur hover:bg-neutral-800 hover:text-white" />
                <CarouselNext className="right-4 border-neutral-700 bg-neutral-900/80 text-neutral-100 backdrop-blur hover:bg-neutral-800 hover:text-white" />

                {/* Contador de imagens */}
                <span className="pointer-events-none absolute right-3 bottom-3 rounded-full border border-neutral-700 bg-neutral-900/80 px-3 py-1 text-xs font-medium text-neutral-200 tabular-nums backdrop-blur">
                  {selected + 1} / {activeImages.length}
                </span>
              </>
            )}
          </Carousel>

          {/* Miniaturas (clicáveis e sincronizadas com o carrossel) */}
          {activeImages.length > 1 && (
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {activeImages.map((imgSrc, idx) => {
                const isActive = idx === selected;
                return (
                  <button
                    key={`thumb-${imgSrc}-${idx}`}
                    type="button"
                    onClick={() => api?.scrollTo(idx)}
                    aria-label={`Ver imagem ${idx + 1}`}
                    aria-current={isActive}
                    className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-neutral-950 transition focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-none ${
                      isActive
                        ? "border-orange-500"
                        : "border-neutral-800 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <Image src={imgSrc} alt="" fill className="object-cover" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* --- COLUNA DIREITA (Card de Compra) --- */}
      <div className="lg:col-span-5">
        <ProductPurchaseCard
          product={product}
          categoryNames={categoryNames}
          onVariantChange={handleVariantChange}
        />
      </div>
    </div>
  );
}
