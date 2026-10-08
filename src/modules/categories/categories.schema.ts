import { z } from "zod";

export const CreateCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Category name is required")
    .max(100, "Category name must not exceed 100 characters"),
  slug: z
    .string()
    .trim()
    .max(120, "Category slug must not exceed 120 characters")
    .optional(),
  parentId: z
    .number()
    .int()
    .positive("Parent ID must be a positive integer")
    .nullable()
    .optional(),
  description: z
    .string()
    .max(500, "Description must not exceed 500 characters")
    .nullable()
    .optional(),
  displayOrder: z
    .number()
    .int()
    .nonnegative("Display order must be zero or positive")
    .optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;

export const UpdateCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Category name cannot be empty")
    .max(100, "Category name must not exceed 100 characters")
    .optional(),
  slug: z
    .string()
    .trim()
    .max(120, "Category slug must not exceed 120 characters")
    .optional(),
  parentId: z
    .number()
    .int()
    .positive("Parent ID must be a positive integer")
    .nullable()
    .optional(),
  description: z
    .string()
    .max(500, "Description must not exceed 500 characters")
    .nullable()
    .optional(),
  displayOrder: z
    .number()
    .int()
    .nonnegative("Display order must be zero or positive")
    .optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;

export const CategoryQuerySchema = z.object({
  page: z.preprocess(
    (val) => (val === undefined || val === "" ? undefined : Number(val)),
    z.number().int().positive().optional()
  ),
  limit: z.preprocess(
    (val) => (val === undefined || val === "" ? undefined : Number(val)),
    z.number().int().positive().max(1000).optional()
  ),
  search: z.string().trim().optional(),
  parentId: z.preprocess(
    (val) => (val === undefined || val === "" ? undefined : Number(val)),
    z.number().int().positive().optional()
  ),
  depth: z.preprocess(
    (val) => (val === undefined || val === "" ? undefined : Number(val)),
    z.number().int().nonnegative().optional()
  ),
  includeInactive: z
    .preprocess(
      (val) =>
        val === undefined || val === ""
          ? undefined
          : val === "true" || val === true || val === "1" || val === 1,
      z.boolean().optional()
    ),
  tree: z
    .preprocess(
      (val) =>
        val === undefined || val === ""
          ? undefined
          : val === "true" || val === true || val === "1" || val === 1,
      z.boolean().optional()
    ),
});

export type CategoryQueryInput = z.infer<typeof CategoryQuerySchema>;

export const IdParamSchema = z.object({
  id: z.coerce.number().int().positive("Category ID must be a positive integer"),
});

export type IdParamInput = z.infer<typeof IdParamSchema>;
