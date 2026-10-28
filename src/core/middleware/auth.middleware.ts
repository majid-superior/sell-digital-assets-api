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

export interface CachedAuthUser {
  id: string;
  email: string;
  role: string;
  role_id?: number | undefined;
  parent_seller_id?: string | null | undefined;
  status: string;
  emailVerifiedAt: Date | string | null;
  permissions: string[];
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

export async function resolveAuthenticatedUser(userId: string): Promise<CachedAuthUser | null> {
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
    role_id: user.role_id,
    parent_seller_id: user.parent_seller_id,
    status: user.status,
    emailVerifiedAt: user.email_verified_at ?? null,
    permissions: user.permissions || [],
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
      roleId: user.role_id,
      parentSellerId: user.parent_seller_id,
      permissions: user.permissions,
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
          roleId: user.role_id,
          parentSellerId: user.parent_seller_id,
          permissions: user.permissions,
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
 * Validates that sub-users have an active, non-suspended parent seller store.
 */
export const requireSellerAccess = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  if (!req.user) {
    return next(new AppError("Authentication required. Please sign in to access seller resources.", 401));
  }

  const user = await resolveAuthenticatedUser(req.user.id);
  if (!user || user.status !== "active") {
    return next(new AppError("Account is inactive, suspended, or deleted.", 403));
  }

  const roleNormalized = (user.role || "").toUpperCase();

  // Primary Seller
  if ((roleNormalized === "SELLER" || user.role_id === 2) && !user.parent_seller_id) {
    req.actingSellerId = user.id;
    return next();
  }

  // Seller Store Sub-User (e.g. MANAGER, USER, ANALYST)
  if (user.parent_seller_id) {
    const parentSeller = await resolveAuthenticatedUser(user.parent_seller_id);
    if (!parentSeller || parentSeller.status !== "active") {
      return next(new AppError("The associated seller store is inactive, suspended, or unavailable.", 403));
    }
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
 * Dynamic Permission Guard (requirePermission)
 * Enforces database-backed seller-managed permissions.
 * Primary sellers and platform admins have full store authority ('*').
 * Team members must possess either '*' or all required permissions.
 */
export const requirePermission = (requiredPermission: string | string[]) => {
  const middleware = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      return next(new AppError("Authentication required.", 401));
    }

    if (!req.actingSellerId) {
      return next(new AppError("Seller context is required for permission evaluation.", 403));
    }

    // Platform admin and primary store owner have full authority within this store
    if (req.user.id === req.actingSellerId || req.user.role?.toLowerCase() === "admin") {
      return next();
    }

    const user = await resolveAuthenticatedUser(req.user.id);
    if (!user || user.status !== "active") {
      return next(new AppError("Account is inactive, suspended, or deleted.", 403));
    }

    const userPerms = new Set(user.permissions || []);
    if (userPerms.has("*")) {
      return next();
    }

    const required = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];
    const missing = required.filter((p) => !userPerms.has(p));

    if (missing.length > 0) {
      return next(
        new AppError(
          `Access denied. You do not have permission to perform this action (${missing.join(", ")}).`,
          403,
        ),
      );
    }

    next();
  };
  (middleware as any)._requiredPermission = requiredPermission;
  return middleware;
};

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

/**
 * Store Team View Guard (requireStoreManagementAccess)
 * Restricts viewing store team members to:
 * - Primary SELLER
 * - Platform ADMIN
 * - Store team members with 'team:view' or 'team:manage' permission
 */
export const requireStoreManagementAccess = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  if (!req.user) {
    return next(new AppError("Authentication required.", 401));
  }

  // Primary store owner or platform admin
  if (req.user.id === req.actingSellerId || req.user.role?.toLowerCase() === "admin") {
    return next();
  }

  const user = await resolveAuthenticatedUser(req.user.id);
  if (!user || user.status !== "active") {
    return next(new AppError("Account is inactive, suspended, or deleted.", 403));
  }

  const userPerms = new Set(user.permissions || []);
  if (userPerms.has("*") || userPerms.has("team:view") || userPerms.has("team:manage")) {
    return next();
  }

  return next(
    new AppError("Access denied. Insufficient permissions to access store team management.", 403),
  );
};
(requireStoreManagementAccess as any)._authRequired = true;

/**
 * Store Owner Guard (requireStoreOwnerAccess)
 * Restricts modifying store team members (add, update, remove) to:
 * - Primary SELLER (store owner)
 * - Platform ADMIN
 * - Authorized team members with 'team:manage' permission
 */
export const requireStoreOwnerAccess = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  if (!req.user) {
    return next(new AppError("Authentication required.", 401));
  }

  // Primary store owner or platform admin
  if (req.user.id === req.actingSellerId || req.user.role?.toLowerCase() === "admin") {
    return next();
  }

  const user = await resolveAuthenticatedUser(req.user.id);
  if (!user || user.status !== "active") {
    return next(new AppError("Account is inactive, suspended, or deleted.", 403));
  }

  const userPerms = new Set(user.permissions || []);
  if (userPerms.has("*") || userPerms.has("team:manage")) {
    return next();
  }

  return next(
    new AppError(
      "Access denied. Only the store owner or an authorized team manager can manage store team members.",
      403,
    ),
  );
};
(requireStoreOwnerAccess as any)._authRequired = true;

/**
 * Asset Mutation Guard (requireAssetMutationAccess)
 * Restricts modifying assets (create, update, delete, upload) to:
 * - Primary store owner or admin
 * - Team members with products:create, products:edit, products:publish, or products:delete permission
 */
export const requireAssetMutationAccess = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  if (!req.user) {
    return next(new AppError("Authentication required.", 401));
  }

  if (req.user.id === req.actingSellerId || req.user.role?.toLowerCase() === "admin") {
    return next();
  }

  const user = await resolveAuthenticatedUser(req.user.id);
  if (!user || user.status !== "active") {
    return next(new AppError("Account is inactive, suspended, or deleted.", 403));
  }

  const userPerms = new Set(user.permissions || []);
  if (userPerms.has("*")) {
    return next();
  }

  const hasMutationPerm =
    userPerms.has("products:create") ||
    userPerms.has("products:edit") ||
    userPerms.has("products:publish") ||
    userPerms.has("products:delete");

  if (!hasMutationPerm) {
    return next(
      new AppError(
        "Access denied. You have read-only access and cannot create, modify, or delete assets.",
        403,
      ),
    );
  }

  return next();
};
(requireAssetMutationAccess as any)._authRequired = true;
(requireAssetMutationAccess as any)._authRequired = true;



