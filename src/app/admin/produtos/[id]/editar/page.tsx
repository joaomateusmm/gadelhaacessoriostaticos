import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import EditProductForm from "@/components/admin/edit-product-form";
import { db } from "@/db";
import { product } from "@/db/schema";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const { id } = await params;

  const productData = await db.query.product.findFirst({
    where: eq(product.id, id),
  });

  if (!productData) {
    return notFound();
  }

  return (
    <div className="space-y-4 p-8 pt-6 pb-40">
      <EditProductForm initialData={productData} />
    </div>
  );
}
