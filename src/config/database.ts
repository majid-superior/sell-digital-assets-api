import pg from "pg";
import { env } from "./env.js";
import { logger } from "../core/logger/index.js";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20, // Max concurrent clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err: Error) => {
  logger.error({ err }, "Unexpected error on idle PostgreSQL client");
});

export interface DatabaseHealth {
  connected: boolean;
  latencyMs?: number;
  database?: string;
  version?: string;
  error?: string;
  pool: {
    total: number;
    idle: number;
    waiting: number;
  };
}

export async function getDatabaseHealth(): Promise<DatabaseHealth> {
  const poolStats = {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount,
  };

  const start = performance.now();
  try {
    const client = await pool.connect();
    try {
      const res = await client.query("SELECT current_database() AS db_name, version() AS version");
      const latencyMs = Math.round(performance.now() - start);
      const row = res.rows[0];
      return {
        connected: true,
        latencyMs,
        database: row?.db_name || "sell_digital_assets",
        version: row?.version ? row.version.split(",")[0] : "PostgreSQL",
        pool: poolStats,
      };
    } finally {
      client.release();
    }
  } catch (err) {
    const latencyMs = Math.round(performance.now() - start);
    return {
      connected: false,
      latencyMs,
      error: (err as Error).message,
      pool: poolStats,
    };
  }
}

export async function checkDatabaseConnection(): Promise<boolean> {
  const health = await getDatabaseHealth();
  if (!health.connected) {
    logger.warn({ err: health.error }, "Database connection check failed (is PostgreSQL running?)");
    return false;
  }
  return true;
}

