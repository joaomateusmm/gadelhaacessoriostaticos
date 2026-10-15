import { desc, eq, inArray } from "drizzle-orm";
import { Star, User } from "lucide-react";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteReviewButton } from "@/components/delete-review-button";
import { EditReviewButton } from "@/components/edit-review-button";
import { Footer } from "@/components/Footer";
import { ReviewDialog } from "@/components/review-dialog";
import { db } from "@/db";
import {
  category,
  product,
  productColor,
  review,
  user as userTable,
} from "@/db/schema";
import { auth } from "@/lib/auth";

import type { ProductSpec } from "./product-info-accordion";
import { ProductInfoAccordion } from "./product-info-accordion";
import { ProductPageClient } from "./product-page-client";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

type ReviewModel = {
  id: string;
  userId: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  user: {
    name: string | null;
    image: string | null;
  } | null;
};

const STAR_COLOR = "#FF4A1C";

function Stars({
  rating,
  size = "h-3.5 w-3.5",
}: {
  rating: number;
  size?: string;
}) {
  return (
    <div className="flex gap-0.5" role="img" aria-label={`Nota ${rating} de 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={size}
          style={
            rating >= star - 0.5
              ? { fill: STAR_COLOR, color: STAR_COLOR }
              : { fill: "#e5e5e5", color: "#e5e5e5" }
          }
        />
      ))}
    </div>
  );
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const currentUserId = session?.user?.id;

  const productData = await db.query.product.findFirst({
    where: eq(product.id, id),
    with: {
      variants: true,
    },
  });

  if (!productData) {
    return notFound();
  }

  // Ordenação inteligente de tamanhos do menor para o maior
  const tamanhoOrdem: Record<string, number> = {
    PP: 1,
    P: 2,
    M: 3,
    G: 4,
    GG: 5,
    XG: 6,
    XXG: 7,
    U: 8,
    ÚNICO: 9,
  };

  const tamanhosList = (productData.tamanhos || []) as string[];
  if (tamanhosList.length > 0) {
    tamanhosList.sort((a, b) => {
      const cleanA = a.trim().toUpperCase();
      const cleanB = b.trim().toUpperCase();
      const numA = parseFloat(cleanA);
      const numB = parseFloat(cleanB);

      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }

      const ordA = tamanhoOrdem[cleanA] || 99;
      const ordB = tamanhoOrdem[cleanB] || 99;
      if (ordA !== ordB) return ordA - ordB;

      return cleanA.localeCompare(cleanB);
    });
  }

  let categoryNames: string[] = [];
  if (productData.categories && productData.categories.length > 0) {
    const categories = await db
      .select({ name: category.name })
      .from(category)
      .where(inArray(category.id, productData.categories));
    categoryNames = categories.map((c) => c.name);
  }

  const allColors = await db
    .select({
      name: productColor.name,
      hex: productColor.hex,
      imageUrl: productColor.imageUrl,
    })
    .from(productColor);

  const rows = await db
    .select({
      review: review,
      user: userTable,
    })
    .from(review)
    .leftJoin(userTable, eq(review.userId, userTable.id))
    .where(eq(review.productId, id))
    .orderBy(desc(review.createdAt));

  const reviews: ReviewModel[] = rows.map((row) => ({
    id: row.review.id,
    userId: row.review.userId,
    rating: row.review.rating,
    comment: row.review.comment,
    createdAt: row.review.createdAt,
    user: row.user
      ? {
          name: row.user.name,
          image: row.user.image,
        }
      : null,
  }));

  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews
      : 0;

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("pt-BR").format(date);

  const productImages =
    productData.images && productData.images.length > 0
      ? productData.images
      : ["https://placehold.co/600x800/f5f5f5/a3a3a3.png?text=Sem+Imagem"];

  const defaultImages = productImages;

  const conditionMap: Record<string, string> = {
    new: "Estado de novo",
    used: "Usado / Ótima condição",
    refurbished: "Recondicionado",
  };

  const dimensions =
    (productData.width ?? 0) > 0 &&
    (productData.height ?? 0) > 0 &&
    (productData.length ?? 0) > 0
      ? `${productData.width}cm x ${productData.height}cm x ${productData.length}cm`
      : null;

  const weight =
    (productData.weight ?? 0) > 0 ? `${productData.weight} kg` : null;

  const specs: ProductSpec[] = [
    ...(dimensions
      ? [{ label: "Dimensões (L x A x C)", value: dimensions }]
      : []),
    ...(weight ? [{ label: "Peso", value: weight }] : []),
    {
      label: "Condição",
      value: conditionMap[productData.condition || "new"] || "Novo",
    },
    ...(productData.brand
      ? [{ label: "Marca", value: productData.brand }]
      : []),
    {
      label: "Montagem",
      value: productData.isAssembled ? (
        "Já vem montado"
      ) : (
        <>
          Requer montagem.{" "}
          <Link href="/servicos" className="underline hover:text-neutral-900">
            Contrate nosso serviço de montagem
          </Link>
        </>
      ),
    },
    {
      label: "Garantia",
      value: productData.hasWarranty
        ? `Garantia inclusa${productData.warrantyDetails ? ` (${productData.warrantyDetails})` : ""}`
        : "Sem garantia",
    },
  ];

  // Distribuição das notas (5 → 1)
  const distribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((r) => r.rating === stars).length;
    return {
      stars,
      count,
      pct: totalReviews > 0 ? (count / totalReviews) * 100 : 0,
    };
  });

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <main className="mx-auto max-w-[1320px] px-4 pt-42 pb-24 md:px-8">
        <ProductPageClient
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          product={productData as any}
          categoryNames={categoryNames}
          defaultImages={defaultImages}
          customColors={allColors}
          averageRating={averageRating}
          totalReviews={totalReviews}
        >
          <ProductInfoAccordion
            description={productData.description}
            specs={specs}
          />
        </ProductPageClient>

        {/* --- AVALIAÇÕES --- */}
        <section className="mx-auto mt-16 w-full border-t border-neutral-200 pt-16">
          <h2 className="text-center text-xl font-light tracking-wide text-neutral-900 uppercase">
            Avaliações de clientes
          </h2>

          {totalReviews > 0 && (
            <div className="mt-2 flex flex-col items-center justify-center gap-8 md:flex-row md:gap-16">
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2">
                  <Stars rating={averageRating} size="h-4 w-4" />
                  <span className="text-sm text-neutral-900">
                    {averageRating.toFixed(2).replace(".", ",")} de 5
                  </span>
                </div>
                <span className="text-xs text-neutral-500">
                  Baseado em {totalReviews}{" "}
                  {totalReviews === 1 ? "avaliação" : "avaliações"}
                </span>
              </div>

              <div className="space-y-1.5">
                {distribution.map(({ stars, count, pct }) => (
                  <div key={stars} className="flex items-center gap-3">
                    <Stars rating={stars} size="h-3 w-3" />
                    <div className="h-2 w-48 bg-neutral-200">
                      <div
                        className="h-full bg-neutral-900"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-8 text-xs text-neutral-500 tabular-nums">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="max-h-[640px] overflow-y-auto pr-2">
            {reviews.length > 0 ? (
              reviews.map((reviewItem) => (
                <article
                  key={reviewItem.id}
                  className="group relative border-b border-neutral-200 py-6 first:border-t"
                >
                  <div className="flex items-start justify-between gap-4">
                    <Stars rating={reviewItem.rating} size="h-4 w-4" />
                    <span className="text-xs text-neutral-400">
                      {formatDate(reviewItem.createdAt)}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-neutral-100">
                      {reviewItem.user?.image ? (
                        <Image
                          src={reviewItem.user.image}
                          alt={reviewItem.user.name || "Usuário"}
                          fill
                          sizes="28px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <User className="h-4 w-4 text-neutral-400" />
                        </div>
                      )}
                    </div>
                    <p className="truncate text-sm text-neutral-900">
                      {reviewItem.user?.name || "Usuário"}
                    </p>

                    {currentUserId === reviewItem.userId && (
                      <div className="ml-auto flex items-center gap-2 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                        <EditReviewButton
                          reviewId={reviewItem.id}
                          initialRating={reviewItem.rating}
                          initialComment={reviewItem.comment}
                        />
                        <DeleteReviewButton
                          reviewId={reviewItem.id}
                          productId={id}
                        />
                      </div>
                    )}
                  </div>

                  {reviewItem.comment && (
                    <p className="mt-3 text-sm leading-relaxed break-words text-neutral-600">
                      {reviewItem.comment}
                    </p>
                  )}
                </article>
              ))
            ) : (
              <div className="pt-12 text-center">
                <p className="text-base text-neutral-700">
                  Ainda não há avaliações para este produto.
                </p>
                <p className="mt-2 mb-6 text-sm text-neutral-400">
                  Seja o primeiro a avaliar.
                </p>
                <div className="flex justify-center">
                  <ReviewDialog productId={id} productName={productData.name} />
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
