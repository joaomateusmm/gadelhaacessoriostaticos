"use client";

import { Image as ImageIcon, Star, Trash2 } from "lucide-react";
import Image from "next/image";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { createReviewAction } from "@/actions/review";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UploadButton } from "@/lib/uploadthing";
import { cn } from "@/lib/utils";

import { Label } from "./ui/label";

interface ProductReviewFormProps {
  productId: string;
  onSuccess?: () => void; // <-- NOVO: Callback para fechar o modal
}

const initialState = {
  success: false,
  message: "",
  errors: undefined,
};

const MAX_CHARS = 155;

export function ProductReviewForm({
  productId,
  onSuccess,
}: ProductReviewFormProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [state, action, isPending] = useActionState<any, FormData>(
    createReviewAction,
    initialState,
  );

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [localError, setLocalError] = useState("");
  const [commentText, setCommentText] = useState("");
  const [reviewImages, setReviewImages] = useState<string[]>([]);

  // Referência para o formulário para podermos enviar automaticamente
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.message) {
      if (state.success) {
        toast.success(state.message);
        setLocalError("");
        setCommentText("");

        // NOVO: Chama a função de fechar o modal após 1.5s (para dar tempo de ler o "Obrigado!")
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 1500);
        }
      } else if (!state.success && state.message) {
        toast.error(state.message);
      }
    }
  }, [state, onSuccess]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    // Validação básica antes de enviar
    setLocalError("");

    if (commentText.length > MAX_CHARS) {
      e.preventDefault(); // Impede o envio se estiver muito longo
      const msg = `O comentário excede o limite de ${MAX_CHARS} caracteres.`;
      toast.error(msg);
      setLocalError(msg);
      return;
    }
    // Se passar, a action server-side (createReviewAction) será chamada normalmente
  };

  // Função para preencher e enviar comentário rápido
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleQuickComment = (text: string) => {
    setCommentText(text);
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.requestSubmit();
      }
    }, 0);
  };

  return (
    // ESTILO: Clean, minimalista, profissional idêntico à loja (ampliado em 20%)
    <div className="rounded-none border border-neutral-200 bg-white p-8 shadow-none">
      {state?.success ? (
        <div className="animate-in fade-in zoom-in flex flex-col items-center justify-center gap-4 rounded-none border border-neutral-200 bg-neutral-50 p-10 text-center text-base text-neutral-900">
          <div className="rounded-full bg-white p-4 shadow-sm ring-1 ring-neutral-200">
            <div className="flex gap-1.5">
              {Array.from({ length: rating }).map((_, i) => (
                <Star
                  key={i}
                  className="h-5 w-5 fill-orange-500 text-orange-500"
                />
              ))}
            </div>
          </div>
          <div>
            <p className="font-sans text-lg font-medium text-neutral-900">
              Obrigado por avaliar!
            </p>
            <p className="mt-1 font-sans text-sm text-neutral-500">
              {state.message}
            </p>
          </div>
        </div>
      ) : (
        <form
          ref={formRef}
          action={action}
          onSubmit={handleSubmit}
          noValidate
          className="space-y-8"
        >
          <input type="hidden" name="productId" value={productId} />
          <input
            type="hidden"
            name="images"
            value={JSON.stringify(reviewImages)}
          />

          <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-2">
            {/* COLUNA ESQUERDA: Estrelas */}
            <div className="flex h-full flex-col items-center justify-center space-y-4 rounded-none border border-neutral-200 bg-neutral-50 p-8">
              <Label className="font-sans text-sm font-normal tracking-wide text-neutral-500 uppercase">
                Sua nota
              </Label>
              <div className="flex gap-2.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="cursor-pointer transition-transform hover:scale-110 focus:outline-none"
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
              <input type="hidden" name="rating" value={rating} />
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
                    className="font-sans text-sm font-medium tracking-wide text-neutral-700 uppercase"
                  >
                    Seu comentário
                    <span className="ml-1.5 text-xs font-normal text-neutral-400 normal-case">
                      (Opcional)
                    </span>
                  </Label>
                  <span
                    className={cn(
                      "text-xs transition-colors",
                      commentText.length >= MAX_CHARS
                        ? "font-medium text-red-500"
                        : "text-neutral-400",
                    )}
                  >
                    {commentText.length} / {MAX_CHARS}
                  </span>
                </div>

                <Textarea
                  id="comment"
                  name="comment"
                  placeholder="O que você achou do produto? Conte detalhes..."
                  className={cn(
                    "min-h-[120px] resize-none rounded-none border-neutral-300 bg-white text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-0",
                    localError && "border-red-500 focus:border-red-500",
                  )}
                  maxLength={MAX_CHARS}
                  value={commentText}
                  onChange={(e) => {
                    setCommentText(e.target.value);
                    setLocalError("");
                  }}
                />

                {localError && (
                  <p className="animate-in slide-in-from-left-1 font-sans text-sm text-red-500">
                    {localError}
                  </p>
                )}

                {state?.errors?.comment && (
                  <p className="font-sans text-sm text-red-500">
                    {state.errors.comment[0]}
                  </p>
                )}
              </div>

              {/* FOTOS DO PRODUTO */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2 font-sans text-sm font-medium tracking-wide text-neutral-700 uppercase">
                  <ImageIcon className="h-4 w-4 text-orange-500" /> Fotos do
                  Produto (Opcional)
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
                          setReviewImages(
                            reviewImages.filter((_, i) => i !== index),
                          );
                          toast.success("Foto removida!");
                        }}
                        className="absolute top-1 right-1 bg-black/75 p-1 text-white transition-colors hover:bg-orange-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}

                  {reviewImages.length < 10 && (
                    <div className="flex h-20 w-20 items-center justify-center border border-dashed border-neutral-300 bg-neutral-50 transition-colors hover:border-neutral-900">
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
                          container:
                            "h-full w-full flex items-center justify-center",
                          allowedContent: "hidden",
                        }}
                        content={{
                          button() {
                            return (
                              <span className="text-xs font-medium text-neutral-600 hover:text-neutral-900">
                                + Foto
                              </span>
                            );
                          },
                        }}
                      />
                    </div>
                  )}
                </div>
                <p className="font-sans text-xs text-neutral-400">
                  Envie até 10 fotos reais do produto recebido (
                  {reviewImages.length}/10).
                </p>
              </div>
            </div>
          </div>

          {state?.message && !state.success && (
            <div className="rounded-none bg-red-50 p-3.5 font-sans text-sm text-red-600">
              {state.message}
            </div>
          )}

          <Button
            type="submit"
            disabled={isPending}
            className="h-12 w-full cursor-pointer rounded-none bg-orange-600 font-sans text-sm font-medium tracking-wider text-white uppercase shadow-none transition-all hover:bg-orange-700 active:scale-[0.98]"
          >
            {isPending ? "Enviando..." : "Enviar Avaliação"}
          </Button>
        </form>
      )}
    </div>
  );
}
