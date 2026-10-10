"use client";

import Image from "next/image";
import { useState } from "react";

import { ProductPurchaseCard, ProductVariantData } from "@/components/product-purchase-card";
import {
  Carousel,
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

  // Callback chamado pelo ProductPurchaseCard quando a variante muda
  const handleVariantChange = (variantImage: string | null | undefined) => {
    if (variantImage) {
      // Coloca a foto da variante como primeira, mantendo as demais do produto
      const rest = defaultImages.filter((img) => img !== variantImage);
      setActiveImages([variantImage, ...rest]);
    } else {
      // Volta para as imagens originais do produto
      setActiveImages(defaultImages);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      {/* --- COLUNA ESQUERDA (Galeria) --- */}
      <div className="lg:col-span-7">
        <div className="w-full rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <Carousel className="w-full">
            <CarouselContent>
              {activeImages.map((imgSrc, index) => (
                <CarouselItem key={`${imgSrc}-${index}`}>
                  <div className="relative flex aspect-4/3 w-full items-center justify-center overflow-hidden rounded-lg bg-neutral-50 p-4">
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
                <CarouselPrevious className="left-4 border-neutral-200 bg-white/80 text-neutral-900 hover:bg-white" />
                <CarouselNext className="right-4 border-neutral-200 bg-white/80 text-neutral-900 hover:bg-white" />
              </>
            )}
          </Carousel>

          {/* Thumbnails */}
          {activeImages.length > 1 && (
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
              {activeImages.map((imgSrc, idx) => (
                <div
                  key={`thumb-${imgSrc}-${idx}`}
                  className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-neutral-200 bg-neutral-50"
                >
                  <Image
                    src={imgSrc}
                    alt="thumb"
                    fill
                    className="object-cover opacity-70 transition-opacity hover:opacity-100"
                  />
                </div>
              ))}
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
