import { desc, eq, inArray } from "drizzle-orm";
import {
  FileText,
  Hammer,
  Hash,
  Info,
  ListChecks,
  MessageSquare,
  Ruler,
  ShieldCheck,
  Star,
  Tag,
  User,
  WandSparkles,
  Weight,
} from "lucide-react";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { DeleteReviewButton } from "@/components/delete-review-button";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ProductPageClient } from "@/components/product-page-client";
import { db } from "@/db";
import { category, product, review, user as userTable } from "@/db/schema";
import { auth } from "@/lib/auth";

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

// Superfície padrão dos blocos da página (dark: borda em vez de sombra)
const surface = "rounded-2xl border border-neutral-800 bg-neutral-900";

function SectionTitle({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <h3 className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-neutral-50">
      <span className="text-orange-500">{icon}</span>
      {children}
    </h3>
  );
}

function SpecItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | null;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-neutral-800 bg-neutral-950/60 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-800 text-orange-500">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-neutral-100">{label}</p>
        <p
          className={`text-sm ${value ? "text-neutral-400" : "text-neutral-500"}`}
        >
          {value ?? "Não informado"}
        </p>
      </div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 text-sm first:pt-0 last:pb-0">
      <div className="flex shrink-0 items-center gap-2 text-neutral-400">
        <span className="text-neutral-500">{icon}</span>
        <span>{label}</span>
      </div>
      <div className="text-right">{children}</div>
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

  let categoryNames: string[] = [];
  if (productData.categories && productData.categories.length > 0) {
    const categories = await db
      .select({ name: category.name })
      .from(category)
      .where(inArray(category.id, productData.categories));
    categoryNames = categories.map((c) => c.name);
  }

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
    new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(date);

  const productImages =
    productData.images && productData.images.length > 0
      ? productData.images
      : ["https://placehold.co/600x600/171717/525252.png?text=Sem+Imagem"];

  const defaultImages =
    productData.variants && productData.variants.length > 0
      ? []
      : productImages;

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

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 [color-scheme:dark]">
      <Header />

      <main className="mx-auto max-w-7xl px-4 pt-38 pb-16 md:px-8">
        <ProductPageClient
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          product={productData as any}
          categoryNames={categoryNames}
          defaultImages={defaultImages}
        />

        {/* --- LINHA INFERIOR: Descrição + Informações úteis --- */}
        <div className="mt-8 grid gap-8 lg:grid-cols-12">
          {/* Coluna esquerda: Descrição e Especificações */}
          <section className={`${surface} p-6 md:p-8 lg:col-span-7`}>
            <div className="mb-8">
              <div className="mb-4">
                <SectionTitle icon={<FileText className="h-5 w-5" />}>
                  Descrição
                </SectionTitle>
              </div>
              <p className="max-w-prose leading-relaxed whitespace-pre-line text-neutral-400">
                {productData.description || "Sem descrição disponível."}
              </p>
            </div>

            <div className="border-t border-neutral-800 pt-8">
              <div className="mb-6">
                <SectionTitle icon={<ListChecks className="h-5 w-5" />}>
                  Especificações técnicas
                </SectionTitle>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <SpecItem
                  icon={<Ruler className="h-5 w-5" />}
                  label="Dimensões (Lar. x Alt. x Com.)"
                  value={dimensions}
                />
                <SpecItem
                  icon={<Weight className="h-5 w-5" />}
                  label="Peso"
                  value={weight}
                />
              </div>
            </div>
          </section>

          {/* Coluna direita: Informações úteis */}
          <aside className="lg:col-span-5">
            <div className={`${surface} p-6`}>
              <h4 className="mb-5 flex items-center gap-2 text-base font-semibold text-neutral-50">
                <Info className="h-4 w-4 text-orange-500" />
                Detalhes do produto
              </h4>

              <div className="divide-y divide-neutral-800">
                <DetailRow
                  icon={<Hash className="h-4 w-4" />}
                  label="ID do produto"
                >
                  <span className="font-mono text-xs break-all text-neutral-200">
                    {productData.id}
                  </span>
                </DetailRow>

                <DetailRow
                  icon={<WandSparkles className="h-4 w-4" />}
                  label="Condição"
                >
                  <span className="font-medium text-neutral-100">
                    {conditionMap[productData.condition || "new"] || "Novo"}
                  </span>
                </DetailRow>

                <DetailRow icon={<Tag className="h-4 w-4" />} label="Marca">
                  <span className="font-medium text-neutral-100">
                    {productData.brand || "Sem marca"}
                  </span>
                </DetailRow>

                <DetailRow
                  icon={<Hammer className="h-4 w-4" />}
                  label="Vem montado?"
                >
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="font-medium text-neutral-100">
                      {productData.isAssembled
                        ? "Sim, já vem montado"
                        : "Não, requer montagem"}
                    </span>
                    <Link
                      href="/servicos"
                      className="text-xs font-medium text-orange-500 hover:text-orange-400 hover:underline focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-none"
                    >
                      Contrate nosso serviço de montagem
                    </Link>
                  </div>
                </DetailRow>

                <DetailRow
                  icon={<ShieldCheck className="h-4 w-4" />}
                  label="Garantia"
                >
                  <span
                    className={`block font-medium ${
                      productData.hasWarranty
                        ? "text-emerald-400"
                        : "text-neutral-300"
                    }`}
                  >
                    {productData.hasWarranty
                      ? "Garantia inclusa"
                      : "Sem garantia"}
                  </span>
                  {productData.hasWarranty && productData.warrantyDetails && (
                    <span className="text-xs text-neutral-500">
                      ({productData.warrantyDetails})
                    </span>
                  )}
                </DetailRow>
              </div>
            </div>
          </aside>
        </div>

        {/* --- SEÇÃO INFERIOR: AVALIAÇÕES --- */}
        <section className={`${surface} mt-8 p-6 md:p-8`}>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 pb-5">
            <h4 className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-neutral-50">
              <MessageSquare className="h-5 w-5 text-orange-500" />
              Avaliações da comunidade ({totalReviews})
            </h4>

            {totalReviews > 0 && (
              <div className="flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-1.5">
                <Star className="h-5 w-5 fill-orange-500 text-orange-500" />
                <span className="text-xl font-semibold text-neutral-50 tabular-nums">
                  {averageRating.toFixed(1)}
                </span>
                <span className="text-sm text-neutral-400">/ 5,0</span>
              </div>
            )}
          </div>

          <div className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-neutral-700 max-h-[600px] overflow-y-auto pr-2">
            {reviews.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {reviews.map((reviewItem) => (
                  <article
                    key={reviewItem.id}
                    className="group relative flex flex-col gap-3 rounded-xl border border-neutral-800 bg-neutral-950/60 p-5 transition-colors hover:border-neutral-700 hover:bg-neutral-800/50"
                  >
                    {currentUserId === reviewItem.userId && (
                      <div className="absolute top-3 right-3 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                        <DeleteReviewButton
                          reviewId={reviewItem.id}
                          productId={id}
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-neutral-700 bg-neutral-800">
                        {reviewItem.user?.image ? (
                          <Image
                            src={reviewItem.user.image}
                            alt={reviewItem.user.name || "Usuário"}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <User className="h-5 w-5 text-neutral-500" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-neutral-100">
                          {reviewItem.user?.name || "Usuário"}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {formatDate(reviewItem.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div
                      className="flex gap-0.5"
                      role="img"
                      aria-label={`Nota ${reviewItem.rating} de 5`}
                    >
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3.5 w-3.5 ${
                            reviewItem.rating >= star
                              ? "fill-orange-500 text-orange-500"
                              : "fill-transparent text-neutral-700"
                          }`}
                        />
                      ))}
                    </div>

                    <p className="line-clamp-4 text-sm leading-relaxed break-words text-neutral-400">
                      {reviewItem.comment}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-base text-neutral-300">
                  Ainda não há avaliações para este produto.
                </p>
                <p className="mt-2 text-sm text-neutral-500">
                  Seja o primeiro a avaliar.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
