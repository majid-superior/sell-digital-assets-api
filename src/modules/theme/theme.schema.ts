import { z } from "zod";

const hexColorRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

export const HexColorSchema = z
  .string()
  .trim()
  .regex(
    hexColorRegex,
    "Must be a valid hex color string (e.g. #ff5a1f, #ffffff)",
  );

export const ColorPaletteSchema = z.record(z.string(), z.string());

export const FlexibleColorHexMapSchema = z.union([
  z.object({
    light: ColorPaletteSchema.optional(),
    dark: ColorPaletteSchema.optional(),
  }).passthrough(),
  ColorPaletteSchema,
]);

export const ColorTokensSchema = z.record(
  z.string(),
  z.string().trim().min(1),
);

export const UpdateActiveThemeSchema = z.object({
  color_hex_map: FlexibleColorHexMapSchema.optional(),
  colorHexMap: FlexibleColorHexMapSchema.optional(),
  color_tokens: ColorTokensSchema.optional(),
  colorTokens: ColorTokensSchema.optional(),
  name: z.string().trim().min(1).max(100).optional(),
  mode: z.string().trim().optional(),
  border_radius: z.string().trim().optional(),
  borderRadius: z.string().trim().optional(),
  typography: z.record(z.string(), z.unknown()).optional(),
  is_active: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const CreateThemeSchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must contain only lowercase alphanumeric characters and hyphens",
    ),
  mode: z.string().trim().optional().default("dark"),
  is_active: z.boolean().optional().default(false),
  isActive: z.boolean().optional(),
  color_hex_map: FlexibleColorHexMapSchema.optional(),
  colorHexMap: FlexibleColorHexMapSchema.optional(),
  color_tokens: ColorTokensSchema.optional(),
  colorTokens: ColorTokensSchema.optional(),
  border_radius: z.string().trim().optional(),
  borderRadius: z.string().trim().optional(),
  typography: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type UpdateActiveThemeInput = z.infer<typeof UpdateActiveThemeSchema>;
export type CreateThemeInput = z.infer<typeof CreateThemeSchema>;
