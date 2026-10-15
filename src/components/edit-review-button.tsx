"use client";

import { Edit3, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { updateReviewAction } from "@/actions/review";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface EditReviewButtonProps {
  reviewId: string;
  productId: string;
  initialRating: number;
  initialComment: string | null;
}

export function EditReviewButton({
  reviewId,
  initialRating,
  initialComment,
}: EditReviewButtonProps) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("reviewId", reviewId);
    formData.append("rating", rating.toString());
    formData.append("comment", comment);

    const result = await updateReviewAction(null, formData);

    if (result?.success) {
      toast.success(result.message);
      setOpen(false);
    } else {
      toast.error(result?.message || "Erro ao atualizar");
    }

    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="cursor-pointer text-neutral-600 transition-colors hover:text-blue-500"
          title="Editar avaliação"
        >
          <Edit3 className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="border-neutral-200 bg-white text-neutral-900 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-neutral-900">
            Editar Avaliação
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="flex flex-col items-center justify-center space-y-2 rounded-lg border border-dashed bg-orange-50 py-4">
            <Label className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
              Sua Nota
            </Label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-6 w-6 ${
                      star <= rating
                        ? "fill-orange-400 text-orange-400"
                        : "text-neutral-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-neutral-600">
              Seu Comentário
            </Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Escreva sua avaliação..."
              className="resize-none"
              rows={4}
              maxLength={155}
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-orange-600 text-white hover:bg-orange-700"
          >
            {isSubmitting ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
