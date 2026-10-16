"use client";

import { MessageSquarePlus } from "lucide-react";
import { useState } from "react";

import { ProductReviewForm } from "@/components/product-review-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ReviewDialogProps {
  productId: string;
  productName: string;
}

export function ReviewDialog({ productId, productName }: ReviewDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          size="sm"
          className="h-11 rounded-none gap-2 bg-orange-600 px-6 text-xs font-medium uppercase tracking-wider text-white shadow-none hover:bg-orange-700 cursor-pointer"
        >
          <MessageSquarePlus className="h-4 w-4" />
          Avaliar Produto
        </Button>
      </DialogTrigger>
      {/* Modal Branco Clean Horizontal / Retangular aumentado em 20% */}
      <DialogContent className="rounded-none border-neutral-200 bg-white text-neutral-900 sm:max-w-[840px] p-10">
        <DialogHeader>
          <DialogTitle className="font-sans text-2xl font-medium tracking-wide text-neutral-900 uppercase">
            Avaliar Produto
          </DialogTitle>
          <DialogDescription className="font-sans text-base text-neutral-500">
            Dê sua opinião sobre{" "}
            <strong className="text-neutral-900 font-medium">{productName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="pt-6">
          <ProductReviewForm productId={productId} onSuccess={() => setOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
