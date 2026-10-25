import dns from "node:dns";
import fs from "node:fs";
import path from "node:path";
import child_process from "node:child_process";
import readline from "node:readline/promises";
import { fileURLToPath } from "node:url";
import pg from "pg";
import dotenv from "dotenv";
import { defaultOrganizationEntity } from "../data/organizations.js";
import { defaultCategories, flattenCategories } from "../data/categories.js";
import { defaultCurrencies } from "../data/currencies.js";
import { defaultTheme } from "../data/themes.js";
import { defaultLicenseTiers } from "../data/license-tiers.js";
import { resilientDnsLookup, isSslRequired } from "../config/database.js";

// Prioritize IPv4 DNS lookups to avoid EAI_AGAIN timeouts on Windows/Node.js
if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Ensures .env is reliably resolved and loaded regardless of
 * current working directory when the script is invoked.
 */
function loadEnv(): void {
  let dir = __dirname;
  while (dir && dir !== path.dirname(dir)) {
    const envPath = path.join(dir, ".env");
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
      return;
    }
    dir = path.dirname(dir);
  }
  dotenv.config();
}

loadEnv();

/**
 * Consolidated pure SQL Schema DDL (tables, extensions, functions, triggers, rules, indexes, seeds, views).
 * Defaults for the organizations table are dynamically bound to organizations.ts.
 */
