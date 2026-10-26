import { z } from "zod";

export const MAX_STOREFRONT_BANNER_BYTES = 3 * 1024 * 1024; // 3 MB max file size (no min limit)

export const RESERVED_STOREFRONT_SLUGS = new Set([
  "admin",
  "administrator",
  "root",
  "superuser",
  "system",
  "auth",
  "login",
  "signin",
  "signup",
  "register",
  "logout",
  "signout",
  "dashboard",
  "seller",
  "buyer",
  "customer",
  "catalog",
  "explore",
  "categories",
  "featured",
  "asset",
  "assets",
  "product",
  "products",
  "item",
  "items",
  "download",
  "downloads",
  "license",
  "licenses",
  "api",
  "doc",
  "docs",
  "swagger",
  "terms",
  "privacy",
  "about",
  "contact",
  "support",
  "help",
  "faq",
  "checkout",
  "cart",
  "billing",
  "payment",
  "theme",
  "settings",
  "storefront",
]);

export const PresignStorefrontBannerSchema = z.object({
  fileName: z
    .string()
    .trim()
    .min(1, "Banner file name is required")
    .max(255, "Banner file name cannot exceed 255 characters"),
  contentType: z.enum(["image/png", "image/jpeg", "image/webp"]),
  fileSizeBytes: z
    .number()
    .int()
    .min(0)
    .max(
      MAX_STOREFRONT_BANNER_BYTES,
      "Banner image exceeds the 3 MB maximum size limit."
    )
    .optional()
    .default(0),
});

export type PresignStorefrontBannerInput = z.infer<
  typeof PresignStorefrontBannerSchema
>;

export const UpdateStorefrontSchema = z.object({
  url: z
    .string()
    .trim()
    .min(3, "Custom URL must be at least 3 characters (e.g., seller01)")
    .max(30, "Custom URL cannot exceed 30 characters")
    .regex(
      /^[a-z0-9][a-z0-9_-]*$/i,
      "Only letters, numbers, hyphens (-), and underscores (_) are allowed"
    )
    .refine(
      (val) => !RESERVED_STOREFRONT_SLUGS.has(val.toLowerCase().trim()),
      "This URL name is reserved by the system. Please choose another."
    ),
  title: z
    .string()
    .trim()
    .min(3, "Storefront title must be at least 3 characters")
    .max(80, "Storefront title cannot exceed 80 characters"),
  description: z
    .string()
    .trim()
    .min(10, "Provide a short description (at least 10 characters)")
    .max(600, "Description cannot exceed 600 characters"),
  bannerUrl: z
    .string()
    .trim()
    .min(1, "Storefront banner image is required")
    .max(2048, "Banner URL cannot exceed 2048 characters")
    .refine(
      (val) =>
        val.startsWith("http://") ||
        val.startsWith("https://") ||
        val.startsWith("/"),
      "Banner must be uploaded to storage before saving storefront settings."
    ),
  featuredAssetId: z.string().optional().default(""),
  isVisible: z.boolean().default(true),
});

export type UpdateStorefrontInput = z.infer<typeof UpdateStorefrontSchema>;

export const StorefrontSlugParamSchema = z.object({
  sellerUrl: z
    .string()
    .trim()
    .min(1, "Seller URL is required"),
});

export type StorefrontSlugParamInput = z.infer<typeof StorefrontSlugParamSchema>;

export const CheckStorefrontUrlQuerySchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "Storefront URL is required"),
});

export type CheckStorefrontUrlQueryInput = z.infer<
  typeof CheckStorefrontUrlQuerySchema
>;

