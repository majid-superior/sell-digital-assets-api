/**
 * Auto-generated TypeScript types from database schema
 * Generated on: 2026-09-20T18:35:20.091Z
 * DO NOT EDIT MANUALLY - Re-generate using 'npm run db:schema'
 */

export interface CompanyEntity {
  id?: number;
  company_name: string;
  legal_name: string;
  tagline?: string | null;
  description?: string | null;
  logo_url?: string | null;
  logo_dark_url?: string | null;
  favicon_url?: string | null;
  cover_banner_url?: string | null;
  support_email: string;
  contact_email?: string | null;
  support_phone?: string | null;
  support_url?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  tax_id?: string | null;
  default_currency?: string;
  platform_fee_percent?: number;
  payout_minimum?: number;
  social_links?: Record<string, unknown> | unknown[];
  metadata?: Record<string, unknown> | unknown[];
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface RoleEntity {
  id?: number;
  slug: string;
  name: string;
  description?: string | null;
  is_system?: boolean;
  created_at?: Date | string;
}

export interface UserEntity {
  id?: string;
  role_id?: number;
  name: string;
  email: string;
  password_hash?: string | null;
  auth_provider?: string;
  status?: string;
  email_verified_at?: Date | string | null;
  failed_login_attempts?: number;
  locked_until?: Date | string | null;
  last_login_at?: Date | string | null;
  created_at?: Date | string;
  updated_at?: Date | string;
  deleted_at?: Date | string | null;
}

export interface DatabaseSchema {
  company: CompanyEntity;
  roles: RoleEntity;
  users: UserEntity;
}