export const SCHEMA_SQL = `
-- Step 1: Extensions
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Step 2: Shared Auto-Update Timestamp Function
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public;

-- Shared function to protect critical singleton configuration from TRUNCATE
CREATE OR REPLACE FUNCTION prevent_table_truncate()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'TRUNCATE operation is strictly prohibited on table %', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public;

-- Step 3: Currencies Table
CREATE TABLE IF NOT EXISTS currencies (
    code VARCHAR(3) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed Supported Currencies (sourced from src/data/currencies.ts)
INSERT INTO currencies (code, name, symbol) VALUES
${defaultCurrencies.map((c) => `    ('${c.code}', '${c.name.replace(/'/g, "''")}', '${c.symbol.replace(/'/g, "''")}')`).join(",\n")}
ON CONFLICT (code) DO UPDATE 
    SET name = EXCLUDED.name,
        symbol = EXCLUDED.symbol;

-- Step 4: Organizations Table (Defaults dynamically sourced from organizations.ts)
CREATE TABLE IF NOT EXISTS organizations (
    id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    organization_name VARCHAR(150) NOT NULL,
    legal_name VARCHAR(150) NOT NULL,
    tagline VARCHAR(255),
    description TEXT,
    logo_url TEXT,
    logo_dark_url TEXT,
    favicon_url TEXT,
    cover_banner_url TEXT,
    support_email citext NOT NULL,
    contact_email citext,
    support_phone VARCHAR(50),
    support_url TEXT,
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    tax_id VARCHAR(50),
    default_currency VARCHAR(3) NOT NULL DEFAULT '${defaultOrganizationEntity.default_currency ?? "PKR"}'
        REFERENCES currencies(code) ON UPDATE CASCADE ON DELETE RESTRICT,
    platform_fee_percent NUMERIC(5, 2) NOT NULL DEFAULT ${defaultOrganizationEntity.platform_fee_percent ?? 5.0} 
        CHECK (platform_fee_percent >= 0.00 AND platform_fee_percent <= 100.00),
    payout_minimum NUMERIC(10, 2) NOT NULL DEFAULT ${defaultOrganizationEntity.payout_minimum ?? 50.0}
        CHECK (payout_minimum >= 0.00),
    social_links JSONB NOT NULL DEFAULT '{}'::jsonb,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    system_settings JSONB NOT NULL DEFAULT '{"sessionIdleTimeoutMinutes":30,"accessTokenTtlMinutes":15,"refreshTokenTtlDays":7,"rememberMeTtlDays":30,"maxLoginAttempts":5,"lockoutDurationMinutes":15,"passwordMinLength":8,"requireSpecialChar":false,"allowUserRegistration":true,"requireEmailVerification":false,"maintenanceMode":false}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Singleton Protection: Disallow accidental DELETE on the organizations row
CREATE OR REPLACE RULE no_delete_organizations AS
ON DELETE TO organizations DO INSTEAD NOTHING;

-- Singleton Protection: Disallow TRUNCATE on the organizations table
DROP TRIGGER IF EXISTS trg_prevent_truncate_organizations ON organizations;
CREATE TRIGGER trg_prevent_truncate_organizations
BEFORE TRUNCATE ON organizations
FOR EACH STATEMENT
EXECUTE FUNCTION prevent_table_truncate();

-- Trigger: organizations updated_at
DROP TRIGGER IF EXISTS trg_organizations_updated_at ON organizations;
CREATE TRIGGER trg_organizations_updated_at
BEFORE UPDATE ON organizations
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

-- Step 5: Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id SMALLSERIAL PRIMARY KEY,
    slug VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    is_system BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed System Roles
INSERT INTO roles (id, slug, name, description, is_system) VALUES
    (1, 'admin', 'Administrator', 'Super administrator with unrestricted platform & system management access', TRUE),
    (2, 'seller', 'Seller', 'Merchant account capable of listing, selling, and managing digital products', TRUE),
    (3, 'buyer', 'Buyer', 'Standard user capable of purchasing and downloading digital assets', TRUE),
    (4, 'guest', 'Guest', 'Unauthenticated visitor with access to public platform features', TRUE)
ON CONFLICT (id) DO UPDATE 
    SET slug = EXCLUDED.slug,
        name = EXCLUDED.name,
        description = EXCLUDED.description;

-- Synchronize sequence with highest manual ID
SELECT setval(pg_get_serial_sequence('roles', 'id'), COALESCE((SELECT MAX(id) FROM roles), 1));

-- Step 6: Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id SMALLINT NOT NULL DEFAULT 3,
    name VARCHAR(100) NOT NULL,
    email citext NOT NULL,
    password_hash VARCHAR(255),
    auth_provider VARCHAR(50) NOT NULL DEFAULT 'local',
    status VARCHAR(20) NOT NULL DEFAULT 'active' 
        CHECK (status IN ('active', 'pending', 'suspended', 'banned')),
    email_verified_at TIMESTAMPTZ,
    failed_login_attempts INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,

    CONSTRAINT fk_users_role 
        FOREIGN KEY (role_id) 
        REFERENCES roles(id) 
        ON UPDATE CASCADE 
        ON DELETE RESTRICT,

    CONSTRAINT chk_users_name_not_empty 
        CHECK (length(trim(name)) > 0),
    CONSTRAINT chk_users_password_if_local 
        CHECK (auth_provider != 'local' OR password_hash IS NOT NULL)
);

ALTER TABLE users ALTER COLUMN role_id SET DEFAULT 3;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_active_email 
    ON users (email) 
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_users_role_id 
    ON users (role_id);

CREATE INDEX IF NOT EXISTS idx_users_status 
    ON users (status) 
    WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

-- Seed Default Platform Super Administrator
INSERT INTO users (
    id,
    role_id,
    name,
    email,
    password_hash,
    auth_provider,
    status,
    email_verified_at
) VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    1,
    'Admin',
    'admin@selldigitalassets.com',
    '$2b$12$bCHdjCEbJS1..bm.a6rfWOvb.1dASiIVehHth7fGkFKoQJm4/k8.6',
    'local',
    'active',
    CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO NOTHING;

-- Step 6b: Revoked Tokens & Session Invalidation Table
CREATE TABLE IF NOT EXISTS revoked_tokens (
    jti VARCHAR(128) PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_revoked_tokens_expires_at ON revoked_tokens (expires_at);
CREATE INDEX IF NOT EXISTS idx_revoked_tokens_user_id ON revoked_tokens (user_id);

-- Step 7: Categories Table (Taxonomy tree for digital assets)
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    parent_id INT,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) NOT NULL UNIQUE,
    depth SMALLINT NOT NULL DEFAULT 0,
    path TEXT NOT NULL,
    description TEXT,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_categories_parent 
        FOREIGN KEY (parent_id) 
        REFERENCES categories(id) 
        ON UPDATE CASCADE 
        ON DELETE SET NULL,

    CONSTRAINT chk_categories_name_not_empty 
        CHECK (length(trim(name)) > 0),
    CONSTRAINT chk_categories_slug_not_empty 
        CHECK (length(trim(slug)) > 0),
    CONSTRAINT chk_categories_depth_non_negative
        CHECK (depth >= 0)
);

CREATE INDEX IF NOT EXISTS idx_categories_parent_id 
    ON categories (parent_id);

CREATE INDEX IF NOT EXISTS idx_categories_slug 
    ON categories (slug);

CREATE INDEX IF NOT EXISTS idx_categories_depth 
    ON categories (depth);

CREATE INDEX IF NOT EXISTS idx_categories_is_active 
    ON categories (is_active);

DROP TRIGGER IF EXISTS trg_categories_updated_at ON categories;
CREATE TRIGGER trg_categories_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

-- Category Soft-Delete Protection Rule: Intercept DELETE and convert to UPDATE is_active = FALSE
CREATE OR REPLACE RULE no_delete_categories AS
ON DELETE TO categories DO INSTEAD
    UPDATE categories SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;

-- Step 8: Unified Query Views
CREATE OR REPLACE VIEW view_users AS
SELECT 
    u.id,
    u.role_id,
    r.slug AS role,
    r.name AS role_name,
    u.name,
    u.email,
    u.password_hash,
    u.auth_provider,
    u.status,
    u.email_verified_at,
    u.failed_login_attempts,
    u.locked_until,
    u.last_login_at,
    u.created_at,
    u.updated_at,
    u.deleted_at
FROM users u
JOIN roles r ON u.role_id = r.id;

CREATE OR REPLACE VIEW view_organizations AS
SELECT 
    o.*,
    curr.name AS currency_name,
    curr.symbol AS currency_symbol,
    json_build_object(
        'code', curr.code,
        'name', curr.name,
        'symbol', curr.symbol
    ) AS currency
FROM organizations o
LEFT JOIN currencies curr ON o.default_currency = curr.code;

CREATE OR REPLACE VIEW view_categories AS
SELECT 
    c.id,
    c.parent_id,
    p.name AS parent_name,
    p.slug AS parent_slug,
    c.name,
    c.slug,
    c.depth,
    c.path,
    c.description,
    c.display_order,
    c.is_active,
    c.metadata,
    c.created_at,
    c.updated_at
FROM categories c
LEFT JOIN categories p ON c.parent_id = p.id;

-- Step 9: Themes Table (Unified Dynamic Theme Tokens, Palette, Mode & Typography)
CREATE TABLE IF NOT EXISTS themes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL DEFAULT 'Default Theme',
    slug VARCHAR(100) NOT NULL UNIQUE DEFAULT 'default',
    mode VARCHAR(20) NOT NULL DEFAULT 'dark',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    color_hex_map JSONB NOT NULL,
    color_tokens JSONB NOT NULL,
    typography JSONB NOT NULL DEFAULT '{}'::jsonb,
    border_radius VARCHAR(50) NOT NULL DEFAULT 'rounded-lg',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_themes_single_active 
    ON themes (is_active) 
    WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_themes_slug 
    ON themes (slug);

DROP TRIGGER IF EXISTS trg_themes_updated_at ON themes;
CREATE TRIGGER trg_themes_updated_at
BEFORE UPDATE ON themes
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

-- Drop legacy theme_settings table if it exists
DROP TABLE IF EXISTS theme_settings CASCADE;

-- Seed Default Theme Palette and Tokens (sourced from src/data/themes.ts)
INSERT INTO themes (
    name,
    slug,
    mode,
    is_active,
    color_hex_map,
    color_tokens,
    typography,
    border_radius,
    metadata
) VALUES (
    '${defaultTheme.name.replace(/'/g, "''")}',
    '${defaultTheme.slug.replace(/'/g, "''")}',
    '${(defaultTheme.mode || "dark").replace(/'/g, "''")}',
    ${defaultTheme.is_active ? "TRUE" : "FALSE"},
    '${JSON.stringify(defaultTheme.color_hex_map).replace(/'/g, "''")}'::jsonb,
    '${JSON.stringify(defaultTheme.color_tokens).replace(/'/g, "''")}'::jsonb,
    '${JSON.stringify(defaultTheme.metadata?.typography ?? {}).replace(/'/g, "''")}'::jsonb,
    'rounded-lg',
    '${JSON.stringify(defaultTheme.metadata ?? {}).replace(/'/g, "''")}'::jsonb
)
ON CONFLICT (slug) DO UPDATE
    SET name = EXCLUDED.name,
        mode = EXCLUDED.mode,
        color_hex_map = EXCLUDED.color_hex_map,
        color_tokens = EXCLUDED.color_tokens,
        typography = EXCLUDED.typography,
        border_radius = EXCLUDED.border_radius,
        metadata = EXCLUDED.metadata,
        updated_at = CURRENT_TIMESTAMP;

-- Step 10: Unified View for Themes
CREATE OR REPLACE VIEW view_themes AS
SELECT 
    t.id,
    t.name,
    t.slug,
    t.mode,
    t.is_active,
    t.color_hex_map,
    t.color_tokens,
    t.typography,
    t.border_radius,
    t.metadata,
    t.created_at,
    t.updated_at
FROM themes t;

-- Step 11: Master License Pricing Tiers Table
CREATE TABLE IF NOT EXISTS license_tiers (
    id SMALLSERIAL PRIMARY KEY,
    tier_type VARCHAR(20) NOT NULL UNIQUE CHECK (tier_type IN ('personal', 'commercial', 'extended')),
    name VARCHAR(100) NOT NULL,
    default_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (default_price >= 0),
    description TEXT,
    license_terms_summary TEXT NOT NULL,
    max_activations INT NOT NULL DEFAULT 1 CHECK (max_activations >= 1),
    display_order SMALLINT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed Default License Tiers (sourced from src/data/license-tiers.ts)
INSERT INTO license_tiers (tier_type, name, default_price, description, license_terms_summary, max_activations, display_order, is_active) VALUES
${defaultLicenseTiers.map((t) => `    ('${t.tier_type}', '${t.name.replace(/'/g, "''")}', ${t.default_price}, '${t.description.replace(/'/g, "''")}', '${t.license_terms_summary.replace(/'/g, "''")}', ${t.max_activations}, ${t.display_order}, ${t.is_active ? "TRUE" : "FALSE"})`).join(",\n")}
ON CONFLICT (tier_type) DO UPDATE
    SET name = EXCLUDED.name,
        default_price = EXCLUDED.default_price,
        description = EXCLUDED.description,
        license_terms_summary = EXCLUDED.license_terms_summary,
        max_activations = EXCLUDED.max_activations,
        display_order = EXCLUDED.display_order,
        is_active = EXCLUDED.is_active;

