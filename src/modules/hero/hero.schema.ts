import { z } from "zod";

export const HeroIdParamSchema = z.object({
  id: z.string().uuid("Invalid hero image ID format"),
});

export const UpdateHeroStatusSchema = z.object({
  is_active: z.boolean(),
});

export const UpdateHeroImageSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  subtitle: z.string().max(200).nullable().optional(),
  sort_order: z.number().int().min(0).max(9999).optional(),
  is_active: z.boolean().optional(),
});

