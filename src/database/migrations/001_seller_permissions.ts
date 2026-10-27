// src/database/migrations/001_seller_permissions.ts
import pg from "pg";
import { env } from "../../config/env.js";

const { Pool } = pg;

export const STORE_PERMISSIONS = [
  {
    name: "analytics:view",
    module: "analytics",
    action: "view",
    description: "View store performance analytics, telemetry, and KPI charts",
  },
  {
    name: "products:view",
    module: "products",
    action: "view",
    description: "Browse and view digital products, assets, and details",
  },
  {
    name: "products:create",
    module: "products",
    action: "create",
    description: "Create draft assets and upload product files and media",
  },
  {
    name: "products:edit",
    module: "products",
    action: "edit",
    description: "Update product details, pricing tiers, and metadata",
  },
  {
    name: "products:delete",
    module: "products",
    action: "delete",
    description: "Archive, soft-delete, or decommission digital assets",
  },
  {
    name: "products:publish",
    module: "products",
    action: "publish",
    description: "Publish assets to the marketplace or change listing status",
  },
  {
    name: "coupons:view",
    module: "coupons",
    action: "view",
    description: "View store discount coupons and promotional campaigns",
  },
  {
    name: "coupons:manage",
    module: "coupons",
    action: "manage",
    description: "Create, edit, toggle status, and delete store discount coupons",
  },
  {
    name: "orders:view",
    module: "orders",
    action: "view",
    description: "View store customer orders, sales history, and transaction records",
  },
  {
    name: "financial:view",
    module: "financial",
    action: "view",
    description: "View store earnings, revenue metrics, and payout history",
  },
  {
    name: "storefront:view",
    module: "storefront",
    action: "view",
    description: "View seller storefront customization and vanity URL",
  },
  {
    name: "storefront:edit",
    module: "storefront",
    action: "edit",
    description: "Edit storefront banner, avatar, branding, and biography",
  },
  {
    name: "team:view",
    module: "team",
    action: "view",
    description: "View store team members and their assigned store roles",
  },
  {
    name: "team:manage",
    module: "team",
    action: "manage",
    description: "Add, update roles, manage permissions, and remove team members",
  },
  {
    name: "settings:view",
    module: "settings",
    action: "view",
    description: "View store preferences and alert settings",
  },
  {
    name: "settings:edit",
    module: "settings",
    action: "edit",
    description: "Update store preferences, notifications, and alert settings",
  },
];

export const ROLE_DEFAULT_PERMISSIONS: Record<number, string[]> = {
  // STORE_MANAGER (4)
  4: [
    "analytics:view",
    "products:view",
    "products:create",
    "products:edit",
    "products:delete",
    "products:publish",
    "coupons:view",
    "coupons:manage",
    "orders:view",
    "financial:view",
    "storefront:view",
    "storefront:edit",
    "team:view",
    "team:manage",
    "settings:view",
    "settings:edit",
  ],
  // CONTENT_UPLOADER (5)
  5: [
    "analytics:view",
    "products:view",
    "products:create",
    "products:edit",
    "products:publish",
  ],
  // ANALYST (6)
  6: [
    "analytics:view",
    "products:view",
    "orders:view",
  ],
};

export async function runMigration(pool?: pg.Pool): Promise<void> {
  const activePool =
    pool ||
    new Pool({
      connectionString: env.DATABASE_URL,
    });

  const client = await activePool.connect();

  try {
    await client.query("BEGIN");

    // 1. Create permissions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        module VARCHAR(50) NOT NULL,
        action VARCHAR(50) NOT NULL,
        description VARCHAR(255) NOT NULL,
        scope VARCHAR(20) NOT NULL DEFAULT 'SELLER_STORE',
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Create role_default_permissions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS role_default_permissions (
        role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        permission_name VARCHAR(100) NOT NULL REFERENCES permissions(name) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (role_id, permission_name)
      );
    `);

    // 3. Create seller_role_permissions table (database-backed, seller-managed role permissions)
    await client.query(`
      CREATE TABLE IF NOT EXISTS seller_role_permissions (
        id SERIAL PRIMARY KEY,
        seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_seller_role_permissions UNIQUE (seller_id, role_id)
      );
    `);

    // Index on seller_id for ultra-fast lookup
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_seller_role_permissions_seller_id 
        ON seller_role_permissions (seller_id);
    `);

    // 4. Upsert permissions catalog
    for (const perm of STORE_PERMISSIONS) {
      await client.query(
        `
        INSERT INTO permissions (name, module, action, description, scope)
        VALUES ($1, $2, $3, $4, 'SELLER_STORE')
        ON CONFLICT (name) DO UPDATE
          SET module = EXCLUDED.module,
              action = EXCLUDED.action,
              description = EXCLUDED.description,
              scope = EXCLUDED.scope;
      `,
        [perm.name, perm.module, perm.action, perm.description],
      );
    }

    // 5. Seed default role permissions
    for (const [roleIdStr, permissions] of Object.entries(ROLE_DEFAULT_PERMISSIONS)) {
      const roleId = Number(roleIdStr);
      for (const permName of permissions) {
        await client.query(
          `
          INSERT INTO role_default_permissions (role_id, permission_name)
          VALUES ($1, $2)
          ON CONFLICT (role_id, permission_name) DO NOTHING;
        `,
          [roleId, permName],
        );
      }
    }

    await client.query("COMMIT");
    console.log(" Migration 001_seller_permissions completed successfully.");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Migration 001_seller_permissions failed:", error);
    throw error;
  } finally {
    client.release();
    if (!pool) {
      await activePool.end();
    }
  }
}

// Allow direct CLI execution
if (process.argv[1]?.endsWith("001_seller_permissions.ts")) {
  runMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

