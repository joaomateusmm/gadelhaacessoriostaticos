"use client";

import {
  Check,
  CreditCard,
  Globe, // Ícone para o accordion
  Lock,
  ShieldCheck,
  XCircle,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { AddToWishlistButton } from "@/components/AddToWishlistButton";
import { BuyNowButton } from "@/components/BuyNowButton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// --- CONFIGURAÇÃO DE MOEDAS ---
const EXCHANGE_RATES: Record<string, number> = {
  GBP: 1, // Libra (Base)
  USD: 1.27, // Dólar
  EUR: 1.15, // Euro
  BRL: 7.35, // Real
};

const PAYMENT_LABELS: Record<string, string> = {
  credit_card: "Cartão de crédito",
  debit_card: "Cartão de débito",
  pix: "Pix",
  boleto: "Boleto",
};

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
  };
  categoryNames: string[];
  /** Callback chamado quando a variante selecionada muda. Recebe o array de imagens da variante (ou null). */
  onVariantChange?: (variantImages: string[] | null | undefined) => void;
}

function corParaCss(cor: string): string {
  const mapa: Record<string, string> = {
    preto: "#171717",
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

// Superfície padrão dos cards (dark: borda em vez de sombra)
const cardSurface = "rounded-2xl border-neutral-800 bg-neutral-900 shadow-none";

// Foco visível padrão para botões de seleção
const focusRing =
  "focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 focus-visible:outline-none";

export function ProductPurchaseCard({
  product,
  categoryNames,
  onVariantChange,
}: ProductPurchaseCardProps) {
  const variants = product.variants || [];
  const hasVariants = variants.length > 0;

  // Extrair opções de Cores e Tamanhos únicas
  const coresDisponiveis = hasVariants
    ? Array.from(
        new Set(
          variants
            .map((v) => v.attributes?.["Cor"] || v.attributes?.["cor"])
            .filter(Boolean),
        ),
      )
    : product.cores || [];

  const tamanhosDisponiveis = hasVariants
    ? Array.from(
        new Set(
          variants
            .map((v) => v.attributes?.["Tamanho"] || v.attributes?.["tamanho"])
            .filter(Boolean),
        ),
      )
    : product.tamanhos || [];

  const [selectedCor, setSelectedCor] = useState<string | null>(
    coresDisponiveis[0] || null,
  );
  const [selectedTamanho, setSelectedTamanho] = useState<string | null>(
    tamanhosDisponiveis[0] || null,
  );

  // Encontrar variante selecionada
  const selectedVariant = hasVariants
    ? variants.find((v) => {
        const vCor = v.attributes?.["Cor"] || v.attributes?.["cor"];
        const vTam = v.attributes?.["Tamanho"] || v.attributes?.["tamanho"];
        const matchCor = selectedCor ? vCor === selectedCor : true;
        const matchTam = selectedTamanho ? vTam === selectedTamanho : true;
        return matchCor && matchTam;
      }) || variants[0]
    : null;

  // Notifica a galeria toda vez que a variante selecionada muda
  useEffect(() => {
    if (onVariantChange) {
      const variantImgs = selectedVariant?.images || null;
      onVariantChange(variantImgs);
    }
  }, [selectedVariant?.id, selectedVariant?.images?.length, onVariantChange]);

  // Preço e estoque da variante ou produto pai
  const activePrice = selectedVariant?.price ?? product.price;
  const activeDiscountPrice =
    selectedVariant?.discountPrice ?? product.discountPrice;
  const activeStock = selectedVariant
    ? selectedVariant.stock
    : (product.stock ?? 0);
  const isStockUnlimitedSafe = selectedVariant
    ? selectedVariant.isStockUnlimited
    : (product.isStockUnlimited ?? false);

  const productCurrency = product.currency || "GBP";
  const currentDisplayPrice = activeDiscountPrice || activePrice;

  const [appliedCoupon] = useState<{
    code: string;
    discount: number;
  } | null>(null);

  const originalDiscountPercentage =
    activeDiscountPrice && activePrice
      ? Math.round(((activePrice - activeDiscountPrice) / activePrice) * 100)
      : 0;

  // Função auxiliar para conversão
  const getConvertedPrice = (priceInCents: number, targetCurrency: string) => {
    const basePrice = priceInCents / EXCHANGE_RATES[productCurrency];
    const converted = basePrice * EXCHANGE_RATES[targetCurrency];
    return formatPrice(converted, targetCurrency);
  };

  const selectedVariantImage =
    selectedVariant?.images?.[0] || product.images?.[0] || "";

  return (
    <>
      {/* --- CARD 1: INFORMAÇÕES DE COMPRA --- */}
      <Card className={cardSurface}>
        <CardContent className="space-y-6 p-6">
          {/* Cabeçalho */}
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              {categoryNames.map((cat) => (
                <Badge
                  key={cat}
                  variant="secondary"
                  className="border border-neutral-700 bg-neutral-800 text-xs font-medium text-neutral-300 hover:bg-neutral-700"
                >
                  {cat}
                </Badge>
              ))}
            </div>
            <h1 className="font-clash-display text-3xl leading-tight font-semibold tracking-tight text-neutral-50">
              {product.name}
            </h1>
          </div>

          <Separator className="bg-neutral-800" />

          {/* Preços */}
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              {(activeDiscountPrice || appliedCoupon) && (
                <span className="text-sm text-neutral-500 line-through decoration-neutral-600">
                  {formatPrice(activePrice, productCurrency)}
                </span>
              )}

              {originalDiscountPercentage > 0 && !appliedCoupon && (
                <Badge className="border border-emerald-500/20 bg-emerald-500/10 text-xs text-emerald-400 hover:bg-emerald-500/15">
                  {originalDiscountPercentage}% OFF
                </Badge>
              )}
              {appliedCoupon && (
                <Badge className="border border-sky-500/20 bg-sky-500/10 text-xs text-sky-400 hover:bg-sky-500/15">
                  CUPOM ATIVO
                </Badge>
              )}
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-semibold tracking-tight text-neutral-50 tabular-nums">
                {currentDisplayPrice === 0
                  ? "Gratuito"
                  : formatPrice(currentDisplayPrice, productCurrency)}
              </span>
            </div>

            {/* ACCORDION DE MOEDAS */}
            {currentDisplayPrice > 0 && (
              <div className="mt-2">
                <Accordion
                  type="single"
                  collapsible
                  className="w-full border-none"
                >
                  <AccordionItem value="currencies" className="border-none">
                    <AccordionTrigger className="flex h-6 justify-start gap-1.5 py-0 text-xs font-medium text-neutral-400 hover:text-orange-500 hover:no-underline data-[state=open]:text-orange-500">
                      <Globe className="h-3.5 w-3.5" />
                      <span>Ver preço em outras moedas</span>
                    </AccordionTrigger>
                    <AccordionContent className="pt-3 pb-1">
                      <div className="grid grid-cols-2 gap-3 rounded-xl border border-neutral-800 bg-neutral-950/60 p-3 text-xs text-neutral-400 sm:grid-cols-3">
                        {["GBP", "USD", "EUR", "BRL"]
                          .filter((c) => c !== productCurrency)
                          .map((target) => (
                            <div key={target} className="flex flex-col">
                              <span className="text-[11px] font-semibold text-neutral-500">
                                {target}
                              </span>
                              <span className="font-mono text-neutral-100">
                                {getConvertedPrice(currentDisplayPrice, target)}
                              </span>
                            </div>
                          ))}
                        <div className="col-span-full mt-1 border-t border-neutral-800 pt-2 text-[11px] text-neutral-500">
                          * Conversão estimada. O valor final pode variar no
                          checkout.
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            )}
          </div>

          {/* --- SELETOR DE CORES --- */}
          {coresDisponiveis.length > 0 && (
            <div className="space-y-3 border-t border-neutral-800 pt-5">
              <p className="text-sm font-medium text-neutral-100">
                Cor:{" "}
                <span className="font-normal text-neutral-400">
                  {selectedCor || "Selecione"}
                </span>
              </p>
              <div className="flex flex-wrap gap-2">
                {coresDisponiveis.map((c) => {
                  const isSelected = selectedCor === c;
                  const hex = corParaCss(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedCor(c)}
                      aria-pressed={isSelected}
                      className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${focusRing} ${
                        isSelected
                          ? "border-orange-500 bg-orange-500/10 text-neutral-50"
                          : "border-neutral-700 bg-neutral-900 text-neutral-300 hover:border-neutral-500 hover:bg-neutral-800"
                      }`}
                    >
                      <span
                        className="h-3.5 w-3.5 shrink-0 rounded-full border border-white/25"
                        style={{ backgroundColor: hex }}
                      />
                      <span>{c}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* --- SELETOR DE TAMANHOS --- */}
          {tamanhosDisponiveis.length > 0 && (
            <div className="space-y-3 border-t border-neutral-800 pt-5">
              <p className="text-sm font-medium text-neutral-100">
                Tamanho:{" "}
                <span className="font-normal text-neutral-400">
                  {selectedTamanho || "Selecione"}
                </span>
              </p>
              <div className="flex flex-wrap gap-2">
                {tamanhosDisponiveis.map((tam) => {
                  const isSelected = selectedTamanho === tam;
                  return (
                    <button
                      key={tam}
                      type="button"
                      onClick={() => setSelectedTamanho(tam)}
                      aria-pressed={isSelected}
                      className={`min-w-11 rounded-lg border px-3.5 py-2 text-sm font-semibold uppercase transition-colors ${focusRing} ${
                        isSelected
                          ? "border-orange-600 bg-orange-600 text-white"
                          : "border-neutral-700 bg-neutral-900 text-neutral-300 hover:border-neutral-500 hover:bg-neutral-800"
                      }`}
                    >
                      {tam}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Entrega */}
          {product.deliveryMode === "email" && (
            <div className="flex items-center gap-2.5 rounded-xl border border-orange-500/20 bg-orange-500/10 p-3 text-sm text-orange-300">
              <Zap className="h-4 w-4 shrink-0 fill-current text-orange-500" />
              <span className="font-medium">Entrega automática via e-mail</span>
            </div>
          )}

          {/* Botões */}
          <div className="space-y-3 pt-1">
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
              selectedAttributes={{
                ...(selectedCor ? { Cor: selectedCor } : {}),
                ...(selectedTamanho ? { Tamanho: selectedTamanho } : {}),
              }}
              selectedImage={selectedVariantImage}
              customPrice={currentDisplayPrice}
              couponCode={appliedCoupon?.code}
            />

            <div className="flex w-full gap-3">
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
                selectedAttributes={{
                  ...(selectedCor ? { Cor: selectedCor } : {}),
                  ...(selectedTamanho ? { Tamanho: selectedTamanho } : {}),
                }}
                selectedImage={selectedVariantImage}
                customPrice={currentDisplayPrice}
                variant="outline"
                size="lg"
                className="h-14 flex-1 border-neutral-700 bg-transparent text-base font-semibold text-neutral-100 transition-colors hover:border-neutral-500 hover:bg-neutral-800 hover:text-white"
              />

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
          </div>

          {/* Rodapé de segurança */}
          <div className="grid grid-cols-2 gap-3 text-xs font-medium text-neutral-400">
            <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-950/60 p-3 text-center">
              <ShieldCheck className="h-5 w-5 text-neutral-500" />
              <span>Compra 100% segura</span>
            </div>
            <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-950/60 p-3 text-center">
              {isStockUnlimitedSafe ? (
                <>
                  <Check className="h-5 w-5 text-emerald-400" />
                  <span className="text-emerald-400">Estoque ilimitado</span>
                </>
              ) : activeStock > 0 ? (
                <>
                  <Lock className="h-5 w-5 text-neutral-500" />
                  <span>
                    Restam{" "}
                    <span className="font-bold text-neutral-100">
                      {activeStock}
                    </span>{" "}
                    unidade(s)
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-400" />
                  <span className="font-bold text-red-400">
                    {hasVariants ? "Variação esgotada" : "Produto esgotado"}
                  </span>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- CARD 2: FORMAS DE PAGAMENTO (SEPARADO) --- */}
      {product.paymentMethods && product.paymentMethods.length > 0 && (
        <Card className={`${cardSurface} mt-6`}>
          <CardContent className="pt-6">
            <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-neutral-50">
              <CreditCard className="h-4 w-4 text-orange-500" />
              Formas de pagamento
            </h4>
            <div className="flex flex-wrap gap-2">
              {product.paymentMethods.map((method) => (
                <Badge
                  key={method}
                  variant="secondary"
                  className="border border-neutral-700 bg-neutral-800 px-3 py-1 font-normal text-neutral-300 hover:bg-neutral-700"
                >
                  {PAYMENT_LABELS[method] ?? method}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
