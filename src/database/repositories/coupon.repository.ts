import type { QueryResultRow } from "pg";
import { BaseRepository } from "./base.repository.js";
import type { CouponEntity, CouponRedemptionEntity, CouponStatus } from "../types.js";

export interface CouponRow extends QueryResultRow, CouponEntity {}

export interface CouponRedemptionRow extends QueryResultRow, CouponRedemptionEntity {}

export interface CreateCouponInput {
  seller_id: string;
  code: string;
  description?: string | null | undefined;
  discount_percent: number;
  starts_at: Date | string;
  ends_at: Date | string;
  usage_limit?: number | null | undefined;
  is_active?: boolean | undefined;
}

export interface UpdateCouponInput {
  description?: string | null | undefined;
  discount_percent?: number | undefined;
  starts_at?: Date | string | undefined;
  ends_at?: Date | string | undefined;
  usage_limit?: number | null | undefined;
  is_active?: boolean | undefined;
}

export interface ListCouponsQuery {
  search?: string | undefined;
  status?: CouponStatus | "all" | undefined;
  sortBy?: "created_at" | "code" | "discount_percent" | "ends_at" | "usage_count" | undefined;
  sortOrder?: "asc" | "desc" | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}

export interface ListCouponsResult {
  items: CouponEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  metrics: {
    totalCoupons: number;
    activeCoupons: number;
    totalRedemptions: number;
    totalDiscountAmount: number;
  };
}

export function computeCouponStatus(coupon: {
  is_active: boolean;
  starts_at: Date | string;
  ends_at: Date | string;
  usage_limit?: number | null | undefined;
  usage_count: number;
}): CouponStatus {
  if (!coupon.is_active) {
    return "inactive";
  }
  const now = new Date();
  const startsAt = new Date(coupon.starts_at);
  const endsAt = new Date(coupon.ends_at);

  if (now < startsAt) {
    return "scheduled";
  }
  if (now > endsAt) {
    return "expired";
  }
  if (coupon.usage_limit != null && coupon.usage_count >= coupon.usage_limit) {
    return "expired";
  }
  return "active";
}

export class CouponRepository extends BaseRepository<CouponRow> {
  async create(input: CreateCouponInput): Promise<CouponEntity> {
    const normalizedCode = input.code.trim().toUpperCase();
    const isActive = input.is_active !== undefined ? input.is_active : true;

    const res = await this.query<CouponRow>(
      `INSERT INTO coupons (
        seller_id,
        code,
        description,
        discount_percent,
        starts_at,
        ends_at,
        usage_limit,
        usage_count,
        is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8)
      RETURNING *`,
      [
        input.seller_id,
        normalizedCode,
        input.description || null,
        input.discount_percent,
        input.starts_at,
        input.ends_at,
        input.usage_limit !== undefined && input.usage_limit !== null ? input.usage_limit : null,
        isActive,
      ],
    );

    const row = res.rows[0];
    if (!row) {
      throw new Error("Failed to insert coupon record");
    }
    return {
      id: row.id,
      seller_id: row.seller_id,
      code: row.code,
      description: row.description,
      discount_percent: row.discount_percent,
      starts_at: row.starts_at,
      ends_at: row.ends_at,
      usage_limit: row.usage_limit,
      usage_count: row.usage_count,
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at,
      status: computeCouponStatus(row),
    };
  }

  async findById(id: string, sellerId?: string): Promise<CouponEntity | null> {
    const params: unknown[] = [id];
    let query = `
      SELECT c.*, u.name AS seller_name, u.email AS seller_email
      FROM coupons c
      LEFT JOIN users u ON u.id = c.seller_id
      WHERE c.id = $1
    `;

    if (sellerId) {
      params.push(sellerId);
      query += ` AND c.seller_id = $2`;
    }

    query += ` LIMIT 1`;

    const res = await this.query<CouponRow & { seller_name?: string; seller_email?: string }>(
      query,
      params,
    );
    if (!res.rows[0]) return null;

    const row = res.rows[0];
    return {
      ...row,
      status: computeCouponStatus(row),
      ...(row.seller_name
        ? {
            seller: {
              id: row.seller_id,
              name: row.seller_name,
              email: row.seller_email ?? undefined,
            },
          }
        : {}),
    };
  }

  async findByCode(code: string): Promise<CouponEntity | null> {
    const normalizedCode = code.trim().toUpperCase();
    const res = await this.query<CouponRow & { seller_name?: string; seller_email?: string }>(
      `SELECT c.*, u.name AS seller_name, u.email AS seller_email
       FROM coupons c
       LEFT JOIN users u ON u.id = c.seller_id
       WHERE UPPER(c.code) = $1
       LIMIT 1`,
      [normalizedCode],
    );

    if (!res.rows[0]) return null;

    const row = res.rows[0];
    return {
      ...row,
      status: computeCouponStatus(row),
      ...(row.seller_name
        ? {
            seller: {
              id: row.seller_id,
              name: row.seller_name,
              email: row.seller_email ?? undefined,
            },
          }
        : {}),
    };
  }

