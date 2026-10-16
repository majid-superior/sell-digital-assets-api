import { z } from "zod";

export const TierTypeEnum = z.enum(["personal", "commercial", "extended"]);
export const AssetStatusEnum = z.enum([
  "draft",
  "pending",
  "needs_update",
  "published",
  "rejected",
  "archived",
  "under_review",
]);

export const SellerAllowedStatusEnum = z.enum(["draft", "pending", "archived"]);

export const AssetTierInputSchema = z.object({
  tierType: TierTypeEnum,
  price: z.number().min(0, "Price must be non-negative"),
  licenseTermsSummary: z.string().trim().optional(),
});

export const CreateAssetSchema = z.object({
  categoryId: z.number().int().positive("Category ID must be a positive integer"),
  title: z.string().trim().min(3).max(180),
  slug: z.string().trim().max(180).optional(),
  shortDescription: z.string().trim().min(10).max(450),
  fullDescription: z.string().trim().min(20),
  tags: z.array(z.string().trim()).default([]),
  technicalSpecs: z.record(z.string(), z.unknown()).default({}),
  tiers: z.array(AssetTierInputSchema).min(1, "At least one pricing tier is required"),
  status: z.enum(["draft", "pending"]).default("draft"),
});

export type CreateAssetInput = z.input<typeof CreateAssetSchema>;

export const UpdateAssetSchema = z.object({
  categoryId: z.number().int().positive().optional(),
  title: z.string().trim().min(3).max(180).optional(),
  slug: z.string().trim().max(180).optional(),
  shortDescription: z.string().trim().min(10).max(450).optional(),
  fullDescription: z.string().trim().min(20).optional(),
  tags: z.array(z.string().trim()).optional(),
  technicalSpecs: z.record(z.string(), z.unknown()).optional(),
  tiers: z.array(AssetTierInputSchema).optional(),
});

export type UpdateAssetInput = z.infer<typeof UpdateAssetSchema>;

export const UpdateAssetStatusSchema = z.object({
  status: AssetStatusEnum,
  feedback: z.string().trim().optional(),
});

export type UpdateAssetStatusInput = z.infer<typeof UpdateAssetStatusSchema>;

export const AdminReviewActionEnum = z.enum(["approve", "reject", "needs_update"]);

export const AdminReviewAssetSchema = z
  .object({
    action: AdminReviewActionEnum,
    feedback: z.string().trim().max(2000).optional(),
  })
  .refine(
    (data) => {
      if (
        (data.action === "reject" || data.action === "needs_update") &&
        (!data.feedback || data.feedback.length < 5)
      ) {
        return false;
      }
      return true;
    },
    {
      message:
        "Feedback/reason of at least 5 characters is required when rejecting or requesting updates",
      path: ["feedback"],
    },
  );

export type AdminReviewAssetInput = z.infer<typeof AdminReviewAssetSchema>;

export const AdminAssetQuerySchema = z.object({
  status: AssetStatusEnum.optional(),
  sellerId: z.string().uuid().optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type AdminAssetQueryInput = z.infer<typeof AdminAssetQuerySchema>;

export const AssetQuerySchema = z.object({
  category: z.coerce.number().int().positive().optional(),
  categorySlug: z.string().trim().optional(),
  search: z.string().trim().optional(),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  priceMin: z.coerce.number().min(0).optional(),
  priceMax: z.coerce.number().min(0).optional(),
  sort: z.enum(["newest", "popular", "price_asc", "price_desc"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export type AssetQueryInput = z.infer<typeof AssetQuerySchema>;

export const SellerAssetQuerySchema = z.object({
  status: AssetStatusEnum.optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type SellerAssetQueryInput = z.infer<typeof SellerAssetQuerySchema>;

// --- File Deliverables & Media Schemas ---

export const PresignFileUploadSchema = z.object({
  fileName: z.string().trim().min(1),
  contentType: z.string().trim().default("application/zip"),
  version: z.string().trim().default("1.0.0"),
  fileSizeBytes: z.number().int().positive().optional(),
});

export type PresignFileUploadInput = z.infer<typeof PresignFileUploadSchema>;

export const ConfirmFileUploadSchema = z.object({
  storageKey: z.string().trim().min(1),
  fileName: z.string().trim().min(1),
  version: z.string().trim().default("1.0.0"),
  fileSizeBytes: z.number().int().positive().optional(),
  fileChecksumSha256: z.string().trim().optional(),
  manifestTree: z.array(z.unknown()).optional(),
});

export type ConfirmFileUploadInput = z.infer<typeof ConfirmFileUploadSchema>;

export const PresignMediaUploadSchema = z.object({
  fileName: z.string().trim().min(1),
  contentType: z.string().trim().min(1),
  mediaType: z.enum(["thumbnail", "screenshot", "preview_audio", "preview_video"]),
  displayOrder: z.number().int().default(0),
});

export type PresignMediaUploadInput = z.infer<typeof PresignMediaUploadSchema>;

export const ConfirmMediaUploadSchema = z.object({
  storageKey: z.string().trim().min(1),
  mediaType: z.enum(["thumbnail", "screenshot", "preview_audio", "preview_video"]),
  displayOrder: z.number().int().default(0),
});

export type ConfirmMediaUploadInput = z.infer<typeof ConfirmMediaUploadSchema>;

// --- Fulfillment & Downloads ---

export const GenerateDownloadLinkSchema = z.object({
  licenseKey: z.string().trim().min(5).optional(),
  fileId: z.string().trim().optional(),
});

export type GenerateDownloadLinkInput = z.infer<typeof GenerateDownloadLinkSchema>;

export const AssetIdParamSchema = z.object({
  assetId: z.string().uuid("Valid Asset UUID is required"),
});

// --- Licensing & Verification ---

export const VerifyLicenseSchema = z.object({
  licenseKey: z.string().trim().min(5, "License key is required"),
  domainOrMachineId: z.string().trim().optional(),
});

export type VerifyLicenseInput = z.infer<typeof VerifyLicenseSchema>;

export const ActivateLicenseSchema = z.object({
  licenseKey: z.string().trim().min(5),
  domainOrMachineId: z.string().trim().min(2, "Domain, IP, or machine identifier is required"),
});

export type ActivateLicenseInput = z.infer<typeof ActivateLicenseSchema>;

export const IssueLicenseSchema = z.object({
  assetId: z.string().trim().min(1),
  buyerId: z.string().trim().min(1),
  tier: TierTypeEnum.default("personal"),
});

export type IssueLicenseInput = z.infer<typeof IssueLicenseSchema>;

export const IdParamSchema = z.object({
  id: z.string().trim().min(1, "ID is required"),
});

export const SlugParamSchema = z.object({
  slug: z.string().trim().min(1, "Slug is required"),
});

export const FileIdParamSchema = z.object({
  id: z.string().trim().min(1, "Asset ID is required"),
  fileId: z.string().trim().min(1, "File ID is required"),
});

