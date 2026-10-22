import { z } from "zod";

export const BANNER_BADGE_TYPES = [
  "special_offer",
  "hot_deal",
  "new_release",
  "limited_time",
  "announcement",
  "flash_sale",
  "none",
] as const;

export const BANNER_APPEARANCES = [
  "primary",
  "secondary",
  "tertiary",
  "inverse",
  "surface",
  "accent",
] as const;

export const BANNER_FILTER_STATUSES = [
  "all",
  "active",
  "scheduled",
  "expired",
  "inactive",
] as const;

/**
 * Validates that a URL is either a safe internal path starting with a single "/"
 * (e.g., "/signup", "/explore?tag=ai") or a valid http/https external URL.
 */
export function isValidBannerUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;

  // Allow safe internal site paths starting with "/" (disallow protocol-relative "//" or "/\")
  if (trimmed.startsWith("/")) {
    if (trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
      return false;
    }
    return !/\s/.test(trimmed);
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Validates that a string is a recognized IANA timezone identifier (e.g. "UTC", "America/New_York", "Asia/Karachi").
 */
export function isValidTimezone(tz: string): boolean {
  const trimmed = tz.trim();
  if (!trimmed) return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: trimmed });
    return true;
  } catch {
    return false;
  }
}

const NullableOptionalString = (maxLen: number, label: string) =>
  z
    .preprocess(
      (val) => (typeof val === "string" && val.trim() === "" ? null : val),
      z
        .string()
        .trim()
        .max(maxLen, `${label} must not exceed ${maxLen} characters`)
        .nullable()
        .optional(),
    );

const BannerUrlSchema = z.preprocess(
  (val) => (typeof val === "string" && val.trim() === "" ? null : val),
  z
    .string()
    .trim()
    .max(500, "Destination URL must not exceed 500 characters")
    .refine(isValidBannerUrl, {
      message:
        "Destination URL must be a valid internal path starting with '/' (e.g., '/signup' or '/explore') or a full 'https://' / 'http://' web address.",
    })
    .nullable()
    .optional(),
);

const OptionalDateStringSchema = (label: string) =>
  z.preprocess(
    (val) => (typeof val === "string" && val.trim() === "" ? null : val),
    z
      .string()
      .trim()
      .max(64, `${label} format is invalid`)
      .nullable()
      .optional(),
  );

export const CreateBannerSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Banner title/message is required. Please enter the main promotional text.")
      .max(200, "Banner title/message must not exceed 200 characters."),
    description: NullableOptionalString(500, "Banner description"),
    supportingText: NullableOptionalString(200, "Supporting details"),
    supporting_text: NullableOptionalString(200, "Supporting details"),
    badgeType: z.enum(BANNER_BADGE_TYPES).optional(),
    badge_type: z.enum(BANNER_BADGE_TYPES).optional(),
    ctaLabel: NullableOptionalString(80, "CTA button label"),
    cta_label: NullableOptionalString(80, "CTA button label"),
    ctaUrl: BannerUrlSchema,
    cta_url: BannerUrlSchema,
    showCta: z.boolean().optional(),
    show_cta: z.boolean().optional(),
    isDismissible: z.boolean().optional(),
    is_dismissible: z.boolean().optional(),
    appearance: z.enum(BANNER_APPEARANCES).optional(),
    priority: z
      .coerce
      .number()
      .int("Display priority must be a whole number.")
      .min(-1000, "Display priority cannot be less than -1000.")
      .max(10000, "Display priority cannot exceed 10000.")
      .optional(),
    isActive: z.boolean().optional(),
    is_active: z.boolean().optional(),
    startsAt: OptionalDateStringSchema("Start date/time"),
    starts_at: OptionalDateStringSchema("Start date/time"),
    endsAt: OptionalDateStringSchema("End date/time"),
    ends_at: OptionalDateStringSchema("End date/time"),
    timezone: z
      .string()
      .trim()
      .max(80, "Timezone identifier must not exceed 80 characters.")
      .refine(isValidTimezone, {
        message:
          "Invalid timezone identifier. Please provide a valid IANA timezone such as 'UTC', 'America/New_York', or 'Asia/Karachi'.",
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    const showCta = data.showCta ?? data.show_cta ?? true;
    const ctaLabel = (data.ctaLabel ?? data.cta_label ?? "")?.trim();
    const ctaUrl = (data.ctaUrl ?? data.cta_url ?? "")?.trim();

    if (showCta) {
      if (!ctaLabel) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["ctaLabel"],
          message:
            "CTA button label is required when the CTA button is visible. Provide a label (e.g., 'Start now') or disable CTA visibility.",
        });
      }
      if (!ctaUrl) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["ctaUrl"],
          message:
            "CTA destination URL is required when the CTA button is visible. Provide a valid path (e.g., '/signup') or disable CTA visibility.",
        });
      }
    }
  });

