import { z } from "zod";

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
    .min(1, "Storefront banner image is required"),
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

