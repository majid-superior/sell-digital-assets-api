import type { Request, Response, NextFunction } from "express";
import { bannersService } from "./banners.service.js";
import type {
  BannerIdParamInput,
  BannerQueryInput,
  CreateBannerInput,
  ToggleBannerStatusInput,
  UpdateBannerInput,
} from "./banners.schema.js";

export class BannersController {
  /**
   * Public endpoint: GET /api/v1/banners/active
   * Returns only currently active and schedule-eligible banners ordered by priority DESC.
   */
  async getActiveBanners(
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const banners = await bannersService.getActiveBanners();
      res.status(200).json({
        success: true,
        message: "Active promotional banners retrieved successfully",
        data: banners,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin endpoint: GET /api/v1/banners
   * Returns all promotional banners with computed schedule status and summary metrics.
   */
  async getAdminBanners(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const query = (req.query as unknown as BannerQueryInput) || {};
      const result = await bannersService.getAdminBanners(query);

      res.status(200).json({
        success: true,
        message: "Promotional banners retrieved successfully",
        data: result.banners,
        metrics: result.metrics,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin endpoint: GET /api/v1/banners/:id
   */
  async getBannerById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params as unknown as BannerIdParamInput;
      const banner = await bannersService.getBannerById(id);

      res.status(200).json({
        success: true,
        message: "Promotional banner retrieved successfully",
        data: banner,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin endpoint: POST /api/v1/banners
   */
  async createBanner(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const body = req.body as CreateBannerInput;
      const userId = req.user?.id ?? null;
      const banner = await bannersService.createBanner(body, userId);

      res.status(201).json({
        success: true,
        message: "Promotional banner created successfully",
        data: banner,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin endpoint: PATCH / PUT /api/v1/banners/:id
   */
  async updateBanner(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params as unknown as BannerIdParamInput;
      const body = req.body as UpdateBannerInput;
      const banner = await bannersService.updateBanner(id, body);

      res.status(200).json({
        success: true,
        message: "Promotional banner updated successfully",
        data: banner,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin endpoint: PATCH /api/v1/banners/:id/status
   */
  async toggleBannerStatus(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params as unknown as BannerIdParamInput;
      const body = req.body as ToggleBannerStatusInput;
      const isActive = Boolean(body.isActive ?? body.is_active);
      const banner = await bannersService.toggleBannerStatus(id, isActive);

      res.status(200).json({
        success: true,
        message: isActive
          ? "Promotional banner activated successfully"
          : "Promotional banner deactivated successfully",
        data: banner,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin endpoint: DELETE /api/v1/banners/:id
   */
  async deleteBanner(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params as unknown as BannerIdParamInput;
      const deleted = await bannersService.deleteBanner(id);

      res.status(200).json({
        success: true,
        message: "Promotional banner deleted successfully",
        data: deleted,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const bannersController = new BannersController();
export default bannersController;
