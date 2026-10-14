import { and, desc, eq, ne } from "drizzle-orm";

import { db } from "@/db";
import { category, product } from "@/db/schema";

import { ProductCard } from "./ProductCard";

export default async function ProductCatalog() {
  const allCategories = await db.select().from(category);

  const allProducts = await db
    .select()
    .from(product)
    .where(and(eq(product.status, "active"), ne(product.hideFromClients, true)))
    .orderBy(desc(product.createdAt));

  const categoriesWithProducts = allCategories
    .map((cat) => {
      const productsInCat = allProducts.filter((prod) =>
        prod.categories?.includes(cat.id),
      );

      return {
        ...cat,
        products: productsInCat,
      };
    })
    .filter((cat) => cat.products.length > 0);

  return (
    <section className="relative z-10 w-full bg-neutral-950 px-4 pb-20 text-neutral-100 md:px-8">
      <div className="mx-auto max-w-[1440px]">
        {/* Cabeçalho Geral */}
        <div className="mb-8 flex flex-col text-start">
          <span className="font-montserrat text-sm font-bold tracking-wider text-orange-500 uppercase">
            Nosso Catálogo:
          </span>
        </div>

        {/* --- LISTA DE CATEGORIAS --- */}
        {categoriesWithProducts.length === 0 ? (
          <div className="py-20 text-center text-neutral-500">
            <p>Nenhum produto disponível no momento.</p>
          </div>
        ) : (
          <div className="space-y-16">
            {categoriesWithProducts.map((catSection) => (
              <div key={catSection.id}>
                {/* Título da Categoria */}
                <div className="mb-6 flex items-center gap-4 border-b border-neutral-800 pb-2">
                  <h3 className="font-clash-display text-3xl font-normal tracking-wide text-white uppercase">
                    {catSection.name}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 sm:gap-6 md:grid-cols-3 lg:grid-cols-5">
                  {catSection.products.map((item) => (
                    <ProductCard
                      key={item.id}
                      data={item}
                      categoryName={catSection.name}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
