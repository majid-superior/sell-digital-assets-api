// src/database/migrations/002_update_roles.ts
import pg from "pg";
import { env } from "../../config/env.js";

const { Pool } = pg;

export async function runMigration(pool?: pg.Pool): Promise<void> {
  const activePool =
    pool ||
    new Pool({
      connectionString: env.DATABASE_URL,
    });

  const client = await activePool.connect();

  try {
    await client.query("BEGIN");

    // Update Role 4 from STORE_MANAGER to MANAGER
    await client.query(`
      UPDATE roles 
      SET name = 'MANAGER', 
          slug = 'manager', 
          description = 'Store manager with permissions to manage products, sales, and settings' 
      WHERE id = 4;
    `);

    // Update Role 5 from CONTENT_UPLOADER to USER
    await client.query(`
      UPDATE roles 
      SET name = 'USER', 
          slug = 'user', 
          description = 'Team member with permissions to draft and upload assets' 
      WHERE id = 5;
    `);

    await client.query("COMMIT");
    console.log(" Migration 002_update_roles completed successfully.");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Migration 002_update_roles failed:", error);
    throw error;
  } finally {
    client.release();
    if (!pool) {
      await activePool.end();
    }
  }
}

// Allow direct CLI execution
if (process.argv[1]?.endsWith("002_update_roles.ts")) {
  runMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

