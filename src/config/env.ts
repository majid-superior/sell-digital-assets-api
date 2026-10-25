import dotenv from "dotenv";

dotenv.config();

export interface EnvConfig {
  PORT: number;
  NODE_ENV: "development" | "production" | "test";
  DATABASE_URL: string;
  LOCAL_DATABASE_URL?: string | undefined;
  PROD_DATABASE_URL?: string | undefined;
  CLIENT_URL: string;
  SERVER_URL?: string | undefined;
  ALLOWED_ORIGINS: string[];
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  DOWNLOAD_TOKEN_SECRET: string;
  BODY_LIMIT: string;
  EXPOSE_STACK: boolean;
  REDIS_URL?: string | undefined;
  AWS_REGION: string;
  AWS_BUCKET_PRIVATE?: string | undefined;
  AWS_BUCKET_PREVIEWS?: string | undefined;
  AWS_ACCESS_KEY_ID?: string | undefined;
  AWS_SECRET_ACCESS_KEY?: string | undefined;
  AWS_ENDPOINT?: string | undefined;
  STORAGE_DRIVER: "local" | "r2" | "s3" | "supabase";
  LOCAL_STORAGE_PATH: string;
  SUPABASE_URL?: string | undefined;
  SUPABASE_SERVICE_ROLE_KEY?: string | undefined;
  SUPABASE_ANON_KEY?: string | undefined;
}

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === "") {
    throw new Error(
      `CRITICAL CONFIGURATION ERROR: Environment variable '${key}' is required. No fallback value is permitted.`,
    );
  }
  return value.trim();
}

function getRequiredSecret(key: string, minLength: number = 32): string {
  const value = getRequiredEnv(key);
  if (value.length < minLength) {
    throw new Error(
      `CRITICAL SECURITY ERROR: Environment variable '${key}' must be at least ${minLength} characters long!`,
    );
  }
  return value;
}

export function isLocalDatabaseHost(host: string): boolean {
  const normalized = host.toLowerCase().trim();
  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "::1" ||
    normalized === "[::1]" ||
    normalized === "0.0.0.0" ||
    normalized === "host.docker.internal" ||
    normalized === "postgres" ||
    normalized === "db" ||
    normalized.endsWith(".local") ||
    normalized.endsWith(".internal")
  );
}

export function isLocalDatabaseUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    return isLocalDatabaseHost(parsed.hostname);
  } catch {
    return false;
  }
}

export function resolveDatabaseUrl(environment: "development" | "production" | "test"): string {
  const localDbUrl = process.env.LOCAL_DATABASE_URL?.trim();
  const rawDbUrl = process.env.DATABASE_URL?.trim();
  const prodDbUrl = process.env.PROD_DATABASE_URL?.trim() || process.env.LIVE_DATABASE_URL?.trim();

  if (environment === "development" || environment === "test") {
    // 1. Mandatory Localhost Development Principle:
    // Local development and automated testing must strictly use a local database.
    if (localDbUrl) {
      if (!isLocalDatabaseUrl(localDbUrl)) {
        throw new Error(
          `CRITICAL CONFIGURATION ERROR: LOCAL_DATABASE_URL must point to a local PostgreSQL instance (e.g., localhost or 127.0.0.1). Received host: '${new URL(localDbUrl).hostname}'. Connecting to remote/cloud databases during local development is strictly prohibited.`,
        );
      }
      return localDbUrl;
    }

    if (rawDbUrl && isLocalDatabaseUrl(rawDbUrl)) {
      return rawDbUrl;
    }

    // Safety guard: prevent accidental fallback to remote production database
    if (rawDbUrl && !isLocalDatabaseUrl(rawDbUrl)) {
      throw new Error(
        `CRITICAL ARCHITECTURE SAFEGUARD: Environment safeguard prevented connection to a live/production database during local development (NODE_ENV=${environment}). Local development and automated testing must connect to a local PostgreSQL database and cannot silently fall back to production credentials. Please define LOCAL_DATABASE_URL=postgresql://postgres:<password>@localhost:5432/sell_digital_assets in .env.`,
      );
    }

    throw new Error(
      `CRITICAL CONFIGURATION ERROR: Missing local database configuration for ${environment} environment. Please define LOCAL_DATABASE_URL=postgresql://postgres:<password>@localhost:5432/sell_digital_assets in .env.`,
    );
  }

  // Production environment:
  const targetUrl = rawDbUrl || prodDbUrl;
  if (!targetUrl) {
    throw new Error(
      `CRITICAL CONFIGURATION ERROR: DATABASE_URL is required in production environment. No fallback value is permitted.`,
    );
  }
  return targetUrl;
}

const rawNodeEnv = getRequiredEnv("NODE_ENV");
if (rawNodeEnv !== "development" && rawNodeEnv !== "production" && rawNodeEnv !== "test") {
  throw new Error(
    `CRITICAL CONFIGURATION ERROR: NODE_ENV must be either 'development', 'production', or 'test', received: '${rawNodeEnv}'`,
  );
}
const nodeEnv = rawNodeEnv as EnvConfig["NODE_ENV"];
const resolvedDatabaseUrl = resolveDatabaseUrl(nodeEnv);

const rawPort = getRequiredEnv("PORT");
const port = parseInt(rawPort, 10);
if (isNaN(port) || port <= 0 || port > 65535) {
  throw new Error(
    `CRITICAL CONFIGURATION ERROR: PORT must be a valid integer between 1 and 65535, received: '${rawPort}'`,
  );
}

