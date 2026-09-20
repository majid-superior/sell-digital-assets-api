import { env } from "../config/env.js";
import { getDatabaseHealth, type DatabaseHealth } from "../config/database.js";

export interface ServerHealth {
  status: "online";
  uptimeSeconds: number;
  uptimeFormatted: string;
  nodeVersion: string;
  environment: string;
  port: number;
  pid: number;
  memoryUsageMb: {
    heapUsed: string;
    heapTotal: string;
    rss: string;
  };
  timestamp: string;
}

export interface SystemStatus {
  overallStatus: "operational" | "degraded";
  server: ServerHealth;
  database: DatabaseHealth;
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);

  return parts.join(" ");
}

let cachedStatus: { data: SystemStatus; timestamp: number } | null = null;
const CACHE_TTL_MS = 5000;

export async function getSystemStatus(forceRefresh = false): Promise<SystemStatus> {
  const now = Date.now();
  if (!forceRefresh && cachedStatus && now - cachedStatus.timestamp < CACHE_TTL_MS) {
    return cachedStatus.data;
  }

  const uptimeSeconds = Math.floor(process.uptime());
  const mem = process.memoryUsage();

  const server: ServerHealth = {
    status: "online",
    uptimeSeconds,
    uptimeFormatted: formatUptime(uptimeSeconds),
    nodeVersion: process.version,
    environment: env.NODE_ENV,
    port: env.PORT,
    pid: process.pid,
    memoryUsageMb: {
      heapUsed: (mem.heapUsed / 1024 / 1024).toFixed(1),
      heapTotal: (mem.heapTotal / 1024 / 1024).toFixed(1),
      rss: (mem.rss / 1024 / 1024).toFixed(1),
    },
    timestamp: new Date().toISOString(),
  };

  const database = await getDatabaseHealth();

  const status: SystemStatus = {
    overallStatus: database.connected ? "operational" : "degraded",
    server,
    database,
  };

  cachedStatus = { data: status, timestamp: now };
  return status;
}
