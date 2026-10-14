"use server";

import { and, eq, ilike, ne } from "drizzle-orm";

import { db } from "@/db";
import { product } from "@/db/schema";

export async function searchProductsAction(query: string) {
  if (!query || query.length < 2) return [];

  try {
    // Busca produtos onde o nome contém o texto (case insensitive) e não estão ocultos para clientes
    const results = await db
      .select({
        id: product.id,
        name: product.name,
        price: product.price,
        images: product.images,
        discountPrice: product.discountPrice,
      })
      .from(product)
      .where(and(ilike(product.name, `%${query}%`), ne(product.hideFromClients, true)))
      .limit(5);

    return results;
  } catch (error) {
    console.error("Erro na busca:", error);
    return [];
  }
}
