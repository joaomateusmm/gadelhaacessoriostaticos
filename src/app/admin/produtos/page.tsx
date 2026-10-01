import { count, desc, ilike, or } from "drizzle-orm";
import { Suspense } from "react";

import { ImportProductsButton } from "@/components/import-button";
import { db } from "@/db";
import { category, product } from "@/db/schema";

import { AddProductButton } from "./components/add-button";
import { ProductsTable } from "./components/products-table";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ limit?: string; search?: string }>;
}) {
  const params = await searchParams;

  const limitParam = params.limit ?? "10";
  const limit = limitParam === "all" ? undefined : Number(limitParam);

  const searchTerm = params.search;

  // LÓGICA DE FILTRO
  const searchFilter = searchTerm
    ? or(
        ilike(product.name, `%${searchTerm}%`),
        ilike(product.id, `%${searchTerm}%`),
      )
    : undefined;

  // QUERY PRINCIPAL COM FILTRO
  const productsQuery = db
    .select()
    .from(product)
    .where(searchFilter)
    .orderBy(desc(product.createdAt));

  if (limit) {
    productsQuery.limit(limit);
  }

  const productsData = await productsQuery;

  // CONTAGEM
  const totalCountResult = await db.select({ value: count() }).from(product);
  const totalProducts = totalCountResult[0].value;

  const categoriesData = await db
    .select({
      id: category.id,
      name: category.name,
    })
    .from(category);

  return (
    <div className="space-y-6 p-2 pt-4 text-white">
      {/* --- HEADER DA PÁGINA --- */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-clash-display text-3xl font-medium text-white">
            Meus Produtos
          </h1>
          <p className="font-mono text-xs text-neutral-500">
            Gerencie o catálogo da sua loja.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <AddProductButton />
          {/* <ImportProductsButton /> */}
        </div>
      </div>

      <Suspense
        fallback={
          <div className="flex h-64 items-center justify-center border border-dashed border-neutral-800 bg-neutral-950 font-mono text-xs text-neutral-500 uppercase">
            Carregando tabela...
          </div>
        }
      >
        <ProductsTable
          data={productsData}
          totalProducts={totalProducts}
          limitParam={limitParam}
          allCategories={categoriesData}
        />
      </Suspense>
    </div>
  );
}
