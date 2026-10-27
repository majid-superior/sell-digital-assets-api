import { couponRepository, type UpdateCouponInput as RepoUpdateCouponInput } from "../../database/repositories/coupon.repository.js";
import { AppError } from "../../core/errors/app-error.js";
import { pool } from "../../config/database.js";
import type { CouponEntity } from "../../database/types.js";
import type {
  CreateCouponInput,
  UpdateCouponInput,
  ListCouponsQueryInput,
  ValidateCouponInput,
} from "./coupons.schema.js";

export interface CartValidationResult {
  valid: boolean;
  coupon: {
    id: string;
    code: string;
    description: string | null;
    discountPercent: number;
    sellerId: string;
    startsAt: Date | string;
    endsAt: Date | string;
  };
  eligibleAssetIds: string[];
  eligibleSubtotal: number;
  discountAmount: number;
  discountedSubtotal: number;
  overallSubtotal: number;
  finalTotal: number;
  currency: string;
}

export class CouponsService {
  /**
   * Create a new coupon for an authenticated seller.
   */
  async createCoupon(sellerId: string, input: CreateCouponInput): Promise<CouponEntity> {
    const normalizedCode = input.code.trim().toUpperCase();

    // Check code uniqueness
    const existing = await couponRepository.findByCode(normalizedCode);
    if (existing) {
      throw new AppError(`Coupon code "${normalizedCode}" is already in use. Please choose a different code.`, 409);
    }

    return couponRepository.create({
      seller_id: sellerId,
      code: normalizedCode,
      description: input.description ?? null,
      discount_percent: input.discountPercent,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      usage_limit: input.usageLimit ?? null,
      is_active: input.isActive ?? true,
    });
  }

  /**
   * List coupons belonging to the seller with filtering, pagination, and KPI metrics.
   */
  async getCoupons(sellerId: string, query: ListCouponsQueryInput) {
    return couponRepository.listBySeller(sellerId, {
      search: query.search ?? undefined,
      status: query.status ?? undefined,
      sortBy: query.sortBy ?? undefined,
      sortOrder: query.sortOrder ?? undefined,
      page: query.page,
      limit: query.limit,
    });
  }

  /**
   * Retrieve a specific coupon owned by the seller.
   */
  async getCouponById(id: string, sellerId: string): Promise<CouponEntity> {
    const coupon = await couponRepository.findById(id, sellerId);
    if (!coupon) {
      throw new AppError("Coupon not found or you do not have permission to access it.", 404);
    }
    return coupon;
  }

  /**
   * Update permitted fields of a seller's coupon.
   */
  async updateCoupon(id: string, sellerId: string, input: UpdateCouponInput): Promise<CouponEntity> {
    const existing = await couponRepository.findById(id, sellerId);
    if (!existing) {
      throw new AppError("Coupon not found or you do not have permission to modify it.", 404);
    }

    // Verify date consistency if one or both dates are updated
    const newStartsAt = input.startsAt ? new Date(input.startsAt) : new Date(existing.starts_at);
    const newEndsAt = input.endsAt ? new Date(input.endsAt) : new Date(existing.ends_at);

    if (newEndsAt.getTime() <= newStartsAt.getTime()) {
      throw new AppError("End date/time must be strictly after the start date/time.", 400);
    }

    // Verify usage limit is not less than already-consumed redemptions
    if (input.usageLimit !== undefined && input.usageLimit !== null && input.usageLimit < existing.usage_count) {
      throw new AppError(
        `Usage limit (${input.usageLimit}) cannot be less than current redemptions count (${existing.usage_count}).`,
        400,
      );
    }

    const repoInput: RepoUpdateCouponInput = {};
    if (input.description !== undefined) repoInput.description = input.description;
    if (input.discountPercent !== undefined) repoInput.discount_percent = input.discountPercent;
    if (input.startsAt !== undefined) repoInput.starts_at = input.startsAt;
    if (input.endsAt !== undefined) repoInput.ends_at = input.endsAt;
    if (input.usageLimit !== undefined) repoInput.usage_limit = input.usageLimit;
    if (input.isActive !== undefined) repoInput.is_active = input.isActive;

    const updated = await couponRepository.update(id, sellerId, repoInput);

    if (!updated) {
      throw new AppError("Failed to update coupon.", 500);
    }

    return updated;
  }

