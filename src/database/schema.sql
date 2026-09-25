-- ========================================================
-- Auto-generated Schema Snapshot from Live PostgreSQL Database
-- Generated on: 2026-09-20T18:35:20.089Z
-- ========================================================

CREATE TABLE IF NOT EXISTS company (
    id INT2 PRIMARY KEY DEFAULT 1,
    company_name VARCHAR NOT NULL,
    legal_name VARCHAR NOT NULL,
    tagline VARCHAR,
    description TEXT,
    logo_url TEXT,
    logo_dark_url TEXT,
    favicon_url TEXT,
    cover_banner_url TEXT,
    support_email CITEXT NOT NULL,
    contact_email CITEXT,
    support_phone VARCHAR,
    support_url TEXT,
    address_line1 VARCHAR,
    address_line2 VARCHAR,
    city VARCHAR,
    state VARCHAR,
    postal_code VARCHAR,
    country VARCHAR,
    tax_id VARCHAR,
    default_currency VARCHAR DEFAULT 'USD'::character varying NOT NULL,
    platform_fee_percent NUMERIC DEFAULT 5.00 NOT NULL,
    payout_minimum NUMERIC DEFAULT 50.00 NOT NULL,
    social_links JSONB DEFAULT '{}'::jsonb NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS roles (
    id INT2 PRIMARY KEY DEFAULT nextval('roles_id_seq'::regclass),
    slug VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    description VARCHAR,
    is_system BOOL DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id INT2 DEFAULT 1 NOT NULL,
    name VARCHAR NOT NULL,
    email CITEXT NOT NULL,
    password_hash VARCHAR,
    auth_provider VARCHAR DEFAULT 'local'::character varying NOT NULL,
    status VARCHAR DEFAULT 'active'::character varying NOT NULL,
    email_verified_at TIMESTAMPTZ,
    failed_login_attempts INT4 DEFAULT 0 NOT NULL,
    locked_until TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ
);

