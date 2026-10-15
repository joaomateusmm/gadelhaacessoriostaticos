"use client";

import { type ReactNode, useCallback, useState } from "react";

import { ProductGallery } from "@/app/produto/[id]/product-gallery";
import {
  ProductPurchaseCard,
  ProductVariantData,
} from "@/app/produto/[id]/product-purchase-card";

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
    sizeChartUrl?: string | null;
  };
  categoryNames: string[];
  defaultImages: string[];
  customColors?: {
    name: string;
    hex: string | null;
    imageUrl: string | null;
  }[];
  averageRating?: number;
  totalReviews?: number;
  /** Renderizado abaixo do card de compra (acordeões de descrição etc.) */
  children?: ReactNode;
}

export function ProductPageClient({
  product,
  categoryNames,
  defaultImages,
  customColors,
  averageRating = 0,
  totalReviews = 0,
  children,
}: ProductPageClientProps) {
  // Começa com as imagens do produto; troca quando a variante tem fotos próprias
  const [activeImages, setActiveImages] = useState<string[]>(defaultImages);

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

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:gap-16">
      {/* key: ao trocar de variante a galeria reinicia na primeira imagem */}
      <div className="min-w-0 lg:sticky lg:top-32 lg:self-start">
        <ProductGallery
          key={activeImages.join("|")}
          images={activeImages}
          productName={product.name}
        />
      </div>

      <div>
        <ProductPurchaseCard
          product={product}
          categoryNames={categoryNames}
          onVariantChange={handleVariantChange}
          customColors={customColors}
          averageRating={averageRating}
          totalReviews={totalReviews}
        />
        {children}
      </div>
    </div>
  );
}
