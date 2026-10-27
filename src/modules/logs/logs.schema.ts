import { z } from "zod";

export const LogsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional(),
  severity: z.enum(["debug", "info", "warn", "error", "critical", "all"]).optional(),
  category: z.enum(["auth", "admin", "security", "system", "error", "all"]).optional(),
  outcome: z.enum(["success", "failure", "denied", "error", "all"]).optional(),
  source: z.string().trim().max(50).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.enum(["created_at", "severity", "category", "action"]).default("created_at"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const LogIdParamSchema = z.object({
  id: z.string().uuid("Invalid Log ID format, expected UUID"),
});

export const CleanupLogsSchema = z.object({
  retentionDays: z.coerce
    .number()
    .int()
    .min(7, "Retention cannot be less than 7 days for audit safety")
    .max(365, "Retention cannot exceed 365 days")
    .default(90),
});

export type LogsQueryInput = z.infer<typeof LogsQuerySchema>;
export type LogIdParamInput = z.infer<typeof LogIdParamSchema>;
export type CleanupLogsInput = z.infer<typeof CleanupLogsSchema>;

