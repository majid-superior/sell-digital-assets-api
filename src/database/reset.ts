import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import dotenv from "dotenv";
import { defaultCompanyEntity } from "../data/company.js";

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
 * Defaults for the company table are dynamically bound to company.ts.
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

-- Step 3: Company Table (Defaults dynamically sourced from company.ts)
CREATE TABLE IF NOT EXISTS company (
    id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    company_name VARCHAR(150) NOT NULL,
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
    default_currency VARCHAR(3) NOT NULL DEFAULT '${defaultCompanyEntity.default_currency || "USD"}',
    platform_fee_percent NUMERIC(5, 2) NOT NULL DEFAULT ${defaultCompanyEntity.platform_fee_percent ?? 5.0} 
        CHECK (platform_fee_percent >= 0.00 AND platform_fee_percent <= 100.00),
    payout_minimum NUMERIC(10, 2) NOT NULL DEFAULT ${defaultCompanyEntity.payout_minimum ?? 50.0}
        CHECK (payout_minimum >= 0.00),
    social_links JSONB NOT NULL DEFAULT '{}'::jsonb,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
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

-- Step 4: Roles Table
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

-- Step 5: Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id SMALLINT NOT NULL DEFAULT 1,
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

-- Step 6: Unified Query View
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
`;

export async function resetDatabase(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("❌ Error: DATABASE_URL environment variable is missing");
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

  console.log(`⚠️  Resetting database: ${targetDbName}`);

  // Step 1: Connect to maintenance database to drop and recreate the target database
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
      await maintenanceClient.query(`DROP DATABASE IF EXISTS "${safeDbName}";`);
    }

    console.log("📦 Creating fresh database...");
    await maintenanceClient.query(`CREATE DATABASE "${safeDbName}";`);
  } catch (err: any) {
    console.error(`❌ Error: ${err.message}`);
    process.exit(1);
  } finally {
    await maintenanceClient.end().catch(() => {});
  }

  // Step 2: Connect to the freshly created target database and execute the schema DDL in a transaction
  const targetClient = new Client({ connectionString: databaseUrl });

  try {
    await targetClient.connect();

    console.log("🔨 Applying schema and tables...");
    await targetClient.query("BEGIN");
    try {
      await targetClient.query(SCHEMA_SQL);

      // Dynamically insert company initial seed from company.ts with parameterized query
      await targetClient.query(
        `INSERT INTO company (
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
           $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
           $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
           $21, $22, $23
         )
         ON CONFLICT (id) DO NOTHING;`,
        [
          defaultCompanyEntity.id ?? 1,
          defaultCompanyEntity.company_name,
          defaultCompanyEntity.legal_name,
          defaultCompanyEntity.tagline || null,
          defaultCompanyEntity.description || null,
          defaultCompanyEntity.logo_url || null,
          defaultCompanyEntity.logo_dark_url || null,
          defaultCompanyEntity.favicon_url || null,
          defaultCompanyEntity.cover_banner_url || null,
          defaultCompanyEntity.support_email,
          defaultCompanyEntity.contact_email || null,
          defaultCompanyEntity.support_phone || null,
          defaultCompanyEntity.support_url || null,
          defaultCompanyEntity.address_line1 || null,
          defaultCompanyEntity.city || null,
          defaultCompanyEntity.state || null,
          defaultCompanyEntity.postal_code || null,
          defaultCompanyEntity.country || null,
          defaultCompanyEntity.default_currency || "USD",
          defaultCompanyEntity.platform_fee_percent ?? 5.0,
          defaultCompanyEntity.payout_minimum ?? 50.0,
          JSON.stringify(defaultCompanyEntity.social_links ?? {}),
          JSON.stringify(defaultCompanyEntity.metadata ?? {}),
        ],
      );

      await targetClient.query("COMMIT");
      console.log("✅ Schema applied successfully!");
    } catch (schemaErr: any) {
      await targetClient.query("ROLLBACK").catch(() => {});
      throw schemaErr;
    }
  } catch (err: any) {
    console.error(`❌ Error: ${err.message}`);
    process.exit(1);
  } finally {
    await targetClient.end().catch(() => {});
  }

  console.log("🎉 Database reset & schema build complete!");
}

// Automatically invoke if executed directly via node or tsx
resetDatabase();
