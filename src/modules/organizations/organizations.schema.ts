import { z } from "zod";

export const UpdateOrganizationSchema = z.object({
  organization_name: z.string().trim().min(1).max(150).optional(),
  legal_name: z.string().trim().min(1).max(150).optional(),
  tagline: z.string().trim().max(255).optional().nullable(),
  description: z.string().optional().nullable(),
  logo_url: z.string().optional().nullable(),
  logo_dark_url: z.string().optional().nullable(),
  favicon_url: z.string().optional().nullable(),
  cover_banner_url: z.string().optional().nullable(),
  support_email: z.string().trim().email().optional(),
  contact_email: z.string().trim().email().optional().nullable(),
  support_phone: z.string().trim().max(50).optional().nullable(),
  support_url: z.string().url().optional().nullable(),
  address_line1: z.string().max(255).optional().nullable(),
  address_line2: z.string().max(255).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  postal_code: z.string().max(20).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  tax_id: z.string().max(50).optional().nullable(),
  default_currency: z.string().min(3).max(3).optional(),
  platform_fee_percent: z.number().min(0).max(100).optional(),
  payout_minimum: z.number().min(0).optional(),
  social_links: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  system_settings: z.record(z.string(), z.unknown()).optional(),
});

export type UpdateOrganizationInput = z.infer<typeof UpdateOrganizationSchema>;

export const SystemSettingsSchema = z.object({
  sessionIdleTimeoutMinutes: z.number().int().min(1).max(1440).optional(),
  accessTokenTtlMinutes: z.number().int().min(1).max(1440).optional(),
  refreshTokenTtlDays: z.number().int().min(1).max(365).optional(),
  rememberMeTtlDays: z.number().int().min(1).max(365).optional(),
  maxLoginAttempts: z.number().int().min(1).max(50).optional(),
  lockoutDurationMinutes: z.number().int().min(1).max(1440).optional(),
  passwordMinLength: z.number().int().min(6).max(128).optional(),
  requireSpecialChar: z.boolean().optional(),
  allowUserRegistration: z.boolean().optional(),
  requireEmailVerification: z.boolean().optional(),
  maintenanceMode: z.boolean().optional(),
});

export type SystemSettingsInput = z.infer<typeof SystemSettingsSchema>;

