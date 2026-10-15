"use client";

import { ChevronLeft, ChevronRight, Ruler, Star } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import { AddToCartButton } from "./add-to-cart-button";
import { AddToWishlistButton } from "./AddToWishlistButton";
import { BuyNowButton } from "./BuyNowButton";

// --- PARCELAMENTO (ajuste à vontade) ---
const MAX_INSTALLMENTS = 7;
const MIN_INSTALLMENT_CENTS = 5000; // parcela mínima: R$ 50,00

// --- QUANTIDADE ---
const MAX_QUANTITY = 99; // limite quando o estoque é ilimitado

const STAR_COLOR = "#FF4A1C";

const formatPrice = (value: number, currencyCode: string = "BRL") => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currencyCode,
  }).format(value / 100);
};

export interface ProductVariantData {
  id: string;
  sku?: string | null;
  name?: string | null;
  price?: number | null;
  discountPrice?: number | null;
  stock: number;
  isStockUnlimited: boolean;
  /** Array de URLs das fotos da variante */
  images?: string[] | null;
  /** @deprecated use images[] */
  image?: string | null;
  attributes: Record<string, string>;
}

interface ProductPurchaseCardProps {
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
    brandRef?: { name: string } | null;
    brand?: string | null;
  };
  categoryNames: string[];
  /** Chamado quando a variante muda. Recebe as imagens da variante (ou null). */
  onVariantChange?: (variantImages: string[] | null | undefined) => void;
  customColors?: {
    name: string;
    hex: string | null;
    imageUrl: string | null;
  }[];
  averageRating?: number;
  totalReviews?: number;
}

function corParaCss(cor: string): string {
  const mapa: Record<string, string> = {
    preto: "#000000",
    branco: "#f8fafc",
    cinza: "#9ca3af",
    caqui: "#c8a97e",
    bege: "#e8d9b5",
    areia: "#d4b896",
    marrom: "#92400e",
    vermelho: "#ef4444",
    vinho: "#7f1d1d",
    bordo: "#881337",
    rosa: "#f472b6",
    roxo: "#a855f7",
    lilas: "#c084fc",
    azul: "#3b82f6",
    "azul marinho": "#1e3a5f",
    "azul royal": "#1d4ed8",
    verde: "#22c55e",
    "verde militar": "#4b5320",
    "verde musgo": "#556b2f",
    laranja: "#f97316",
    amarelo: "#facc15",
    dourado: "#d4a017",
    prata: "#cbd5e1",
  };
  return mapa[cor.toLowerCase().trim()] || "#d1d5db";
}

const focusRing =
  "focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:outline-none";

