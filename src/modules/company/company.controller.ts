import type { Request, Response, NextFunction } from "express";
import { companyService } from "./company.service.js";
import type { UpdateCompanyInput } from "./company.schema.js";

export class CompanyController {
  async getCompany(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await companyService.getCompany();
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as UpdateCompanyInput;
      const data = await companyService.updateCompany(body);
      res.status(200).json({
        success: true,
        message: "Company details updated successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const companyController = new CompanyController();
