import { z } from "zod";

const hexColorRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const safeCssColorRegex =
  /^(#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})|(rgb|rgba|hsl|hsla)\([0-9.,%\s/]+\))$/;

export const HexColorSchema = z
  .string()
  .trim()
  .regex(
    hexColorRegex,
    "Must be a valid hex color string (e.g. #ff5a1f, #ffffff)",
  );

export const CssTokenKeySchema = z
  .string()
  .trim()
  .regex(
    /^[a-zA-Z0-9_-]{1,64}$/,
    "Color token key must be alphanumeric, hyphen, or underscore",
  );

export const SafeCssColorValueSchema = z
  .string()
  .trim()
  .regex(
    safeCssColorRegex,
    "Must be a valid hex or rgb/rgba/hsl/hsla color string",
  );

export const ColorPaletteSchema = z.record(
  CssTokenKeySchema,
  SafeCssColorValueSchema,
);

export const FlexibleColorHexMapSchema = z.union([
  z.object({
    light: ColorPaletteSchema.optional(),
    dark: ColorPaletteSchema.optional(),
  }),
  ColorPaletteSchema,
]);

export const ColorTokensSchema = z.record(
  CssTokenKeySchema,
  z.string().trim().min(1).max(120),
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

export const IdParamSchema = z.object({
  id: z.coerce.number().int().positive("Theme ID must be a positive integer"),
});

export type UpdateActiveThemeInput = z.infer<typeof UpdateActiveThemeSchema>;
export type CreateThemeInput = z.infer<typeof CreateThemeSchema>;
export type IdParamInput = z.infer<typeof IdParamSchema>;
