import { desc } from "drizzle-orm";

import { AddBrandButton } from "@/app/admin/marcas/add-brand-button";
import { BrandsTable } from "@/app/admin/marcas/brands-table";
import { db } from "@/db";
import { brand } from "@/db/schema";

export default async function AdminBrandsPage() {
  const brands = await db.select().from(brand).orderBy(desc(brand.createdAt));

  return (
    <div className="flex flex-col space-y-8 p-2 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-clash-display text-3xl font-medium tracking-tight text-white">
            Marcas
          </h2>
          <p className="text-neutral-400">Gerencie as marcas da sua loja.</p>
        </div>
        <AddBrandButton />
      </div>

      <div className="rounded-xl">
        <BrandsTable data={brands} />
      </div>
    </div>
  );
}
