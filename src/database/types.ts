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
  scope?: "PLATFORM" | "SELLER_STORE" | string;
  allow_public_signup?: boolean;
  description?: string | null;
  is_system?: boolean;
  is_active?: boolean;
  created_at?: Date | string;
}

export interface UserEntity {
  id?: string;
  role_id?: number;
  name: string;
  display_name?: string;
  email: string;
  url?: string;
  parent_seller_id?: string | null;
  allowed_permissions?: string[] | Record<string, unknown>;
  is_active?: boolean;
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
  created_by_user_id?: string | null;
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
  sales_count?: number;
  total_revenue?: number;
  first_sale_at?: Date | string | null;
  last_sold_at?: Date | string | null;
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
  bytes_transferred?: number;
  status?: 'in_progress' | 'completed' | 'failed' | 'expired';
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

export type CouponStatus = "active" | "inactive" | "scheduled" | "expired";

export interface CouponEntity {
  id?: string | undefined;
  seller_id: string;
  code: string;
  description?: string | null | undefined;
  discount_percent: number;
  starts_at: Date | string;
  ends_at: Date | string;
  usage_limit?: number | null | undefined;
  usage_count: number;
  is_active: boolean;
  created_at?: Date | string | undefined;
  updated_at?: Date | string | undefined;
  // Computed fields / relations
  status?: CouponStatus | undefined;
  seller?: {
    id: string;
    name: string;
    email?: string | null | undefined;
  } | undefined;
}

export interface CouponRedemptionEntity {
  id?: string | undefined;
  coupon_id: string;
  buyer_id: string;
  order_id?: string | null | undefined;
  discount_amount: number;
  currency: string;
  original_subtotal: number;
  discounted_subtotal: number;
  status: "pending" | "completed" | "cancelled" | "refunded";
  created_at?: Date | string | undefined;
  updated_at?: Date | string | undefined;
  // Relations
  coupon?: CouponEntity | undefined;
  buyer?: {
    id: string;
    name: string;
    email: string;
  } | undefined;
}

export type OrderStatus =
  | "pending"
  | "paid"
  | "completed"
  | "failed"
  | "cancelled"
  | "refunded"
  | "partially_refunded";

export interface OrderEntity {
  id?: string;
  order_number: string;
  buyer_id: string;
  currency_code: string;
  subtotal_amount: number;
  discount_amount?: number;
  tax_amount?: number;
  total_amount: number;
  status?: OrderStatus;
  payment_provider?: string;
  payment_gateway_ref?: string | null;
  coupon_id?: string | null;
  customer_notes?: string | null;
  metadata?: Record<string, unknown>;
  paid_at?: Date | string | null;
  created_at?: Date | string;
  updated_at?: Date | string;
  // Relations
  buyer?: UserEntity;
  items?: OrderItemEntity[];
  coupon?: CouponEntity | null;
}

export type OrderItemPayoutStatus =
  | "pending"
  | "available"
  | "processing"
  | "paid"
  | "withheld"
  | "refunded";

export interface OrderItemEntity {
  id?: string;
  order_id: string;
  asset_id: string;
  seller_id: string;
  license_tier_type: string;
  license_id?: string | null;
  asset_title: string;
  price: number;
  discount_amount?: number;
  net_amount: number;
  platform_fee_rate: number;
  platform_fee_amount: number;
  seller_earning_amount: number;
  payout_status?: OrderItemPayoutStatus;
  created_at?: Date | string;
  updated_at?: Date | string;
  // Relations
  asset?: AssetEntity;
  seller?: UserEntity;
}

export type RefundReason =
  | "broken_file"
  | "misleading_preview"
  | "accidental_purchase"
  | "license_incompatibility"
  | "unauthorized_transaction"
  | "other";

export type RefundStatus =
  | "requested"
  | "under_review"
  | "approved"
  | "rejected"
  | "refunded"
  | "cancelled";

export interface RefundEntity {
  id?: string;
  refund_number: string;
  order_id: string;
  order_item_id?: string | null;
  buyer_id: string;
  amount: number;
  currency_code: string;
  reason: RefundReason;
  reason_details?: string | null;
  status?: RefundStatus;
  gateway_refund_id?: string | null;
  requested_by: string;
  resolved_by?: string | null;
  resolved_at?: Date | string | null;
  admin_notes?: string | null;
  created_at?: Date | string;
  updated_at?: Date | string;
  // Relations
  order?: OrderEntity;
  order_item?: OrderItemEntity | null;
  buyer?: UserEntity;
}

export type PayoutStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export type PayoutMethod =
  | "stripe_connect"
  | "paypal"
  | "wise"
  | "bank_transfer"
  | "manual";

export interface PayoutEntity {
  id?: string;
  payout_number: string;
  seller_id: string;
  amount: number;
  currency_code: string;
  method?: PayoutMethod;
  status?: PayoutStatus;
  destination_details?: Record<string, unknown>;
  gateway_payout_ref?: string | null;
  admin_notes?: string | null;
  processed_by?: string | null;
  requested_at?: Date | string;
  processed_at?: Date | string | null;
  created_at?: Date | string;
  updated_at?: Date | string;
  // Relations
  seller?: UserEntity;
}

export interface SearchLogEntity {
  id?: string;
  query_text: string;
  normalized_query: string;
  results_count: number;
  category_id?: number | null;
  user_id?: string | null;
  session_id?: string | null;
  clicked_asset_id?: string | null;
  has_converted?: boolean;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at?: Date | string;
  // Relations
  category?: CategoryEntity;
  user?: UserEntity;
  clicked_asset?: AssetEntity;
}

export type StorefrontEventType =
  | 'page_view'
  | 'asset_view'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'checkout_start'
  | 'checkout_complete';

export interface StorefrontEventEntity {
  id?: string;
  visitor_id: string;
  user_id?: string | null;
  event_type: StorefrontEventType;
  asset_id?: string | null;
  metadata?: Record<string, unknown> | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at?: Date | string;
  // Relations
  user?: UserEntity;
  asset?: AssetEntity;
}

export type MarketingCampaignType = 'hero' | 'banner' | 'curated_collection' | 'broadcast';

export interface MarketingImpressionEntity {
  id?: string;
  campaign_type: MarketingCampaignType;
  campaign_id: string;
  impressions_count?: number;
  clicks_count?: number;
  direct_conversions?: number;
  attributed_gmv?: number;
  recorded_date?: Date | string;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export type GrowthTriggerType =
  | 'underpriced_asset'
  | 'creator_churn_risk'
  | 'category_supply_deficit'
  | 'license_friction_drop'
  | 'high_refund_spike';

export type GrowthTriggerSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface PlatformGrowthTriggerEntity {
  id?: string;
  trigger_type: GrowthTriggerType;
  severity: GrowthTriggerSeverity;
  title: string;
  description: string;
  recommended_action: string;
  target_entity_type?: string | null;
  target_entity_id?: string | null;
  metadata?: Record<string, unknown> | null;
  is_dismissed?: boolean;
  dismissed_at?: Date | string | null;
  dismissed_by?: string | null;
  created_at?: Date | string;
  // Relations
  dismissed_by_user?: UserEntity;
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
  coupons: CouponEntity;
  coupon_redemptions: CouponRedemptionEntity;
  orders: OrderEntity;
  order_items: OrderItemEntity;
  refunds: RefundEntity;
  payouts: PayoutEntity;
  search_logs: SearchLogEntity;
  storefront_events: StorefrontEventEntity;
  marketing_impressions: MarketingImpressionEntity;
  platform_growth_triggers: PlatformGrowthTriggerEntity;
}
