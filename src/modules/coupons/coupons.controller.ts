import type { Request, Response, NextFunction } from "express";
import { couponsService } from "./coupons.service.js";
import { AppError } from "../../core/errors/app-error.js";
import {
  CreateCouponSchema,
  UpdateCouponSchema,
  UpdateCouponStatusSchema,
  ValidateCouponSchema,
  ListCouponsQuerySchema,
} from "./coupons.schema.js";

export class CouponsController {
  private getSellerId(req: Request): string {
    const sellerId = req.actingSellerId || req.user?.id;
    if (!sellerId) {
      throw new AppError("Authentication required: Seller identity is missing.", 401);
    }
    return sellerId;
  }

  private getIdParam(req: Request): string {
    const rawId = req.params.id;
    if (!rawId || typeof rawId !== "string") {
      throw new AppError("Missing coupon ID parameter", 400);
    }
    return rawId;
  }

  async createCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = this.getSellerId(req);
      const validatedInput = CreateCouponSchema.parse(req.body);
      const coupon = await couponsService.createCoupon(sellerId, validatedInput);

      res.status(201).json({
        success: true,
        data: coupon,
        message: "Coupon created successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async getCoupons(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = this.getSellerId(req);
      const query = ListCouponsQuerySchema.parse(req.query);
      const result = await couponsService.getCoupons(sellerId, query);

      res.status(200).json({
        success: true,
        data: result.items,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
        metrics: result.metrics,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCouponById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = this.getSellerId(req);
      const id = this.getIdParam(req);
      const coupon = await couponsService.getCouponById(id, sellerId);

      res.status(200).json({
        success: true,
        data: coupon,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = this.getSellerId(req);
      const id = this.getIdParam(req);
      const validatedInput = UpdateCouponSchema.parse(req.body);
      const coupon = await couponsService.updateCoupon(id, sellerId, validatedInput);

      res.status(200).json({
        success: true,
        data: coupon,
        message: "Coupon updated successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCouponStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = this.getSellerId(req);
      const id = this.getIdParam(req);
      const validatedInput = UpdateCouponStatusSchema.parse(req.body);
      const coupon = await couponsService.updateCouponStatus(
        id,
        sellerId,
        validatedInput.isActive,
      );

      res.status(200).json({
        success: true,
        data: coupon,
        message: `Coupon ${validatedInput.isActive ? "activated" : "deactivated"} successfully`,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = this.getSellerId(req);
      const id = this.getIdParam(req);
      const result = await couponsService.deleteCoupon(id, sellerId);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  async validateCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const buyerId = req.user?.id;
      const validatedInput = ValidateCouponSchema.parse(req.body);
      const result = await couponsService.validateCouponForCart(buyerId, validatedInput);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const couponsController = new CouponsController();
