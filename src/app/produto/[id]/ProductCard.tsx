"use client";

import {
  Hammer,
  Heart,
  Loader2,
  ShoppingCart,
  TrendingDown,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";

interface ProductCardProps {
  data: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    discountPrice?: number | null;
    images: string[] | null;
    variants?: Array<{
      images?: string[] | null;
      image?: string | null;
    }> | null;
    stock: number | null;
    isStockUnlimited: boolean;
    currency?: string;
    sku?: string | null;
  };
  categoryName: string;
}

export function ProductCard({ data, categoryName }: ProductCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const addItemToCart = useCartStore((state) => state.addItem);
  const {
    addItem: addItemToWishlist,
    removeItem: removeItemFromWishlist,
    isInWishlist,
  } = useWishlistStore();

  const isFavorite = isInWishlist(data.id);

  // Define a moeda (Padrão GBP se não existir)
  const productCurrency = data.currency || "GBP";

  // 2. Formatação dinâmica baseada na moeda do produto
  const formatPrice = (priceInCents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: productCurrency,
    }).format(priceInCents / 100);
  };

  const discountPercentage =
    data.discountPrice && data.price
      ? Math.round(((data.price - data.discountPrice) / data.price) * 100)
      : 0;

  const finalPrice = data.discountPrice || data.price;

  const isFree = finalPrice === 0;

  // Lógica de Estoque
  const stockCount = data.stock ?? 0;
  const isOutOfStock = !data.isStockUnlimited && stockCount <= 0;

  // Lógica de "Poucas Unidades"
  const isLowStock =
    !data.isStockUnlimited && stockCount > 0 && stockCount <= 10;

  // Procura imagem na galeria geral ou na primeira variante disponível
  const firstVariantImage =
    data.variants?.find((v) => (v.images && v.images.length > 0) || v.image)
      ?.images?.[0] || data.variants?.find((v) => v.image)?.image;

  const productImage =
    data.images && data.images.length > 0
      ? data.images[0]
      : firstVariantImage ||
        "https://placehold.co/992x658/f3f4f6/9ca3af.png?text=Sem+Imagem";

  const handleCardClick = () => {
    startTransition(() => {
      router.push(`/produto/${data.id}`);
    });
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItemToCart({
      id: data.id,
      name: data.name,
      price: finalPrice,
      image: productImage,
      quantity: 1,
    });
    toast.success("Adicionado ao carrinho!");
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isFavorite) {
      removeItemFromWishlist(data.id);
      toast.info("Removido dos favoritos.");
    } else {
      addItemToWishlist({
        id: data.id,
        name: data.name,
        price: finalPrice,
        image: productImage,
        category: categoryName,
      });
      toast.success("Adicionado aos favoritos!");
    }
  };

  const installmentCount = 10;
  const installmentValue = finalPrice / installmentCount;

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        "relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-neutral-800 bg-[#0A0A0A] transition-colors",
        isPending && "pointer-events-none cursor-wait opacity-80",
      )}
    >
      {isPending && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[1px]">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      )}

      {/* --- ÁREA DA IMAGEM (Fundo clean com cantos arredondados) --- */}
      <div className="relative aspect-square w-full overflow-hidden bg-white">
        {/* Badge Lançamento / Desconto no canto superior esquerdo */}
        {discountPercentage > 0 && (
          <span className="absolute top-3 left-3 z-10 rounded-full bg-[#FF4500] px-3.5 py-1 text-[11px] font-extrabold tracking-wide text-white uppercase shadow-sm">
            -{discountPercentage}%
          </span>
        )}

        <Image
          src={productImage}
          alt={data.name}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        />
      </div>

      {/* --- ÁREA DE INFORMAÇÕES (Fundo Preto com Texto Branco) --- */}
      <div className="flex flex-1 flex-col items-center justify-center p-4 text-center">
        {/* Nome do Produto */}
        <h3 className="line-clamp-2 text-sm font-semibold text-white">
          {data.name}
        </h3>

        {/* Preço Principal */}
        <div className="mt-2">
          {isFree ? (
            <span className="text-lg font-bold text-emerald-400 uppercase">
              Grátis
            </span>
          ) : (
            <span className="text-lg font-extrabold text-white">
              {formatPrice(finalPrice)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