  async listBySeller(sellerId: string, options: ListCouponsQuery = {}): Promise<ListCouponsResult> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(100, options.limit || 20));
    const offset = (page - 1) * limit;

    const conditions: string[] = ["c.seller_id = $1"];
    const params: unknown[] = [sellerId];
    let paramIndex = 2;

    if (options.search && options.search.trim()) {
      const sanitized = `%${this.escapeLike(options.search.trim())}%`;
      conditions.push(`(c.code ILIKE $${paramIndex} OR c.description ILIKE $${paramIndex})`);
      params.push(sanitized);
      paramIndex++;
    }

    if (options.status && options.status !== "all") {
      switch (options.status) {
        case "active":
          conditions.push(
            `(c.is_active = TRUE AND c.starts_at <= CURRENT_TIMESTAMP AND c.ends_at >= CURRENT_TIMESTAMP AND (c.usage_limit IS NULL OR c.usage_count < c.usage_limit))`,
          );
          break;
        case "inactive":
          conditions.push(`(c.is_active = FALSE)`);
          break;
        case "scheduled":
          conditions.push(`(c.is_active = TRUE AND c.starts_at > CURRENT_TIMESTAMP)`);
          break;
        case "expired":
          conditions.push(
            `(c.is_active = TRUE AND (c.ends_at < CURRENT_TIMESTAMP OR (c.usage_limit IS NOT NULL AND c.usage_count >= c.usage_limit)))`,
          );
          break;
      }
    }

    const whereClause = conditions.join(" AND ");

    // Sorting safe whitelist
    const sortFieldMap: Record<string, string> = {
      created_at: "c.created_at",
      code: "c.code",
      discount_percent: "c.discount_percent",
      ends_at: "c.ends_at",
      usage_count: "c.usage_count",
    };
    const sortColumn = sortFieldMap[options.sortBy || "created_at"] || "c.created_at";
    const sortDirection = options.sortOrder?.toLowerCase() === "asc" ? "ASC" : "DESC";

    // Count filtered items
    const countRes = await this.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM coupons c WHERE ${whereClause}`,
      params,
    );
    const total = parseInt(countRes.rows[0]?.count || "0", 10);

    // Fetch paginated rows
    const listParams = [...params, limit, offset];
    const rowsRes = await this.query<CouponRow>(
      `SELECT c.*
       FROM coupons c
       WHERE ${whereClause}
       ORDER BY ${sortColumn} ${sortDirection}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      listParams,
    );

    // Compute metrics across all seller's coupons
    const metricsRes = await this.query<{
      total_coupons: string;
      active_coupons: string;
      total_redemptions: string;
      total_discount_amount: string;
    }>(
      `SELECT 
        COUNT(*)::text AS total_coupons,
        COUNT(CASE WHEN is_active = TRUE AND starts_at <= CURRENT_TIMESTAMP AND ends_at >= CURRENT_TIMESTAMP AND (usage_limit IS NULL OR usage_count < usage_limit) THEN 1 END)::text AS active_coupons,
        COALESCE(SUM(usage_count), 0)::text AS total_redemptions,
        COALESCE(
          (SELECT SUM(cr.discount_amount)
           FROM coupon_redemptions cr
           JOIN coupons c2 ON c2.id = cr.coupon_id
           WHERE c2.seller_id = $1 AND cr.status = 'completed'),
          0
        )::text AS total_discount_amount
       FROM coupons
       WHERE seller_id = $1`,
      [sellerId],
    );

    const metricsRow = metricsRes.rows[0];
    const metrics = {
      totalCoupons: parseInt(metricsRow?.total_coupons || "0", 10),
      activeCoupons: parseInt(metricsRow?.active_coupons || "0", 10),
      totalRedemptions: parseInt(metricsRow?.total_redemptions || "0", 10),
      totalDiscountAmount: parseFloat(metricsRow?.total_discount_amount || "0"),
    };

    const items: CouponEntity[] = rowsRes.rows.map((row) => ({
      ...row,
      status: computeCouponStatus(row),
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      metrics,
    };
  }

  async update(id: string, sellerId: string, input: UpdateCouponInput): Promise<CouponEntity | null> {
    const updates: string[] = [];
    const params: unknown[] = [id, sellerId];
    let paramIndex = 3;

    if (input.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      params.push(input.description);
    }
    if (input.discount_percent !== undefined) {
      updates.push(`discount_percent = $${paramIndex++}`);
      params.push(input.discount_percent);
    }
    if (input.starts_at !== undefined) {
      updates.push(`starts_at = $${paramIndex++}`);
      params.push(input.starts_at);
    }
    if (input.ends_at !== undefined) {
      updates.push(`ends_at = $${paramIndex++}`);
      params.push(input.ends_at);
    }
    if (input.usage_limit !== undefined) {
      updates.push(`usage_limit = $${paramIndex++}`);
      params.push(input.usage_limit);
    }
    if (input.is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      params.push(input.is_active);
    }

    if (updates.length === 0) {
      return this.findById(id, sellerId);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    const query = `
      UPDATE coupons
      SET ${updates.join(", ")}
      WHERE id = $1 AND seller_id = $2
      RETURNING *;
    `;

    const res = await this.query<CouponRow>(query, params);
    if (!res.rows[0]) return null;

    const row = res.rows[0];
    return {
      ...row,
      status: computeCouponStatus(row),
    };
  }

  async updateStatus(id: string, sellerId: string, isActive: boolean): Promise<CouponEntity | null> {
    const res = await this.query<CouponRow>(
      `UPDATE coupons
       SET is_active = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND seller_id = $2
       RETURNING *;`,
      [id, sellerId, isActive],
    );

    if (!res.rows[0]) return null;
    const row = res.rows[0];
    return {
      ...row,
      status: computeCouponStatus(row),
    };
  }

  async delete(id: string, sellerId: string): Promise<boolean> {
    const res = await this.query(
      `DELETE FROM coupons
       WHERE id = $1 AND seller_id = $2
       RETURNING id;`,
      [id, sellerId],
    );
    return (res.rowCount ?? 0) > 0;
  }

  /**
   * Concurrency-safe atomic usage increment.
   * Returns the updated coupon row ONLY if the coupon is currently active,
   * within validity date window, and has not exceeded its usage limit.
   */
  async incrementUsageAtomic(couponId: string): Promise<CouponEntity | null> {
    const res = await this.query<CouponRow>(
      `UPDATE coupons
       SET usage_count = usage_count + 1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
         AND is_active = TRUE
         AND starts_at <= CURRENT_TIMESTAMP
         AND ends_at >= CURRENT_TIMESTAMP
         AND (usage_limit IS NULL OR usage_count < usage_limit)
       RETURNING *;`,
      [couponId],
    );

    if (!res.rows[0]) return null;
    const row = res.rows[0];
    return {
      ...row,
      status: computeCouponStatus(row),
    };
  }

  /**
   * Concurrency-safe atomic usage rollback if order payment fails or cancels.
   */
  async decrementUsageAtomic(couponId: string): Promise<void> {
    await this.query(
      `UPDATE coupons
       SET usage_count = GREATEST(0, usage_count - 1), updated_at = CURRENT_TIMESTAMP
       WHERE id = $1;`,
      [couponId],
    );
  }

  /**
   * Record a redemption in coupon_redemptions table.
   */
  async recordRedemption(data: {
    coupon_id: string;
    buyer_id: string;
    order_id?: string | null;
    discount_amount: number;
    currency: string;
    original_subtotal: number;
    discounted_subtotal: number;
    status?: "pending" | "completed" | "cancelled" | "refunded";
  }): Promise<CouponRedemptionEntity> {
    const res = await this.query<CouponRedemptionRow>(
      `INSERT INTO coupon_redemptions (
        coupon_id,
        buyer_id,
        order_id,
        discount_amount,
        currency,
        original_subtotal,
        discounted_subtotal,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;`,
      [
        data.coupon_id,
        data.buyer_id,
        data.order_id || null,
        data.discount_amount,
        data.currency || "USD",
        data.original_subtotal,
        data.discounted_subtotal,
        data.status || "completed",
      ],
    );

    const row = res.rows[0];
    if (!row) {
      throw new Error("Failed to insert coupon redemption record");
    }
    return row;
  }

  async getRedemptions(couponId: string, sellerId: string): Promise<CouponRedemptionEntity[]> {
    const res = await this.query<CouponRedemptionRow & { buyer_name?: string; buyer_email?: string }>(
      `SELECT cr.*, u.name AS buyer_name, u.email AS buyer_email
       FROM coupon_redemptions cr
       JOIN coupons c ON c.id = cr.coupon_id
       JOIN users u ON u.id = cr.buyer_id
       WHERE cr.coupon_id = $1 AND c.seller_id = $2
       ORDER BY cr.created_at DESC
       LIMIT 100;`,
      [couponId, sellerId],
    );

    return res.rows.map((row) => ({
      ...row,
      ...(row.buyer_name
        ? {
            buyer: {
              id: row.buyer_id,
              name: row.buyer_name,
              email: row.buyer_email || "",
            },
          }
        : {}),
    }));
  }
}

export const couponRepository = new CouponRepository();