DROP TRIGGER IF EXISTS trg_license_tiers_updated_at ON license_tiers;
CREATE TRIGGER trg_license_tiers_updated_at
BEFORE UPDATE ON license_tiers
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

-- Step 12: Assets & Digital Products Module
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    short_description VARCHAR(500) NOT NULL,
    full_description TEXT,
    preview_url TEXT,
    storage_path TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'needs_update', 'published', 'rejected', 'archived', 'under_review')),
    admin_feedback TEXT,
    seller_feedback TEXT,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ,
    tags TEXT[] NOT NULL DEFAULT '{}',
    technical_specs JSONB NOT NULL DEFAULT '{}'::jsonb,
    view_count INT NOT NULL DEFAULT 0,
    download_count INT NOT NULL DEFAULT 0,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_curated BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assets_seller_id ON assets (seller_id);
CREATE INDEX IF NOT EXISTS idx_assets_category_id ON assets (category_id);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets (status);
CREATE INDEX IF NOT EXISTS idx_assets_slug ON assets (slug);
CREATE INDEX IF NOT EXISTS idx_assets_preview_url ON assets (preview_url) WHERE preview_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_assets_storage_path ON assets (storage_path) WHERE storage_path IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_assets_active ON assets (is_active) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_assets_curated ON assets (is_curated) WHERE is_curated = TRUE AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_assets_featured ON assets (is_featured) WHERE is_featured = TRUE AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_assets_tags_gin ON assets USING GIN (tags);

DROP TRIGGER IF EXISTS trg_assets_updated_at ON assets;
CREATE TRIGGER trg_assets_updated_at
BEFORE UPDATE ON assets
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

-- Step 13: Asset Pricing Tiers
CREATE TABLE IF NOT EXISTS asset_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    tier_type VARCHAR(20) NOT NULL REFERENCES license_tiers(tier_type) ON UPDATE CASCADE,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    license_terms_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_asset_tier UNIQUE (asset_id, tier_type)
);

CREATE INDEX IF NOT EXISTS idx_asset_tiers_asset_id ON asset_tiers (asset_id);

DROP TRIGGER IF EXISTS trg_asset_tiers_updated_at ON asset_tiers;
CREATE TRIGGER trg_asset_tiers_updated_at
BEFORE UPDATE ON asset_tiers
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

