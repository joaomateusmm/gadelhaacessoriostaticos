"use server";
import { desc } from "drizzle-orm";

import { db } from "@/db";
import { brand } from "@/db/schema";

export async function getBrands() {
  const data = await db.select().from(brand).orderBy(desc(brand.createdAt));
  return data.map((b) => ({ id: b.id, name: b.name }));
}
