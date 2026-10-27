import jwt, { type JwtPayload } from "jsonwebtoken";
import crypto from "node:crypto";
import { env } from "../../config/env.js";
import { AppError } from "../errors/app-error.js";
import { getSystemSettings, type SystemSettings } from "../../data/organizations.js";
import { tokenRevocationRepository } from "../../database/repositories/token-revocation.repository.js";

export interface AuthUserPayload {
  id: string;
  email: string;
  role: string;
  jti?: string;
  iat?: number;
  iatMs?: number;
  exp?: number;
  rememberMe?: boolean;
}

export const REFRESH_TOKEN_EXPIRY_DAYS = 7;

export interface GeneratedTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  jti: string;
  refreshExpiresAt: Date;
}

// Local write-through cache backed by PostgreSQL revoked_tokens table
const revokedRefreshTokens = new Map<string, number>();
const userRevocationEpochs = new Map<string, number>();
let lastRevocationSyncAt = 0;
let revocationSyncPromise: Promise<void> | null = null;
const REVOCATION_SYNC_TTL_MS = 30_000;

async function hydrateRevocationCache(): Promise<void> {
  if (revocationSyncPromise) {
    return revocationSyncPromise;
  }

  revocationSyncPromise = (async () => {
    try {
      const rows = await tokenRevocationRepository.loadActiveRevocations();
      const now = Date.now();
      for (const row of rows) {
        if (row.expMs > now) {
          if (row.jti.startsWith("user_epoch:")) {
            const userId = row.jti.slice("user_epoch:".length);
            const currentEpoch = userRevocationEpochs.get(userId) ?? 0;
            if (row.createdMs > currentEpoch) {
              userRevocationEpochs.set(userId, row.createdMs);
            }
          } else {
            revokedRefreshTokens.set(row.jti, row.expMs);
          }
        }
      }
      lastRevocationSyncAt = now;
    } catch {
      // Retain existing in-memory revocation state if DB is temporarily unreachable
    } finally {
      revocationSyncPromise = null;
    }
  })();

  return revocationSyncPromise;
}

function ensureHydrated(): void {
  if (Date.now() - lastRevocationSyncAt >= REVOCATION_SYNC_TTL_MS && !revocationSyncPromise) {
    void hydrateRevocationCache();
  }
}

async function ensureRevocationCacheFresh(): Promise<void> {
  if (Date.now() - lastRevocationSyncAt < REVOCATION_SYNC_TTL_MS) {
    return;
  }
  await hydrateRevocationCache();
}

function pruneExpiredRevocations(): void {
  const now = Date.now();
  for (const [jti, expMs] of revokedRefreshTokens.entries()) {
    if (expMs <= now) {
      revokedRefreshTokens.delete(jti);
    }
  }
}

export function isRefreshTokenRevoked(jti: string): boolean {
  ensureHydrated();
  pruneExpiredRevocations();
  const expMs = revokedRefreshTokens.get(jti);
  if (!expMs) return false;
  if (expMs <= Date.now()) {
    revokedRefreshTokens.delete(jti);
    return false;
  }
  return true;
}

export function isTokenRevoked(
  jti?: string,
  userId?: string,
  iatSeconds?: number,
  iatMs?: number,
): boolean {
  ensureHydrated();
  pruneExpiredRevocations();

  if (jti && isRefreshTokenRevoked(jti)) {
    return true;
  }

  if (userId && (iatMs !== undefined || iatSeconds !== undefined)) {
    const tokenIssuedMs = iatMs !== undefined ? iatMs : (iatSeconds as number) * 1000;
    const cachedEpochMs = userRevocationEpochs.get(userId);
    if (cachedEpochMs && tokenIssuedMs <= cachedEpochMs) {
      return true;
    }
  }

  return false;
}

export async function isTokenRevokedAsync(
  jti?: string,
  userId?: string,
  iatSeconds?: number,
  iatMs?: number,
): Promise<boolean> {
  await ensureRevocationCacheFresh();
  return isTokenRevoked(jti, userId, iatSeconds, iatMs);
}