-- Step 14: Asset Deliverable Files
CREATE TABLE IF NOT EXISTS asset_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
    storage_key TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT NOT NULL DEFAULT 0,
    file_checksum_sha256 VARCHAR(64),
    manifest_tree JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_asset_files_asset_id ON asset_files (asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_files_active ON asset_files (asset_id, is_active);

DROP TRIGGER IF EXISTS trg_asset_files_updated_at ON asset_files;
CREATE TRIGGER trg_asset_files_updated_at
BEFORE UPDATE ON asset_files
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

-- Step 15: Asset Showcase Media
CREATE TABLE IF NOT EXISTS asset_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    media_type VARCHAR(30) NOT NULL CHECK (media_type IN ('thumbnail', 'screenshot', 'preview_audio', 'preview_video')),
    storage_key TEXT NOT NULL,
    url TEXT NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_asset_media_asset_id ON asset_media (asset_id);

DROP TRIGGER IF EXISTS trg_asset_media_updated_at ON asset_media;
CREATE TRIGGER trg_asset_media_updated_at
BEFORE UPDATE ON asset_media
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

-- Step 16: Licensing Engine
CREATE TABLE IF NOT EXISTS licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_key VARCHAR(50) NOT NULL UNIQUE,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tier VARCHAR(20) NOT NULL DEFAULT 'personal' REFERENCES license_tiers(tier_type) ON UPDATE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
    max_activations INT NOT NULL DEFAULT 1,
    activation_count INT NOT NULL DEFAULT 0,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_licenses_asset_id ON licenses (asset_id);
CREATE INDEX IF NOT EXISTS idx_licenses_buyer_id ON licenses (buyer_id);
CREATE INDEX IF NOT EXISTS idx_licenses_key ON licenses (license_key);

-- Step 17: License Activations
CREATE TABLE IF NOT EXISTS license_activations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_id UUID NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
    domain_or_machine_id VARCHAR(255) NOT NULL,
    ip_address VARCHAR(50),
    activated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_license_domain UNIQUE (license_id, domain_or_machine_id)
);

CREATE INDEX IF NOT EXISTS idx_license_activations_license_id ON license_activations (license_id);

-- Step 18: Download Audits
CREATE TABLE IF NOT EXISTS download_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    asset_file_id UUID REFERENCES asset_files(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    license_key VARCHAR(50),
    ip_address VARCHAR(50) NOT NULL,
    user_agent TEXT,
    signed_url_token VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    downloaded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_download_audits_asset_id ON download_audits (asset_id);
CREATE INDEX IF NOT EXISTS idx_download_audits_token ON download_audits (signed_url_token);

-- Step 19: Notifications System
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications (user_id) WHERE is_read = FALSE;

-- Step 19b: Promotional Banners System
CREATE TABLE IF NOT EXISTS banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description VARCHAR(500),
    supporting_text VARCHAR(200),
    badge_type VARCHAR(30) NOT NULL DEFAULT 'special_offer'
        CHECK (badge_type IN ('special_offer', 'hot_deal', 'new_release', 'limited_time', 'announcement', 'flash_sale', 'none')),
    cta_label VARCHAR(80),
    cta_url VARCHAR(500),
    show_cta BOOLEAN NOT NULL DEFAULT TRUE,
    is_dismissible BOOLEAN NOT NULL DEFAULT TRUE,
    appearance VARCHAR(30) NOT NULL DEFAULT 'primary'
        CHECK (appearance IN ('primary', 'secondary', 'tertiary', 'inverse', 'surface', 'accent')),
    priority INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    timezone VARCHAR(80) NOT NULL DEFAULT 'UTC',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_banners_title_not_empty CHECK (length(trim(title)) > 0),
    CONSTRAINT chk_banners_schedule_window CHECK (starts_at IS NULL OR ends_at IS NULL OR ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_banners_active_schedule
    ON banners (is_active, priority DESC, starts_at, ends_at);

DROP TRIGGER IF EXISTS trg_banners_updated_at ON banners;
CREATE TRIGGER trg_banners_updated_at
BEFORE UPDATE ON banners
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

-- Step 20: Supabase Storage Buckets (Safe Initialization)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage') THEN
        -- Best-effort SQL bucket initialization and object cleanup (Supabase JS/S3 API also ensures them post-commit)
        BEGIN
            -- Step 20a: Empty both buckets at the database storage level
            DELETE FROM storage.objects
            WHERE bucket_id IN ('sell-digital-assets-storage-previews', 'sell-digital-assets-storage-private');

            INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
            VALUES (
                'sell-digital-assets-storage-previews',
                'sell-digital-assets-storage-previews',
                true,
                10485760, -- 10MB limit for webp preview images
                ARRAY['image/webp', 'image/png', 'image/jpeg']::text[]
            )
            ON CONFLICT (id) DO UPDATE SET
                public = true,
                file_size_limit = EXCLUDED.file_size_limit,
                allowed_mime_types = EXCLUDED.allowed_mime_types;

            INSERT INTO storage.buckets (id, name, public, file_size_limit)
            VALUES (
                'sell-digital-assets-storage-private',
                'sell-digital-assets-storage-private',
                false,
                524288000 -- 500MB limit for original asset files
            )
            ON CONFLICT (id) DO UPDATE SET
                public = false,
                file_size_limit = EXCLUDED.file_size_limit;
        EXCEPTION WHEN OTHERS THEN
            -- In managed cloud databases where direct SQL access to storage.buckets/objects is restricted,
            -- this block safely passes, and buckets are provisioned and emptied by the Supabase/S3 Storage API.
            NULL;
        END;
    END IF;
END $$;
`;

/**
 * Resolves the location of pg_dump on the host system.
 * Checks PG_DUMP_PATH environment variable, system PATH, and
 * standard PostgreSQL installation directories on Windows.
 */
function findPgDumpBinary(): string | null {
  if (process.env.PG_DUMP_PATH && fs.existsSync(process.env.PG_DUMP_PATH)) {
    return process.env.PG_DUMP_PATH;
  }

  // Check system PATH
  try {
    const testCmd = process.platform === "win32" ? "where pg_dump" : "which pg_dump";
    const out = child_process
      .execSync(testCmd, { stdio: ["pipe", "pipe", "ignore"], encoding: "utf8" })
      .trim();
    if (out) {
      const firstLine = out.split(/\r?\n/)[0]?.trim();
      if (firstLine && fs.existsSync(firstLine)) return firstLine;
      return "pg_dump";
    }
  } catch {
    // pg_dump not found in PATH
  }

  // Windows standard installation directories (e.g. C:\Program Files\PostgreSQL\<version>\bin\pg_dump.exe)
  if (process.platform === "win32") {
    const programFilesDirs = [
      process.env.ProgramFiles,
      process.env["ProgramFiles(x86)"],
      "C:\\Program Files",
      "C:\\Program Files (x86)",
    ].filter(Boolean) as string[];

    for (const pf of programFilesDirs) {
      const pgRoot = path.join(pf, "PostgreSQL");
      if (fs.existsSync(pgRoot)) {
        try {
          const versions = fs
            .readdirSync(pgRoot)
            .filter((v) => /^\d+/.test(v))
            .sort((a, b) => parseInt(b, 10) - parseInt(a, 10));

          for (const ver of versions) {
            const candidate = path.join(pgRoot, ver, "bin", "pg_dump.exe");
            if (fs.existsSync(candidate)) {
              return candidate;
            }
          }
        } catch {
          // ignore directory read errors
        }
      }
    }
  }

  return null;
}

/**
 * Resilient Node.js SQL dumper fallback if pg_dump binary is absent in the host environment.
 */
async function fallbackDatabaseBackup(
  databaseUrl: string,
  backupFilePath: string,
  requiresSsl: boolean,
): Promise<void> {
  const dumpClient = new Client({
    connectionString: databaseUrl,
    ssl: requiresSsl ? { rejectUnauthorized: false } : undefined,
  });
  await dumpClient.connect();
  try {
    const lines: string[] = [
      `-- Fallback database backup generated at ${new Date().toISOString()}`,
      "BEGIN;",
    ];

    const tablesRes = await dumpClient.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    for (const row of tablesRes.rows) {
      const tableName = row.table_name;
      const dataRes = await dumpClient.query(`SELECT * FROM "${tableName}"`);
      if (dataRes.rows.length > 0) {
        lines.push(`\n-- Data for table: ${tableName}`);
        for (const dataRow of dataRes.rows) {
          const cols = Object.keys(dataRow);
          const vals = cols.map((col) => {
            const val = dataRow[col];
            if (val === null || val === undefined) return "NULL";
            if (typeof val === "number" || typeof val === "boolean") return String(val);
            if (typeof val === "object") return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
            return `'${String(val).replace(/'/g, "''")}'`;
          });
          lines.push(
            `INSERT INTO "${tableName}" ("${cols.join('", "')}") VALUES (${vals.join(", ")}) ON CONFLICT DO NOTHING;`,
          );
        }
      }
    }

    lines.push("\nCOMMIT;");
    fs.writeFileSync(backupFilePath, lines.join("\n"), "utf8");
  } finally {
    await dumpClient.end().catch(() => {});
  }
}

