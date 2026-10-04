import jwt, { type JwtPayload } from "jsonwebtoken";
import crypto from "node:crypto";
import { env } from "../../config/env.js";

export interface AuthUserPayload {
  id: string;
  email: string;
  role: string;
  jti?: string;
}

export const REFRESH_TOKEN_EXPIRY_DAYS = 7;

export interface GeneratedTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  jti: string;
  refreshExpiresAt: Date;
}

export function generateTokens(user: AuthUserPayload): GeneratedTokens {
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

  const accessToken = jwt.sign(accessPayload, env.JWT_SECRET, {
    expiresIn: "15m",
    algorithm: "HS256",
  });

  const refreshToken = jwt.sign(refreshPayload, env.JWT_REFRESH_SECRET, {
    expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d`,
    algorithm: "HS256",
  });

  const refreshExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  return {
    accessToken,
    refreshToken,
    expiresIn: "15m",
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
  return {
    id: decoded.id,
    email: decoded.email,
    role: decoded.role,
    ...(decoded.jti ? { jti: decoded.jti } : {}),
  };
}
