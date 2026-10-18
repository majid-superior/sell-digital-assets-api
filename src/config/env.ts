import dotenv from "dotenv";

dotenv.config();

export interface EnvConfig {
  PORT: number;
  NODE_ENV: "development" | "production";
  DATABASE_URL: string;
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
  AWS_BUCKET_NAME?: string | undefined;
  AWS_ACCESS_KEY_ID?: string | undefined;
  AWS_SECRET_ACCESS_KEY?: string | undefined;
  AWS_ENDPOINT?: string | undefined;
  STORAGE_DRIVER: "local" | "r2" | "s3";
  LOCAL_STORAGE_PATH: string;
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

const nodeEnv = getRequiredEnv("NODE_ENV");
if (nodeEnv !== "development" && nodeEnv !== "production") {
  throw new Error(
    `CRITICAL CONFIGURATION ERROR: NODE_ENV must be either 'development' or 'production', received: '${nodeEnv}'`,
  );
}

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

const clientUrl = primaryClientUrl.replace(/\/+$/, "");

const rawExposeStack = getRequiredEnv("EXPOSE_STACK");
if (rawExposeStack !== "true" && rawExposeStack !== "false") {
  throw new Error(
    `CRITICAL CONFIGURATION ERROR: EXPOSE_STACK must be either 'true' or 'false', received: '${rawExposeStack}'`,
  );
}

export const env: EnvConfig = {
  PORT: port,
  NODE_ENV: nodeEnv as EnvConfig["NODE_ENV"],
  DATABASE_URL: getRequiredEnv("DATABASE_URL"),
  CLIENT_URL: clientUrl,
  SERVER_URL: process.env.SERVER_URL?.trim() || process.env.API_URL?.trim() || process.env.RENDER_EXTERNAL_URL?.trim() || undefined,
  ALLOWED_ORIGINS: parsedOrigins,
  JWT_SECRET: getRequiredSecret("JWT_SECRET"),
  JWT_REFRESH_SECRET: getRequiredSecret("JWT_REFRESH_SECRET"),
  DOWNLOAD_TOKEN_SECRET: getRequiredSecret("DOWNLOAD_TOKEN_SECRET"),
  BODY_LIMIT: getRequiredEnv("BODY_LIMIT"),
  EXPOSE_STACK: rawExposeStack === "true",
  REDIS_URL: process.env.REDIS_URL?.trim() || undefined,
  AWS_REGION: process.env.AWS_REGION?.trim() || "us-east-1",
  AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME?.trim() || undefined,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID?.trim() || undefined,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY?.trim() || undefined,
  AWS_ENDPOINT: process.env.AWS_ENDPOINT?.trim() || undefined,
  STORAGE_DRIVER: (process.env.STORAGE_DRIVER?.trim() as "local" | "r2" | "s3") || "local",
  LOCAL_STORAGE_PATH: process.env.LOCAL_STORAGE_PATH?.trim() || (process.platform === "win32" ? "C:\\GH\\sell-digital-assets-storage" : "./storage"),
};
