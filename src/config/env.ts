import dotenv from "dotenv";

dotenv.config();

export interface EnvConfig {
  PORT: number;
  NODE_ENV: "development" | "production";
  DATABASE_URL: string;
  CLIENT_URL: string;
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

const clientUrl = getRequiredEnv("CLIENT_URL");
try {
  new URL(clientUrl);
} catch {
  throw new Error(
    `CRITICAL CONFIGURATION ERROR: Environment variable 'CLIENT_URL' must be a valid URL, received: '${clientUrl}'`,
  );
}

// Support multiple comma-separated origins, ensuring clientUrl is always included
const rawAllowedOrigins = process.env.ALLOWED_ORIGINS;
const parsedOrigins = rawAllowedOrigins
  ? rawAllowedOrigins.split(",").map((o) => o.trim()).filter(Boolean)
  : [];

if (!parsedOrigins.includes(clientUrl)) {
  parsedOrigins.push(clientUrl);
}

for (const origin of parsedOrigins) {
  try {
    new URL(origin);
  } catch {
    throw new Error(
      `CRITICAL CONFIGURATION ERROR: Origin '${origin}' in ALLOWED_ORIGINS must be a valid URL.`,
    );
  }
}

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
};
