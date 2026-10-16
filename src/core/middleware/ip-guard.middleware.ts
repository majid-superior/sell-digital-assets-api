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
 * Normalizes a Host or X-Forwarded-Host header by taking the first value,
 * stripping port numbers and IPv6 brackets, and lowercasing.
 */
function normalizeHostHeader(raw: string | string[] | undefined): string {
  const first = Array.isArray(raw) ? raw[0] : raw;
  if (!first) return "";
  const primary = first.split(",")[0]?.trim() || "";
  return primary
    .replace(/:\d+$/, "")
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .trim()
    .toLowerCase();
}

function isLoopbackHost(cleanHost: string): boolean {
  return (
    cleanHost === "localhost" ||
    cleanHost === "127.0.0.1" ||
    cleanHost === "::1"
  );
}

function isLoopbackSocket(remoteAddress: string | undefined): boolean {
  if (!remoteAddress) return false;
  return (
    remoteAddress === "127.0.0.1" ||
    remoteAddress === "::1" ||
    remoteAddress === "::ffff:127.0.0.1"
  );
}

/**
 * Middleware that strictly prevents direct IP access in production.
 * Requests must use an authorized domain name rather than a raw server IP address.
 * Loopback addresses (localhost, 127.0.0.1, ::1) are only permitted from actual loopback sockets,
 * and health check endpoints are exempted.
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

  // Exempt health check to ensure internal container/cloud orchestrator probes succeed
  if (req.path === "/api/v1/health") {
    return next();
  }

  const hostHeader = normalizeHostHeader(req.headers.host || req.hostname);
  const forwardedHostHeader = normalizeHostHeader(req.headers["x-forwarded-host"]);
  const socketIsLoopback = isLoopbackSocket(req.socket?.remoteAddress);

  // Only permit loopback hostnames when the underlying socket is genuinely loopback
  // and neither header contains a non-loopback raw IP address.
  if (isLoopbackHost(hostHeader) || isLoopbackHost(forwardedHostHeader)) {
    if (
      socketIsLoopback &&
      (!forwardedHostHeader || isLoopbackHost(forwardedHostHeader) || !isRawIpAddress(forwardedHostHeader)) &&
      (!hostHeader || isLoopbackHost(hostHeader) || !isRawIpAddress(hostHeader))
    ) {
      return next();
    }
    return next(
      new AppError(
        "Direct IP access is prohibited. Please access the API using the authorized domain name.",
        403,
      ),
    );
  }

  // Block any raw IP access in either Host or X-Forwarded-Host
  if (
    !hostHeader ||
    isRawIpAddress(hostHeader) ||
    (forwardedHostHeader && isRawIpAddress(forwardedHostHeader))
  ) {
    return next(
      new AppError(
        "Direct IP access is prohibited. Please access the API using the authorized domain name.",
        403,
      ),
    );
  }

  next();
}


