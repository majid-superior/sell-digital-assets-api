import dns from "node:dns";
import net from "node:net";
import pg from "pg";
import { env, isLocalDatabaseUrl } from "./env.js";
import { logger } from "../core/logger/index.js";

// Prioritize IPv4 DNS lookups to avoid EAI_AGAIN timeouts on Windows/Node.js
if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

const { Pool } = pg;

export function maskDatabaseUrl(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    if (parsed.password) {
      parsed.password = "******";
    }
    return parsed.toString();
  } catch {
    return urlStr.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:******@");
  }
}

export function isSslRequired(databaseUrl: string): boolean {
  if (isLocalDatabaseUrl(databaseUrl)) {
    return false;
  }
  return (
    process.env.DATABASE_SSL === "true" ||
    databaseUrl.includes("sslmode=require") ||
    databaseUrl.includes("render.com") ||
    databaseUrl.includes("amazonaws.com") ||
    databaseUrl.includes("supabase.co") ||
    databaseUrl.includes("supabase.com") ||
    databaseUrl.includes("neon.tech")
  );
}

const requiresSsl = isSslRequired(env.DATABASE_URL);

const publicResolver = new dns.Resolver();
publicResolver.setServers(["8.8.8.8", "1.1.1.1"]);

export const resilientDnsLookup = (
  hostname: string,
  options: any,
  callback?: (err: NodeJS.ErrnoException | null, address?: any, family?: number) => void,
): void => {
  let cb = callback;
  let opts = options;
  if (typeof options === "function") {
    cb = options;
    opts = {};
  }
  if (!cb) return;

  if (
    !hostname ||
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)
  ) {
    return dns.lookup(hostname, opts, cb);
  }

  dns.lookup(hostname, opts, (err, ...res) => {
    if (err && (err.code === "EAI_AGAIN" || err.code === "ENOTFOUND" || err.code === "ETIMEDOUT")) {
      publicResolver.resolve4(hostname, (resErr, addresses) => {
        if (!resErr && addresses && addresses.length > 0) {
          if (opts && opts.all) {
            return cb!(null, addresses.map((addr) => ({ address: addr, family: 4 })));
          }
          return cb!(null, addresses[0], 4);
        }
        return cb!(err, ...res);
      });
    } else {
      cb!(err, ...res);
    }
  });
};

/**
 * Creates a net.Socket that explicitly passes resilientDnsLookup to .connect().
 * This guarantees pg.Client and pg.Pool bypass Windows local DNS EAI_AGAIN issues.
 */
export function createResilientSocket(): net.Socket {
  const socket = new net.Socket();
  const origConnect = socket.connect.bind(socket);
  socket.connect = function (optionsOrPort: any, ...rest: any[]): net.Socket {
    if (typeof optionsOrPort === "number") {
      const port = optionsOrPort;
      const host = rest[0];
      const cb = typeof rest[1] === "function" ? rest[1] : undefined;
      return origConnect({ port, host, lookup: resilientDnsLookup }, cb);
    }
    if (typeof optionsOrPort === "object" && optionsOrPort !== null) {
      return origConnect({ ...optionsOrPort, lookup: optionsOrPort.lookup || resilientDnsLookup }, rest[0]);
    }
    return origConnect(optionsOrPort, ...rest);
  };
  return socket;
}

let isDnsHooked = false;
export function installResilientDns(): void {
  if (isDnsHooked) return;
  isDnsHooked = true;

  if (typeof dns.setDefaultResultOrder === "function") {
    dns.setDefaultResultOrder("ipv4first");
  }

  const origLookup = dns.lookup;
  dns.lookup = function (
    hostname: string,
    options: any,
    callback?: any,
  ): any {
    let cb = callback;
    let opts = options;
    if (typeof options === "function") {
      cb = options;
      opts = {};
    }

    if (
      !hostname ||
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)
    ) {
      return origLookup(hostname, opts, cb);
    }

    return origLookup(hostname, opts, (err: NodeJS.ErrnoException | null, ...res: any[]) => {
      if (err && (err.code === "EAI_AGAIN" || err.code === "ENOTFOUND" || err.code === "ETIMEDOUT")) {
        publicResolver.resolve4(hostname, (resErr, addresses) => {
          if (!resErr && addresses && addresses.length > 0) {
            if (opts && opts.all) {
              return cb(null, addresses.map((addr) => ({ address: addr, family: 4 })));
            }
            return cb(null, addresses[0], 4);
          }
          return cb(err, ...res);
        });
      } else {
        cb(err, ...res);
      }
    });
  } as any;
}

installResilientDns();

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: requiresSsl ? { rejectUnauthorized: false } : undefined,
  stream: () => createResilientSocket(),
  lookup: resilientDnsLookup,
  max: 20, // Max concurrent clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
} as any);

pool.on("error", (err: Error) => {
  logger.error({ err }, "Unexpected error on idle PostgreSQL client");
});

export interface DatabaseHealth {
  connected: boolean;
  isLocal: boolean;
  targetType: "local" | "live";
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
  const isLocal = isLocalDatabaseUrl(env.DATABASE_URL);
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
        isLocal,
        targetType: isLocal ? "local" : "live",
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
    const rawErr = (err as Error).message || "";
    let safeError = "Database service is currently unreachable.";
    if (/ECONNREFUSED/i.test(rawErr)) {
      safeError = "Database connection was refused. Please verify that PostgreSQL is running locally on port 5432.";
    } else if (/password authentication failed/i.test(rawErr)) {
      safeError = "Database authentication failed. Please verify PostgreSQL credentials in configuration.";
    } else if (/does not exist/i.test(rawErr)) {
      safeError = "Database does not exist. Please initialize the database schema.";
    } else if (/ETIMEDOUT|timeout/i.test(rawErr)) {
      safeError = "Database connection timed out. Please check network connectivity and database load.";
    } else if (/getaddrinfo|EAI_AGAIN|ENOTFOUND/i.test(rawErr)) {
      safeError = "Database host address could not be resolved.";
    }

    logger.error(
      {
        errName: (err as Error).name,
        errMessage: rawErr,
        databaseUrl: maskDatabaseUrl(env.DATABASE_URL),
      },
      "Database health check failed",
    );

    return {
      connected: false,
      isLocal,
      targetType: isLocal ? "local" : "live",
      latencyMs,
      error: safeError,
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

