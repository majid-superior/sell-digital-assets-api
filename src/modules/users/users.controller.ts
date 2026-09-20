import type { Request, Response, NextFunction } from "express";
import { usersService } from "./users.service.js";
import { AppError } from "../../core/errors/app-error.js";
import type { CreateUserInput, PaginationQueryInput, UuidParamInput } from "./users.schema.js";

export class UsersController {
  async getAllUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = (req.query as unknown as PaginationQueryInput) || {};
      const page = query.page ?? 1;
      const limit = query.limit ?? 20;

      const result = await usersService.getAllUsers({ page, limit });
      res.status(200).json({
        success: true,
        ...result,
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

      const user = await usersService.getUserById(req.user.id);
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as unknown as UuidParamInput;
      const user = await usersService.getUserById(id);
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as CreateUserInput;
      const user = await usersService.createUser(body);

      res.status(201).json({
        success: true,
        message: "User created successfully",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const usersController = new UsersController();
