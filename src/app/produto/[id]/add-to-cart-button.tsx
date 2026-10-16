"use client";

import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";

interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    price: number;
    discountPrice?: number | null;
    images: string[] | null;
    stock: number | null;
    isStockUnlimited: boolean;
  };
  variantId?: string | null;
  selectedAttributes?: Record<string, string>;
  selectedImage?: string | null;
  customPrice?: number | null;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  showText?: boolean;
  /** Quantidade a adicionar (padrão 1) */
  quantity?: number;
  /** Mostra o ícone de carrinho antes do texto (padrão true) */
  showIcon?: boolean;
}

export function AddToCartButton({
  product,
  variantId,
  selectedAttributes,
  selectedImage,
  customPrice,
  className,
  variant = "default",
  size = "default",
  showText = true,
  quantity = 1,
  showIcon = true,
}: AddToCartButtonProps) {
  const addItem = useCartStore((state) => state.addItem);

  // Lógica de estoque
  const isOutOfStock = !product.isStockUnlimited && (product.stock ?? 0) <= 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOutOfStock) return; // Bloqueio extra de segurança

    const finalPrice = customPrice ?? product.discountPrice ?? product.price;

    const cartItemId = variantId ? `${product.id}-${variantId}` : product.id;
    const attributeSuffix = selectedAttributes
      ? Object.values(selectedAttributes).filter(Boolean).join(" / ")
      : "";
    const displayName = attributeSuffix
      ? `${product.name} (${attributeSuffix})`
      : product.name;

    addItem({
      id: cartItemId,
      productId: product.id,
      variantId: variantId || undefined,
      selectedAttributes: selectedAttributes || undefined,
      name: displayName,
      price: finalPrice,
      image: selectedImage || product.images?.[0] || "",
      quantity,
    });

    toast.success(
      quantity > 1
        ? `${quantity} unidades adicionadas ao carrinho!`
        : "Produto adicionado ao carrinho!",
    );
  };

  return (
    <Button
      onClick={handleAddToCart}
      variant={variant}
      size={size}
      disabled={isOutOfStock}
      className={cn(
        "cursor-pointer rounded-sm transition-transform duration-200 hover:-translate-y-1",
        className,
        isOutOfStock &&
          "cursor-not-allowed bg-[#676767] opacity-100 hover:bg-[#676767]",
      )}
    >
      {showIcon && <ShoppingCart className="mr-2 h-4 w-4" />}
      ADICIONAR AO CARRINHO
    </Button>
  );
}
