import { z } from "zod";

export const colorSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "O nome da cor é obrigatório"),
  hex: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
});

export type ColorSchema = z.infer<typeof colorSchema>;