export type CreateBannerInput = z.infer<typeof CreateBannerSchema>;

export const UpdateBannerSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Banner title/message cannot be empty.")
    .max(200, "Banner title/message must not exceed 200 characters.")
    .optional(),
  description: NullableOptionalString(500, "Banner description"),
  supportingText: NullableOptionalString(200, "Supporting details"),
  supporting_text: NullableOptionalString(200, "Supporting details"),
  badgeType: z.enum(BANNER_BADGE_TYPES).optional(),
  badge_type: z.enum(BANNER_BADGE_TYPES).optional(),
  ctaLabel: NullableOptionalString(80, "CTA button label"),
  cta_label: NullableOptionalString(80, "CTA button label"),
  ctaUrl: BannerUrlSchema,
  cta_url: BannerUrlSchema,
  showCta: z.boolean().optional(),
  show_cta: z.boolean().optional(),
  isDismissible: z.boolean().optional(),
  is_dismissible: z.boolean().optional(),
  appearance: z.enum(BANNER_APPEARANCES).optional(),
  priority: z
    .coerce
    .number()
    .int("Display priority must be a whole number.")
    .min(-1000, "Display priority cannot be less than -1000.")
    .max(10000, "Display priority cannot exceed 10000.")
    .optional(),
  isActive: z.boolean().optional(),
  is_active: z.boolean().optional(),
  startsAt: OptionalDateStringSchema("Start date/time"),
  starts_at: OptionalDateStringSchema("Start date/time"),
  endsAt: OptionalDateStringSchema("End date/time"),
  ends_at: OptionalDateStringSchema("End date/time"),
  timezone: z
    .string()
    .trim()
    .max(80, "Timezone identifier must not exceed 80 characters.")
    .refine(isValidTimezone, {
      message:
        "Invalid timezone identifier. Please provide a valid IANA timezone such as 'UTC', 'America/New_York', or 'Asia/Karachi'.",
    })
    .optional(),
});

export type UpdateBannerInput = z.infer<typeof UpdateBannerSchema>;

export const ToggleBannerStatusSchema = z
  .object({
    isActive: z.boolean().optional(),
    is_active: z.boolean().optional(),
  })
  .refine((data) => data.isActive !== undefined || data.is_active !== undefined, {
    message: "Please specify 'isActive' (true or false) to update banner status.",
  });

export type ToggleBannerStatusInput = z.infer<typeof ToggleBannerStatusSchema>;

export const BannerQuerySchema = z.object({
  page: z.preprocess(
    (val) => (val === undefined || val === "" ? undefined : Number(val)),
    z.number().int().positive().optional(),
  ),
  limit: z.preprocess(
    (val) => (val === undefined || val === "" ? undefined : Number(val)),
    z.number().int().positive().max(1000).optional(),
  ),
  search: z.string().trim().optional(),
  status: z.enum(BANNER_FILTER_STATUSES).optional(),
});

export type BannerQueryInput = z.infer<typeof BannerQuerySchema>;

export const BannerIdParamSchema = z.object({
  id: z.string().uuid("Invalid banner ID format. Expected a valid UUID."),
});

export type BannerIdParamInput = z.infer<typeof BannerIdParamSchema>;

