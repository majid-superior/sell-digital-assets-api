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
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body);
      res.status(200).json({
        success: true,
        message: "Authentication successful",
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
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.body?.refreshToken || req.cookies?.refreshToken;
      await authService.logout(refreshToken);

      res.clearCookie("accessToken", { httpOnly: true, secure: true, sameSite: "strict" });
      res.clearCookie("refreshToken", { httpOnly: true, secure: true, sameSite: "strict" });

      res.status(200).json({
        success: true,
        message: "Successfully logged out",
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
