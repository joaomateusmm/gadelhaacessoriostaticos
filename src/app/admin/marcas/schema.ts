import { z } from "zod";

export const brandSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
});

export type BrandSchema = z.infer<typeof brandSchema>;
