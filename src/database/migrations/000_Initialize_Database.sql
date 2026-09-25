-- ========================================================
-- Migration: 000_Initialize_Database
-- Description: Core extensions, global triggers, company profile, RBAC, and users
-- Order: Extensions & Triggers -> Company -> Roles -> Users -> View
-- Target Architecture: Multi-user marketplace with standalone Admin app (sell-digital-assets-admin)
-- ========================================================

-- Step 1: Extensions
CREATE EXTENSION IF NOT EXISTS "citext";     -- Case-insensitive text for emails, usernames, and domains
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- Cryptographic functions & UUID generator

-- Step 2: Shared Auto-Update Timestamp Function (Secured against search-path injection)
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


-- ========================================================
-- 1. Company Table (First - Completely Decoupled & Standalone)
-- ========================================================
-- Dedicated for the 'sell-digital-assets-admin' app and public storefront.
-- Stores company details, branding, legal info, and marketplace settings.
-- Has NO foreign key dependencies on the users table.
CREATE TABLE IF NOT EXISTS company (
    -- Singleton constraint: forces the table to hold exactly one record (id = 1)
    id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    
    -- Brand & Profile
    company_name VARCHAR(150) NOT NULL,
    legal_name VARCHAR(150) NOT NULL,
    tagline VARCHAR(255),
    description TEXT,
    
    -- Visual Identity (TEXT type supports long signed cloud S3/R2/GCS URLs and CDN tokens)
    logo_url TEXT,
    logo_dark_url TEXT,
    favicon_url TEXT,
    cover_banner_url TEXT,
    
    -- Official Contact & Support
    support_email citext NOT NULL,
    contact_email citext,
    support_phone VARCHAR(50),
    support_url TEXT,
    
    -- Legal & Physical Address (for invoices, receipts, and VAT compliance)
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    tax_id VARCHAR(50), -- e.g. VAT, GST, or EIN for receipts
    
    -- Marketplace Global Business Parameters
    default_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    platform_fee_percent NUMERIC(5, 2) NOT NULL DEFAULT 5.00 
        CHECK (platform_fee_percent >= 0.00 AND platform_fee_percent <= 100.00),
    payout_minimum NUMERIC(10, 2) NOT NULL DEFAULT 50.00
        CHECK (payout_minimum >= 0.00),
    
    -- Social Links & Extensible Metadata
    social_links JSONB NOT NULL DEFAULT '{}'::jsonb,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Singleton Protection: Disallow accidental DELETE on the company row
CREATE OR REPLACE RULE no_delete_company AS
ON DELETE TO company DO INSTEAD NOTHING;

-- Singleton Protection: Disallow TRUNCATE on the company table
DROP TRIGGER IF EXISTS trg_prevent_truncate_company ON company;
CREATE TRIGGER trg_prevent_truncate_company
BEFORE TRUNCATE ON company
FOR EACH STATEMENT
EXECUTE FUNCTION prevent_table_truncate();

-- Trigger: company updated_at
DROP TRIGGER IF EXISTS trg_company_updated_at ON company;
CREATE TRIGGER trg_company_updated_at
BEFORE UPDATE ON company
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

-- Seed Default Company Record
INSERT INTO company (
    id,
    company_name,
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
    1,
    'Sell Digital Assets',
    'Sell Digital Assets Inc.',
    'System Status & Observability Dashboard',
    'Enterprise-grade digital assets marketplace and license distribution REST API platform.',
    '/logo.png',
    '/logo-dark.png',
    '/favicon.ico',
    '/banner.png',
    'support@selldigitalassets.com',
    'contact@selldigitalassets.com',
    '+1 (555) 234-5678',
    'https://selldigitalassets.com/support',
    '100 Market Street, Suite 400',
    'San Francisco',
    'CA',
    '94105',
    'United States',
    'USD',
    10.00,
    50.00,
    '{
        "twitter": "https://twitter.com/selldigitalassets",
        "github": "https://github.com/majid-superior/sell-digital-assets-api"
    }'::jsonb,
    '{
        "links": {
            "website": "https://selldigitalassets.com",
            "docs": "/api/docs",
            "status": "/"
        },
        "copyright": {
            "holder": "Sell Digital Assets Inc.",
            "text": "Sell Digital Assets • Digital Assets Marketplace"
        }
    }'::jsonb
)
ON CONFLICT (id) DO NOTHING;


