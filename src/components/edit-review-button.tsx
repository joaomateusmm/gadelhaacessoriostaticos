"use client";

import { Edit3, Image as ImageIcon, Star, Trash2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

import { updateReviewAction } from "@/actions/review";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UploadButton } from "@/lib/uploadthing";
import { cn } from "@/lib/utils";

interface EditReviewButtonProps {
  reviewId: string;
  initialRating: number;
  initialComment: string | null;
  initialImages?: string[] | null;
}

const MAX_CHARS = 155;

export function EditReviewButton({
  reviewId,
  initialRating,
  initialComment,
  initialImages,
}: EditReviewButtonProps) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(initialComment || "");
  const [reviewImages, setReviewImages] = useState<string[]>(initialImages || []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.length > MAX_CHARS) {
      toast.error(`O comentário excede o limite de ${MAX_CHARS} caracteres.`);
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("reviewId", reviewId);
    formData.append("rating", rating.toString());
    formData.append("comment", comment);
    formData.append("images", JSON.stringify(reviewImages));

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
      
      {/* Modal Horizontal / Retangular Ampliado */}
      <DialogContent className="rounded-none border-neutral-200 bg-white text-neutral-900 sm:max-w-[840px] p-10">
        <DialogHeader>
          <DialogTitle className="font-sans text-2xl font-medium tracking-wide text-neutral-900 uppercase">
            Editar Avaliação
          </DialogTitle>
          <DialogDescription className="font-sans text-base text-neutral-500">
            Modifique sua nota, comentário ou fotos do produto.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8 pt-4">
          <input type="hidden" name="reviewId" value={reviewId} />
          <input type="hidden" name="rating" value={rating} />
          <input type="hidden" name="images" value={JSON.stringify(reviewImages)} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* COLUNA ESQUERDA: Estrelas */}
            <div className="flex flex-col items-center justify-center space-y-4 rounded-none border border-neutral-200 bg-neutral-50 p-8 h-full">
              <Label className="font-sans text-sm font-normal tracking-wide text-neutral-500 uppercase">
                Sua nota
              </Label>
              <div className="flex gap-2.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="transition-transform hover:scale-110 focus:outline-none cursor-pointer"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                  >
                    <Star
                      className={cn(
                        "h-9 w-9 transition-all duration-200",
                        (hoverRating || rating) >= star
                          ? "fill-orange-500 text-orange-500"
                          : "fill-neutral-200 text-neutral-300",
                      )}
                    />
                  </button>
                ))}
              </div>
              <p className="h-5 font-sans text-sm font-medium text-orange-600">
                {(hoverRating || rating) === 5 && "Excelente!"}
                {(hoverRating || rating) === 4 && "Muito Bom"}
                {(hoverRating || rating) === 3 && "Bom"}
                {(hoverRating || rating) === 2 && "Razoável"}
                {(hoverRating || rating) === 1 && "Ruim"}
              </p>
            </div>

            {/* COLUNA DIREITA: Comentário & Fotos */}
            <div className="space-y-6">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <Label
                    htmlFor="comment"
                    className="font-sans text-sm font-medium text-neutral-700 uppercase tracking-wide"
                  >
                    Seu comentário
                    <span className="ml-1.5 text-xs font-normal text-neutral-400 normal-case">
                      (Opcional)
                    </span>
                  </Label>
                  <span
                    className={cn(
                      "text-xs transition-colors",
                      comment.length >= MAX_CHARS
                        ? "font-medium text-red-500"
                        : "text-neutral-400",
                    )}
                  >
                    {comment.length} / {MAX_CHARS}
                  </span>
                </div>

                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Escreva sua avaliação..."
                  className="min-h-[120px] resize-none rounded-none border-neutral-300 bg-white text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-0"
                  maxLength={MAX_CHARS}
                />
              </div>

              {/* FOTOS DO PRODUTO */}
              <div className="space-y-3">
                <Label className="font-sans text-sm font-medium text-neutral-700 uppercase tracking-wide flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-orange-500" /> Fotos do Produto (Opcional)
                </Label>
                
                <div className="flex flex-wrap gap-3">
                  {reviewImages.map((url, index) => (
                    <div
                      key={url}
                      className="relative aspect-square h-20 w-20 overflow-hidden rounded-none border border-neutral-300 bg-neutral-100"
                    >
                      <Image
                        src={url}
                        alt={`Foto da avaliação ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setReviewImages(reviewImages.filter((_, i) => i !== index));
                          toast.success("Foto removida!");
                        }}
                        className="absolute top-1 right-1 bg-black/75 p-1 text-white hover:bg-orange-600 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}

                  {reviewImages.length < 10 && (
                    <div className="flex h-20 w-20 items-center justify-center border border-dashed border-neutral-300 bg-neutral-50 hover:border-neutral-900 transition-colors">
                      <UploadButton
                        endpoint="imageUploader"
                        onClientUploadComplete={(res) => {
                          if (res && res[0]?.url) {
                            setReviewImages([...reviewImages, res[0].url]);
                            toast.success("Foto enviada com sucesso!");
                          }
                        }}
                        onUploadError={(error: Error) => {
                          toast.error(`Erro ao enviar foto: ${error.message}`);
                        }}
                        appearance={{
                          button:
                            "h-full w-full bg-transparent text-neutral-600 hover:text-neutral-900 text-sm p-0 ut-uploading:cursor-not-allowed border-0 shadow-none",
                          container: "h-full w-full flex items-center justify-center",
                          allowedContent: "hidden",
                        }}
                        content={{
                          button() {
                            return <span className="text-xs font-medium text-neutral-600 hover:text-neutral-900">+ Foto</span>;
                          },
                        }}
                      />
                    </div>
                  )}
                </div>
                <p className="font-sans text-xs text-neutral-400">
                  Envie até 10 fotos reais ({reviewImages.length}/10).
                </p>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-12 w-full rounded-none bg-orange-600 font-sans text-sm font-medium uppercase tracking-wider text-white shadow-none transition-all hover:bg-orange-700 active:scale-[0.98] cursor-pointer"
          >
            {isSubmitting ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
