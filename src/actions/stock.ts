import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { orderItem, product, productVariant } from "@/db/schema";

export async function decreaseProductStock(orderId: string) {
  // 1. Buscar os itens do pedido
  const items = await db
    .select()
    .from(orderItem)
    .where(eq(orderItem.orderId, orderId));

  // 2. Iterar sobre os itens
  for (const item of items) {
    // Se o item possui uma variante associada
    if (item.variantId) {
      const variantData = await db.query.productVariant.findFirst({
        where: eq(productVariant.id, item.variantId),
      });

      if (variantData && !variantData.isStockUnlimited) {
        await db
          .update(productVariant)
          .set({
            stock: sql`GREATEST(0, ${productVariant.stock} - ${item.quantity})`,
          })
          .where(eq(productVariant.id, item.variantId));
      }
    }

    // Busca dados ATUAIS do produto pai
    const productData = await db.query.product.findFirst({
      where: eq(product.id, item.productId),
      columns: {
        id: true,
        stock: true,
        isStockUnlimited: true,
      },
    });

    if (!productData) continue;

    // Atualiza vendas
    await db
      .update(product)
      .set({
        sales: sql`${product.sales} + ${item.quantity}`,
      })
      .where(eq(product.id, item.productId));

    // Se for ilimitado, NÃO mexe no estoque do produto pai
    if (productData.isStockUnlimited) continue;

    // 3. Atualizar o estoque do produto pai
    await db
      .update(product)
      .set({
        stock: sql`GREATEST(0, ${product.stock} - ${item.quantity})`,
      })
      .where(eq(product.id, item.productId));
  }
}