-- ========================================================
-- 2. Roles Table (Second - Deterministic RBAC Base)
-- ========================================================
CREATE TABLE IF NOT EXISTS roles (
    id SMALLSERIAL PRIMARY KEY,
    slug VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    is_system BOOLEAN NOT NULL DEFAULT TRUE, -- Protected system roles cannot be deleted
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed System Roles with EXPLICIT IDs (Eliminates sequence desynchronization & privilege escalation)
INSERT INTO roles (id, slug, name, description, is_system) VALUES
    (1, 'customer', 'Customer', 'Standard user capable of purchasing and downloading digital assets', TRUE),
    (2, 'seller',   'Creator / Seller', 'Merchant account capable of listing, selling, and managing digital products', TRUE),
    (3, 'admin',    'Administrator', 'Super administrator with unrestricted platform & system management access', TRUE)
ON CONFLICT (id) DO UPDATE 
    SET slug = EXCLUDED.slug,
        name = EXCLUDED.name,
        description = EXCLUDED.description;

-- Synchronize sequence with the highest manual ID so future additions never collide
SELECT setval(pg_get_serial_sequence('roles', 'id'), COALESCE((SELECT MAX(id) FROM roles), 1));


-- ========================================================
-- 3. Users Table (Third - Core Identity, Security & Moderation)
-- ========================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id SMALLINT NOT NULL DEFAULT 1,
    name VARCHAR(100) NOT NULL,
    email citext NOT NULL,
    password_hash VARCHAR(255),
    auth_provider VARCHAR(50) NOT NULL DEFAULT 'local', -- 'local', 'google', 'github', etc.
    
    -- Account Lifecycle & Security Moderation
    status VARCHAR(20) NOT NULL DEFAULT 'active' 
        CHECK (status IN ('active', 'pending', 'suspended', 'banned')),
    email_verified_at TIMESTAMPTZ,
    failed_login_attempts INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    
    -- Audit & Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ, -- Soft delete support (GDPR compliant & preserves transaction integrity)

    -- Relational Integrity
    CONSTRAINT fk_users_role 
        FOREIGN KEY (role_id) 
        REFERENCES roles(id) 
        ON UPDATE CASCADE 
        ON DELETE RESTRICT,

    -- Data Sanity Checks
    CONSTRAINT chk_users_name_not_empty 
        CHECK (length(trim(name)) > 0),
    CONSTRAINT chk_users_password_if_local 
        CHECK (auth_provider != 'local' OR password_hash IS NOT NULL)
);

-- Partial unique index: Guarantees email uniqueness strictly among ACTIVE accounts.
-- Permits users who delete their account to re-register with the same email in the future.
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_active_email 
    ON users (email) 
    WHERE deleted_at IS NULL;

-- Index on role foreign key (Postgres does not auto-index foreign keys)
CREATE INDEX IF NOT EXISTS idx_users_role_id 
    ON users (role_id);

-- Filtered index for active users lookup (speeds up login, auth, and search queries)
CREATE INDEX IF NOT EXISTS idx_users_status 
    ON users (status) 
    WHERE deleted_at IS NULL;

-- Trigger: users updated_at
DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_timestamp_column();

-- Seed Default Platform Super Administrator into users table
-- (Dedicated account for login into sell-digital-assets-admin)
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
    3, -- Administrator role (id = 3)
    'System Admin',
    'admin@selldigitalassets.com',
    -- Default bootstrap password hash ($2a$12$e8xL4k0N5qU7gYw9u5yZMea.KkL1M8vL9GZq4H7XhQ1dJ3R3P4iTe)
    '$2a$12$e8xL4k0N5qU7gYw9u5yZMea.KkL1M8vL9GZq4H7XhQ1dJ3R3P4iTe',
    'local',
    'active',
    CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO NOTHING;


-- ========================================================
-- 4. Unified Query View: view_users
-- ========================================================
-- Bridges database normalization and application ease:
-- Exposes both numeric role_id and readable role slug ('customer', 'seller', 'admin')
-- so queries avoid repetitive manual JOINs and eliminate application column collisions.
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
