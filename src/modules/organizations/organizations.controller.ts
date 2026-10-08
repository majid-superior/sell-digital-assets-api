import type { Request, Response, NextFunction } from "express";
import { organizationsService } from "./organizations.service.js";
import type { UpdateOrganizationInput } from "./organizations.schema.js";

export class OrganizationsController {
  async getOrganization(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await organizationsService.getOrganization();
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
}

export const organizationsController = new OrganizationsController();
export const organizationController = organizationsController;
