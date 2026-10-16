import jwt, { type JwtPayload } from "jsonwebtoken";
import crypto from "node:crypto";
import { env } from "../../config/env.js";
import { AppError } from "../errors/app-error.js";
import { getSystemSettings, type SystemSettings } from "../../data/organizations.js";

export interface AuthUserPayload {
  id: string;
  email: string;
  role: string;
  jti?: string;
  exp?: number;
}

export const REFRESH_TOKEN_EXPIRY_DAYS = 7;

export interface GeneratedTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  jti: string;
  refreshExpiresAt: Date;
}

// Revoked refresh token JTI store mapping jti -> expiration timestamp (ms)
const revokedRefreshTokens = new Map<string, number>();

function pruneExpiredRevocations(): void {
  const now = Date.now();
  for (const [jti, expMs] of revokedRefreshTokens.entries()) {
    if (expMs <= now) {
      revokedRefreshTokens.delete(jti);
    }
  }
}

export function isRefreshTokenRevoked(jti: string): boolean {
  pruneExpiredRevocations();
  const expMs = revokedRefreshTokens.get(jti);
  if (!expMs) return false;
  if (expMs <= Date.now()) {
    revokedRefreshTokens.delete(jti);
    return false;
  }
  return true;
}

export function revokeRefreshToken(tokenOrJti: string, expiresAtMs?: number): void {
  if (!tokenOrJti) return;
  pruneExpiredRevocations();

  const defaultExpiry = Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

  // If a raw JWT was passed, verify/decode it to extract jti and exp
  if (tokenOrJti.includes(".")) {
    try {
      const decoded = jwt.verify(tokenOrJti, env.JWT_REFRESH_SECRET, {
        algorithms: ["HS256"],
      }) as JwtPayload & AuthUserPayload;
      if (decoded.jti) {
        const expMs = decoded.exp ? decoded.exp * 1000 : expiresAtMs || defaultExpiry;
        revokedRefreshTokens.set(decoded.jti, expMs);
      }
    } catch {
      // Ignore already invalid or expired tokens during revocation
    }
    return;
  }

  revokedRefreshTokens.set(tokenOrJti, expiresAtMs || defaultExpiry);
}

export function generateTokens(
  user: AuthUserPayload,
  customSettings?: Partial<SystemSettings>,
): GeneratedTokens {
  const currentSettings = getSystemSettings();
  const settings = customSettings
    ? { ...currentSettings, ...customSettings }
    : currentSettings;

  const accessPayload = {
    id: user.id,
    email: user.email,
    role: user.role || "user",
  };

  const jti = crypto.randomUUID();
  const refreshPayload = {
    ...accessPayload,
    jti,
  };

  const accessMinutes = Math.max(1, settings.accessTokenTtlMinutes || 15);
  const refreshDays = Math.max(1, settings.refreshTokenTtlDays || 7);

  const expiresIn = `${accessMinutes}m`;
  const refreshExpiresIn = `${refreshDays}d`;

  const accessToken = jwt.sign(accessPayload, env.JWT_SECRET, {
    expiresIn: expiresIn as any,
    algorithm: "HS256",
  });

  const refreshToken = jwt.sign(refreshPayload, env.JWT_REFRESH_SECRET, {
    expiresIn: refreshExpiresIn as any,
    algorithm: "HS256",
  });

  const refreshExpiresAt = new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000);

  return {
    accessToken,
    refreshToken,
    expiresIn,
    jti,
    refreshExpiresAt,
  };
}

export function verifyAccessToken(token: string): AuthUserPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET, {
    algorithms: ["HS256"],
  }) as JwtPayload & AuthUserPayload;
  return {
    id: decoded.id,
    email: decoded.email,
    role: decoded.role,
  };
}

export function verifyRefreshToken(token: string): AuthUserPayload {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET, {
    algorithms: ["HS256"],
  }) as JwtPayload & AuthUserPayload;

  if (decoded.jti && isRefreshTokenRevoked(decoded.jti)) {
    throw new AppError("Refresh token has been revoked. Please sign in again.", 401);
  }

  return {
    id: decoded.id,
    email: decoded.email,
    role: decoded.role,
    ...(decoded.jti ? { jti: decoded.jti } : {}),
    ...(decoded.exp ? { exp: decoded.exp } : {}),
  };
}