/**
 * Takes an automated backup of the target database before dropping or resetting schemas.
 * Dumps are placed in the backups/ directory.
 */
async function backupDatabase(
  databaseUrl: string,
  targetDbName: string,
  isCloudDb: boolean,
  requiresSsl: boolean,
): Promise<string | null> {
  const backupsDir = path.resolve(__dirname, "../../backups");
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  const backupFileName = `${targetDbName}_backup_${timestamp}.sql`;
  const backupFilePath = path.join(backupsDir, backupFileName);

  // Check if database exists before attempting backup
  if (!isCloudDb) {
    const maintenanceUrl = new URL(databaseUrl);
    maintenanceUrl.pathname = "/postgres";
    const checkClient = new Client({ connectionString: maintenanceUrl.toString() });
    try {
      await checkClient.connect();
      const res = await checkClient.query(
        "SELECT 1 FROM pg_database WHERE datname = $1",
        [targetDbName],
      );
      if (res.rows.length === 0) {
        console.log(`ℹ️  Target database "${targetDbName}" does not exist yet; skipping pre-drop backup.`);
        return null;
      }
    } catch {
      // If maintenance client connection fails, proceed and attempt backup directly
    } finally {
      await checkClient.end().catch(() => {});
    }
  } else {
    const testClient = new Client({
      connectionString: databaseUrl,
      ssl: requiresSsl ? { rejectUnauthorized: false } : undefined,
      lookup: resilientDnsLookup,
    } as any);
    try {
      await testClient.connect();
      const res = await testClient.query(
        "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' LIMIT 1",
      );
      if (res.rows.length === 0) {
        console.log(`ℹ️  Target database "${targetDbName}" has no existing tables; skipping pre-drop backup.`);
        return null;
      }
    } catch (err: any) {
      console.log(`ℹ️  Could not connect to target database (${err.message}); skipping pre-drop backup.`);
      return null;
    } finally {
      await testClient.end().catch(() => {});
    }
  }

  console.log(`💾 Taking pre-drop backup of database "${targetDbName}"...`);

  const pgDumpPath = findPgDumpBinary();
  const parsed = new URL(databaseUrl);
  const host = parsed.hostname || "localhost";
  const port = parsed.port || "5432";
  const username = parsed.username || "postgres";
  const password = decodeURIComponent(parsed.password || "");

  if (pgDumpPath) {
    try {
      const args = [
        "-h", host,
        "-p", port,
        "-U", username,
        "-d", targetDbName,
        "-f", backupFilePath,
        "--clean",
        "--if-exists",
        "--no-owner",
        "--no-privileges",
      ];

      await new Promise<void>((resolve, reject) => {
        const child = child_process.spawn(pgDumpPath, args, {
          env: {
            ...process.env,
            PGPASSWORD: password,
            ...(requiresSsl ? { PGSSLMODE: "require" } : {}),
          },
          stdio: ["ignore", "pipe", "pipe"],
        });

        let stderr = "";
        child.stderr?.on("data", (data) => {
          stderr += data.toString();
        });

        child.on("close", (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`pg_dump exited with code ${code}: ${stderr.trim()}`));
          }
        });

        child.on("error", (err) => reject(err));
      });

      const stats = fs.statSync(backupFilePath);
      const sizeKb = (stats.size / 1024).toFixed(1);
      console.log(`✅ Pre-drop backup saved: backups/${backupFileName} (${sizeKb} KB)`);
      return backupFilePath;
    } catch (dumpErr: any) {
      console.warn(`⚠️  pg_dump encountered an error (${dumpErr.message}). Falling back to Node.js table exporter...`);
    }
  }

  try {
    await fallbackDatabaseBackup(databaseUrl, backupFilePath, requiresSsl);
    const stats = fs.statSync(backupFilePath);
    const sizeKb = (stats.size / 1024).toFixed(1);
    console.log(`✅ Pre-drop backup saved via fallback: backups/${backupFileName} (${sizeKb} KB)`);
    return backupFilePath;
  } catch (fallbackErr: any) {
    console.warn(`⚠️  Pre-drop backup fallback failed: ${fallbackErr.message}`);
    return null;
  }
}

