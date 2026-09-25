import { z } from "zod";

export const UpdateCompanySchema = z.object({
  company_name: z.string().trim().min(1).max(150).optional(),
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
});

export type UpdateCompanyInput = z.infer<typeof UpdateCompanySchema>;
