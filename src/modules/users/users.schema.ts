import { z } from "zod";

export const CreateUserSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
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

export const UpdateMeSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(100).optional(),
    currentPassword: z.string().min(1, "Current password cannot be empty").optional(),
    password: z.string().min(6, "New password must be at least 6 characters").max(128).optional(),
  })
  .refine(
    (data) => {
      if (data.password && !data.currentPassword) {
        return false;
      }
      return true;
    },
    {
      message: "Current password is required to set a new password",
      path: ["currentPassword"],
    },
  );

export type UpdateMeInput = z.infer<typeof UpdateMeSchema>;

export const UpdateUserSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100).optional(),
  email: z.string().trim().email("Invalid email address").max(255).optional(),
  role: z.enum(["customer", "seller", "admin", "buyer", "user", "creator"]).optional(),
  status: z.enum(["active", "deactive", "pending", "suspended", "banned"]).optional(),
});

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;

