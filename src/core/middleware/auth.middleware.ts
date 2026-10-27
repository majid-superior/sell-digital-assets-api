import type { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/app-error.js";
import { verifyAccessToken, isTokenRevokedAsync, type AuthUserPayload } from "../security/tokens.js";
import { userRepository } from "../../database/repositories/user.repository.js";
import { getSystemSettings } from "../../data/organizations.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
      actingSellerId?: string;
    }
  }
}

interface CachedAuthUser {
  id: string;
  email: string;
  role: string;
  status: string;
  emailVerifiedAt: Date | string | null;
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
    emailVerifiedAt: user.email_verified_at ?? null,
    expiresAt: now + AUTH_CACHE_TTL_MS,
  };
  authUserCache.set(userId, entry);
  return entry;
}

/**
 * Extracts a JWT bearer access token from request Authorization header or cookies.
 * Supports case-insensitive 'Bearer' scheme, variable whitespace, and accessToken cookies.
 */
export function extractAuthToken(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (match && match[1]?.trim()) {
      return match[1].trim();
    }
  }

  if (req.cookies && typeof req.cookies.accessToken === "string") {
    const raw = req.cookies.accessToken.replace(/^["']|["']$/g, "").trim();
    if (raw) {
      return raw;
    }
  }

  return undefined;
}

export const authenticate = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  const token = extractAuthToken(req);

  if (!token) {
    return next(new AppError("Authentication required. Please provide a valid Bearer token.", 401));
  }

  try {
    const decoded = verifyAccessToken(token);

    if (await isTokenRevokedAsync(decoded.jti, decoded.id, decoded.iat, decoded.iatMs)) {
      return next(new AppError("Authentication session has ended or been revoked. Please sign in again.", 401));
    }

    // Verify account exists and is actively permitted to access the platform
    const user = await resolveAuthenticatedUser(decoded.id);
    if (!user || user.status !== "active") {
      return next(new AppError("Account is inactive, suspended, or deleted.", 403));
    }

    // Enforce maintenance mode and email verification for non-admin users
    const settings = getSystemSettings();
    if (settings.maintenanceMode && user.role !== "admin") {
      return next(
        new AppError("Platform is currently undergoing scheduled maintenance. Please try again later.", 503),
      );
    }

    if (settings.requireEmailVerification && !user.emailVerifiedAt && user.role !== "admin") {
      return next(
        new AppError(
          "Your email address has not been verified yet. Please verify your email before accessing this resource.",
          403,
        ),
      );
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    next();
  } catch (err: unknown) {
    if (err instanceof AppError) {
      return next(err);
    }
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
  const token = extractAuthToken(req);

  if (!token) {
    return next();
  }

  try {
    const decoded = verifyAccessToken(token);
    const isRevoked = await isTokenRevokedAsync(decoded.jti, decoded.id, decoded.iat, decoded.iatMs);
    if (!isRevoked) {
      const user = await resolveAuthenticatedUser(decoded.id);
      if (user && user.status === "active") {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
        };
      }
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

    if (allowedRoles.length > 0) {
      const currentRole = (req.user.role || "").toLowerCase();
      const isAllowed = allowedRoles.some((role) => role.toLowerCase() === currentRole);
      if (!isAllowed) {
        throw new AppError("Access denied. Insufficient permissions for this resource.", 403);
      }
    }

    next();
  };
  (middleware as any)._allowedRoles = allowedRoles;
  return middleware;
};

/**
 * Tenant Isolation Middleware (requireSellerAccess)
 * Resolves req.actingSellerId (equal to user ID for primary SELLER, and parent_seller_id for sub-users).
 * Ensures all seller queries filter by seller_id = req.actingSellerId.
 */
export const requireSellerAccess = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  if (!req.user) {
    return next(new AppError("Authentication required. Please sign in to access seller resources.", 401));
  }

  const user = await userRepository.findById(req.user.id);
  if (!user || user.status !== "active") {
    return next(new AppError("Account is inactive, suspended, or deleted.", 403));
  }

  const roleNormalized = (user.role || "").toUpperCase();

  // Primary Seller
  if (roleNormalized === "SELLER" || user.role_id === 2) {
    req.actingSellerId = user.id;
    return next();
  }

  // Seller Store Sub-User (e.g. STORE_MANAGER, CONTENT_UPLOADER, ANALYST)
  if (user.parent_seller_id) {
    req.actingSellerId = user.parent_seller_id;
    return next();
  }

  // Organization Admin override (platform admin acting on seller behalf)
  if (roleNormalized === "ADMIN" || user.role_id === 1) {
    req.actingSellerId =
      (req.query.actingSellerId as string) ||
      (req.headers["x-acting-seller-id"] as string) ||
      user.id;
    return next();
  }

  return next(
    new AppError("Access denied. A valid Seller or Seller Team account is required to access seller resources.", 403),
  );
};
(requireSellerAccess as any)._authRequired = true;

/**
 * Admin Guard (requireOrgAdmin)
 * Restrict /v1/admin/* strictly to the seeded ADMIN role.
 */
export const requireOrgAdmin = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.user) {
    throw new AppError("Authentication required. Please sign in to access administrator resources.", 401);
  }
  const roleNormalized = (req.user.role || "").toUpperCase();
  if (roleNormalized !== "ADMIN") {
    throw new AppError("Access denied. Organization Administrator privileges are strictly required.", 403);
  }
  next();
};
(requireOrgAdmin as any)._authRequired = true;



