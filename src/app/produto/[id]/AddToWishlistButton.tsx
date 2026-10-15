"use client";

import { Heart, HeartPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWishlistStore } from "@/store/wishlist-store";

interface AddToWishlistButtonProps {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    category: string;
  };
  className?: string;
}

export function AddToWishlistButton({
  product,
  className,
}: AddToWishlistButtonProps) {
  const {
    addItem: addItemToWishlist,
    removeItem: removeItemFromWishlist,
    isInWishlist,
  } = useWishlistStore();

  const isFavorite = isInWishlist(product.id);

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isFavorite) {
      removeItemFromWishlist(product.id);
      toast.info("Removido dos favoritos.");
    } else {
      addItemToWishlist({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
      });
      toast.success("Adicionado aos favoritos!");
    }
  };

  return (
    <button
      type="button"
      onClick={handleFavorite}
      aria-label="Favoritar"
      className={cn(
        "flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-800 shadow-sm transition-all duration-300 hover:bg-neutral-50 hover:scale-105 active:scale-95",
        isFavorite && "border-red-500 bg-red-50 text-red-500",
        className,
      )}
    >
      <Heart className={cn("h-5 w-5", isFavorite && "fill-current")} />
    </button>
  );
}
