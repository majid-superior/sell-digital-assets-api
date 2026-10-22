import type { Request, Response, NextFunction } from "express";
import { organizationsService } from "./organizations.service.js";
import type { UpdateOrganizationInput } from "./organizations.schema.js";

export class OrganizationsController {
  async getOrganization(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const isAdmin = req.user?.role === "admin";
      const data = await organizationsService.getOrganization(isAdmin);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateOrganization(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as UpdateOrganizationInput;
      const data = await organizationsService.updateOrganization(body);
      res.status(200).json({
        success: true,
        message: "Organization details updated successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCurrencies(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await organizationsService.getCurrencies();
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSystemSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const isAdmin = req.user?.role === "admin";
      const data = await organizationsService.getSystemSettings(isAdmin);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateSystemSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body;
      const data = await organizationsService.updateSystemSettings(body);
      res.status(200).json({
        success: true,
        message: "System settings updated successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const organizationsController = new OrganizationsController();
export const organizationController = organizationsController;
