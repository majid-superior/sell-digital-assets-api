import { z } from "zod";

export const AnalyticsDateQuerySchema = z.object({
  period: z
    .enum(["today", "7d", "30d", "90d", "ytd", "1y", "all"])
    .optional()
    .default("30d"),
  from: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: "Parameter 'from' must be a valid ISO date string",
    }),
  to: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: "Parameter 'to' must be a valid ISO date string",
    }),
});

export const RevenueTrendQuerySchema = AnalyticsDateQuerySchema.extend({
  interval: z.enum(["day", "week", "month"]).optional().default("day"),
});

export const TopCreatorsQuerySchema = AnalyticsDateQuerySchema.extend({
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
});

export const CatalogLeaderboardQuerySchema = AnalyticsDateQuerySchema.extend({
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
  metric: z
    .enum(["revenue", "sales", "views", "downloads"])
    .optional()
    .default("revenue"),
});

export const ZeroResultsQuerySchema = AnalyticsDateQuerySchema.extend({
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
  minQueries: z.coerce.number().int().min(1).max(1000).optional().default(1),
});

export const TrackSearchEventSchema = z.object({
  queryText: z.string().min(1).max(255),
  resultsCount: z.coerce.number().int().min(0).default(0),
  categoryId: z.coerce.number().int().positive().optional().nullable(),
  sessionId: z.string().max(100).optional().nullable(),
});

export const TrackSearchClickSchema = z.object({
  sessionId: z.string().min(1).max(100),
  assetId: z.string().uuid(),
});

export const TrackStorefrontEventSchema = z.object({
  visitorId: z.string().min(1).max(100),
  eventType: z.enum([
    "page_view",
    "asset_view",
    "add_to_cart",
    "remove_from_cart",
    "checkout_start",
    "checkout_complete",
  ]),
  assetId: z.string().uuid().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

export const AnomaliesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
});

export const TrackMarketingInteractionSchema = z.object({
  campaignType: z.enum(["hero", "banner", "curated_collection", "broadcast"]),
  campaignId: z.string().uuid(),
  action: z.enum(["impression", "click", "conversion"]).default("impression"),
  attributedGmv: z.coerce.number().min(0).optional().default(0),
});

export const ReportExportQuerySchema = AnalyticsDateQuerySchema.extend({
  reportType: z.enum(["financial", "catalog", "coupons"]).default("financial"),
});

export type AnalyticsDateQuery = z.infer<typeof AnalyticsDateQuerySchema>;
export type RevenueTrendQuery = z.infer<typeof RevenueTrendQuerySchema>;
export type TopCreatorsQuery = z.infer<typeof TopCreatorsQuerySchema>;
export type CatalogLeaderboardQuery = z.infer<typeof CatalogLeaderboardQuerySchema>;
export type ZeroResultsQuery = z.infer<typeof ZeroResultsQuerySchema>;
export type TrackSearchEventInput = z.infer<typeof TrackSearchEventSchema>;
export type TrackSearchClickInput = z.infer<typeof TrackSearchClickSchema>;
export type TrackStorefrontEventInput = z.infer<typeof TrackStorefrontEventSchema>;
export type AnomaliesQuery = z.infer<typeof AnomaliesQuerySchema>;
export type TrackMarketingInteractionInput = z.infer<
  typeof TrackMarketingInteractionSchema
>;
export type ReportExportQuery = z.infer<typeof ReportExportQuerySchema>;

