import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Client } = pg;

async function resetDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("❌ DATABASE_URL environment variable is missing in .env");
    process.exit(1);
  }

  const parsed = new URL(databaseUrl);
  const targetDbName = parsed.pathname.replace(/^\//, "");

  if (!targetDbName) {
    console.error("❌ Target database name could not be parsed from DATABASE_URL");
    process.exit(1);
  }

  // Connect to default 'postgres' maintenance database
  const maintenanceUrl = new URL(databaseUrl);
  maintenanceUrl.pathname = "/postgres";

  console.log("=========================================");
  console.log(`⚠️  RESETTING DATABASE: "${targetDbName}"`);
  console.log("=========================================\n");

  const client = new Client({ connectionString: maintenanceUrl.toString() });

  try {
    await client.connect();

    const safeDbName = targetDbName.replace(/"/g, '""');

    // Terminate any active connections and drop the database
    console.log(`🗑️  Dropping database "${targetDbName}"...`);
    try {
      // WITH (FORCE) closes any active client sessions before dropping
      await client.query(`DROP DATABASE IF EXISTS "${safeDbName}" WITH (FORCE)`);
    } catch {
      // Fallback for older PostgreSQL versions that don't support WITH (FORCE)
      await client.query(`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = $1 AND pid <> pg_backend_pid();
      `, [targetDbName]);
      await client.query(`DROP DATABASE IF EXISTS "${safeDbName}"`);
    }
    console.log(`✅ Database "${targetDbName}" dropped.`);

    // Create a brand new, empty database
    console.log(`📦 Creating fresh database "${targetDbName}"...`);
    await client.query(`CREATE DATABASE "${safeDbName}"`);
    console.log(`✅ Brand new database "${targetDbName}" created successfully!`);

    console.log("\n🎉 Database reset complete. Fresh empty database is ready!");
  } catch (err: any) {
    console.error(`❌ Failed to reset database: ${err.message}`);
    process.exit(1);
  } finally {
    await client.end();
  }
}

resetDatabase();
