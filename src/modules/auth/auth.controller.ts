import type { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service.js";
import { AppError } from "../../core/errors/app-error.js";

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.register(req.body);
      res.status(201).json({
        success: true,
        message: "User registered successfully",
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
      res.status(200).json({
        success: true,
        message: "Authentication successful",
        token: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
        ...result,
      });
    } catch (error) {
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
      await authService.signOut(refreshToken);

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
        ...user,
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
}

export const authController = new AuthController();
