import type { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/app-error.js";
import { verifyAccessToken, type AuthUserPayload } from "../security/tokens.js";
import { userRepository } from "../../database/repositories/user.repository.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

interface CachedAuthUser {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: number;
}

const AUTH_CACHE_TTL_MS = 30_000; // 30 seconds
const MAX_AUTH_CACHE_SIZE = 5000;
const authUserCache = new Map<string, CachedAuthUser>();

export function invalidateAuthUserCache(userId: string): void {
  authUserCache.delete(userId);
}

export function clearAuthUserCache(): void {
  authUserCache.clear();
}

async function resolveAuthenticatedUser(userId: string): Promise<CachedAuthUser | null> {
  const now = Date.now();
  const cached = authUserCache.get(userId);
  if (cached) {
    if (cached.expiresAt > now) {
      return cached;
    }
    authUserCache.delete(userId);
  }

  const user = await userRepository.findById(userId);
  if (!user) {
    return null;
  }

  if (authUserCache.size >= MAX_AUTH_CACHE_SIZE) {
    const oldestKey = authUserCache.keys().next().value;
    if (oldestKey) {
      authUserCache.delete(oldestKey);
    }
  }

  const entry: CachedAuthUser = {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    expiresAt: now + AUTH_CACHE_TTL_MS,
  };
  authUserCache.set(userId, entry);
  return entry;
}

export const authenticate = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return next(new AppError("Authentication required. Please provide a valid Bearer token.", 401));
  }

  try {
    const decoded = verifyAccessToken(token);

    // Verify account exists and is actively permitted to access the platform
    const user = await resolveAuthenticatedUser(decoded.id);
    if (!user || user.status !== "active") {
      return next(new AppError("Account is inactive, suspended, or deleted.", 403));
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    next();
  } catch (err: unknown) {
    if ((err as Error).name === "TokenExpiredError") {
      return next(new AppError("Access token expired. Please refresh your token.", 401));
    }
    next(new AppError("Invalid authentication token.", 401));
  }
};
(authenticate as any)._authRequired = true;

export const optionalAuthenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = verifyAccessToken(token);
    const user = await resolveAuthenticatedUser(decoded.id);
    if (user && user.status === "active") {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
      };
    }
  } catch {
    // Ignore invalid/expired token for optional auth; downstream logic will verify licenseKey if unauthenticated
  }

  next();
};

export const authorize = (...allowedRoles: string[]) => {
  const middleware = (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError("Authentication required.", 401);
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      throw new AppError("Access denied. Insufficient permissions for this resource.", 403);
    }

    next();
  };
  (middleware as any)._allowedRoles = allowedRoles;
  return middleware;
};



