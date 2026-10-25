// src/core/middleware/cors.middleware.ts
import type { Request } from "express";
import cors, { type CorsOptions, type CorsOptionsDelegate } from "cors";
import { env } from "../../config/env.js";
import { AppError } from "../errors/app-error.js";

const CORS_ALLOWED_METHODS = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
];

const CORS_ALLOWED_HEADERS = [
  "Content-Type",
  "Authorization",
  "X-Requested-With",
  "X-Request-ID",
];

/**
 * Public static assets (fonts, theme styles, favicon, logos) are intended for open cross-origin usage.
 */
function isPublicStaticPath(path: string): boolean {
  return (
    path.startsWith("/theme") ||
    path.startsWith("/css") ||
    path.startsWith("/js") ||
    path === "/favicon.ico" ||
    path === "/logo.png"
  );
}

/**
 * Checks whether an incoming origin is authorized according to the CORS policy.
 */
export function isOriginAllowed(origin: string, req?: Request): boolean {
  // 1. Public static assets are accessible to any origin
  if (req?.path && isPublicStaticPath(req.path)) {
    return true;
  }

  // 2. Explicitly whitelisted origins (CLIENT_URL, ALLOWED_ORIGINS, SERVER_URL, PORT loopback)
  if (env.ALLOWED_ORIGINS.includes(origin)) {
    return true;
  }

  // 3. In development mode, allow any localhost/loopback origin on any port
  if (env.NODE_ENV === "development") {
    if (/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(origin)) {
      return true;
    }
  }

  // 4. Same-origin request: origin matches current Host or X-Forwarded-Host header
  if (req) {
    try {
      const originHost = new URL(origin).host.toLowerCase();
      const forwardedHost = req.headers["x-forwarded-host"];
      const primaryForwardedHost = Array.isArray(forwardedHost)
        ? forwardedHost[0]
        : forwardedHost?.split(",")[0]?.trim();
      const serverHost = (
        primaryForwardedHost ||
        req.headers.host ||
        ""
      ).toLowerCase();

      if (originHost && serverHost && originHost === serverHost) {
        return true;
      }
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Dynamic CORS options delegate that inspects incoming requests.
 */
export const corsOptionsDelegate: CorsOptionsDelegate<Request> = (
  req,
  callback,
) => {
  const origin = req.headers.origin;

  // Non-browser clients (Postman, curl, server-to-server, mobile apps) where no Origin header is present
  if (!origin) {
    return callback(null, {
      origin: true,
      credentials: true,
      methods: CORS_ALLOWED_METHODS,
      allowedHeaders: CORS_ALLOWED_HEADERS,
    });
  }

  // Verify origin authorization
  if (isOriginAllowed(origin, req)) {
    return callback(null, {
      origin: true,
      credentials: true,
      methods: CORS_ALLOWED_METHODS,
      allowedHeaders: CORS_ALLOWED_HEADERS,
    });
  }

  // Strictly reject unauthorized browser origins with 403 Forbidden and actionable explanation
  return callback(
    new AppError(
      `Access blocked: Origin '${origin}' is not authorized by CORS policy. Please configure this origin in ALLOWED_ORIGINS or use an authorized client domain.`,
      403,
    ),
  );
};

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || isOriginAllowed(origin)) {
      return callback(null, true);
    }
    return callback(
      new AppError(
        `Access blocked: Origin '${origin}' is not authorized by CORS policy. Please configure this origin in ALLOWED_ORIGINS or use an authorized client domain.`,
        403,
      ),
    );
  },
  credentials: true,
  methods: CORS_ALLOWED_METHODS,
  allowedHeaders: CORS_ALLOWED_HEADERS,
};

export const corsMiddleware = cors(corsOptionsDelegate);