  /**
   * Toggle coupon activation status (activate / deactivate).
   */
  async updateCouponStatus(id: string, sellerId: string, isActive: boolean): Promise<CouponEntity> {
    const existing = await couponRepository.findById(id, sellerId);
    if (!existing) {
      throw new AppError("Coupon not found or you do not have permission to modify it.", 404);
    }

    const updated = await couponRepository.updateStatus(id, sellerId, isActive);
    if (!updated) {
      throw new AppError("Failed to update coupon status.", 500);
    }

    return updated;
  }

  /**
   * Delete a coupon if it has never been redeemed.
   */
  async deleteCoupon(id: string, sellerId: string): Promise<{ success: boolean; message: string }> {
    const existing = await couponRepository.findById(id, sellerId);
    if (!existing) {
      throw new AppError("Coupon not found or you do not have permission to delete it.", 404);
    }

    if (existing.usage_count > 0) {
      throw new AppError(
        `Cannot delete coupon "${existing.code}" because it has ${existing.usage_count} active redemption record(s). Deactivate the coupon instead to prevent future use while preserving order audit history.`,
        400,
      );
    }

    const deleted = await couponRepository.delete(id, sellerId);
    if (!deleted) {
      throw new AppError("Failed to delete coupon.", 500);
    }

    return {
      success: true,
      message: `Coupon "${existing.code}" deleted successfully.`,
    };
  }

  /**
   * Validate a coupon against a buyer's cart items with authoritative database pricing,
   * seller ownership verification, validity windows, and usage bounds.
   */
  async validateCouponForCart(
    _buyerId: string | undefined,
    input: ValidateCouponInput,
  ): Promise<CartValidationResult> {
    const normalizedCode = input.code.trim().toUpperCase();

    // 1. Fetch coupon
    const coupon = await couponRepository.findByCode(normalizedCode);
    if (!coupon) {
      throw new AppError(`Invalid coupon code "${normalizedCode}".`, 404);
    }

    // 2. Validate active state
    if (!coupon.is_active) {
      throw new AppError(`Coupon "${normalizedCode}" is currently inactive.`, 400);
    }

    // 3. Validate date validity window
    const now = new Date();
    const startsAt = new Date(coupon.starts_at);
    const endsAt = new Date(coupon.ends_at);

    if (now < startsAt) {
      throw new AppError(
        `Coupon "${normalizedCode}" is scheduled and will become valid on ${startsAt.toUTCString()}.`,
        400,
      );
    }

    if (now > endsAt) {
      throw new AppError(`Coupon "${normalizedCode}" has expired.`, 400);
    }

    // 4. Validate usage limit
    if (coupon.usage_limit != null && coupon.usage_count >= coupon.usage_limit) {
      throw new AppError(`Coupon "${normalizedCode}" has reached its maximum redemption limit.`, 400);
    }

    // 5. Query authoritative asset details from database for all cart items
    const assetIds = Array.from(new Set(input.items.map((i) => i.assetId)));
    const assetRes = await pool.query<{
      id: string;
      seller_id: string;
      title: string;
      slug: string;
      status: string;
      is_active: boolean;
      tiers: Array<{ tier_type: string; price: number }>;
    }>(
      `SELECT 
        a.id,
        a.seller_id,
        a.title,
        a.slug,
        a.status,
        a.is_active,
        COALESCE(
          (SELECT json_agg(json_build_object('tier_type', at.tier_type, 'price', at.price::float))
           FROM asset_tiers at
           WHERE at.asset_id = a.id),
          '[]'::json
        ) AS tiers
       FROM assets a
       WHERE a.id = ANY($1::uuid[]) AND a.deleted_at IS NULL;`,
      [assetIds],
    );

    const assetMap = new Map<string, (typeof assetRes.rows)[0]>();
    for (const row of assetRes.rows) {
      assetMap.set(row.id, row);
    }

    // 6. Calculate authoritative item prices and evaluate eligibility
    const eligibleAssetIds: string[] = [];
    let eligibleSubtotal = 0;
    let overallSubtotal = 0;

    for (const item of input.items) {
      const dbAsset = assetMap.get(item.assetId);
      if (!dbAsset || !dbAsset.is_active || dbAsset.status !== "published") {
        continue;
      }

      // Resolve authoritative price from database tiers
      let itemPrice = 0;
      if (item.tierType) {
        const matchingTier = dbAsset.tiers.find((t) => t.tier_type === item.tierType);
        if (matchingTier) {
          itemPrice = matchingTier.price;
        }
      }

      if (itemPrice === 0 && dbAsset.tiers.length > 0) {
        // Fallback to minimal available tier price or first tier
        const minPrice = Math.min(...dbAsset.tiers.map((t) => t.price));
        itemPrice = isFinite(minPrice) ? minPrice : (dbAsset.tiers[0]?.price ?? 0);
      }

      if (itemPrice === 0 && typeof item.price === "number" && item.price >= 0) {
        // Fallback to client specified price if tiers table is not populated for this asset
        itemPrice = item.price;
      }

      overallSubtotal += itemPrice;

      // Ownership and eligibility check:
      // Coupon applies ONLY to paid assets (price > 0) owned by the coupon's seller!
      if (dbAsset.seller_id === coupon.seller_id && itemPrice > 0) {
        eligibleAssetIds.push(item.assetId);
        eligibleSubtotal += itemPrice;
      }
    }

    // 7. Verify at least one item was eligible
    if (eligibleAssetIds.length === 0 || eligibleSubtotal <= 0) {
      throw new AppError(
        `Coupon "${normalizedCode}" is not applicable to any items in your cart. This coupon applies only to paid assets published by this merchant.`,
        400,
      );
    }

    // 8. Round currency calculations to 2 decimal places
    const rawDiscount = (eligibleSubtotal * coupon.discount_percent) / 100;
    const discountAmount = Math.round(rawDiscount * 100) / 100;
    const discountedSubtotal = Math.max(0, Math.round((eligibleSubtotal - discountAmount) * 100) / 100);
    const finalTotal = Math.max(0, Math.round((overallSubtotal - discountAmount) * 100) / 100);

    return {
      valid: true,
      coupon: {
        id: coupon.id!,
        code: coupon.code,
        description: coupon.description ?? null,
        discountPercent: coupon.discount_percent,
        sellerId: coupon.seller_id,
        startsAt: coupon.starts_at,
        endsAt: coupon.ends_at,
      },
      eligibleAssetIds,
      eligibleSubtotal: Math.round(eligibleSubtotal * 100) / 100,
      discountAmount,
      discountedSubtotal,
      overallSubtotal: Math.round(overallSubtotal * 100) / 100,
      finalTotal,
      currency: "USD",
    };
  }

