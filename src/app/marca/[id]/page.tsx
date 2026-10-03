import { and, eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { db } from "@/db";
import { brand, product } from "@/db/schema";

interface BrandPageProps {
  params: Promise<{ id: string }>;
}

export default async function BrandPage({ params }: BrandPageProps) {
  const { id } = await params;

  const currentBrand = await db.query.brand.findFirst({
    where: eq(brand.id, id),
  });

  if (!currentBrand) {
    return notFound();
  }

  const brandProducts = await db
    .select()
    .from(product)
    .where(and(eq(product.brandId, id), eq(product.status, "active")));

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-36 pb-16 md:px-8">
        {/* CABEÇALHO */}
        <div className="mb-12 flex flex-col gap-4">
          <Link
            href="/"
            className="flex w-fit items-center gap-2 text-sm text-neutral-500 transition-colors hover:text-neutral-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para o catálogo
          </Link>

          <div>
            <h1 className="font-clash-display text-4xl font-medium capitalize text-black md:text-5xl">
              {currentBrand.name}
            </h1>
            <p className="mt-2 text-neutral-500">
              {brandProducts.length} produto
              {brandProducts.length !== 1 ? "s" : ""} encontrado
              {brandProducts.length !== 1 ? "s" : ""} para esta marca.
            </p>
          </div>
        </div>

        {/* GRID DE PRODUTOS */}
        {brandProducts.length === 0 ? (
          <div className="h-full w-full rounded-md border border-neutral-200 shadow-md shadow-neutral-200">
            <div className="flex h-full w-full flex-col items-center justify-center gap-4 py-18">
              <Image
                src="/images/illustration.svg"
                alt="Sem produtos"
                width={220}
                height={220}
                className="opacity-80 grayscale"
              />
              <p className="text-lg font-light text-neutral-400">
                Nenhum produto encontrado para esta marca.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {brandProducts.map((prod) => (
              <ProductCard
                key={prod.id}
                data={{
                  id: prod.id,
                  name: prod.name,
                  description: prod.description,
                  price: prod.price,
                  discountPrice: prod.discountPrice,
                  images: prod.images,
                  stock: prod.stock,
                  isStockUnlimited: prod.isStockUnlimited ?? false,
                  currency: prod.currency,
                }}
                categoryName={currentBrand.name}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
