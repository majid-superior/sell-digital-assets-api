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

export const CreateTeamMemberSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().trim().email("Invalid email address"),
    password: z.string().min(4, "Password must be at least 4 characters").max(128),
    role: z.string().optional(),
    roleId: z.coerce.number().int().optional(),
    allowedPermissions: z.array(z.string()).optional(),
  })
  .refine((data) => data.role !== undefined || data.roleId !== undefined, {
    message: "A valid store role or role ID is required",
    path: ["role"],
  });

export type CreateTeamMemberInput = z.infer<typeof CreateTeamMemberSchema>;

export const UpdateTeamMemberSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  role: z.string().optional(),
  roleId: z.coerce.number().int().optional(),
  status: z.enum(["active", "suspended", "deactive", "pending"]).optional(),
  allowedPermissions: z.array(z.string()).optional(),
  password: z.string().min(4).max(128).optional(),
});

export type UpdateTeamMemberInput = z.infer<typeof UpdateTeamMemberSchema>;

export const UpdateRolePermissionsSchema = z.object({
  permissions: z.array(z.string().trim().min(1, "Permission name cannot be empty")),
});

export type UpdateRolePermissionsInput = z.infer<typeof UpdateRolePermissionsSchema>;

export const RoleIdParamSchema = z.object({
  roleId: z.coerce.number().int().positive("Invalid role ID"),
});

export type RoleIdParamInput = z.infer<typeof RoleIdParamSchema>;

export const CreateRoleSchema = z.object({
  name: z.string().trim().min(2, "Role name must be at least 2 characters").max(50, "Role name must not exceed 50 characters"),
  description: z.string().trim().max(255).optional(),
  permissions: z.array(z.string().trim().min(1)).optional(),
  reactivateIfExists: z.boolean().optional(),
});

export type CreateRoleInput = z.infer<typeof CreateRoleSchema>;

export const UpdateRoleStatusSchema = z.object({
  is_active: z.boolean({ message: "is_active boolean flag is required" }),
});

export type UpdateRoleStatusInput = z.infer<typeof UpdateRoleStatusSchema>;

export const UpdatePermissionMatrixSchema = z.object({
  matrix: z.array(
    z.object({
      roleId: z.coerce.number().int().positive("Invalid role ID"),
      permissions: z.array(z.string().trim().min(1, "Permission name cannot be empty")),
    })
  ).min(1, "Matrix must contain at least one role permission set"),
});

export type UpdatePermissionMatrixInput = z.infer<typeof UpdatePermissionMatrixSchema>;


