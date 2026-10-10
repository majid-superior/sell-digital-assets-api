/**
 * Auto-generated TypeScript types from database schema
 * Generated on: 2026-10-04T11:53:28.007Z
 * DO NOT EDIT MANUALLY - Re-generate using 'npm run db:schema'
 */

export interface CurrencyEntity {
  code: string;
  name: string;
  symbol: string;
  created_at?: Date | string;
}

export interface OrganizationEntity {
  id?: number;
  organization_name: string;
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
  currency?: CurrencyEntity;
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

export interface CategoryEntity {
  id?: number;
  parent_id?: number | null;
  name: string;
  slug: string;
  depth?: number;
  path?: string;
  description?: string | null;
  display_order?: number;
  is_active?: boolean;
  metadata?: Record<string, unknown> | null;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface ThemeEntity {
  id?: number | string;
  name: string;
  slug?: string;
  mode?: string;
  is_active: boolean;
  color_hex_map: Record<string, any>;
  color_tokens?: Record<string, string>;
  typography?: Record<string, unknown> | null;
  border_radius?: string | null;
  metadata?: Record<string, unknown> | null | undefined;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface ThemeSettingsEntity {
  id?: number | string;
  name: string;
  mode?: string;
  color_hex_map: Record<string, any>;
  typography?: Record<string, unknown> | null;
  border_radius?: string | null;
  is_active: boolean;
  updated_at?: Date | string;
}

export interface DatabaseSchema {
  organizations: OrganizationEntity;
  roles: RoleEntity;
  users: UserEntity;
  categories: CategoryEntity;
  themes: ThemeEntity;
  theme_settings: ThemeSettingsEntity;
}

