"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { db } from "@/db";
import { product, review } from "@/db/schema";
import { auth } from "@/lib/auth";
import { sendReviewToDiscord } from "@/lib/discord";

// 1. Definição do Tipo de Retorno (Estado)
export type ReviewState = {
  success: boolean;
  message: string;
  errors?: {
    [key: string]: string[];
  };
} | null;

// Schema refinado
const createReviewSchema = z.object({
  // CORREÇÃO: Removi o .uuid() para aceitar IDs antigos (ex: "005")
  productId: z.string().min(1, "ID do produto inválido"),
  rating: z.coerce.number().int().min(1, "A nota é obrigatória").max(5),
  comment: z
    .string()
    .trim()
    .max(155, "O comentário não pode ter mais de 155 caracteres")
    .optional()
    .nullable()
    .transform((val) => val || ""),
  images: z.array(z.string()).optional().default([]),
});

export async function createReviewAction(
  prevState: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return {
        success: false,
        message: "Você precisa estar logado para avaliar.",
      };
    }

    const rawProductId = formData.get("productId");
    const rawRating = formData.get("rating");
    const rawComment = formData.get("comment");
    const rawImagesJson = formData.get("images");

    let parsedImages: string[] = [];
    if (rawImagesJson && typeof rawImagesJson === "string") {
      try {
        parsedImages = JSON.parse(rawImagesJson);
      } catch {
        parsedImages = [];
      }
    }

    const rawData = {
      productId: rawProductId,
      rating: rawRating,
      comment: rawComment,
      images: parsedImages,
    };

    const validatedFields = createReviewSchema.safeParse(rawData);

    if (!validatedFields.success) {
      console.error(
        "Erro de validação na Review:",
        validatedFields.error.flatten().fieldErrors,
      );

      return {
        success: false,
        message: "Dados inválidos. Verifique a nota e o comentário.",
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { productId, rating, comment, images } = validatedFields.data;

    // Inserir no Banco
    await db.insert(review).values({
      userId: session.user.id,
      productId: productId,
      rating: rating,
      comment: comment,
      images: images || [],
    });

    // Discord
    try {
      const productData = await db.query.product.findFirst({
        where: eq(product.id, productId),
        columns: { name: true },
      });

      const productName = productData?.name || "Produto da Loja";

      await sendReviewToDiscord(
        session.user.name,
        productName,
        rating,
        comment,
      );
    } catch (discordError) {
      console.error("Falha ao enviar webhook para o Discord:", discordError);
    }

    revalidatePath(`/produto/${productId}`);

    return {
      success: true,
      message: "Avaliação enviada com sucesso!",
    };
  } catch (error) {
    console.error("Erro CRÍTICO ao criar avaliação:", error);
    return {
      success: false,
      message: "Ocorreu um erro interno. Tente novamente.",
    };
  }
}

export async function deleteReviewAction(reviewId: string, productId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, message: "Não autorizado." };
    }

    const deleted = await db
      .delete(review)
      .where(and(eq(review.id, reviewId), eq(review.userId, session.user.id)))
      .returning();

    if (!deleted.length) {
      return { success: false, message: "Erro ao apagar ou permissão negada." };
    }

    revalidatePath(`/produto/${productId}`);

    return { success: true, message: "Avaliação removida." };
  } catch (error) {
    console.error("Erro ao deletar review:", error);
    return { success: false, message: "Erro interno." };
  }
}

// ... (mantenha os imports anteriores)

// Schema para atualização (basicamente o mesmo, mas precisa do reviewId)
const updateReviewSchema = z.object({
  reviewId: z.string(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z
    .string()
    .trim()
    .max(155)
    .optional()
    .nullable()
    .transform((val) => val || ""),
  images: z.array(z.string()).optional().default([]),
});

export async function updateReviewAction(
  prevState: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, message: "Não autorizado." };
    }

    const rawImagesJson = formData.get("images");
    let parsedImages: string[] = [];
    if (rawImagesJson && typeof rawImagesJson === "string") {
      try {
        parsedImages = JSON.parse(rawImagesJson);
      } catch {
        parsedImages = [];
      }
    }

    const rawData = {
      reviewId: formData.get("reviewId"),
      rating: formData.get("rating"),
      comment: formData.get("comment"),
      images: parsedImages,
    };

    const validated = updateReviewSchema.safeParse(rawData);

    if (!validated.success) {
      return {
        success: false,
        message: "Dados inválidos.",
        errors: validated.error.flatten().fieldErrors,
      };
    }

    const { reviewId, rating, comment, images } = validated.data;

    // Atualiza APENAS se o review pertencer ao usuário
    const updated = await db
      .update(review)
      .set({
        rating,
        comment,
        images: images || [],
      })
      .where(and(eq(review.id, reviewId), eq(review.userId, session.user.id)))
      .returning();

    if (!updated.length) {
      return {
        success: false,
        message: "Review não encontrada ou permissão negada.",
      };
    }

    revalidatePath("/minha-conta/avaliacoes");
    revalidatePath(`/produto/${updated[0].productId}`);

    return { success: true, message: "Avaliação atualizada!" };
  } catch (error) {
    console.error("Erro ao atualizar review:", error);
    return { success: false, message: "Erro interno." };
  }
}
