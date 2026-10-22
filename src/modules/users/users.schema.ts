import { z } from "zod";

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.string().optional(),
  status: z.string().optional(),
});

export const UuidParamSchema = z.object({
  id: z.string().uuid("Invalid ID format, expected UUID"),
});

export const UserResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  role: z.string(),
  status: z.string().optional(),
  created_at: z.date().or(z.string()),
  updated_at: z.date().or(z.string()),
});

export type PaginationQueryInput = z.infer<typeof PaginationQuerySchema>;
export type UuidParamInput = z.infer<typeof UuidParamSchema>;

export const UpdateUserSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100).optional(),
  password: z.string().min(4, "Password must be at least 4 characters").max(128).optional(),
  status: z.enum(["active", "deactive", "pending", "suspended", "banned"]).optional(),
});

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type UpdateUserStatusInput = UpdateUserInput;
export const UpdateUserStatusSchema = UpdateUserSchema;

