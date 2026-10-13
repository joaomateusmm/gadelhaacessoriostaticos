"use server";

import { desc } from "drizzle-orm";

import { db } from "@/db";
import { productColor } from "@/db/schema";

export interface ColorOption {
  id: string;
  name: string;
  hex: string | null;
  imageUrl: string | null;
}

export async function getProductColors(): Promise<ColorOption[]> {
  try {
    const data = await db
      .select({
        id: productColor.id,
        name: productColor.name,
        hex: productColor.hex,
        imageUrl: productColor.imageUrl,
      })
      .from(productColor)
      .orderBy(desc(productColor.createdAt));

    return data;
  } catch (error) {
    console.error("Erro ao buscar cores do banco:", error);
    return [];
  }
}
