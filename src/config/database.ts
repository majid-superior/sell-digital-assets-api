import dns from "node:dns";
import pg from "pg";
import { env } from "./env.js";
import { logger } from "../core/logger/index.js";

// Prioritize IPv4 DNS lookups to avoid EAI_AGAIN timeouts on Windows/Node.js
if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

const { Pool } = pg;

const requiresSsl =
  process.env.DATABASE_SSL === "true" ||
  env.DATABASE_URL.includes("sslmode=require") ||
  env.DATABASE_URL.includes("render.com") ||
  env.DATABASE_URL.includes("amazonaws.com") ||
  env.DATABASE_URL.includes("supabase.co") ||
  env.DATABASE_URL.includes("neon.tech");

const publicResolver = new dns.Resolver();
publicResolver.setServers(["8.8.8.8", "1.1.1.1"]);

export const resilientDnsLookup = (
  hostname: string,
  options: any,
  callback: (err: NodeJS.ErrnoException | null, address?: string, family?: number) => void,
): void => {
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)
  ) {
    return dns.lookup(hostname, options, callback as any);
  }

  dns.lookup(hostname, options, (err, address, family) => {
    if (err) {
      publicResolver.resolve4(hostname, (resErr, addresses) => {
        if (resErr || !addresses || addresses.length === 0) {
          return callback(err);
        }
        return callback(null, addresses[0], 4);
      });
    } else {
      callback(null, address, family);
    }
  });
};

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: requiresSsl ? { rejectUnauthorized: false } : undefined,
  lookup: resilientDnsLookup,
  max: 20, // Max concurrent clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
} as any);

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

