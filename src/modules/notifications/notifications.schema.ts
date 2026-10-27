import { z } from "zod";

export const NotificationsQuerySchema = z.object({
  unread: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export const NotificationIdParamSchema = z.object({
  id: z.string().uuid("Invalid notification ID format. Expected a valid UUID."),
});

export type NotificationsQueryInput = z.infer<typeof NotificationsQuerySchema>;
export type NotificationIdParamInput = z.infer<typeof NotificationIdParamSchema>;

