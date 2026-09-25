import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function ensureDatabaseExists(databaseUrl: string): Promise<string> {
  const parsed = new URL(databaseUrl);
  const targetDbName = parsed.pathname.replace(/^\//, "");

  if (!targetDbName) {
    throw new Error("DATABASE_URL does not contain a target database name");
  }

  // Connect to default 'postgres' database to check/create target database
  const maintenanceUrl = new URL(databaseUrl);
  maintenanceUrl.pathname = "/postgres";

  console.log(`🔌 Checking PostgreSQL connection...`);
  const client = new Client({ connectionString: maintenanceUrl.toString() });

  try {
    await client.connect();
  } catch (err: any) {
    console.error(`❌ Could not connect to PostgreSQL server: ${err.message}`);
    console.error(`👉 Please ensure PostgreSQL is running and credentials in .env are correct.`);
    throw err;
  }

  try {
    const res = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [targetDbName]
    );

    if (res.rowCount === 0) {
      console.log(`📦 Database "${targetDbName}" does not exist. Creating it now...`);
      const safeDbName = targetDbName.replace(/"/g, '""');
      await client.query(`CREATE DATABASE "${safeDbName}"`);
      console.log(`✅ Database "${targetDbName}" created successfully!`);
    } else {
      console.log(`ℹ️  Database "${targetDbName}" already exists.`);
    }
  } finally {
    await client.end();
  }

  return targetDbName;
}

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("❌ DATABASE_URL environment variable is missing in .env");
    process.exit(1);
  }

  console.log("=========================================");
  console.log("🚀 Starting Database Setup & Migrations");
  console.log("=========================================\n");

  try {
    // Step 1: Ensure database exists
    const dbName = await ensureDatabaseExists(databaseUrl);

    // Step 2: Connect to the target database
    console.log(`\n🔌 Connecting to database "${dbName}"...`);
    const dbClient = new Client({ connectionString: databaseUrl });
    await dbClient.connect();

    try {
      // Step 3: Ensure migrations tracking table exists
      await dbClient.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) UNIQUE NOT NULL,
          executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Fetch list of already executed migrations
      const executedRes = await dbClient.query<{ name: string }>(
        "SELECT name FROM schema_migrations"
      );
      const executedSet = new Set(executedRes.rows.map((r) => r.name));

      // Step 4: Read migration files
      const migrationsDir = path.join(__dirname, "migrations");
      if (!fs.existsSync(migrationsDir)) {
        console.error(`❌ Migrations directory not found at: ${migrationsDir}`);
        process.exit(1);
      }

      const files = fs
        .readdirSync(migrationsDir)
        .filter((file) => file.endsWith(".sql"))
        .sort();

      if (files.length === 0) {
        console.log("⚠️  No .sql migration files found.");
        return;
      }

      let pendingCount = 0;

      for (const file of files) {
        if (executedSet.has(file)) {
          console.log(`⏭️  Skipping (already applied): ${file}`);
          continue;
        }

        pendingCount++;
        console.log(`\n▶️ Executing migration: ${file}...`);
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, "utf-8");

        // Run each migration inside an atomic transaction
        await dbClient.query("BEGIN");
        try {
          await dbClient.query(sql);
          await dbClient.query(
            "INSERT INTO schema_migrations (name) VALUES ($1)",
            [file]
          );
          await dbClient.query("COMMIT");
          console.log(`✅ ${file} applied and recorded successfully.`);
        } catch (migrationErr) {
          await dbClient.query("ROLLBACK");
          throw migrationErr;
        }
      }

      if (pendingCount === 0) {
        console.log("\n✨ All migrations are up to date. Nothing to run.");
      }

      // Display all active tables (excluding migration metadata)
      const tablesRes = await dbClient.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name != 'schema_migrations'
        ORDER BY table_name;
      `);

      console.log("\n📋 Active application tables:");
      tablesRes.rows.forEach((row) => {
        console.log(`   - ${row.table_name}`);
      });

      console.log("\n🎉 Database setup completed successfully!");
    } finally {
      await dbClient.end();
    }
  } catch (err: any) {
    console.error("\n❌ Migration failed with error:", err.message);
    process.exit(1);
  }
}

runMigrations();
