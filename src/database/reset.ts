import dns from "node:dns";
import fs from "node:fs";
import path from "node:path";
import child_process from "node:child_process";
import readline from "node:readline/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import pg from "pg";
import dotenv from "dotenv";
import { defaultOrganizationEntity } from "../data/organizations.js";
import { defaultCategories, flattenCategories } from "../data/categories.js";
import { defaultCurrencies } from "../data/currencies.js";
import { defaultTheme } from "../data/themes.js";
import { defaultLicenseTiers } from "../data/license-tiers.js";
import { defaultHeroImages } from "../data/hero-images.js";
import { defaultBanners } from "../data/banners.js";
import {
  resilientDnsLookup,
  isSslRequired,
  createResilientSocket,
  installResilientDns,
  maskDatabaseUrl,
} from "../config/database.js";
import { isLocalDatabaseHost } from "../config/env.js";

// Prioritize IPv4 DNS lookups and activate resilient public DNS fallback
installResilientDns();

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
      dotenv.config({ path: envPath, quiet: true });
      return;
    }
    dir = path.dirname(dir);
  }
  dotenv.config({ quiet: true });
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
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,           -- 'ADMIN', 'SELLER', 'BUYER', 'MANAGER', 'USER', 'ANALYST'
    slug VARCHAR(50) UNIQUE NOT NULL,
    scope VARCHAR(20) NOT NULL DEFAULT 'PLATFORM', -- 'PLATFORM' or 'SELLER_STORE'
    allow_public_signup BOOLEAN NOT NULL DEFAULT FALSE,
    description VARCHAR(255),
    is_system BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_roles_normalized_name ON roles (LOWER(TRIM(name)));
CREATE UNIQUE INDEX IF NOT EXISTS idx_roles_normalized_slug ON roles (LOWER(TRIM(slug)));

-- Seed System & Scoped Roles
INSERT INTO roles (id, name, slug, scope, allow_public_signup, description) VALUES
    (1, 'ADMIN',    'admin',    'PLATFORM',     FALSE, 'Super administrator with unrestricted platform & system management access'),
    (2, 'SELLER',   'seller',   'PLATFORM',     TRUE,  'Merchant account capable of listing, selling, and managing digital products'),
    (3, 'BUYER',    'buyer',    'PLATFORM',     TRUE,  'Standard user capable of purchasing and downloading digital assets'),
    (4, 'MANAGER',  'manager',  'SELLER_STORE', FALSE, 'Store manager with permissions to manage products, sales, and settings'),
    (5, 'USER',     'user',     'SELLER_STORE', FALSE, 'Team member with permissions to draft and upload assets'),
    (6, 'ANALYST',  'analyst',  'SELLER_STORE', FALSE, 'Team member with permissions to view sales and analytics')
ON CONFLICT (id) DO UPDATE
    SET name = EXCLUDED.name,
        slug = EXCLUDED.slug,
        scope = EXCLUDED.scope,
        allow_public_signup = EXCLUDED.allow_public_signup,
        description = EXCLUDED.description;

-- Synchronize sequence with highest manual ID
SELECT setval(pg_get_serial_sequence('roles', 'id'), COALESCE((SELECT MAX(id) FROM roles), 1));

