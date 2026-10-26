"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { createFreeOrder } from "@/actions/checkout";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";

interface BuyNowButtonProps {
  product: {
    id: string;
    name: string;
    price: number;
    image?: string;
    stock: number | null;
    isStockUnlimited: boolean;
  };
  variantId?: string | null;
  selectedAttributes?: Record<string, string>;
  selectedImage?: string | null;
  customPrice?: number | null;
  user?: {
    name: string | null;
    email: string | null;
  } | null;
  couponCode?: string;
}

export function BuyNowButton({
  product,
  variantId,
  selectedAttributes,
  selectedImage,
  customPrice,
  user: initialUser,
  couponCode,
}: BuyNowButtonProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(false);

  // Verifica sessão no cliente (mais seguro) ou usa a inicial
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: session } = authClient.useSession();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const user = session?.user || initialUser;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {
    clearCart,
    addItem,
    applyCoupon,
    coupon: storeCoupon,
  } = useCartStore();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const finalPrice = customPrice ?? product.price;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isFree = finalPrice === 0;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isOutOfStock = !product.isStockUnlimited && (product.stock ?? 0) <= 0;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const attributeSuffix = selectedAttributes
    ? Object.values(selectedAttributes).filter(Boolean).join(" / ")
    : "";
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const displayName = attributeSuffix
    ? `${product.name} (${attributeSuffix})`
    : product.name;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const cartItemId = variantId ? `${product.id}-${variantId}` : product.id;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const chosenImage = selectedImage || product.image;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleBuyNow = async () => {};

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const processFreeCheckout = async () => {};

  return (
    <Button
      size="lg"
      className={cn(
        "text-md h-15 w-full cursor-not-allowed rounded-[3px] font-medium text-white opacity-60 shadow-lg",
        "bg-[#676767] hover:bg-[#676767]",
      )}
      disabled={true}
    >
      EM BREVE
    </Button>
  );
}