export function ProductPurchaseCard({
  product,
  categoryNames,
  onVariantChange,
  customColors = [],
  averageRating = 0,
  totalReviews = 0,
}: ProductPurchaseCardProps) {
  const variants = product.variants || [];
  const hasVariants = variants.length > 0;

  const getAttr = (v: ProductVariantData, key: "Cor" | "Tamanho") =>
    v.attributes?.[key] || v.attributes?.[key.toLowerCase()];

  // Mapa de ordem fixa para cores com HEX solicitadas
  const hexCorOrdemMap: Record<string, number> = {
    preto: 1,
    cinza: 2,
    prata: 3,
    bege: 4,
    caqui: 5,
    "azul mar.": 6,
    "azul mar": 6,
    "azul marinho": 6,
    "verde militar": 7,
  };

  // Função para ordenar as cores: HEX primeiro (na ordem especificada) e Imagens/Estampas depois
  const sortCores = (list: string[]) => {
    return [...list].sort((a, b) => {
      const matchA = customColors.find(
        (item) => item.name.toLowerCase().trim() === a.toLowerCase().trim(),
      );
      const matchB = customColors.find(
        (item) => item.name.toLowerCase().trim() === b.toLowerCase().trim(),
      );

      const hasImgA = Boolean(matchA?.imageUrl);
      const hasImgB = Boolean(matchB?.imageUrl);

      // Cores HEX vêm SEMPRE antes de cores com imagem
      if (!hasImgA && hasImgB) return -1;
      if (hasImgA && !hasImgB) return 1;

      // Se ambas forem cores HEX
      if (!hasImgA && !hasImgB) {
        const cleanA = a.toLowerCase().trim();
        const cleanB = b.toLowerCase().trim();
        const ordA = hexCorOrdemMap[cleanA] ?? 99;
        const ordB = hexCorOrdemMap[cleanB] ?? 99;

        if (ordA !== ordB) return ordA - ordB;
        return cleanA.localeCompare(cleanB);
      }

      // Se ambas forem cores com Imagem
      return a.localeCompare(b);
    });
  };

  // Opções únicas de Cor e Tamanho
  const rawCores = hasVariants
    ? Array.from(
        new Set(variants.map((v) => getAttr(v, "Cor")).filter(Boolean)),
      )
    : product.cores || [];

  const coresDisponiveis = sortCores(rawCores);

  const tamanhoOrdemMap: Record<string, number> = {
    PP: 1,
    P: 2,
    M: 3,
    G: 4,
    GG: 5,
    XG: 6,
    XXG: 7,
    U: 8,
    ÚNICO: 9,
  };

  const sortTamanhos = (list: string[]) => {
    return [...list].sort((a, b) => {
      const cleanA = a.trim().toUpperCase();
      const cleanB = b.trim().toUpperCase();
      const numA = parseFloat(cleanA);
      const numB = parseFloat(cleanB);

      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }

      const ordA = tamanhoOrdemMap[cleanA] || 99;
      const ordB = tamanhoOrdemMap[cleanB] || 99;
      if (ordA !== ordB) return ordA - ordB;

      return cleanA.localeCompare(cleanB);
    });
  };

  const tamanhosDisponiveis = sortTamanhos(
    hasVariants
      ? Array.from(
          new Set(variants.map((v) => getAttr(v, "Tamanho")).filter(Boolean)),
        )
      : product.tamanhos || [],
  );

  const [selectedCor, setSelectedCor] = useState<string | null>(
    coresDisponiveis[0] || null,
  );
  const [selectedTamanho, setSelectedTamanho] = useState<string | null>(
    tamanhosDisponiveis[0] || null,
  );

  const [quantity, setQuantity] = useState(1);

  // Variante selecionada
  const selectedVariant = hasVariants
    ? variants.find((v) => {
        const matchCor = selectedCor ? getAttr(v, "Cor") === selectedCor : true;
        const matchTam = selectedTamanho
          ? getAttr(v, "Tamanho") === selectedTamanho
          : true;
        return matchCor && matchTam;
      }) || variants[0]
    : null;

  // Notifica a galeria quando a variante muda
  useEffect(() => {
    if (onVariantChange) {
      const variantImgs =
        selectedVariant?.images && selectedVariant.images.length > 0
          ? selectedVariant.images
          : selectedVariant?.image
            ? [selectedVariant.image]
            : [];

      if (variantImgs.length > 0) {
        // Imagens da variante têm PRIORIDADE MÁXIMA (aparecem primeiro).
        // Remove eventuais duplicatas caso alguma imagem da variante também esteja na galeria geral.
        const generalImgs = (product.images || []).filter(
          (img) => !variantImgs.includes(img),
        );
        onVariantChange([...variantImgs, ...generalImgs]);
      } else {
        onVariantChange(null);
      }
    }
  }, [
    selectedVariant?.id,
    selectedVariant?.image,
    selectedVariant?.images,
    onVariantChange,
    product.images,
  ]);

  // Preço e estoque
  const activePrice = selectedVariant?.price ?? product.price;
  const activeDiscountPrice =
    selectedVariant?.discountPrice ?? product.discountPrice;
  const activeStock = selectedVariant
    ? selectedVariant.stock
    : (product.stock ?? 0);
  const isStockUnlimitedSafe = selectedVariant
    ? selectedVariant.isStockUnlimited
    : (product.isStockUnlimited ?? false);
  const isOutOfStock = !isStockUnlimitedSafe && activeStock <= 0;

  // Quantidade nunca passa do estoque da variante selecionada
  const maxQuantity = isStockUnlimitedSafe
    ? MAX_QUANTITY
    : Math.max(activeStock, 1);
  const safeQuantity = Math.min(quantity, maxQuantity);

  const productCurrency = product.currency || "GBP";
  const currentDisplayPrice = activeDiscountPrice || activePrice;

  const [appliedCoupon] = useState<{ code: string; discount: number } | null>(
    null,
  );

  const discountPercentage =
    activeDiscountPrice && activePrice
      ? Math.round(((activePrice - activeDiscountPrice) / activePrice) * 100)
      : 0;

  // Parcelamento
  const installments = Math.min(
    MAX_INSTALLMENTS,
    Math.floor(currentDisplayPrice / MIN_INSTALLMENT_CENTS),
  );
  const installmentValue =
    installments >= 2 ? Math.floor(currentDisplayPrice / installments) : 0;

  const selectedVariantImage =
    selectedVariant?.images?.[0] || product.images?.[0] || "";

  const selectedAttributes = {
    ...(selectedCor ? { Cor: selectedCor } : {}),
    ...(selectedTamanho ? { Tamanho: selectedTamanho } : {}),
  };

  return (
    <div className="space-y-8">
      {/* --- TÍTULO + AVALIAÇÃO + FAVORITO MICRO --- */}
      <div className="relative space-y-3 pr-12">
        <h1 className="text-[28px] leading-[1.15] font-light tracking-tight text-neutral-900 uppercase md:text-[32px]">
          {product.name}
        </h1>

        <div className="absolute top-0 right-0">
          <AddToWishlistButton
            product={{
              id: product.id,
              name: product.name,
              price: currentDisplayPrice,
              image: selectedVariantImage,
              category: categoryNames[0] || "Geral",
            }}
          />
        </div>

        {/* Sempre visível (mesmo com 0 avaliações). Clique leva às avaliações. */}
        <div className="flex items-center gap-3">
          {(() => {
            const brandName = product.brandRef?.name || product.brand;
            if (!brandName) return null;
            return (
              <>
                <span
                  title="Marca do produto"
                  className="text-sm text-neutral-600"
                >
                  {brandName}
                </span>
                <span className="h-3 w-px bg-neutral-300" />
              </>
            );
          })()}

          <a
            href="#avaliacoes"
            className="inline-flex items-center gap-2 text-sm text-neutral-600 transition-colors hover:text-neutral-900"
          >
            <span className="flex gap-0.5" aria-hidden>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className="h-3.5 w-3.5"
                  style={
                    averageRating >= star - 0.5
                      ? { fill: STAR_COLOR, color: STAR_COLOR }
                      : { fill: "#e5e5e5", color: "#e5e5e5" }
                  }
                />
              ))}
            </span>
            <span className="tabular-nums">
              {averageRating.toFixed(2).replace(".", ",")}
            </span>
            <span className="h-3 w-px bg-neutral-300" />
            <span>
              {totalReviews} {totalReviews === 1 ? "avaliação" : "avaliações"}
            </span>
          </a>
        </div>
      </div>

      {/* --- PREÇO --- */}
      <div className="space-y-1">
        {activeDiscountPrice ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-400 line-through">
              {formatPrice(activePrice, productCurrency)}
            </span>
            {discountPercentage > 0 && (
              <span className="bg-neutral-900 px-2 py-0.5 text-xs font-medium text-white">
                -{discountPercentage}%
              </span>
            )}
          </div>
        ) : null}

        <p className="text-2xl font-bold text-neutral-900 tabular-nums">
          {currentDisplayPrice === 0
            ? "Gratuito"
            : formatPrice(currentDisplayPrice, productCurrency)}
        </p>

        {installmentValue > 0 && (
          <p className="text-lg text-neutral-700">
            ou {installments}x de{" "}
            <span className="text-neutral-400 tabular-nums">
              {formatPrice(installmentValue, productCurrency)}
            </span>
          </p>
        )}
      </div>

      {/* --- CORES --- */}
      {coresDisponiveis.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <p className="text-base text-neutral-500">
              Cor:{" "}
              <span className="ml-1 font-medium text-neutral-900">
                {selectedCor || "Selecione"}
              </span>
            </p>
            {isOutOfStock && (
              <span className="text-sm font-medium text-neutral-600/60">
                {hasVariants ? "(variação esgotada)" : "(produto esgotado)"}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {coresDisponiveis.map((c) => {
              const isSelected = selectedCor === c;
              const customMatch = customColors.find(
                (item) =>
                  item.name.toLowerCase().trim() === c.toLowerCase().trim(),
              );
              const hex = customMatch?.hex || corParaCss(c);
              const imageUrl = customMatch?.imageUrl;
              const soldOut =
                hasVariants &&
                variants
                  .filter((v) => getAttr(v, "Cor") === c)
                  .every((v) => !v.isStockUnlimited && v.stock <= 0);

              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedCor(c)}
                  aria-pressed={isSelected}
                  aria-label={c}
                  title={c}
                  className={cn(
                    "relative cursor-pointer rounded-md border-2 p-0.5 transition-colors",
                    focusRing,
                    isSelected && soldOut
                      ? "border-dashed border-neutral-900"
                      : isSelected
                        ? "border-neutral-900"
                        : "border-transparent hover:border-neutral-300",
                  )}
                >
                  <span
                    className="relative block h-8 w-8 overflow-hidden rounded-sm shadow-md shadow-black/30"
                    style={{ backgroundColor: imageUrl ? "transparent" : hex }}
                  >
                    {imageUrl && (
                      <Image
                        src={imageUrl}
                        alt={c}
                        fill
                        sizes="32px"
                        className="object-cover"
                      />
                    )}
                    {soldOut && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/0">
                        <span className="h-px w-full rotate-45 bg-white shadow-sm" />
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* --- TAMANHOS --- */}
      {tamanhosDisponiveis.length > 0 && (
        <div className="space-y-3">
          <p className="text-base text-neutral-500">
            Tamanho:{" "}
            <span className="ml-1 font-medium text-neutral-900">
              {selectedTamanho || "Selecione"}
            </span>
          </p>
          <div className="flex flex-wrap gap-3">
            {tamanhosDisponiveis.map((tam) => {
              const isSelected = selectedTamanho === tam;
              const soldOut =
                hasVariants &&
                variants
                  .filter((v) => getAttr(v, "Tamanho") === tam)
                  .every((v) => !v.isStockUnlimited && v.stock <= 0);

              return (
                <button
                  key={tam}
                  type="button"
                  onClick={() => setSelectedTamanho(tam)}
                  aria-pressed={isSelected}
                  className={cn(
                    "h-12 min-w-[58px] cursor-pointer rounded-md border px-4 text-sm text-neutral-900 uppercase transition-colors",
                    focusRing,
                    isSelected
                      ? "border-neutral-900 ring-1 ring-neutral-900"
                      : "border-neutral-200 hover:border-neutral-400",
                    soldOut && "text-neutral-300 line-through",
                  )}
                >
                  {tam}
                </button>
              );
            })}
          </div>

          {product.sizeChartUrl && (
            <a
              href={product.sizeChartUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 pt-3 text-sm text-neutral-500 transition-colors hover:text-neutral-900"
            >
              <Ruler className="h-4 w-4" />
              Tabela de Medidas
            </a>
          )}
        </div>
      )}

      {product.deliveryMode === "email" && (
        <p className="text-sm text-neutral-500">
          Entrega automática via e-mail
        </p>
      )}

      {/* --- COMPRA --- */}
      <div className="space-y-3">
        <div className="flex w-full gap-3">
          {/* Seletor de quantidade */}
          <div className="flex h-[60px] w-36 shrink-0 items-center justify-between rounded-[4px] border border-neutral-200 bg-white px-3">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, safeQuantity - 1))}
              disabled={isOutOfStock || safeQuantity <= 1}
              aria-label="Diminuir quantidade"
              className="flex h-10 w-10 cursor-pointer items-center justify-center text-neutral-900 transition-opacity hover:opacity-60 focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span
              className="text-sm text-neutral-900 tabular-nums"
              aria-live="polite"
            >
              {safeQuantity}
            </span>
            <button
              type="button"
              onClick={() =>
                setQuantity(Math.min(maxQuantity, safeQuantity + 1))
              }
              disabled={isOutOfStock || safeQuantity >= maxQuantity}
              aria-label="Aumentar quantidade"
              className="flex h-10 w-10 cursor-pointer items-center justify-center text-neutral-900 transition-opacity hover:opacity-60 focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <AddToCartButton
            product={{
              id: product.id,
              name: product.name,
              price: activePrice,
              discountPrice: activeDiscountPrice,
              images: product.images,
              stock: activeStock,
              isStockUnlimited: isStockUnlimitedSafe,
            }}
            variantId={selectedVariant?.id || null}
            selectedAttributes={selectedAttributes}
            selectedImage={selectedVariantImage}
            customPrice={currentDisplayPrice}
            quantity={safeQuantity}
            showIcon={false}
            variant="default"
            size="lg"
            className="h-[60px] min-w-0 flex-1 rounded-[4px] bg-neutral-900 text-[15px] font-medium text-white uppercase hover:translate-y-0 hover:bg-black"
          />
        </div>

        <BuyNowButton
          product={{
            id: product.id,
            name: product.name,
            price: currentDisplayPrice,
            image: selectedVariantImage,
            stock: activeStock,
            isStockUnlimited: isStockUnlimitedSafe,
          }}
          variantId={selectedVariant?.id || null}
          selectedAttributes={selectedAttributes}
          selectedImage={selectedVariantImage}
          customPrice={currentDisplayPrice}
          couponCode={appliedCoupon?.code}
        />

        <p className="text-sm text-neutral-400">
          Seu frete será calculado no checkout
        </p>
      </div>
    </div>
  );
}
