import type { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/app-error.js";
import { verifyAccessToken, type AuthUserPayload } from "../security/tokens.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    throw new AppError("Authentication required. Please provide a valid Bearer token.", 401);
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (err: unknown) {
    if ((err as Error).name === "TokenExpiredError") {
      throw new AppError("Access token expired. Please refresh your token.", 401);
    }
    throw new AppError("Invalid authentication token.", 401);
  }
};
(authenticate as any)._authRequired = true;

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

