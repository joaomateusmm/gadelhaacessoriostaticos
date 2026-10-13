"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { productColor } from "@/db/schema";

import { ColorSchema, colorSchema } from "./schema";

export async function getColors() {
  const data = await db
    .select()
    .from(productColor)
    .orderBy(desc(productColor.createdAt));

  return data.map((c) => ({
    id: c.id,
    name: c.name,
    hex: c.hex,
    imageUrl: c.imageUrl,
    createdAt: c.createdAt,
  }));
}

export async function createColor(data: ColorSchema) {
  const result = colorSchema.safeParse(data);

  if (!result.success) {
    return { success: false, message: "Dados inválidos." };
  }

  const { name, hex, imageUrl } = result.data;

  if (!hex && !imageUrl) {
    return {
      success: false,
      message: "Informe ao menos uma cor (código HEX) ou uma imagem de textura.",
    };
  }

  try {
    const [inserted] = await db
      .insert(productColor)
      .values({
        name: name.trim(),
        hex: hex?.trim() || null,
        imageUrl: imageUrl?.trim() || null,
      })
      .returning();

    revalidatePath("/admin/cores");
    revalidatePath("/admin/produtos/new");
    revalidatePath("/admin/produtos");

    return {
      success: true,
      message: "Cor cadastrada com sucesso!",
      color: inserted,
    };
  } catch (error) {
    console.error("Erro ao criar cor:", error);
    return { success: false, message: "Erro ao salvar a cor." };
  }
}

export async function updateColor(id: string, data: ColorSchema) {
  const result = colorSchema.safeParse(data);

  if (!result.success) {
    return { success: false, message: "Dados inválidos." };
  }

  const { name, hex, imageUrl } = result.data;

  if (!hex && !imageUrl) {
    return {
      success: false,
      message: "Informe ao menos uma cor (código HEX) ou uma imagem de textura.",
    };
  }

  try {
    await db
      .update(productColor)
      .set({
        name: name.trim(),
        hex: hex?.trim() || null,
        imageUrl: imageUrl?.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(productColor.id, id));

    revalidatePath("/admin/cores");
    revalidatePath("/admin/produtos/new");
    revalidatePath("/admin/produtos");

    return { success: true, message: "Cor atualizada com sucesso!" };
  } catch (error) {
    console.error("Erro ao atualizar cor:", error);
    return { success: false, message: "Erro ao atualizar cor." };
  }
}

export async function deleteColor(id: string) {
  try {
    await db.delete(productColor).where(eq(productColor.id, id));

    revalidatePath("/admin/cores");
    revalidatePath("/admin/produtos/new");
    revalidatePath("/admin/produtos");

    return { success: true, message: "Cor excluída com sucesso." };
  } catch (error) {
    console.error("Erro ao deletar cor:", error);
    return { success: false, message: "Erro ao excluir cor." };
  }
}
