"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { brand } from "@/db/schema";

import { BrandSchema, brandSchema } from "./schema";

// --- CRIAR MARCA ---
export async function createBrand(data: BrandSchema) {
  const result = brandSchema.safeParse(data);

  if (!result.success) {
    return { success: false, message: "Dados inválidos." };
  }

  try {
    await db.insert(brand).values({
      name: result.data.name,
    });

    revalidatePath("/admin/marcas");
    revalidatePath("/"); // Atualiza o menu do site

    return { success: true, message: "Marca adicionada com sucesso!" };
  } catch (error) {
    console.error("Erro ao criar marca:", error);
    return { success: false, message: "Erro ao criar marca." };
  }
}

// --- DELETAR MARCA ---
export async function deleteBrand(id: string) {
  try {
    await db.delete(brand).where(eq(brand.id, id));

    revalidatePath("/admin/marcas");
    revalidatePath("/");

    return { success: true, message: "Marca excluída com sucesso." };
  } catch (error) {
    console.error("Erro ao deletar marca:", error);
    return {
      success: false,
      message: "Erro ao excluir. Verifique se há produtos vinculados.",
    };
  }
}
