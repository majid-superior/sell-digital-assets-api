import jwt, { type JwtPayload } from "jsonwebtoken";
import crypto from "node:crypto";
import { env } from "../../config/env.js";

export interface AuthUserPayload {
  id: string;
  email: string;
  role: string;
  jti?: string;
}

export function generateTokens(user: AuthUserPayload): {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
} {
  const accessPayload = {
    id: user.id,
    email: user.email,
    role: user.role || "user",
  };

  const refreshPayload = {
    ...accessPayload,
    jti: crypto.randomUUID(),
  };

  const accessToken = jwt.sign(accessPayload, env.JWT_SECRET, {
    expiresIn: "15m",
    algorithm: "HS256",
  });

  const refreshToken = jwt.sign(refreshPayload, env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
    algorithm: "HS256",
  });

  return {
    accessToken,
    refreshToken,
    expiresIn: "15m",
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
