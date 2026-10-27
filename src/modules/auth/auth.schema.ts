import { z } from "zod";

export const RegisterUserSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  password: z.string().min(4, "Password must be at least 4 characters").max(128),
  role: z.string().optional().default("BUYER"),
});


export const SignInUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required").optional(),
});

export const UpdateMeSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(100).optional(),
    currentPassword: z.string().min(1, "Current password cannot be empty").optional(),
    password: z.string().min(4, "New password must be at least 4 characters").max(128).optional(),
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

export type RegisterUserInput = z.infer<typeof RegisterUserSchema>;
export type SignInUserInput = z.infer<typeof SignInUserSchema>;
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;
export type UpdateMeInput = z.infer<typeof UpdateMeSchema>;
