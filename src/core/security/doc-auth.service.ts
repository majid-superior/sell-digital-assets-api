import type { Request } from "express";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { comparePassword } from "./password.js";
import { verifyAccessToken } from "./tokens.js";
import { env } from "../../config/env.js";
import { logger } from "../logger/index.js";
import { userRepository } from "../../database/repositories/user.repository.js";

export const DOC_COOKIE_NAME = "doc_access_token";
export const DOC_STATE_COOKIE_NAME = "doc_auth_state";
export const DOC_COOKIE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

const DOC_SIGNING_SECRET = crypto
  .createHmac("sha256", env.JWT_SECRET)
  .update("sda_doc_access_signing_key_v1")
  .digest("hex");

/**
 * Validates the provided password against active administrator accounts
 * registered in the PostgreSQL database (role = 'admin', status = 'active').
 * Only falls back to explicit ADMIN_PASSWORD env var if zero admins exist or DB is unreachable.
 */
export async function verifyAdminPassword(password: string): Promise<boolean> {
  if (!password || typeof password !== "string") {
    return false;
  }

  const trimmed = password.trim();
  if (!trimmed) {
    return false;
  }

  // 1. Live PostgreSQL verification against active admins via UserRepository
  try {
    const hashes = await userRepository.findActiveAdminPasswordHashes(5);
    if (hashes.length > 0) {
      for (const hash of hashes) {
        const isMatch = await comparePassword(trimmed, hash);
        if (isMatch) {
          return true;
        }
      }
      return false;
    }
  } catch (err) {
    logger.warn(
      {
        errName: (err as Error).name,
        errMessage: (err as Error).message,
      },
      "Database query for admin password verification failed, evaluating explicit configuration fallback",
    );
  }

  // 2. Explicit environment fallback ONLY when no database admins exist or DB is unreachable
  const configuredPassword = process.env.ADMIN_PASSWORD?.trim();
  if (!configuredPassword) {
    return false;
  }

  const inputBuf = Buffer.from(trimmed, "utf8");
  const expectedBuf = Buffer.from(configuredPassword, "utf8");
  if (inputBuf.length !== expectedBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(inputBuf, expectedBuf);
}

/**
 * Issues a cryptographically signed JWT grant for accessing the API documentation,
 * using an isolated signing secret and audience.
 */
export function createDocAccessToken(): string {
  return jwt.sign(
    {
      scope: "doc_access",
      role: "admin",
    },
    DOC_SIGNING_SECRET,
    {
      expiresIn: "24h",
      audience: "doc_access",
      issuer: "sell-digital-assets-api",
    },
  );
}

export function verifyDocAccessToken(token: string): boolean {
  try {
    const decoded = jwt.verify(token, DOC_SIGNING_SECRET, {
      algorithms: ["HS256"],
      audience: "doc_access",
      issuer: "sell-digital-assets-api",
    }) as {
      scope?: string;
    };
    return decoded?.scope === "doc_access";
  } catch {
    return false;
  }
}

/**
 * Inspects cookies and authorization headers to determine whether the request
 * has an active, valid administrator documentation access grant.
 */
export function isDocAuthorized(req: Request): boolean {
  // 1. Direct documentation session cookie
  const docCookie = req.cookies?.[DOC_COOKIE_NAME];
  if (docCookie && typeof docCookie === "string") {
    if (verifyDocAccessToken(docCookie)) {
      return true;
    }
  }

  // 2. Standard Admin Bearer token or accessToken cookie
  const authHeader = req.headers.authorization;
  let bearerToken: string | undefined;
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    bearerToken = authHeader.slice(7).trim();
  } else if (typeof req.cookies?.accessToken === "string") {
    bearerToken = req.cookies.accessToken;
  }

  if (bearerToken) {
    if (verifyDocAccessToken(bearerToken)) {
      return true;
    }
    try {
      const decoded = verifyAccessToken(bearerToken);
      if (decoded.role === "admin") {
        return true;
      }
    } catch {
      // Invalid platform token
    }
  }

  return false;
}

