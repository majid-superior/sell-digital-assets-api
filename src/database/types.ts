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
  system_settings?: Record<string, unknown> | unknown[];
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
  typography?: Record<string, unknown> | null | undefined;
  border_radius?: string | null | undefined;
  metadata?: Record<string, unknown> | null | undefined;
  created_at?: Date | string | undefined;
  updated_at?: Date | string | undefined;
}

/**
 * @deprecated Legacy type alias; unified into ThemeEntity
 */
export type ThemeSettingsEntity = ThemeEntity;

export interface LicenseTierEntity {
  id?: number;
  tier_type: "personal" | "commercial" | "extended";
  name: string;
  default_price: number;
  description?: string | null;
  license_terms_summary: string;
  max_activations: number;
  display_order: number;
  is_active: boolean;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface AssetTierEntity {
  id?: string;
  asset_id: string;
  tier_type: "personal" | "commercial" | "extended";
  price: number;
  license_terms_summary?: string | null;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface AssetFileEntity {
  id?: string;
  asset_id: string;
  version: string;
  storage_key: string;
  file_name: string;
  file_size_bytes: number;
  file_checksum_sha256?: string | null;
  manifest_tree?: unknown[] | null;
  is_active?: boolean;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface AssetMediaEntity {
  id?: string;
  asset_id: string;
  media_type: "thumbnail" | "screenshot" | "preview_audio" | "preview_video";
  storage_key: string;
  url: string;
  display_order?: number;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface AssetEntity {
  id?: string;
  seller_id: string;
  category_id: number;
  title: string;
  slug: string;
  short_description: string;
  full_description: string | null;
  preview_url?: string | null;
  storage_path?: string | null;
  status:
    | "draft"
    | "pending"
    | "needs_update"
    | "published"
    | "rejected"
    | "archived"
    | "under_review";
  admin_feedback?: string | null;
  seller_feedback?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: Date | string | null;
  submitted_at?: Date | string | null;
  tags?: string[];
  technical_specs?: Record<string, unknown>;
  view_count?: number;
  download_count?: number;
  is_featured?: boolean;
  is_curated?: boolean;
  is_active?: boolean;
  deleted_at?: Date | string | null;
  created_at?: Date | string;
  updated_at?: Date | string;
  // Joins
  seller?: {
    id: string;
    name: string;
    email?: string;
  };
  category?: {
    id: number;
    name: string;
    slug: string;
  };
  tiers?: AssetTierEntity[];
  media?: AssetMediaEntity[];
  files?: AssetFileEntity[];
}

export interface LicenseEntity {
  id?: string;
  license_key: string;
  asset_id: string;
  buyer_id: string;
  tier: "personal" | "commercial" | "extended";
  status: "active" | "revoked" | "expired";
  max_activations?: number;
  activation_count?: number;
  issued_at?: Date | string;
  expires_at?: Date | string | null;
  asset?: {
    id: string;
    title: string;
    slug: string;
    status: string;
  };
  buyer?: {
    id: string;
    name: string;
    email: string;
  };
  activations?: LicenseActivationEntity[];
}

export interface LicenseActivationEntity {
  id?: string;
  license_id: string;
  domain_or_machine_id: string;
  ip_address?: string | null;
  activated_at?: Date | string;
}

export interface DownloadAuditEntity {
  id?: string;
  asset_id: string;
  asset_file_id?: string | null;
  user_id?: string | null;
  license_key?: string | null;
  ip_address: string;
  user_agent?: string | null;
  signed_url_token: string;
  expires_at: Date | string;
  downloaded_at?: Date | string | null;
  created_at?: Date | string;
}

export interface NotificationEntity {
  id?: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown> | null;
  is_read?: boolean;
  read_at?: Date | string | null;
  created_at?: Date | string;
}

export interface DatabaseSchema {
  currencies: CurrencyEntity;
  organizations: OrganizationEntity;
  roles: RoleEntity;
  users: UserEntity;
  categories: CategoryEntity;
  themes: ThemeEntity;
  license_tiers: LicenseTierEntity;
  assets: AssetEntity;
  asset_tiers: AssetTierEntity;
  asset_files: AssetFileEntity;
  asset_media: AssetMediaEntity;
  licenses: LicenseEntity;
  license_activations: LicenseActivationEntity;
  download_audits: DownloadAuditEntity;
  notifications: NotificationEntity;
}