export function revokeRefreshToken(
  tokenOrJti: string,
  expiresAtMs?: number,
  userId?: string,
): string | undefined {
  if (!tokenOrJti) return undefined;
  ensureHydrated();
  pruneExpiredRevocations();

  const defaultExpiry = Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

  // If a raw JWT was passed, verify/decode it to extract jti, exp, and user id
  if (tokenOrJti.includes(".")) {
    try {
      const decoded = jwt.verify(tokenOrJti, env.JWT_REFRESH_SECRET, {
        algorithms: ["HS256"],
      }) as JwtPayload & AuthUserPayload;
      if (decoded.jti) {
        const expMs = decoded.exp ? decoded.exp * 1000 : expiresAtMs || defaultExpiry;
        revokedRefreshTokens.set(decoded.jti, expMs);
        void tokenRevocationRepository.revokeJti(
          decoded.jti,
          new Date(expMs),
          decoded.id || userId,
        );
      }
      return decoded.id || userId;
    } catch {
      // If verification failed (e.g. expired during sign-out), still decode to extract jti and revoke it
      try {
        const decoded = jwt.decode(tokenOrJti) as (JwtPayload & AuthUserPayload) | null;
        if (decoded?.jti) {
          const expMs = decoded.exp ? decoded.exp * 1000 : expiresAtMs || defaultExpiry;
          revokedRefreshTokens.set(decoded.jti, expMs);
          void tokenRevocationRepository.revokeJti(
            decoded.jti,
            new Date(expMs),
            decoded.id || userId,
          );
        }
        return decoded?.id || userId;
      } catch {
        return userId;
      }
    }
  }

  const finalExpMs = expiresAtMs || defaultExpiry;
  revokedRefreshTokens.set(tokenOrJti, finalExpMs);
  void tokenRevocationRepository.revokeJti(tokenOrJti, new Date(finalExpMs), userId);
  return userId;
}

export function revokeAccessToken(
  tokenOrJti: string,
  expiresAtMs?: number,
  userId?: string,
): string | undefined {
  if (!tokenOrJti) return undefined;
  ensureHydrated();
  pruneExpiredRevocations();

  const defaultExpiry = Date.now() + 24 * 60 * 60 * 1000;

  if (tokenOrJti.includes(".")) {
    try {
      const decoded = jwt.verify(tokenOrJti, env.JWT_SECRET, {
        algorithms: ["HS256"],
      }) as JwtPayload & AuthUserPayload;
      if (decoded.jti) {
        const expMs = decoded.exp ? decoded.exp * 1000 : expiresAtMs || defaultExpiry;
        revokedRefreshTokens.set(decoded.jti, expMs);
        void tokenRevocationRepository.revokeJti(
          decoded.jti,
          new Date(expMs),
          decoded.id || userId,
        );
      }
      return decoded.id || userId;
    } catch {
      try {
        const decoded = jwt.decode(tokenOrJti) as (JwtPayload & AuthUserPayload) | null;
        if (decoded?.jti) {
          const expMs = decoded.exp ? decoded.exp * 1000 : expiresAtMs || defaultExpiry;
          revokedRefreshTokens.set(decoded.jti, expMs);
          void tokenRevocationRepository.revokeJti(
            decoded.jti,
            new Date(expMs),
            decoded.id || userId,
          );
        }
        return decoded?.id || userId;
      } catch {
        return userId;
      }
    }
  }

  const finalExpMs = expiresAtMs || defaultExpiry;
  revokedRefreshTokens.set(tokenOrJti, finalExpMs);
  void tokenRevocationRepository.revokeJti(tokenOrJti, new Date(finalExpMs), userId);
  return userId;
}

export async function revokeAllUserTokens(userId: string): Promise<void> {
  if (!userId) return;
  ensureHydrated();
  const epochMs = await tokenRevocationRepository.revokeAllForUser(userId);
  userRevocationEpochs.set(userId, epochMs);
}

export function generateTokens(
  user: AuthUserPayload,
  customSettings?: Partial<SystemSettings> & { rememberMe?: boolean },
): GeneratedTokens {
  ensureHydrated();
  const currentSettings = getSystemSettings();
  const settings = customSettings
    ? { ...currentSettings, ...customSettings }
    : currentSettings;

  const minIatMs = (userRevocationEpochs.get(user.id) ?? 0) + 1;
  const iatMs = Math.max(Date.now(), minIatMs);

  const accessJti = crypto.randomUUID();
  const accessPayload = {
    id: user.id,
    email: user.email,
    role: user.role || "user",
    jti: accessJti,
    iatMs,
  };

  const jti = crypto.randomUUID();
  const refreshPayload = {
    id: user.id,
    email: user.email,
    role: user.role || "user",
    jti,
    iatMs,
    rememberMe: Boolean(customSettings?.rememberMe ?? user.rememberMe),
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

  if (decoded.jti && isRefreshTokenRevoked(decoded.jti)) {
    throw new AppError("Access token has been revoked. Please sign in again.", 401);
  }

  return {
    id: decoded.id,
    email: decoded.email,
    role: decoded.role,
    ...(decoded.jti ? { jti: decoded.jti } : {}),
    ...(decoded.iat ? { iat: decoded.iat } : {}),
    ...(decoded.iatMs !== undefined ? { iatMs: Number(decoded.iatMs) } : {}),
    ...(decoded.exp ? { exp: decoded.exp } : {}),
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
    ...(decoded.iat ? { iat: decoded.iat } : {}),
    ...(decoded.iatMs !== undefined ? { iatMs: Number(decoded.iatMs) } : {}),
    ...(decoded.exp ? { exp: decoded.exp } : {}),
    ...(decoded.rememberMe !== undefined ? { rememberMe: Boolean(decoded.rememberMe) } : {}),
  };
}
