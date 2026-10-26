import { z } from "zod";

export const HeroIdParamSchema = z.object({
  id: z.string().uuid("Invalid hero image ID format"),
});

export const UpdateHeroStatusSchema = z.object({
  is_active: z.boolean().optional(),
  isActive: z.boolean().optional(),
}).refine(
  (data) => data.is_active !== undefined || data.isActive !== undefined,
  { message: "Either 'is_active' or 'isActive' boolean is required." },
);

export const UpdateHeroImageSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  subtitle: z.string().max(200).nullable().optional(),
  detail: z.string().max(1000).nullable().optional(),
  category_name: z.string().max(150).nullable().optional(),
  categoryName: z.string().max(150).nullable().optional(),
  category_slug: z.string().max(150).nullable().optional(),
  categorySlug: z.string().max(150).nullable().optional(),
  image_url: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  storage_key: z.string().max(500).nullable().optional(),
  storageKey: z.string().max(500).nullable().optional(),
  sort_order: z.number().int().min(0).max(9999).optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
  is_active: z.boolean().optional(),
  isActive: z.boolean().optional(),
});
