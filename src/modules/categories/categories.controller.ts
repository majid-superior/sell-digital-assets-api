import type { Request, Response, NextFunction } from "express";
import { categoriesService } from "./categories.service.js";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
  CategoryQueryInput,
  IdParamInput,
} from "./categories.schema.js";

export class CategoriesController {
  async getCategories(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const query = (req.query as unknown as CategoryQueryInput) || {};
      const result = await categoriesService.getCategories(query);

      if (result.type === "paginated") {
        res.status(200).json({
          success: true,
          data: result.data,
          pagination: result.pagination,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result.data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCategoryById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params as unknown as IdParamInput;
      const category = await categoriesService.getCategoryById(id, true);

      res.status(200).json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  async createCategory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const body = req.body as CreateCategoryInput;
      const category = await categoriesService.createCategory(body);

      res.status(201).json({
        success: true,
        message: "Category created successfully",
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCategory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params as unknown as IdParamInput;
      const body = req.body as UpdateCategoryInput;
      const category = await categoriesService.updateCategory(id, body);

      res.status(200).json({
        success: true,
        message: "Category updated successfully",
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCategory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params as unknown as IdParamInput;
      const cascade = req.query.cascade === "true" || req.query.cascade === "1";
      await categoriesService.deleteCategory(id, cascade);

      res.status(200).json({
        success: true,
        message: "Category deactivated successfully",
        data: { id, is_active: false },
      });
    } catch (error) {
      next(error);
    }
  }

  async restoreCategory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params as unknown as IdParamInput;
      const restoreParents = req.query.restoreParents !== "false";
      await categoriesService.restoreCategory(id, restoreParents);

      res.status(200).json({
        success: true,
        message: "Category reactivated successfully",
        data: { id, is_active: true },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const categoriesController = new CategoriesController();

