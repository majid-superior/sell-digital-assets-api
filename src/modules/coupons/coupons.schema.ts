import { z } from "zod";

export const COUPON_CODE_REGEX = /^[A-Z0-9_-]{3,50}$/;

export const CreateCouponSchema = z
  .object({
    code: z
      .string({ message: "Coupon code is required" })
      .trim()
      .transform((val) => val.toUpperCase().replace(/\s+/g, ""))
      .pipe(
        z
          .string()
          .min(3, "Coupon code must be at least 3 characters")
          .max(50, "Coupon code cannot exceed 50 characters")
          .regex(
            COUPON_CODE_REGEX,
            "Coupon code must contain only letters, numbers, hyphens, and underscores",
          ),
      ),
    description: z
      .string()
      .trim()
      .max(500, "Description cannot exceed 500 characters")
      .optional()
      .nullable(),
    discountPercent: z
      .number({ message: "Discount percentage is required" })
      .int("Discount percentage must be a whole number")
      .min(1, "Discount percentage must be at least 1%")
      .max(90, "Discount percentage cannot exceed 90%"),
    startsAt: z
      .string({ message: "Start date/time is required" })
      .datetime({ message: "Invalid ISO 8601 format for start date/time" }),
    endsAt: z
      .string({ message: "End date/time is required" })
      .datetime({ message: "Invalid ISO 8601 format for end date/time" }),
    usageLimit: z
      .number()
      .int("Usage limit must be an integer")
      .positive("Usage limit must be greater than 0")
      .optional()
      .nullable(),
    isActive: z.boolean().default(true),
  })
  .refine((data) => new Date(data.endsAt).getTime() > new Date(data.startsAt).getTime(), {
    message: "End date/time must be strictly after the start date/time",
    path: ["endsAt"],
  });

export const UpdateCouponSchema = z
  .object({
    description: z
      .string()
      .trim()
      .max(500, "Description cannot exceed 500 characters")
      .optional()
      .nullable(),
    discountPercent: z
      .number()
      .int("Discount percentage must be a whole number")
      .min(1, "Discount percentage must be at least 1%")
      .max(90, "Discount percentage cannot exceed 90%")
      .optional(),
    startsAt: z
      .string()
      .datetime({ message: "Invalid ISO 8601 format for start date/time" })
      .optional(),
    endsAt: z
      .string()
      .datetime({ message: "Invalid ISO 8601 format for end date/time" })
      .optional(),
    usageLimit: z
      .number()
      .int("Usage limit must be an integer")
      .positive("Usage limit must be greater than 0")
      .optional()
      .nullable(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.startsAt && data.endsAt) {
        return new Date(data.endsAt).getTime() > new Date(data.startsAt).getTime();
      }
      return true;
    },
    {
      message: "End date/time must be strictly after the start date/time",
      path: ["endsAt"],
    },
  );

export const UpdateCouponStatusSchema = z.object({
  isActive: z.boolean({ message: "isActive boolean is required" }),
});

export const ValidateCouponItemSchema = z.object({
  assetId: z.string().uuid("Invalid asset ID format"),
  price: z.number().min(0).optional(),
  tierType: z.enum(["personal", "commercial", "extended"]).optional(),
});

export const ValidateCouponSchema = z.object({
  code: z
    .string({ message: "Coupon code is required" })
    .trim()
    .min(1, "Coupon code cannot be empty")
    .max(50, "Coupon code cannot exceed 50 characters")
    .transform((val) => val.toUpperCase().replace(/\s+/g, "")),
  items: z
    .array(ValidateCouponItemSchema, { message: "Cart items are required for validation" })
    .min(1, "At least one cart item is required to validate a coupon"),
});

export const ListCouponsQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(["all", "active", "inactive", "scheduled", "expired"]).default("all"),
  sortBy: z
    .enum(["created_at", "code", "discount_percent", "ends_at", "usage_count"])
    .default("created_at"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateCouponInput = z.infer<typeof CreateCouponSchema>;
export type UpdateCouponInput = z.infer<typeof UpdateCouponSchema>;
export type UpdateCouponStatusInput = z.infer<typeof UpdateCouponStatusSchema>;
export type ValidateCouponInput = z.infer<typeof ValidateCouponSchema>;
export type ListCouponsQueryInput = z.infer<typeof ListCouponsQuerySchema>;
