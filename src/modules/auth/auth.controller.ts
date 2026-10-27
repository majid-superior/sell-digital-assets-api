import type { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service.js";
import { AppError } from "../../core/errors/app-error.js";
import { extractAuthToken } from "../../core/middleware/auth.middleware.js";
import { logAuditFromReq } from "../../core/logger/audit-logger.js";

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.register(req.body);
      logAuditFromReq(req, {
        severity: "info",
        category: "auth",
        action: "auth.register",
        source: "auth",
        actor_id: result.user.id,
        actor_email: result.user.email,
        actor_role: result.user.role,
        outcome: "success",
        message: `New user registered with role ${result.user.role}: ${result.user.email}`,
      }).catch(() => {});

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: result,
        token: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async signIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.signIn(req.body);
      logAuditFromReq(req, {
        severity: "info",
        category: "auth",
        action: "auth.login",
        source: "auth",
        actor_id: result.user.id,
        actor_email: result.user.email,
        actor_role: result.user.role,
        outcome: "success",
        message: `User ${result.user.email} signed in successfully`,
        metadata: { role: result.user.role, status: result.user.status },
      }).catch(() => {});

      res.status(200).json({
        success: true,
        message: "Authentication successful",
        data: result,
        token: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
        ...result,
      });
    } catch (error) {
      logAuditFromReq(req, {
        severity: "warn",
        category: "auth",
        action: "auth.failed_login",
        source: "auth",
        actor_email: typeof req.body?.email === "string" ? req.body.email : null,
        actor_role: "anonymous",
        outcome: "failure",
        message: `Failed sign-in attempt for email: ${typeof req.body?.email === "string" ? req.body.email : "unknown"}`,
        metadata: { reason: (error as Error)?.message || "invalid_credentials" },
      }).catch(() => {});
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.body?.refreshToken || req.cookies?.refreshToken;
      if (!refreshToken || typeof refreshToken !== "string") {
        throw new AppError("Refresh token is required via request body or cookie", 400);
      }

      const result = await authService.refresh(refreshToken);
      res.status(200).json({
        success: true,
        message: "Access token refreshed successfully",
        data: result,
        token: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async signOut(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.body?.refreshToken || req.cookies?.refreshToken;
      const accessToken = extractAuthToken(req);

      await authService.signOut(refreshToken, accessToken);

      logAuditFromReq(req, {
        severity: "info",
        category: "auth",
        action: "auth.logout",
        source: "auth",
        outcome: "success",
        message: "User signed out and revoked active tokens",
      }).catch(() => {});

      res.clearCookie("accessToken", { httpOnly: true, secure: true, sameSite: "strict" });
      res.clearCookie("refreshToken", { httpOnly: true, secure: true, sameSite: "strict" });

      res.status(200).json({
        success: true,
        message: "Successfully signed out",
      });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Authentication required", 401);
      }

      const user = await authService.getMe(req.user.id);
      res.status(200).json({
        success: true,
        data: user,
        user,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Authentication required", 401);
      }

      const user = await authService.updateMe(req.user.id, req.body);
      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async becomeSeller(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Authentication required", 401);
      }

      const result = await authService.becomeSeller(req.user.id);
      res.status(200).json({
        success: true,
        message: "Account upgraded to Seller successfully. Welcome to the Seller Studio!",
        data: result.user,
        user: result.user,
        tokens: result.tokens,
        token: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
