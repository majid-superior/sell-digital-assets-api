// src/core/middleware/ip-guard.middleware.ts
import type { Request, Response, NextFunction } from "express";
import { env } from "../../config/env.js";
import { AppError } from "../errors/app-error.js";

/**
 * Checks whether a host string represents a raw IPv4 or IPv6 address.
 */
function isRawIpAddress(host: string): boolean {
  // Strip port (e.g. "192.168.1.1:5000" -> "192.168.1.1", "[::1]:5000" -> "::1")
  const cleanHost = host
    .replace(/:\d+$/, "")
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .trim();

  // IPv4 check: 4 octets of numbers
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(cleanHost)) {
    return true;
  }

  // IPv6 check: contains colons
  if (cleanHost.includes(":")) {
    return true;
  }

  return false;
}

/**
 * Middleware that strictly prevents direct IP access in production.
 * Requests must use an authorized domain name rather than a raw server IP address.
 * Loopback addresses (localhost, 127.0.0.1) and health check endpoints are exempted.
 */
export function ipGuardMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  // Only enforce in production mode
  if (env.NODE_ENV !== "production") {
    return next();
  }

  // Exempt health checks to ensure internal container/cloud orchestrator probes succeed
  if (req.path === "/api/health" || req.path === "/health") {
    return next();
  }

  // Extract host from headers or req.hostname
  const host =
    (req.headers["x-forwarded-host"] as string) ||
    req.headers.host ||
    req.hostname ||
    "";

  const cleanHost = host
    .replace(/:\d+$/, "")
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .trim()
    .toLowerCase();

  // Allow loopback for internal diagnostics
  if (
    cleanHost === "localhost" ||
    cleanHost === "127.0.0.1" ||
    cleanHost === "::1"
  ) {
    return next();
  }

  // Block any raw IP access
  if (isRawIpAddress(cleanHost)) {
    return next(
      new AppError(
        "Direct IP access is prohibited. Please access the API using the authorized domain name.",
        403,
      ),
    );
  }

  next();
}

