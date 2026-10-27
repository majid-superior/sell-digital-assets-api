import type { Request, Response, NextFunction } from "express";
import { usersService } from "./users.service.js";
import { AppError } from "../../core/errors/app-error.js";
import type {
  PaginationQueryInput,
  UuidParamInput,
  UpdateUserInput,
  CreateTeamMemberInput,
  UpdateTeamMemberInput,
} from "./users.schema.js";

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
      const user = await usersService.updateUser(id, body, req.user?.id);

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
      await usersService.deleteUser(id, req.user?.id);

      res.status(200).json({
        success: true,
        message: "User deactivated successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async getSellerTeam(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = req.actingSellerId || req.user?.id;
      if (!sellerId) {
        throw new AppError("Seller context is required", 401);
      }
      const members = await usersService.getSellerTeam(sellerId);
      res.status(200).json({
        success: true,
        data: members,
      });
    } catch (error) {
      next(error);
    }
  }

  async createTeamMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = req.actingSellerId || req.user?.id;
      if (!sellerId) {
        throw new AppError("Seller context is required", 401);
      }
      const member = await usersService.createTeamMember(
        sellerId,
        req.body as CreateTeamMemberInput,
      );
      res.status(201).json({
        success: true,
        message: "Team member added successfully",
        data: member,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateTeamMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = req.actingSellerId || req.user?.id;
      if (!sellerId) {
        throw new AppError("Seller context is required", 401);
      }
      const { id } = req.params as unknown as UuidParamInput;
      const member = await usersService.updateTeamMember(
        sellerId,
        id,
        req.body as UpdateTeamMemberInput,
      );
      res.status(200).json({
        success: true,
        message: "Team member updated successfully",
        data: member,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteTeamMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = req.actingSellerId || req.user?.id;
      if (!sellerId) {
        throw new AppError("Seller context is required", 401);
      }
      const { id } = req.params as unknown as UuidParamInput;
      await usersService.deleteTeamMember(sellerId, id);
      res.status(200).json({
        success: true,
        message: "Team member removed successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

export const usersController = new UsersController();