-- Step 6: Users Table (Unified table for all roles and sub-users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email citext UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name VARCHAR(100) NOT NULL DEFAULT '',
    name VARCHAR(100) NOT NULL DEFAULT '',
    role_id INTEGER NOT NULL DEFAULT 3 REFERENCES roles(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    url VARCHAR(30) NOT NULL DEFAULT '',        -- Custom storefront slug for Sellers (e.g. "seller01")
    parent_seller_id UUID NULL REFERENCES users(id) ON DELETE CASCADE, -- Binds sub-users to a parent seller
    allowed_permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    auth_provider VARCHAR(50) NOT NULL DEFAULT 'local',
    status VARCHAR(20) NOT NULL DEFAULT 'active' 
        CHECK (status IN ('active', 'pending', 'suspended', 'banned')),
    email_verified_at TIMESTAMPTZ,
    failed_login_attempts INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

ALTER TABLE users ALTER COLUMN role_id SET DEFAULT 3;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_active_email 
    ON users (email) 
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_users_role_id 
    ON users (role_id);

CREATE INDEX IF NOT EXISTS idx_users_parent_seller 
    ON users (parent_seller_id);

CREATE INDEX IF NOT EXISTS idx_users_url 
    ON users (url) 
    WHERE url != '';

CREATE INDEX IF NOT EXISTS idx_users_status 
    ON users (status) 
    WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

-- Seed Organization Owner Admin (No public registration allowed)
INSERT INTO users (
    id,
    email,
    password_hash,
    display_name,
    name,
    role_id,
    url,
    parent_seller_id,
    allowed_permissions,
    is_active,
    auth_provider,
    status,
    email_verified_at
) VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'admin@selldigitalassets.com',
    '$2b$12$bCHdjCEbJS1..bm.a6rfWOvb.1dASiIVehHth7fGkFKoQJm4/k8.6',
    'Organization Owner',
    'Organization Owner',
    1,
    '',
    NULL,
    '["*"]'::jsonb,
    TRUE,
    'local',
    'active',
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO UPDATE
    SET display_name = EXCLUDED.display_name,
        name = EXCLUDED.name,
        role_id = 1,
        allowed_permissions = '["*"]'::jsonb,
        is_active = TRUE;

-- Step 6b: Revoked Tokens & Session Invalidation Table
CREATE TABLE IF NOT EXISTS revoked_tokens (
    jti VARCHAR(128) PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_revoked_tokens_expires_at ON revoked_tokens (expires_at);
CREATE INDEX IF NOT EXISTS idx_revoked_tokens_user_id ON revoked_tokens (user_id);

-- Step 6c: Permissions Catalog & Seller-Managed Role Permissions
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    module VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description VARCHAR(255) NOT NULL,
    scope VARCHAR(20) NOT NULL DEFAULT 'SELLER_STORE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_default_permissions (
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_name VARCHAR(100) NOT NULL REFERENCES permissions(name) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_name)
);

CREATE TABLE IF NOT EXISTS seller_role_permissions (
    id SERIAL PRIMARY KEY,
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_seller_role_permissions UNIQUE (seller_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_seller_role_permissions_seller_id 
    ON seller_role_permissions (seller_id);

DROP TRIGGER IF EXISTS trg_seller_role_permissions_updated_at ON seller_role_permissions;
CREATE TRIGGER trg_seller_role_permissions_updated_at
BEFORE UPDATE ON seller_role_permissions
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

-- Seed Permissions Catalog
INSERT INTO permissions (name, module, action, description, scope) VALUES
    ('analytics:view', 'analytics', 'view', 'View store performance analytics, telemetry, and KPI charts', 'SELLER_STORE'),
    ('products:view', 'products', 'view', 'Browse and view digital products, assets, and details', 'SELLER_STORE'),
    ('products:create', 'products', 'create', 'Create draft assets and upload product files and media', 'SELLER_STORE'),
    ('products:edit', 'products', 'edit', 'Update product details, pricing tiers, and metadata', 'SELLER_STORE'),
    ('products:delete', 'products', 'delete', 'Archive, soft-delete, or decommission digital assets', 'SELLER_STORE'),
    ('products:publish', 'products', 'publish', 'Publish assets to the marketplace or change listing status', 'SELLER_STORE'),
    ('coupons:view', 'coupons', 'view', 'View store discount coupons and promotional campaigns', 'SELLER_STORE'),
    ('coupons:manage', 'coupons', 'manage', 'Create, edit, toggle status, and delete store discount coupons', 'SELLER_STORE'),
    ('orders:view', 'orders', 'view', 'View store customer orders, sales history, and transaction records', 'SELLER_STORE'),
    ('financial:view', 'financial', 'view', 'View store earnings, revenue metrics, and payout history', 'SELLER_STORE'),
    ('storefront:view', 'storefront', 'view', 'View seller storefront customization and vanity URL', 'SELLER_STORE'),
    ('storefront:edit', 'storefront', 'edit', 'Edit storefront banner, avatar, branding, and biography', 'SELLER_STORE'),
    ('team:view', 'team', 'view', 'View store team members and their assigned store roles', 'SELLER_STORE'),
    ('team:manage', 'team', 'manage', 'Add, update roles, manage permissions, and remove team members', 'SELLER_STORE'),
    ('settings:view', 'settings', 'view', 'View store preferences and alert settings', 'SELLER_STORE'),
    ('settings:edit', 'settings', 'edit', 'Update store preferences, notifications, and alert settings', 'SELLER_STORE')
ON CONFLICT (name) DO UPDATE
    SET module = EXCLUDED.module,
        action = EXCLUDED.action,
        description = EXCLUDED.description,
        scope = EXCLUDED.scope;

-- Seed Default Role Permissions
-- MANAGER (4)
INSERT INTO role_default_permissions (role_id, permission_name) VALUES
    (4, 'analytics:view'), (4, 'products:view'), (4, 'products:create'), (4, 'products:edit'),
    (4, 'products:delete'), (4, 'products:publish'), (4, 'coupons:view'), (4, 'coupons:manage'),
    (4, 'orders:view'), (4, 'financial:view'), (4, 'storefront:view'), (4, 'storefront:edit'),
    (4, 'team:view'), (4, 'team:manage'), (4, 'settings:view'), (4, 'settings:edit')
ON CONFLICT DO NOTHING;

-- USER (5)
INSERT INTO role_default_permissions (role_id, permission_name) VALUES
    (5, 'analytics:view'), (5, 'products:view'), (5, 'products:create'), (5, 'products:edit'),
    (5, 'products:publish')
ON CONFLICT DO NOTHING;

-- ANALYST (6)
INSERT INTO role_default_permissions (role_id, permission_name) VALUES
    (6, 'analytics:view'), (6, 'products:view'), (6, 'orders:view')
ON CONFLICT DO NOTHING;


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
    COALESCE(r.slug, LOWER(r.name)) AS role,
    r.name AS role_name,
    r.scope AS role_scope,
    r.allow_public_signup AS role_allow_public_signup,
    COALESCE(NULLIF(u.display_name, ''), u.name) AS display_name,
    COALESCE(NULLIF(u.name, ''), u.display_name) AS name,
    u.email,
    u.url,
    u.parent_seller_id,
    u.allowed_permissions,
    u.is_active,
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
    created_by_user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
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
CREATE INDEX IF NOT EXISTS idx_assets_created_by ON assets (created_by_user_id);
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
CREATE INDEX IF NOT EXISTS idx_asset_tiers_asset_id_price ON asset_tiers (asset_id, price);

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

-- Step 19c: Hero Showcase Images System
CREATE TABLE IF NOT EXISTS hero_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL DEFAULT 'Hero Slide',
    subtitle VARCHAR(200),
    detail TEXT,
    category_name VARCHAR(150),
    category_slug VARCHAR(150),
    image_url TEXT NOT NULL,
    storage_key VARCHAR(500),
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_hero_images_title_not_empty CHECK (length(trim(title)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_hero_images_active_order 
    ON hero_images (is_active, sort_order ASC, created_at DESC);

DROP TRIGGER IF EXISTS trg_hero_images_updated_at ON hero_images;
CREATE TRIGGER trg_hero_images_updated_at
BEFORE UPDATE ON hero_images
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

-- Step 19d: Seller Custom Storefronts
CREATE TABLE IF NOT EXISTS seller_storefronts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    url VARCHAR(50) UNIQUE,
    title VARCHAR(150) NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    banner_url TEXT NOT NULL DEFAULT '',
    featured_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
    is_visible BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_seller_storefronts_url ON seller_storefronts (LOWER(url));
CREATE INDEX IF NOT EXISTS idx_seller_storefronts_seller ON seller_storefronts (seller_id);

DROP TRIGGER IF EXISTS trg_seller_storefronts_updated_at ON seller_storefronts;
CREATE TRIGGER trg_seller_storefronts_updated_at
BEFORE UPDATE ON seller_storefronts
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

-- Step 19e: Audit & System Logs System
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    severity VARCHAR(20) NOT NULL DEFAULT 'info' 
        CHECK (severity IN ('debug', 'info', 'warn', 'error', 'critical')),
    category VARCHAR(50) NOT NULL DEFAULT 'system' 
        CHECK (category IN ('auth', 'admin', 'security', 'system', 'error')),
    action VARCHAR(100) NOT NULL,
    source VARCHAR(50) NOT NULL DEFAULT 'api',
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_email citext,
    actor_role VARCHAR(50),
    target_id VARCHAR(100),
    target_type VARCHAR(50),
    outcome VARCHAR(20) NOT NULL DEFAULT 'success' 
        CHECK (outcome IN ('success', 'failure', 'denied', 'error')),
    message TEXT NOT NULL,
    request_id VARCHAR(64),
    ip_address VARCHAR(50),
    user_agent TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    stack_trace TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs (severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON audit_logs (category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_source ON audit_logs (source);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs (actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_email ON audit_logs (actor_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_outcome ON audit_logs (outcome);
CREATE INDEX IF NOT EXISTS idx_audit_logs_request_id ON audit_logs (request_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_filter ON audit_logs (category, severity, created_at DESC);

-- Step 19f: Coupons System
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    discount_percent INT NOT NULL CHECK (discount_percent >= 1 AND discount_percent <= 90),
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    usage_limit INT CHECK (usage_limit IS NULL OR usage_limit > 0),
    usage_count INT NOT NULL DEFAULT 0 CHECK (usage_count >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_coupons_dates CHECK (ends_at > starts_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_coupons_code ON coupons (UPPER(code));
CREATE INDEX IF NOT EXISTS idx_coupons_seller_id ON coupons (seller_id);
CREATE INDEX IF NOT EXISTS idx_coupons_active_dates ON coupons (is_active, starts_at, ends_at);

DROP TRIGGER IF EXISTS trg_coupons_updated_at ON coupons;
CREATE TRIGGER trg_coupons_updated_at
BEFORE UPDATE ON coupons
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

-- Coupon Redemptions Table
CREATE TABLE IF NOT EXISTS coupon_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID,
    discount_amount NUMERIC(10, 2) NOT NULL CHECK (discount_amount >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    original_subtotal NUMERIC(10, 2) NOT NULL CHECK (original_subtotal >= 0),
    discounted_subtotal NUMERIC(10, 2) NOT NULL CHECK (discounted_subtotal >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon_id ON coupon_redemptions (coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_buyer_id ON coupon_redemptions (buyer_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_order_id ON coupon_redemptions (order_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_coupon_redemptions_order_unique ON coupon_redemptions (order_id) WHERE order_id IS NOT NULL;

DROP TRIGGER IF EXISTS trg_coupon_redemptions_updated_at ON coupon_redemptions;
CREATE TRIGGER trg_coupon_redemptions_updated_at
BEFORE UPDATE ON coupon_redemptions
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

-- Step 20: Public Schema Permissions & Role-Adaptive Default Privileges
DO $$
BEGIN
    EXECUTE 'GRANT ALL ON SCHEMA public TO ' || quote_ident(CURRENT_USER);
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ' || quote_ident(CURRENT_USER);
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ' || quote_ident(CURRENT_USER);
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO ' || quote_ident(CURRENT_USER);

    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        EXECUTE 'GRANT USAGE ON SCHEMA public TO anon';
        EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        EXECUTE 'GRANT ALL ON SCHEMA public TO authenticated';
        EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated';
        EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated';
        EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        EXECUTE 'GRANT ALL ON SCHEMA public TO service_role';
        EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role';
        EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role';
        EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role';
    END IF;
END $$;
`;

/**
 * Resolves the backup directory from BACKUP_DIR env variable or defaults to project backups/.
 */
export function getBackupsDir(): string {
  if (process.env.BACKUP_DIR && process.env.BACKUP_DIR.trim().length > 0) {
    return path.resolve(process.env.BACKUP_DIR.trim());
  }
  return path.resolve(__dirname, "../../backups");
}

/**
 * Verifies that a backup file was generated, is non-empty (>= 1KB),
 * and contains CREATE TABLE statements.
 */
export function verifyBackupFile(filePath: string): {
  verified: boolean;
  sizeBytes: number;
  tableCount: number;
  error?: string;
} {
  if (!fs.existsSync(filePath)) {
    return {
      verified: false,
      sizeBytes: 0,
      tableCount: 0,
      error: `Backup file does not exist at '${filePath}'`,
    };
  }

  const stats = fs.statSync(filePath);
  if (stats.size < 1024) {
    return {
      verified: false,
      sizeBytes: stats.size,
      tableCount: 0,
      error: `Backup file size (${stats.size} bytes) is below minimum threshold (1024 bytes)`,
    };
  }

  let content: string;
  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch (err: any) {
    return {
      verified: false,
      sizeBytes: stats.size,
      tableCount: 0,
      error: `Failed to read backup file: ${err.message}`,
    };
  }

  const matches = content.match(/CREATE\s+(?:OR\s+REPLACE\s+)?TABLE/gi) || [];
  if (matches.length === 0) {
    return {
      verified: false,
      sizeBytes: stats.size,
      tableCount: 0,
      error:
        "Backup file contains 0 CREATE TABLE statements. Aborting reset to prevent data loss.",
    };
  }

  return { verified: true, sizeBytes: stats.size, tableCount: matches.length };
}

/**
 * Enforces backup retention policy: keeps the newest `maxToKeep` backups
 * matching `<dbname>_backup_*.sql`. Never removes index 0 (the newest).
 */
export function applyBackupRetention(
  backupsDir: string,
  targetDbName: string,
  maxToKeep: number = 10,
): string[] {
  if (!fs.existsSync(backupsDir)) return [];

  const escapedName = targetDbName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^${escapedName}_backup_.*\\.sql$`);

  try {
    const files = fs
      .readdirSync(backupsDir)
      .filter((file) => pattern.test(file))
      .map((file) => {
        const fullPath = path.join(backupsDir, file);
        const stats = fs.statSync(fullPath);
        return { file, fullPath, mtimeMs: stats.mtimeMs };
      })
      .sort((a, b) => b.mtimeMs - a.mtimeMs);

    const removedFiles: string[] = [];
    if (files.length > maxToKeep) {
      for (let i = maxToKeep; i < files.length; i++) {
        const item = files[i]!;
        try {
          fs.unlinkSync(item.fullPath);
          removedFiles.push(item.file);
          console.log(
            `🧹 Removed old backup due to retention limit (keeping newest ${maxToKeep}): ${item.file}`,
          );
        } catch (unlinkErr: any) {
          console.warn(
            `⚠️  Failed to remove old backup ${item.file}: ${unlinkErr.message}`,
          );
        }
      }
    }
    return removedFiles;
  } catch (err: any) {
    console.warn(`⚠️  Retention policy scan failed: ${err.message}`);
    return [];
  }
}

/**
 * Resolves the location of pg_dump on the host system.
 */
function findPgDumpBinary(): string | null {
  if (process.env.PG_DUMP_PATH && fs.existsSync(process.env.PG_DUMP_PATH)) {
    return process.env.PG_DUMP_PATH;
  }

  // Check system PATH
  try {
    const testCmd =
      process.platform === "win32" ? "where pg_dump" : "which pg_dump";
    const out = child_process
      .execSync(testCmd, {
        stdio: ["pipe", "pipe", "ignore"],
        encoding: "utf8",
      })
      .trim();
    if (out) {
      const firstLine = out.split(/\r?\n/)[0]?.trim();
      if (firstLine && fs.existsSync(firstLine)) return firstLine;
      return "pg_dump";
    }
  } catch {
    // pg_dump not found in PATH
  }

  // Windows standard installation directories
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
 * Resilient Node.js SQL dumper fallback if pg_dump binary is absent.
 * Generates both CREATE TABLE and INSERT statements to ensure verifiable backups.
 */
async function fallbackDatabaseBackup(
  databaseUrl: string,
  backupFilePath: string,
  requiresSsl: boolean,
): Promise<void> {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const dumpClient = new Client({
      connectionString: databaseUrl,
      ssl: requiresSsl ? { rejectUnauthorized: false } : undefined,
      stream: () => createResilientSocket(),
      lookup: resilientDnsLookup,
    } as any);

    // CRITICAL: Prevent unhandled 'error' event on client from crashing Node.js process
    dumpClient.on("error", () => {
      // Handled cleanly by query/connect rejection
    });

    try {
      await dumpClient.connect();

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
        const colsRes = await dumpClient.query(
          `SELECT column_name, data_type, is_nullable, column_default
           FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = $1
           ORDER BY ordinal_position;`,
          [tableName],
        );

        if (colsRes.rows.length > 0) {
          const colDefs = colsRes.rows.map((c: any) => {
            let def = `"${c.column_name}" ${c.data_type}`;
            if (c.column_default) def += ` DEFAULT ${c.column_default}`;
            if (c.is_nullable === "NO") def += " NOT NULL";
            return def;
          });
          lines.push(`\n-- Structure for table: ${tableName}`);
          lines.push(
            `CREATE TABLE IF NOT EXISTS "${tableName}" (\n  ${colDefs.join(",\n  ")}\n);`,
          );
        }

        const dataRes = await dumpClient.query(`SELECT * FROM "${tableName}";`);
        if (dataRes.rows.length > 0) {
          lines.push(`\n-- Data for table: ${tableName}`);
          for (const dataRow of dataRes.rows) {
            const cols = Object.keys(dataRow);
            const vals = cols.map((col) => {
              const val = dataRow[col];
              if (val === null || val === undefined) return "NULL";
              if (typeof val === "number" || typeof val === "boolean")
                return String(val);
              if (typeof val === "object")
                return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
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
      await dumpClient.end().catch(() => {});
      return;
    } catch (err: any) {
      await dumpClient.end().catch(() => {});
      if (attempt < maxAttempts) {
        console.warn(
          `⚠️  Fallback backup attempt ${attempt} failed (${err.message}). Retrying in 2s...`,
        );
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } else {
        throw err;
      }
    }
  }
}

/**
 * Validates database connection port.
 * Refuses live DDL/reset on port 6543 (transaction-pooler mode).
 */
export function validateConnectionPort(
  port: string,
  isLiveTarget: boolean,
): void {
  if (isLiveTarget && port === "6543") {
    throw new Error(
      "🛑 SAFEGUARD BLOCKED: Connection port is 6543 (transaction-pooler mode). Schema reset and DDL operations cannot run through a transaction pooler. Port 5432 session-pooler or a direct connection is required.",
    );
  }
}

/**
 * Extracts Supabase project reference from hostname or username.
 */
export function extractProjectRef(
  host: string,
  username?: string,
): string | null {
  const subMatch = host.match(/^([a-z0-9_-]+)\.supabase\.co$/i);
  if (subMatch && subMatch[1]) {
    return subMatch[1];
  }
  if (username) {
    const userMatch = username.match(/^postgres\.([a-z0-9_-]+)$/i);
    if (userMatch && userMatch[1]) {
      return userMatch[1];
    }
  }
  return null;
}

/**
 * Production authorization safeguard:
 * Requires confirmation code 0000, ALLOW_PRODUCTION_RESET=true, or --allow-production.
 * In interactive mode, prompts the user to enter code '0000'.
 */
export async function verifyProductionAuthorization(options: {
  host: string;
  projectRef?: string | null;
  isInteractive: boolean;
  isDryRun?: boolean;
}): Promise<{ confirmed: boolean; confirmedByCode: boolean }> {
  const confirmCodeFlag = process.argv.find((arg) =>
    arg.startsWith("--confirm-code="),
  );
  const confirmCode = confirmCodeFlag
    ? confirmCodeFlag.split("=")[1]?.trim()
    : process.env.CONFIRM_CODE?.trim();

  const isAuthorized =
    confirmCode === "0000" ||
    process.env.ALLOW_PRODUCTION_RESET === "true" ||
    process.env.ALLOW_LIVE_DB_RESET === "true" ||
    process.argv.includes("--allow-production");

  if (options.isDryRun) {
    if (!isAuthorized) {
      throw new Error(
        "🛑 SAFEGUARD BLOCKED: Resetting the live database requires confirmation code 0000 (--confirm-code=0000) or environment variable ALLOW_PRODUCTION_RESET=true / --allow-production.",
      );
    }
    console.log(
      "🛡️  Live production authorization verified (code 0000 / ALLOW_PRODUCTION_RESET present).",
    );
    return { confirmed: true, confirmedByCode: confirmCode === "0000" };
  }

  // Interactive challenge: prompt user for confirmation code 0000
  if (options.isInteractive) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    try {
      console.log("\n=======================================================");
      console.log(
        "⚠️  WARNING: You are modifying or resetting the LIVE PRODUCTION database!",
      );
      console.log(`📍 Target Host: ${options.host}`);
      if (options.projectRef) {
        console.log(`🆔 Project Ref: ${options.projectRef}`);
      }
      console.log("=======================================================");

      const promptMsg =
        "To confirm live database reset and emptying all cloud buckets, enter confirmation code: ";
      const answer = (await rl.question(promptMsg)).trim();

      const matches =
        answer === "0000" ||
        answer === options.host ||
        Boolean(options.projectRef && answer === options.projectRef);

      if (!matches) {
        console.log(
          "🛡️  Reset of live database cancelled (confirmation code did not match 0000). No changes were made.",
        );
        process.exit(0);
      }
      return { confirmed: true, confirmedByCode: answer === "0000" };
    } finally {
      rl.close();
    }
  } else {
    // Non-interactive / CI execution: fail closed if confirmation flag is missing or invalid
    const confirmFlag = process.argv.find((arg) =>
      arg.startsWith("--confirm-production="),
    );
    const confirmVal = confirmFlag
      ? confirmFlag.split("=")[1]?.trim()
      : process.env.CONFIRM_PRODUCTION?.trim();

    const matches =
      confirmCode === "0000" ||
      confirmVal === "0000" ||
      confirmVal === options.host ||
      Boolean(options.projectRef && confirmVal === options.projectRef);

    if (!isAuthorized && !matches) {
      throw new Error(
        "🛑 SAFEGUARD BLOCKED: Resetting the live database requires confirmation code 0000 (--confirm-code=0000) or environment variable ALLOW_PRODUCTION_RESET=true.",
      );
    }

    if (!matches) {
      throw new Error(
        `🛑 SAFEGUARD BLOCKED: Non-interactive live database reset requires --confirm-code=0000 or --confirm-production=${options.host}. Fail-closed protection activated.`,
      );
    }

    return {
      confirmed: true,
      confirmedByCode: confirmCode === "0000" || confirmVal === "0000",
    };
  }
}

/**
 * Takes an automated pre-drop backup of the target database.
 * Verifies the backup before destructive operations and applies retention.
 */
async function backupDatabase(
  databaseUrl: string,
  targetDbName: string,
  isCloudDb: boolean,
  requiresSsl: boolean,
): Promise<{ backupFilePath: string; tableCount: number; sizeBytes: number }> {
  const backupsDir = getBackupsDir();
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  const backupFileName = `${targetDbName}_backup_${timestamp}.sql`;
  const backupFilePath = path.join(backupsDir, backupFileName);

  console.log(`💾 Starting pre-drop backup of database "${targetDbName}"...`);
  console.log(`📁 Backup Destination: ${backupFilePath}`);

  const pgDumpPath = findPgDumpBinary();
  const parsed = new URL(databaseUrl);
  const host = parsed.hostname || "localhost";
  const port = parsed.port || "5432";
  const username = parsed.username || "postgres";
  const password = decodeURIComponent(parsed.password || "");

  const isSupabasePooler = isCloudDb && (host.includes("pooler.supabase.com") || port === "6543");
  let dumpSucceeded = false;

  if (isSupabasePooler) {
    console.log(
      "ℹ️  Supabase connection pooler detected (poolers do not support pg_dump). Using resilient native table exporter...",
    );
  } else if (pgDumpPath) {
    try {
      const args = [
        "-h",
        host,
        "-p",
        port,
        "-U",
        username,
        "-d",
        targetDbName,
        "-f",
        backupFilePath,
        "--clean",
        "--if-exists",
        "--no-owner",
        "--no-privileges",
        ...(isCloudDb ? ["--schema=public"] : []),
      ];

      const dumpTimeoutMs = isCloudDb ? 60000 : 30000;

      await new Promise<void>((resolve, reject) => {
        let child: child_process.ChildProcess | null = null;
        const timer = setTimeout(() => {
          if (child) {
            try {
              child.kill();
            } catch {}
          }
          reject(
            new Error(
              `pg_dump process timed out after ${dumpTimeoutMs / 1000}s`,
            ),
          );
        }, dumpTimeoutMs);

        child = child_process.spawn(pgDumpPath, args, {
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
          clearTimeout(timer);
          if (code === 0) {
            resolve();
          } else {
            reject(
              new Error(`pg_dump exited with code ${code}: ${stderr.trim()}`),
            );
          }
        });

        child.on("error", (err) => {
          clearTimeout(timer);
          reject(err);
        });
      });

      dumpSucceeded = true;
    } catch (dumpErr: any) {
      console.warn(
        `⚠️  pg_dump encountered an issue (${dumpErr.message}). Falling back to Node.js table exporter...`,
      );
    }
  }

  if (!dumpSucceeded) {
    await fallbackDatabaseBackup(databaseUrl, backupFilePath, requiresSsl);
  }

  // Verification step: verify backup file existence, size, and table statements
  const verification = verifyBackupFile(backupFilePath);
  if (!verification.verified) {
    throw new Error(`Backup verification failed: ${verification.error}`);
  }

  const sizeKb = (verification.sizeBytes / 1024).toFixed(1);
  console.log(
    `✅ Pre-drop backup saved and verified: ${backupFilePath} (${sizeKb} KB, ${verification.tableCount} tables found)`,
  );

  // Apply retention policy only after successful verification
  applyBackupRetention(backupsDir, targetDbName, 10);

  return {
    backupFilePath,
    tableCount: verification.tableCount,
    sizeBytes: verification.sizeBytes,
  };
}

/**
 * Local storage cleanup: empties ONLY the local directory.
 * Never touches cloud buckets.
 */
export async function cleanLocalStorage(
  dryRun: boolean,
  skipStorage: boolean = false,
): Promise<"cleaned" | "skipped" | "not applicable"> {
  if (skipStorage) {
    console.log("🔒 Local storage cleanup skipped via --skip-storage flag.");
    return "skipped";
  }

  const localPath =
    process.env.LOCAL_STORAGE_PATH ||
    (process.platform === "win32"
      ? "C:\\GH\\sell-digital-assets-storage"
      : "./storage");

  if (dryRun) {
    console.log(
      `[DRY-RUN] Local Storage: Would empty directory '${localPath}' [NOT EXECUTED]`,
    );
    return "skipped";
  }

  if (fs.existsSync(localPath)) {
    try {
      const files = fs.readdirSync(localPath);
      for (const file of files) {
        fs.rmSync(path.join(localPath, file), { recursive: true, force: true });
      }
      console.log(
        `🧹 Emptied local storage directory: ${localPath} (${files.length} items removed)`,
      );
      return "cleaned";
    } catch (err: any) {
      console.warn(
        `⚠️  Local storage directory cleanup encountered an error: ${err.message}`,
      );
      return "not applicable";
    }
  }
  return "not applicable";
}

/**
 * Live cloud storage cleanup: empties ONLY cloud buckets after opt-in confirmation.
 * Never touches the local developer storage directory.
 */
export async function cleanCloudStorage(options: {
  dryRun: boolean;
  skipStorage: boolean;
  isInteractive: boolean;
  autoConfirm?: boolean;
}): Promise<"cleaned" | "skipped" | "declined" | "not applicable"> {
  if (options.skipStorage) {
    console.log(
      "🔒 Cloud storage cleanup skipped via --skip-storage flag. Buckets preserved.",
    );
    return "skipped";
  }

  const previewsBucket =
    process.env.AWS_BUCKET_PREVIEWS || "sell-digital-assets-storage-previews";
  const privateBucket =
    process.env.AWS_BUCKET_PRIVATE || "sell-digital-assets-storage-private";
  const buckets = [previewsBucket, privateBucket];

  if (options.dryRun) {
    console.log(
      `[DRY-RUN] Cloud Storage: Would inspect buckets (${buckets.join(", ")}) and request opt-in confirmation [NOT EXECUTED]`,
    );
    return "skipped";
  }

  let s3Client: any = null;
  if (
    process.env.AWS_ENDPOINT &&
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY
  ) {
    try {
      const { S3Client } = await import("@aws-sdk/client-s3");
      s3Client = new S3Client({
        region: process.env.AWS_REGION || "auto",
        endpoint: process.env.AWS_ENDPOINT,
        forcePathStyle: true,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      });
    } catch {
      // S3 client unavailable
    }
  }

  let supabaseClient: any = null;
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      supabaseClient = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { autoRefreshToken: false, persistSession: false } },
      );
    } catch {
      // Supabase client unavailable
    }
  }

  if (!s3Client && !supabaseClient) {
    console.log(
      "ℹ️  No cloud storage credentials configured (Supabase/S3); skipping cloud storage cleanup.",
    );
    return "not applicable";
  }

  // Count objects in buckets
  const bucketCounts = new Map<string, number>();
  for (const bucket of buckets) {
    let count = 0;
    if (s3Client) {
      try {
        const { ListObjectsV2Command } = await import("@aws-sdk/client-s3");
        let token: string | undefined = undefined;
        do {
          const res: any = await s3Client.send(
            new ListObjectsV2Command({
              Bucket: bucket,
              ContinuationToken: token,
            }),
          );
          if (res.Contents) {
            count += res.Contents.length;
          }
          token = res.NextContinuationToken;
        } while (token);
      } catch {
        // Fall back to supabase if S3 list fails
      }
    }
    if (count === 0 && supabaseClient) {
      try {
        const { data } = await supabaseClient.storage
          .from(bucket)
          .list("", { limit: 1000 });
        if (data) {
          count = data.length;
        }
      } catch {
        // ignore
      }
    }
    bucketCounts.set(bucket, count);
  }

  console.log("\n📦 Cloud Storage Buckets Detected:");
  for (const bucket of buckets) {
    console.log(`   - ${bucket}: ${bucketCounts.get(bucket) ?? 0} object(s)`);
  }

  const expectedConfirmPhrase = `${previewsBucket}, ${privateBucket}`;

  if (options.autoConfirm) {
    console.log(
      "🧹 Confirmation code 0000 matched: Emptying cloud storage buckets...",
    );
  } else if (options.isInteractive) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    try {
      console.log(
        "\n⚠️  OPT-IN CONFIRMATION: Emptying cloud storage buckets is destructive.",
      );
      const answer = (
        await rl.question(
          `To confirm emptying buckets, type exact bucket names '${expectedConfirmPhrase}' (or press Enter to skip): `,
        )
      ).trim();

      if (
        answer !== expectedConfirmPhrase &&
        answer !== `${previewsBucket} ${privateBucket}`
      ) {
        console.log(
          "🛡️  Cloud storage cleanup declined by user. Buckets left untouched.",
        );
        return "declined";
      }
    } finally {
      rl.close();
    }
  } else {
    const confirmStorageFlag = process.argv.find((arg) =>
      arg.startsWith("--confirm-storage="),
    );
    const confirmVal = confirmStorageFlag
      ? confirmStorageFlag.split("=")[1]?.trim()
      : process.env.CONFIRM_STORAGE?.trim();

    if (
      confirmVal !== expectedConfirmPhrase &&
      confirmVal !== `${previewsBucket} ${privateBucket}`
    ) {
      console.log(
        "🛡️  Cloud storage cleanup skipped in non-interactive mode (no explicit --confirm-storage). Buckets left untouched.",
      );
      return "declined";
    }
  }

  // Execute deletion
  console.log("🧹  Emptying cloud storage buckets...");
  if (s3Client) {
    const { ListObjectsV2Command, DeleteObjectsCommand } =
      await import("@aws-sdk/client-s3");
    for (const bucket of buckets) {
      let token: string | undefined = undefined;
      do {
        const listRes: any = await s3Client.send(
          new ListObjectsV2Command({
            Bucket: bucket,
            ContinuationToken: token,
          }),
        );
        if (listRes.Contents && listRes.Contents.length > 0) {
          await s3Client.send(
            new DeleteObjectsCommand({
              Bucket: bucket,
              Delete: {
                Objects: listRes.Contents.map((obj: any) => ({
                  Key: obj.Key!,
                })),
                Quiet: true,
              },
            }),
          );
        }
        token = listRes.NextContinuationToken;
      } while (token);
    }
  }

  if (supabaseClient) {
    for (const bucket of buckets) {
      await supabaseClient.storage.emptyBucket(bucket).catch(() => {});
    }
  }

  console.log(`✅ Emptied cloud storage buckets: ${buckets.join(", ")}.`);
  return "cleaned";
}

export interface SeedSummary {
  organizations: number;
  categories: number;
  heroImages: number;
  banners: number;
}

export async function seedOrganization(client: pg.Client): Promise<number> {
  console.log("🌱 Seeding organization configuration from organizations.ts...");
  await client.query(
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
     ON CONFLICT (id) DO UPDATE SET
       organization_name = EXCLUDED.organization_name,
       legal_name = EXCLUDED.legal_name,
       tagline = EXCLUDED.tagline,
       description = EXCLUDED.description,
       support_email = EXCLUDED.support_email,
       default_currency = EXCLUDED.default_currency,
       updated_at = CURRENT_TIMESTAMP;`,
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
  console.log("✅ Seeded 1 organization successfully!");
  return 1;
}

export async function seedCategories(client: pg.Client): Promise<number> {
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

      const result = await client.query(insertCategoriesQuery, values);
      for (const row of result.rows) {
        slugToIdMap.set(row.slug, row.id);
      }
    }
  }
  console.log(
    `✅ Seeded ${slugToIdMap.size} digital asset categories successfully!`,
  );
  return slugToIdMap.size;
}

export async function seedHeroImages(client: pg.Client): Promise<number> {
  console.log("🌱 Seeding hero showcase images from hero-images.ts...");
  let count = 0;
  for (const img of defaultHeroImages) {
    await client.query(
      `INSERT INTO hero_images (
          id,
          title,
          subtitle,
          detail,
          category_name,
          category_slug,
          image_url,
          storage_key,
          sort_order,
          is_active,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          subtitle = EXCLUDED.subtitle,
          detail = EXCLUDED.detail,
          category_name = EXCLUDED.category_name,
          category_slug = EXCLUDED.category_slug,
          image_url = EXCLUDED.image_url,
          storage_key = EXCLUDED.storage_key,
          sort_order = EXCLUDED.sort_order,
          is_active = EXCLUDED.is_active,
          updated_at = CURRENT_TIMESTAMP;`,
      [
        img.id,
        img.title,
        img.subtitle ?? null,
        img.detail ?? null,
        img.categoryName ?? null,
        img.categorySlug ?? null,
        img.imageUrl,
        img.storageKey ?? null,
        img.sortOrder,
        img.isActive,
        img.createdAt,
        img.updatedAt,
      ],
    );
    count++;
  }
  console.log(`✅ Seeded ${count} hero showcase images successfully!`);
  return count;
}

export async function seedBanners(client: pg.Client): Promise<number> {
  console.log("🌱 Seeding promotional banners from banners.ts...");
  let count = 0;
  for (const banner of defaultBanners) {
    await client.query(
      `INSERT INTO banners (
          id,
          title,
          description,
          supporting_text,
          badge_type,
          cta_label,
          cta_url,
          show_cta,
          is_dismissible,
          appearance,
          priority,
          is_active,
          starts_at,
          ends_at,
          timezone,
          created_by,
          created_at,
          updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18
        )
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          supporting_text = EXCLUDED.supporting_text,
          badge_type = EXCLUDED.badge_type,
          cta_label = EXCLUDED.cta_label,
          cta_url = EXCLUDED.cta_url,
          show_cta = EXCLUDED.show_cta,
          is_dismissible = EXCLUDED.is_dismissible,
          appearance = EXCLUDED.appearance,
          priority = EXCLUDED.priority,
          is_active = EXCLUDED.is_active,
          starts_at = EXCLUDED.starts_at,
          ends_at = EXCLUDED.ends_at,
          timezone = EXCLUDED.timezone,
          created_by = EXCLUDED.created_by,
          updated_at = CURRENT_TIMESTAMP;`,
      [
        banner.id,
        banner.title,
        banner.description ?? null,
        banner.supporting_text ?? banner.supportingText ?? null,
        banner.badge_type ?? banner.badgeType ?? "special_offer",
        banner.cta_label ?? banner.ctaLabel ?? null,
        banner.cta_url ?? banner.ctaUrl ?? null,
        banner.show_cta ?? banner.showCta ?? true,
        banner.is_dismissible ?? banner.isDismissible ?? true,
        banner.appearance ?? "primary",
        banner.priority ?? 0,
        banner.is_active ?? banner.isActive ?? false,
        banner.starts_at ?? banner.startsAt ?? null,
        banner.ends_at ?? banner.endsAt ?? null,
        banner.timezone ?? "UTC",
        banner.created_by ?? banner.createdBy ?? null,
        banner.created_at ?? banner.createdAt ?? new Date().toISOString(),
        banner.updated_at ?? banner.updatedAt ?? new Date().toISOString(),
      ],
    );
    count++;
  }
  console.log(`✅ Seeded ${count} promotional banners successfully!`);
  return count;
}

export async function seedAll(client: pg.Client): Promise<SeedSummary> {
  const orgCount = await seedOrganization(client);
  const catCount = await seedCategories(client);
  const heroCount = await seedHeroImages(client);
  const bannerCount = await seedBanners(client);
  return {
    organizations: orgCount,
    categories: catCount,
    heroImages: heroCount,
    banners: bannerCount,
  };
}

export function printSummaryBox(summary: {
  targetDbName: string;
  host: string;
  port: string;
  isCloudDb: boolean;
  mode: "LIVE" | "DRY-RUN";
  backupPath: string | null;
  backupVerified: boolean;
  backupTableCount?: number;
  backupSizeBytes?: number;
  tablesVerified: number;
  seeds: SeedSummary;
  storageStatus: "cleaned" | "skipped" | "declined" | "not applicable";
  result: "SUCCESS" | "DRY-RUN" | "DECLINED" | "FAILED";
}): void {
  console.log("\n=======================================================");
  console.log("                   RESET SUMMARY                       ");
  console.log("=======================================================");
  console.log(
    `  Target Database: ${summary.targetDbName} (${summary.isCloudDb ? "🔴 LIVE / CLOUD DATABASE" : "🟢 LOCAL DATABASE"})`,
  );
  console.log(`  Host:            ${summary.host}:${summary.port}`);
  console.log(
    `  Execution Mode:  ${summary.mode === "DRY-RUN" ? "DRY-RUN (Simulated - No changes made)" : "LIVE EXECUTION"}`,
  );

  if (summary.mode === "DRY-RUN") {
    console.log(
      `  Backup Action:   PLANNED (${summary.backupPath || "skipped"})`,
    );
    console.log(
      `  Schema DDL:      PLANNED (22 tables, functions, triggers, rules)`,
    );
    console.log(`  Tables Verified: SKIPPED (Dry-Run)`);
    console.log(
      `  Rows Seeded:     PLANNED (Organizations: 1, Categories: 296, Hero Images: 15, Banners: 3)`,
    );
  } else {
    const backupDesc = summary.backupPath
      ? `${path.basename(summary.backupPath)} (Verified: ${(Number(summary.backupSizeBytes || 0) / 1024).toFixed(1)} KB, ${summary.backupTableCount || 0} tables)`
      : "None / Skipped";
    console.log(`  Backup:          ${backupDesc}`);
    console.log(`  Schema DDL:      Applied successfully`);
    console.log(
      `  Tables Created:  ${summary.tablesVerified} tables verified in 'public' schema`,
    );
    console.log(
      `  Rows Seeded:     Organizations (${summary.seeds.organizations}), Categories (${summary.seeds.categories}), Hero Images (${summary.seeds.heroImages}), Banners (${summary.seeds.banners})`,
    );
  }
  console.log(`  Storage Status:  ${summary.storageStatus.toUpperCase()}`);
  console.log(`  Result:          ${summary.result}`);
  console.log("=======================================================\n");
}

async function promptTargetDatabase(): Promise<string> {
  const localUrl =
    process.env.LOCAL_DATABASE_URL ||
    (process.env.DATABASE_URL && !isSslRequired(process.env.DATABASE_URL)
      ? process.env.DATABASE_URL
      : undefined) ||
    "postgresql://postgres:P%40ssw0rd@localhost:5432/sell_digital_assets";
  const liveUrl =
    process.env.PROD_DATABASE_URL ||
    (isSslRequired(process.env.DATABASE_URL || "")
      ? process.env.DATABASE_URL
      : undefined);

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
      console.log(
        "  [1] Local Database (localhost:5432/sell_digital_assets) [SAFE]",
      );
      console.log(
        "  [2] Live Database  (Supabase / Cloud) [PRODUCTION - DANGEROUS]",
      );
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
          return liveUrl;
        }
        console.log(
          "⚠️  Invalid option. Please enter '1' for Local or '2' for Live.",
        );
      }
    } finally {
      rl.close();
    }
  }

  // Non-interactive fallback defaults strictly to local database to protect live database
  return localUrl;
}

export async function resetDatabase(): Promise<void> {
  const isDryRun =
    process.argv.includes("--dry-run") || process.env.DRY_RUN === "true";
  const skipStorage =
    process.argv.includes("--skip-storage") ||
    process.env.SKIP_STORAGE === "true";

  const databaseUrl = await promptTargetDatabase();
  if (!databaseUrl) {
    console.error("❌ Error: Target database URL could not be resolved");
    process.exit(1);
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(databaseUrl);
  } catch (err: any) {
    console.error(`❌ Error: Invalid DATABASE_URL format`);
    process.exit(1);
  }

  const targetDbName = parsedUrl.pathname.replace(/^\//, "");
  if (!targetDbName) {
    console.error(
      "❌ Error: Target database name could not be parsed from DATABASE_URL",
    );
    process.exit(1);
  }

  const host = parsedUrl.hostname || "localhost";
  const port = parsedUrl.port || "5432";
  const requiresSsl = isSslRequired(databaseUrl);
  const isCloudDb = requiresSsl || !isLocalDatabaseHost(host);
  const projectRef = extractProjectRef(host, parsedUrl.username);

  console.log("=======================================================");
  console.log(`🎯 Target Database: ${targetDbName}`);
  console.log(
    `📍 Host:            ${host}:${port} (${isCloudDb ? "🔴 LIVE / CLOUD DATABASE" : "🟢 LOCAL DATABASE"})`,
  );
  console.log(
    `🔌 Mode:            ${port === "5432" ? "Session Pooler / Direct (Port 5432)" : `Port ${port}`}`,
  );
  if (isDryRun) {
    console.log(
      "🔎 Execution:       DRY-RUN SIMULATION (No database connections or modifications)",
    );
  }
  console.log("=======================================================");

  // Protect live connections against transaction-pooler port 6543
  try {
    validateConnectionPort(port, isCloudDb);
  } catch (portErr: any) {
    console.error(`\n${portErr.message}\n`);
    process.exit(1);
  }

  // Strengthened production authorization
  let confirmedByCode = false;
  if (isCloudDb) {
    try {
      const authResult = await verifyProductionAuthorization({
        host,
        projectRef,
        isInteractive: process.stdin.isTTY,
        isDryRun,
      });
      confirmedByCode = authResult?.confirmedByCode ?? false;
    } catch (authErr: any) {
      console.error(`\n${authErr.message}\n`);
      process.exit(1);
    }
  }

  // DRY RUN BRANCH
  if (isDryRun) {
    const plannedTimestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, 19);
    const plannedBackup = path.join(
      getBackupsDir(),
      `${targetDbName}_backup_${plannedTimestamp}.sql`,
    );

    console.log("\n[DRY-RUN] Planned Actions (NOT EXECUTED):");
    console.log(
      `  1. [BACKUP]  Would dump '${targetDbName}' to '${plannedBackup}' (using ${isCloudDb ? "pg_dump --schema=public" : "pg_dump"}) [NOT EXECUTED]`,
    );
    console.log(
      `  2. [SCHEMA]  Would ${isCloudDb ? "reset 'public' schema via DROP/CREATE SCHEMA public" : `drop and recreate local database '${targetDbName}'`} [NOT EXECUTED]`,
    );
    console.log(
      "  3. [DDL]     Would execute SCHEMA_SQL (22 tables, citext, pgcrypto, uuid-ossp, timestamp triggers, truncate protections, adaptive grants) [NOT EXECUTED]",
    );
    console.log(
      "  4. [SEED]    Would seed Organizations (1), Categories (296), Hero Images (15), Banners (3) [NOT EXECUTED]",
    );
    if (isCloudDb) {
      console.log(
        "  5. [STORAGE] Would inspect cloud storage buckets and prompt for opt-in confirmation [NOT EXECUTED]",
      );
      console.log(
        "  6. [AUTH]    ⚠️  Notice: Supabase auth.users accounts are not reset and may become orphaned. (--reset-auth-users reserved) [NOT EXECUTED]",
      );
    } else {
      console.log(
        "  5. [STORAGE] Would empty local storage directory [NOT EXECUTED]",
      );
    }

    printSummaryBox({
      targetDbName,
      host,
      port,
      isCloudDb,
      mode: "DRY-RUN",
      backupPath: plannedBackup,
      backupVerified: false,
      tablesVerified: 22,
      seeds: { organizations: 1, categories: 296, heroImages: 15, banners: 3 },
      storageStatus: "skipped",
      result: "DRY-RUN",
    });
    return;
  }

  // REAL EXECUTION (Local or Confirmed Live)
  let currentStep = "Initialization";
  let activeBackupPath: string | null = null;
  let backupMeta = { tableCount: 0, sizeBytes: 0 };
  let targetClient: any = null;

  try {
    // Step 0: Take an automated verified pre-drop backup
    currentStep = "Database Backup";
    const backupRes = await backupDatabase(
      databaseUrl,
      targetDbName,
      isCloudDb,
      requiresSsl,
    );
    activeBackupPath = backupRes.backupFilePath;
    backupMeta = {
      tableCount: backupRes.tableCount,
      sizeBytes: backupRes.sizeBytes,
    };

    if (!isCloudDb) {
      // Local PostgreSQL: connect to maintenance database to terminate connections and drop/create target database
      currentStep = "Local Database Drop and Recreation";
      const maintenanceUrl = new URL(databaseUrl);
      maintenanceUrl.pathname = "/postgres";

      const maintenanceClient = new Client({
        connectionString: maintenanceUrl.toString(),
        stream: () => createResilientSocket(),
        lookup: resilientDnsLookup,
      } as any);
      maintenanceClient.on("error", () => {});

      try {
        await maintenanceClient.connect();

        console.log(
          "🗑️  Terminating active connections and dropping old database...",
        );
        const safeDbName = targetDbName.replace(/"/g, '""');

        // Always terminate active connections before drop
        await maintenanceClient
          .query(
            `SELECT pg_terminate_backend(pid)
           FROM pg_stat_activity
           WHERE datname = $1 AND pid <> pg_backend_pid();`,
            [targetDbName],
          )
          .catch(() => {});

        try {
          await maintenanceClient.query(
            `DROP DATABASE IF EXISTS "${safeDbName}" WITH (FORCE);`,
          );
        } catch {
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
        "☁️  Cloud / Managed Database detected: Performing clean 'public' schema reset...",
      );
    }

    // Connect to the target database and execute the schema DDL in a transaction
    currentStep = "Target Database Connection";
    for (let attempt = 1; attempt <= 3; attempt++) {
      targetClient = new Client({
        connectionString: databaseUrl,
        ssl: requiresSsl ? { rejectUnauthorized: false } : undefined,
        stream: () => createResilientSocket(),
        lookup: resilientDnsLookup,
      } as any);
      targetClient.on("error", () => {});

      try {
        await targetClient.connect();
        break;
      } catch (connErr: any) {
        await targetClient.end().catch(() => {});
        targetClient = null;
        if (attempt < 3) {
          console.warn(
            `⚠️  Database connection attempt ${attempt} failed (${connErr.message}). Retrying in 2s...`,
          );
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
      currentStep = "Cloud Schema Reset";
      await targetClient.query(
        "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO CURRENT_USER;",
      );
    }

    currentStep = "Applying Schema DDL";
    console.log("🔨 Applying schema and tables...");
    console.log("  ↳ Step 1: Extensions (citext, pgcrypto, uuid-ossp)");
    console.log(
      "  ↳ Step 2: Timestamp update & singleton truncate protection functions",
    );
    console.log("  ↳ Step 3: Core persistence tables, views, and indexes");
    console.log(
      "  ↳ Step 4: Role-adaptive schema grants and default privileges",
    );

    await targetClient.query("BEGIN");
    await targetClient.query(SCHEMA_SQL);

    currentStep = "Seeding Initial Data";
    const seedResults = await seedAll(targetClient);

    await targetClient.query("COMMIT");
    console.log(
      "✅ Schema applied successfully (seed data only, no mock data).",
    );

    // Verify resulting table count in 'public' schema
    const tablesCheck = await targetClient.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name;",
    );
    const tableNames: string[] = tablesCheck.rows.map((r: any) => r.table_name);
    console.log(
      `📊 Verified ${tableNames.length} tables in 'public' schema: ${tableNames.join(", ")}`,
    );

    // Storage cleanup phase
    currentStep = "Storage Cleanup";
    let storageStatus: "cleaned" | "skipped" | "declined" | "not applicable";
    if (isCloudDb) {
      console.log(
        "\n⚠️  Notice: Supabase auth.users accounts are not reset and may become orphaned. (--reset-auth-users flag is reserved; deletion from auth schema requires verified requirements and separate review).",
      );
      storageStatus = await cleanCloudStorage({
        dryRun: false,
        skipStorage,
        isInteractive: process.stdin.isTTY,
        autoConfirm: confirmedByCode,
      });
    } else {
      console.log(
        "🔒 Local database reset: Cleaning local storage directory...",
      );
      storageStatus = await cleanLocalStorage(false, skipStorage);
    }

    printSummaryBox({
      targetDbName,
      host,
      port,
      isCloudDb,
      mode: "LIVE",
      backupPath: activeBackupPath,
      backupVerified: true,
      backupTableCount: backupMeta.tableCount,
      backupSizeBytes: backupMeta.sizeBytes,
      tablesVerified: tableNames.length,
      seeds: seedResults,
      storageStatus,
      result: "SUCCESS",
    });

    console.log("🎉 Database reset & schema build complete!");
  } catch (err: any) {
    if (targetClient) {
      await targetClient.query("ROLLBACK").catch(() => {});
    }
    console.error(`\n❌ Error during step [${currentStep}]: ${err.message}`);
    if (activeBackupPath && fs.existsSync(activeBackupPath)) {
      console.log(`💾 Pre-drop Backup Available: ${activeBackupPath}`);
      console.log(
        `🔄 Recovery Hint: psql -h ${host} -p ${port} -U ${parsedUrl.username || "postgres"} -d "${targetDbName}" -f "${activeBackupPath}"`,
      );
    }
    process.exit(1);
  } finally {
    if (targetClient) {
      await targetClient.end().catch(() => {});
    }
  }
}

function isDirectExecution(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  return import.meta.url === pathToFileURL(path.resolve(entry)).href;
}

// Automatically invoke only if executed directly via node or tsx
if (isDirectExecution()) {
  void resetDatabase();
}