const rawClientUrl = getRequiredEnv("CLIENT_URL");
const clientUrls = rawClientUrl
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

const primaryClientUrl = clientUrls[0];
if (!primaryClientUrl) {
  throw new Error(
    `CRITICAL CONFIGURATION ERROR: Environment variable 'CLIENT_URL' is required. No fallback value is permitted.`,
  );
}

for (const url of clientUrls) {
  try {
    new URL(url);
  } catch {
    throw new Error(
      `CRITICAL CONFIGURATION ERROR: Environment variable 'CLIENT_URL' contains invalid URL '${url}', received: '${rawClientUrl}'`,
    );
  }
}

// Support multiple comma-separated origins, ensuring all clientUrls are included
const rawAllowedOrigins = process.env.ALLOWED_ORIGINS;
const parsedOrigins: string[] = [];

function registerOrigin(originStr: string, sourceVar: string) {
  try {
    const origin = new URL(originStr).origin;
    if (!parsedOrigins.includes(origin)) {
      parsedOrigins.push(origin);
    }
  } catch {
    throw new Error(
      `CRITICAL CONFIGURATION ERROR: Origin '${originStr}' in ${sourceVar} must be a valid URL.`,
    );
  }
}

for (const u of clientUrls) {
  registerOrigin(u, "CLIENT_URL");
}

if (rawAllowedOrigins) {
  const origins = rawAllowedOrigins
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  for (const o of origins) {
    registerOrigin(o, "ALLOWED_ORIGINS");
  }
}

// Automatically register local host/loopback origins for the server's own port
// so Swagger UI, local pages, and self-hosted static assets are always accessible
registerOrigin(`http://localhost:${port}`, "PORT");
registerOrigin(`http://127.0.0.1:${port}`, "PORT");
registerOrigin(`http://[::1]:${port}`, "PORT");

// If SERVER_URL / API_URL is explicitly configured, register its origin as well
const serverUrlCandidate =
  process.env.SERVER_URL?.trim() ||
  process.env.API_URL?.trim() ||
  process.env.RENDER_EXTERNAL_URL?.trim() ||
  undefined;

if (serverUrlCandidate) {
  registerOrigin(serverUrlCandidate, "SERVER_URL");
}

const clientUrl = primaryClientUrl.replace(/\/+$/, "");

const rawExposeStack = getRequiredEnv("EXPOSE_STACK");
if (rawExposeStack !== "true" && rawExposeStack !== "false") {
  throw new Error(
    `CRITICAL CONFIGURATION ERROR: EXPOSE_STACK must be either 'true' or 'false', received: '${rawExposeStack}'`,
  );
}

export const env: EnvConfig = {
  PORT: port,
  NODE_ENV: nodeEnv,
  DATABASE_URL: resolvedDatabaseUrl,
  LOCAL_DATABASE_URL: process.env.LOCAL_DATABASE_URL?.trim() || undefined,
  PROD_DATABASE_URL: process.env.PROD_DATABASE_URL?.trim() || undefined,
  CLIENT_URL: clientUrl,
  SERVER_URL: serverUrlCandidate,
  ALLOWED_ORIGINS: parsedOrigins,
  JWT_SECRET: getRequiredSecret("JWT_SECRET"),
  JWT_REFRESH_SECRET: getRequiredSecret("JWT_REFRESH_SECRET"),
  DOWNLOAD_TOKEN_SECRET: getRequiredSecret("DOWNLOAD_TOKEN_SECRET"),
  BODY_LIMIT: getRequiredEnv("BODY_LIMIT"),
  EXPOSE_STACK: rawExposeStack === "true",
  REDIS_URL: process.env.REDIS_URL?.trim() || undefined,
  AWS_REGION: process.env.AWS_REGION?.trim() || "us-east-1",
  AWS_BUCKET_PRIVATE: process.env.AWS_BUCKET_PRIVATE?.trim() || undefined,
  AWS_BUCKET_PREVIEWS: process.env.AWS_BUCKET_PREVIEWS?.trim() || undefined,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID?.trim() || undefined,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY?.trim() || undefined,
  AWS_ENDPOINT: process.env.AWS_ENDPOINT?.trim() || undefined,
  STORAGE_DRIVER:
    (process.env.STORAGE_DRIVER?.trim() as
      | "local"
      | "r2"
      | "s3"
      | "supabase") || "local",
  LOCAL_STORAGE_PATH:
    process.env.LOCAL_STORAGE_PATH?.trim() ||
    (process.platform === "win32"
      ? "C:\\GH\\sell-digital-assets-storage"
      : "./storage"),
  SUPABASE_URL:
    process.env.SUPABASE_URL?.trim() ||
    process.env.VITE_SUPABASE_URL?.trim() ||
    (process.env.AWS_ENDPOINT?.includes(".storage.supabase.co")
      ? `https://${new URL(process.env.AWS_ENDPOINT.trim()).hostname.replace(".storage.supabase.co", ".supabase.co")}`
      : undefined),
  SUPABASE_SERVICE_ROLE_KEY:
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || undefined,
  SUPABASE_ANON_KEY:
    process.env.SUPABASE_ANON_KEY?.trim() ||
    process.env.VITE_SUPABASE_ANON_KEY?.trim() ||
    undefined,
};
