import { desc } from "drizzle-orm";
import { Palette } from "lucide-react";

import { AddColorButton } from "@/app/admin/cores/add-color-button";
import { ColorsTable } from "@/app/admin/cores/colors-table";
import { db } from "@/db";
import { productColor } from "@/db/schema";

export const metadata = {
  title: "Cores de Produtos | Admin",
  description: "Gerencie as opções de cores sólidas e texturas camufladas dos produtos.",
};

export default async function AdminColorsPage() {
  const colors = await db
    .select()
    .from(productColor)
    .orderBy(desc(productColor.createdAt));

  return (
    <div className="space-y-6 pt-4 text-white">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-orange-500/20 bg-orange-500/10 text-orange-400">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-clash-display text-3xl font-medium tracking-tight text-white">
                Cores dos Produtos
              </h2>
              <p className="text-xs text-neutral-400">
                Cadastre cores com código HEX ou fotos de texturas/camuflagens para seus produtos.
              </p>
            </div>
          </div>
        </div>
        <AddColorButton />
      </div>

      <div className="rounded-xl">
        <ColorsTable data={colors} />
      </div>
    </div>
  );
}
