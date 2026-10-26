import type { Request, Response, NextFunction } from "express";
import { storefrontService } from "./storefront.service.js";
import { AppError } from "../../core/errors/app-error.js";
import type { UpdateStorefrontInput, StorefrontSlugParamInput } from "./storefront.schema.js";

export class StorefrontController {
  private getSellerId(req: Request): string {
    const sellerId = req.user?.id;
    if (!sellerId) {
      throw new AppError("Authentication required: Seller identity is missing.", 401);
    }
    return sellerId;
  }

  async getSellerStorefront(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = this.getSellerId(req);
      const config = await storefrontService.getStorefrontConfig(sellerId);
      res.status(200).json({
        success: true,
        data: config,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateSellerStorefront(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = this.getSellerId(req);
      const body = req.body as UpdateStorefrontInput;
      const config = await storefrontService.updateStorefrontConfig(sellerId, body);
      res.status(200).json({
        success: true,
        data: config,
        message: "Storefront updated successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async uploadBanner(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = this.getSellerId(req);
      const result = await storefrontService.uploadStorefrontBanner(sellerId, req.file);
      res.status(200).json({
        success: true,
        data: result,
        message: "Banner uploaded successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async getPublicStorefront(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sellerUrl } = req.params as unknown as StorefrontSlugParamInput;
      const storefront = await storefrontService.getPublicStorefront(sellerUrl);
      res.status(200).json({
        success: true,
        data: storefront,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const storefrontController = new StorefrontController();