  /**
   * Concurrency-safe checkout redemption handler.
   * Atomically increments usage count and records redemption.
   */
  async redeemCouponAtCheckout(params: {
    couponCode: string;
    buyerId: string;
    orderId?: string | null;
    items: Array<{ assetId: string; price?: number; tierType?: "personal" | "commercial" | "extended" }>;
  }) {
    // 1. Validate cart eligibility and compute discount
    const validation = await this.validateCouponForCart(params.buyerId, {
      code: params.couponCode,
      items: params.items,
    });

    // 2. Concurrency-safe atomic increment of usage count
    const consumed = await couponRepository.incrementUsageAtomic(validation.coupon.id);
    if (!consumed) {
      throw new AppError(
        `Coupon "${validation.coupon.code}" could not be redeemed. Its usage limit has been reached or it has expired.`,
        409,
      );
    }

    // 3. Record redemption record in database
    try {
      const redemption = await couponRepository.recordRedemption({
        coupon_id: validation.coupon.id,
        buyer_id: params.buyerId,
        order_id: params.orderId || null,
        discount_amount: validation.discountAmount,
        currency: validation.currency,
        original_subtotal: validation.eligibleSubtotal,
        discounted_subtotal: validation.discountedSubtotal,
        status: "completed",
      });

      return {
        success: true,
        redemption,
        validation,
      };
    } catch (error) {
      // Rollback usage count if database insert failed
      await couponRepository.decrementUsageAtomic(validation.coupon.id);
      throw error;
    }
  }
}

export const couponsService = new CouponsService();
