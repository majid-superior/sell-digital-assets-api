import type { Request, Response, NextFunction } from "express";
import { usersService } from "./users.service.js";
import type { PaginationQueryInput, UuidParamInput, UpdateUserInput } from "./users.schema.js";

export class UsersController {
  async getAllUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = (req.query as unknown as PaginationQueryInput) || {};
      const page = query.page ?? 1;
      const limit = query.limit ?? 20;
      const { search, role, status } = query;

      const result = await usersService.getAllUsers({ page, limit, search, role, status });
      res.status(200).json({
        success: true,
        ...result,
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

  async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as unknown as UuidParamInput;
      const body = req.body as UpdateUserInput;
      const user = await usersService.updateUser(id, body);

      res.status(200).json({
        success: true,
        message: "User updated successfully",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as unknown as UuidParamInput;
      await usersService.deleteUser(id);

      res.status(200).json({
        success: true,
        message: "User deactivated successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

export const usersController = new UsersController();
