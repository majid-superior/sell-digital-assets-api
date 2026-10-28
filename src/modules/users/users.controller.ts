import type { Request, Response, NextFunction } from "express";
import { usersService } from "./users.service.js";
import { AppError } from "../../core/errors/app-error.js";
import { logAuditFromReq } from "../../core/logger/audit-logger.js";
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

      logAuditFromReq(req, {
        severity: "info",
        category: "admin",
        action: "user.update",
        source: "users",
        target_id: id,
        target_type: "user",
        outcome: "success",
        message: `User ${user.email} was updated by administrator`,
        metadata: {
          updatedFields: Object.keys(body).filter((k) => k !== "password"),
          newStatus: body.status,
        },
      }).catch(() => {});

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

      logAuditFromReq(req, {
        severity: "warn",
        category: "admin",
        action: "user.deactivate",
        source: "users",
        target_id: id,
        target_type: "user",
        outcome: "success",
        message: `User ${id} was deactivated by administrator`,
      }).catch(() => {});

      res.status(200).json({
        success: true,
        message: "User deactivated successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async getStoreRoles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const includeInactive = req.query.includeInactive === "true" || req.query.includeInactive === "1";
      const roles = await usersService.getStoreRoles(includeInactive);
      res.status(200).json({
        success: true,
        data: roles,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPermissionsCatalog(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const permissions = await usersService.getPermissionsCatalog();
      res.status(200).json({
        success: true,
        data: permissions,
      });
    } catch (error) {
      next(error);
    }
  }

  async getStoreRolePermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = req.actingSellerId || req.user?.id;
      if (!sellerId) {
        throw new AppError("Seller context is required", 401);
      }
      const includeInactive = req.query.includeInactive === "true" || req.query.includeInactive === "1";
      const rolePermissions = await usersService.getStoreRolePermissions(sellerId, includeInactive);
      res.status(200).json({
        success: true,
        data: rolePermissions,
      });
    } catch (error) {
      next(error);
    }
  }

  async createStoreRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = req.actingSellerId || req.user?.id;
      if (!sellerId) {
        throw new AppError("Seller context is required", 401);
      }
      const role = await usersService.createStoreRole(sellerId, req.body);
      res.status(201).json({
        success: true,
        message: `Store role '${role.name}' created successfully`,
        data: role,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStoreRoleStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { roleId } = req.params as { roleId: string };
      const { is_active } = req.body as { is_active: boolean };
      const role = await usersService.updateStoreRoleStatus(Number(roleId), is_active);
      res.status(200).json({
        success: true,
        message: `Store role '${role.name}' has been ${is_active ? "reactivated" : "deactivated"} successfully`,
        data: role,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStoreRolePermissionsMatrix(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = req.actingSellerId || req.user?.id;
      if (!sellerId) {
        throw new AppError("Seller context is required", 401);
      }
      const { matrix } = req.body as { matrix: Array<{ roleId: number; permissions: string[] }> };
      const result = await usersService.updateStoreRolePermissionsMatrix(sellerId, matrix);
      res.status(200).json({
        success: true,
        message: "Store permissions matrix updated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStoreRolePermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = req.actingSellerId || req.user?.id;
      if (!sellerId) {
        throw new AppError("Seller context is required", 401);
      }
      const { roleId } = req.params as { roleId: string };
      const { permissions } = req.body as { permissions: string[] };

      const result = await usersService.updateStoreRolePermissions(
        sellerId,
        Number(roleId),
        permissions,
      );

      res.status(200).json({
        success: true,
        message: "Store role permissions updated successfully",
        data: result,
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