async function promptTargetDatabase(): Promise<string> {
  const localUrl =
    process.env.LOCAL_DATABASE_URL ||
    (process.env.DATABASE_URL && !isSslRequired(process.env.DATABASE_URL) ? process.env.DATABASE_URL : undefined) ||
    "postgresql://postgres:P%40ssw0rd@localhost:5432/sell_digital_assets";
  const liveUrl = process.env.PROD_DATABASE_URL || (isSslRequired(process.env.DATABASE_URL || "") ? process.env.DATABASE_URL : undefined);

  // Command-line flag shortcuts (for scripting or automated environments)
  if (process.argv.includes("--local") || process.argv.includes("-1")) {
    return localUrl;
  }
  if (
    process.argv.includes("--live") ||
    process.argv.includes("--cloud") ||
    process.argv.includes("-2")
  ) {
    if (!liveUrl) {
      console.error(
        "❌ Error: PROD_DATABASE_URL environment variable is missing for live database.",
      );
      process.exit(1);
    }
    if (process.env.ALLOW_LIVE_DB_RESET !== "true") {
      console.error(
        "🛑 SAFEGUARD BLOCKED: Resetting the live database via CLI flags requires ALLOW_LIVE_DB_RESET=true.",
      );
      process.exit(1);
    }
    return liveUrl;
  }

  // Interactive menu
  if (process.stdin.isTTY) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    try {
      console.log("\n=======================================================");
      console.log("             DATABASE RESET UTILITY                   ");
      console.log("=======================================================");
      console.log("  [1] Local Database (localhost:5432/sell_digital_assets) [SAFE]");
      console.log("  [2] Live Database  (Supabase / Cloud) [PRODUCTION - DANGEROUS]");
      console.log("=======================================================");

      while (true) {
        const choice = (
          await rl.question("Select option (1 for Local, 2 for Live): ")
        ).trim();
        if (choice === "1") {
          return localUrl;
        }
        if (choice === "2") {
          if (!liveUrl) {
            console.error(
              "❌ Error: PROD_DATABASE_URL environment variable is missing for live database.",
            );
            process.exit(1);
          }

          console.log("\n⚠️  DANGER: You selected the LIVE / PRODUCTION CLOUD database!");
          const confirmText = (
            await rl.question("Type 'CONFIRM RESET PRODUCTION' to proceed or anything else to cancel: ")
          ).trim();

          if (confirmText !== "CONFIRM RESET PRODUCTION") {
            console.log("🛡️  Reset of live database cancelled by user.");
            process.exit(0);
          }
          return liveUrl;
        }
        console.log("⚠️  Invalid option. Please enter '1' for Local or '2' for Live.");
      }
    } finally {
      rl.close();
    }
  }

  // Non-interactive fallback defaults strictly to local database to protect live database
  return localUrl;
}

