import pino from "pino";
import { pinoHttp } from "pino-http";
import { env } from "../../config/env.js";

// Automated PII and sensitive secret redaction paths
const REDACTED_PATHS = [
  "req.headers.authorization",
  "req.headers.cookie",
  "password",
  "passwordHash",
  "password_hash",
  "token",
  "accessToken",
  "refreshToken",
  "secret",
  "creditCard",
  "cardNumber",
  "cvv",
];

export const logger = pino({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  redact: {
    paths: REDACTED_PATHS,
    censor: "[REDACTED]",
  },
  base: {
    env: env.NODE_ENV,
    service: "sell-digital-assets-api",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export const httpLogger = pinoHttp({
  logger,
  genReqId: (req) => (req as unknown as { id?: string }).id || req.headers["x-request-id"] || crypto.randomUUID(),
  customLogLevel: (_req, res, err) => {
    if (res.statusCode >= 500 || err) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  customSuccessMessage: (req, res) => `${req.method} ${req.url} - ${res.statusCode}`,
  customErrorMessage: (req, res, err) => `${req.method} ${req.url} - ${res.statusCode} Error: ${err.message}`,
});
