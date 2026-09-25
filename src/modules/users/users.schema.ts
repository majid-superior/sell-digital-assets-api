import { z } from "zod";

export const CreateUserSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(128).optional(),
  role: z.enum(["customer", "seller", "admin", "user", "creator"]).optional().default("customer"),
});

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
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

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type PaginationQueryInput = z.infer<typeof PaginationQuerySchema>;
export type UuidParamInput = z.infer<typeof UuidParamSchema>;