export async function resetDatabase(): Promise<void> {
  const databaseUrl = await promptTargetDatabase();
  if (!databaseUrl) {
    console.error("❌ Error: Target database URL could not be resolved");
    process.exit(1);
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(databaseUrl);
  } catch (err: any) {
    console.error(`❌ Error: Invalid DATABASE_URL: ${err.message}`);
    process.exit(1);
  }

  const targetDbName = parsedUrl.pathname.replace(/^\//, "");
  if (!targetDbName) {
    console.error(
      "❌ Error: Target database name could not be parsed from DATABASE_URL",
    );
    process.exit(1);
  }

  const requiresSsl = isSslRequired(databaseUrl);
  const isCloudDb = requiresSsl;

  console.log("=======================================================");
  console.log(`🎯 Target Database: ${targetDbName}`);
  console.log(`📍 Host:            ${parsedUrl.hostname} (${isCloudDb ? "🔴 LIVE / CLOUD DATABASE" : "🟢 LOCAL DATABASE"})`);
  console.log("=======================================================");

  if (isCloudDb) {
    console.log("⚠️  WARNING: You are resetting the LIVE / PRODUCTION CLOUD database!\n");
  } else {
    console.log("🟢 Running database reset on LOCAL PostgreSQL.\n");
  }

  // Step 0: Take an automated pre-drop backup of the database into the backups/ folder
  try {
    await backupDatabase(databaseUrl, targetDbName, isCloudDb, requiresSsl);
  } catch (backupErr: any) {
    console.warn(`⚠️  Database pre-drop backup encountered an issue: ${backupErr.message}`);
  }

  if (!isCloudDb) {
    // Step 1: For local PostgreSQL, connect to maintenance database to drop and recreate the target database
    const maintenanceUrl = new URL(databaseUrl);
    maintenanceUrl.pathname = "/postgres";

    const maintenanceClient = new Client({
      connectionString: maintenanceUrl.toString(),
    });

    try {
      await maintenanceClient.connect();

      console.log("🗑️  Dropping old database...");
      const safeDbName = targetDbName.replace(/"/g, '""');

      try {
        // PostgreSQL 13+ supports WITH (FORCE) to automatically terminate active connections
        await maintenanceClient.query(
          `DROP DATABASE IF EXISTS "${safeDbName}" WITH (FORCE);`,
        );
      } catch {
        // Fallback for older PostgreSQL versions
        await maintenanceClient.query(
          `SELECT pg_terminate_backend(pid)
           FROM pg_stat_activity
           WHERE datname = $1 AND pid <> pg_backend_pid();`,
          [targetDbName],
        );
        await maintenanceClient.query(
          `DROP DATABASE IF EXISTS "${safeDbName}";`,
        );
      }

      console.log("📦 Creating fresh database...");
      await maintenanceClient.query(`CREATE DATABASE "${safeDbName}";`);
    } catch (err: any) {
      console.warn(
        `⚠️  Maintenance DB drop/create skipped (${err.message}). Falling back to schema reset.`,
      );
    } finally {
      await maintenanceClient.end().catch(() => {});
    }
  } else {
    console.log(
      "☁️  Cloud / Managed Database detected: Performing clean schema reset...",
    );
  }

  // Step 2: Connect to the target database and execute the schema DDL in a transaction
  let targetClient: any = null;

  try {
    for (let attempt = 1; attempt <= 3; attempt++) {
      targetClient = new Client({
        connectionString: databaseUrl,
        ssl: requiresSsl ? { rejectUnauthorized: false } : undefined,
        lookup: resilientDnsLookup,
      } as any);

      try {
        await targetClient.connect();
        break;
      } catch (connErr: any) {
        await targetClient.end().catch(() => {});
        targetClient = null;
        if (attempt < 3) {
          console.warn(`⚠️  Database connection attempt ${attempt} failed (${connErr.message}). Retrying in 2s...`);
          await new Promise((r) => setTimeout(r, 2000));
        } else {
          throw connErr;
        }
      }
    }

    if (!targetClient) {
      throw new Error("Failed to initialize database connection");
    }

    if (isCloudDb) {
      await targetClient.query(
        "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO CURRENT_USER;",
      );
    }

    console.log("🔨 Applying schema and tables...");
    await targetClient.query("BEGIN");
    try {
      await targetClient.query(SCHEMA_SQL);

      // Dynamically insert organization initial seed from organizations.ts with parameterized query
      await targetClient.query(
        `INSERT INTO organizations (
           id,
           organization_name,
           legal_name,
           tagline,
           description,
           logo_url,
           logo_dark_url,
           favicon_url,
           cover_banner_url,
           support_email,
           contact_email,
           support_phone,
           support_url,
           address_line1,
           city,
           state,
           postal_code,
           country,
           default_currency,
           platform_fee_percent,
           payout_minimum,
           social_links,
           metadata
         ) VALUES (
           $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
           $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
           $21, $22, $23
         )
         ON CONFLICT (id) DO NOTHING;`,
        [
          defaultOrganizationEntity.id ?? 1,
          defaultOrganizationEntity.organization_name,
          defaultOrganizationEntity.legal_name,
          defaultOrganizationEntity.tagline || null,
          defaultOrganizationEntity.description || null,
          defaultOrganizationEntity.logo_url || null,
          defaultOrganizationEntity.logo_dark_url || null,
          defaultOrganizationEntity.favicon_url || null,
          defaultOrganizationEntity.cover_banner_url || null,
          defaultOrganizationEntity.support_email,
          defaultOrganizationEntity.contact_email || null,
          defaultOrganizationEntity.support_phone || null,
          defaultOrganizationEntity.support_url || null,
          defaultOrganizationEntity.address_line1 || null,
          defaultOrganizationEntity.city || null,
          defaultOrganizationEntity.state || null,
          defaultOrganizationEntity.postal_code || null,
          defaultOrganizationEntity.country || null,
          defaultOrganizationEntity.default_currency || "PKR",
          defaultOrganizationEntity.platform_fee_percent ?? 5.0,
          defaultOrganizationEntity.payout_minimum ?? 50.0,
          JSON.stringify(defaultOrganizationEntity.social_links ?? {}),
          JSON.stringify(defaultOrganizationEntity.metadata ?? {}),
        ],
      );

      // Dynamically seed digital asset categories from categories.ts
      console.log("🌱 Seeding digital asset categories from categories.ts...");
      const flatCats = flattenCategories(defaultCategories);
      const slugToIdMap = new Map<string, number>();

      const maxDepth = Math.max(...flatCats.map((c) => c.depth));
      for (let d = 0; d <= maxDepth; d++) {
        const itemsAtDepth = flatCats.filter((c) => c.depth === d);
        if (itemsAtDepth.length === 0) continue;

        const chunkSize = 50;
        for (let i = 0; i < itemsAtDepth.length; i += chunkSize) {
          const chunk = itemsAtDepth.slice(i, i + chunkSize);
          const valuePlaceholders: string[] = [];
          const values: any[] = [];

          chunk.forEach((cat, idx) => {
            const parentId = cat.parentSlug
              ? (slugToIdMap.get(cat.parentSlug) ?? null)
              : null;
            const offset = idx * 8;
            valuePlaceholders.push(
              `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}::jsonb)`,
            );
            values.push(
              parentId,
              cat.name,
              cat.slug,
              cat.depth,
              cat.fullPath,
              i + idx + 1,
              true,
              JSON.stringify({ pathSlugs: cat.pathSlugs }),
            );
          });

          const insertCategoriesQuery = `
            INSERT INTO categories (
              parent_id,
              name,
              slug,
              depth,
              path,
              display_order,
              is_active,
              metadata
            ) VALUES ${valuePlaceholders.join(", ")}
            ON CONFLICT (slug) DO UPDATE SET
              parent_id = EXCLUDED.parent_id,
              name = EXCLUDED.name,
              depth = EXCLUDED.depth,
              path = EXCLUDED.path,
              display_order = EXCLUDED.display_order,
              is_active = EXCLUDED.is_active,
              metadata = EXCLUDED.metadata,
              updated_at = CURRENT_TIMESTAMP
            RETURNING id, slug;
          `;

          const result = await targetClient.query(
            insertCategoriesQuery,
            values,
          );
          for (const row of result.rows) {
            slugToIdMap.set(row.slug, row.id);
          }
        }
      }
      console.log(`✅ Seeded ${slugToIdMap.size} digital asset categories successfully!`);

      await targetClient.query("COMMIT");
      console.log("✅ Schema applied successfully with ZERO mock data!");

      // If Supabase API credentials are configured, ensure and empty buckets via Supabase Storage API
      if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const { createClient } = await import("@supabase/supabase-js");
          const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            { auth: { autoRefreshToken: false, persistSession: false } }
          );

          const { error: prevErr } = await supabase.storage.createBucket("sell-digital-assets-storage-previews", {
            public: true,
            fileSizeLimit: 10485760,
            allowedMimeTypes: ["image/webp", "image/png", "image/jpeg"],
          });
          if (prevErr && prevErr.message?.toLowerCase().includes("already exists")) {
            await supabase.storage.updateBucket("sell-digital-assets-storage-previews", {
              public: true,
              fileSizeLimit: 10485760,
              allowedMimeTypes: ["image/webp", "image/png", "image/jpeg"],
            }).catch(() => {});
          }

          const { error: privErr } = await supabase.storage.createBucket("sell-digital-assets-storage-private", {
            public: false,
            fileSizeLimit: 524288000,
          });
          if (privErr && privErr.message?.toLowerCase().includes("already exists")) {
            await supabase.storage.updateBucket("sell-digital-assets-storage-private", {
              public: false,
              fileSizeLimit: 524288000,
            }).catch(() => {});
          }

          // Empty both buckets via Supabase Storage API
          await supabase.storage.emptyBucket("sell-digital-assets-storage-previews").catch(() => {});
          await supabase.storage.emptyBucket("sell-digital-assets-storage-private").catch(() => {});

          console.log("🪣  Verified and emptied Supabase Storage buckets: sell-digital-assets-storage-previews (public) and sell-digital-assets-storage-private (private)");
        } catch {
          // If network error or bucket already exists, proceed smoothly
        }
      }

      // If S3 credentials are configured (e.g. Supabase S3 storage), also empty both buckets via S3 API
      if (
        process.env.AWS_ENDPOINT &&
        process.env.AWS_ACCESS_KEY_ID &&
        process.env.AWS_SECRET_ACCESS_KEY
      ) {
        try {
          const { S3Client, ListObjectsV2Command, DeleteObjectsCommand } = await import("@aws-sdk/client-s3");
          const s3 = new S3Client({
            region: process.env.AWS_REGION || "auto",
            endpoint: process.env.AWS_ENDPOINT,
            forcePathStyle: true,
            credentials: {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            },
          });

          const buckets = [
            process.env.AWS_BUCKET_PREVIEWS || "sell-digital-assets-storage-previews",
            process.env.AWS_BUCKET_PRIVATE || "sell-digital-assets-storage-private",
          ];

          for (const bucket of buckets) {
            let continuationToken: string | undefined = undefined;
            do {
              const listRes: any = await s3.send(
                new ListObjectsV2Command({
                  Bucket: bucket,
                  ContinuationToken: continuationToken,
                })
              );
              if (listRes.Contents && listRes.Contents.length > 0) {
                await s3.send(
                  new DeleteObjectsCommand({
                    Bucket: bucket,
                    Delete: {
                      Objects: listRes.Contents.map((obj: any) => ({ Key: obj.Key! })),
                      Quiet: true,
                    },
                  })
                );
              }
              continuationToken = listRes.NextContinuationToken;
            } while (continuationToken);
          }
          console.log("🧹  Emptied storage buckets via S3 API: sell-digital-assets-storage-previews and sell-digital-assets-storage-private");
        } catch {
          // If S3 bucket empty fails or offline, continue smoothly
        }
      }

      // Also empty local storage directory if local driver is used
      if (process.env.STORAGE_DRIVER === "local" || !process.env.STORAGE_DRIVER) {
        const localPath =
          process.env.LOCAL_STORAGE_PATH ||
          (process.platform === "win32"
            ? "C:\\GH\\sell-digital-assets-storage"
            : "./storage");
        if (fs.existsSync(localPath)) {
          try {
            const files = fs.readdirSync(localPath);
            for (const file of files) {
              fs.rmSync(path.join(localPath, file), { recursive: true, force: true });
            }
            console.log(`🧹  Emptied local storage directory: ${localPath}`);
          } catch {
            // ignore
          }
        }
      }
    } catch (schemaErr: any) {
      await targetClient.query("ROLLBACK").catch(() => {});
      throw schemaErr;
    }
  } catch (err: any) {
    console.error(`❌ Error: ${err.message}`);
    process.exit(1);
  } finally {
    if (targetClient) {
      await targetClient.end().catch(() => {});
    }
  }

  console.log("🎉 Database reset & schema build complete!");
}

// Automatically invoke if executed directly via node or tsx
resetDatabase();
