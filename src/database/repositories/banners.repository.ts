import { BaseRepository } from "./base.repository.js";

export type BannerBadgeType =
  | "special_offer"
  | "hot_deal"
  | "new_release"
  | "limited_time"
  | "announcement"
  | "flash_sale"
  | "none";

export type BannerAppearance =
  | "primary"
  | "secondary"
  | "tertiary"
  | "inverse"
  | "surface"
  | "accent";

export interface BannerEntity {
  id: string;
  title: string;
  description: string | null;
  supporting_text: string | null;
  badge_type: BannerBadgeType;
  cta_label: string | null;
  cta_url: string | null;
  show_cta: boolean;
  is_dismissible: boolean;
  appearance: BannerAppearance;
  priority: number;
  is_active: boolean;
  starts_at: Date | string | null;
  ends_at: Date | string | null;
  timezone: string;
  created_by: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface CreateBannerDbInput {
  title: string;
  description: string | null;
  supporting_text: string | null;
  badge_type: BannerBadgeType;
  cta_label: string | null;
  cta_url: string | null;
  show_cta: boolean;
  is_dismissible: boolean;
  appearance: BannerAppearance;
  priority: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  timezone: string;
  created_by: string | null;
}

export interface UpdateBannerDbInput {
  title?: string;
  description?: string | null;
  supporting_text?: string | null;
  badge_type?: BannerBadgeType;
  cta_label?: string | null;
  cta_url?: string | null;
  show_cta?: boolean;
  is_dismissible?: boolean;
  appearance?: BannerAppearance;
  priority?: number;
  is_active?: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
  timezone?: string;
}

export interface BannerSummaryMetrics {
  total: number;
  activeCount: number;
  scheduledCount: number;
  expiredCount: number;
  inactiveCount: number;
}

export interface FindAdminBannersOptions {
  search?: string | undefined;
  status?: "active" | "scheduled" | "expired" | "inactive" | undefined;
  page: number;
  limit: number;
  referenceNow?: Date | undefined;
}

export class BannersRepository extends BaseRepository<BannerEntity> {
  /**
   * Returns only currently active and schedule-eligible banners for public display,
   * ordered by display priority (descending) and creation date (descending).
   */
  async findActiveEligible(referenceNow?: Date): Promise<BannerEntity[]> {
    const nowIso = (referenceNow ?? new Date()).toISOString();
    const res = await this.query<BannerEntity>(
      `SELECT
         id,
         title,
         description,
         supporting_text,
         badge_type,
         cta_label,
         cta_url,
         show_cta,
         is_dismissible,
         appearance,
         priority,
         is_active,
         starts_at,
         ends_at,
         timezone,
         created_by,
         created_at,
         updated_at
       FROM banners
       WHERE is_active = TRUE
         AND (starts_at IS NULL OR starts_at <= $1::timestamptz)
         AND (ends_at IS NULL OR ends_at > $1::timestamptz)
       ORDER BY priority DESC, created_at DESC`,
      [nowIso],
    );
    return res.rows;
  }

  /**
   * Returns all banners for Admin management, optionally filtered by search term,
   * ordered by priority DESC, created_at DESC.
   */
  async findAll(options?: { search?: string | undefined }): Promise<BannerEntity[]> {
    const params: unknown[] = [];
    let whereClause = "";

    if (options?.search && options.search.trim().length > 0) {
      params.push(`%${this.escapeLike(options.search.trim())}%`);
      whereClause = `
        WHERE (
          title ILIKE $1 ESCAPE '\\'
          OR COALESCE(description, '') ILIKE $1 ESCAPE '\\'
          OR COALESCE(supporting_text, '') ILIKE $1 ESCAPE '\\'
          OR COALESCE(badge_type, '') ILIKE $1 ESCAPE '\\'
          OR COALESCE(cta_label, '') ILIKE $1 ESCAPE '\\'
        )
      `;
    }

    const res = await this.query<BannerEntity>(
      `SELECT
         id,
         title,
         description,
         supporting_text,
         badge_type,
         cta_label,
         cta_url,
         show_cta,
         is_dismissible,
         appearance,
         priority,
         is_active,
         starts_at,
         ends_at,
         timezone,
         created_by,
         created_at,
         updated_at
       FROM banners
       ${whereClause}
       ORDER BY priority DESC, created_at DESC`,
      params,
    );
    return res.rows;
  }

  /**
   * Executes SQL-level summary metrics aggregation, status filtering, and pagination
   * for Admin banner management without loading the entire table into Node.js memory.
   */
  async findAdminPaginated(options: FindAdminBannersOptions): Promise<{
    rows: BannerEntity[];
    metrics: BannerSummaryMetrics;
    filteredTotal: number;
  }> {
    const nowIso = (options.referenceNow ?? new Date()).toISOString();
    const searchTerm = options.search?.trim();

    const metricsParams: unknown[] = [nowIso];
    let searchWhereClause = "";

    if (searchTerm) {
      const escapedSearch = `%${this.escapeLike(searchTerm)}%`;
      metricsParams.push(escapedSearch);
      searchWhereClause = `
        WHERE (
          title ILIKE $2 ESCAPE '\\'
          OR COALESCE(description, '') ILIKE $2 ESCAPE '\\'
          OR COALESCE(supporting_text, '') ILIKE $2 ESCAPE '\\'
          OR COALESCE(badge_type, '') ILIKE $2 ESCAPE '\\'
          OR COALESCE(cta_label, '') ILIKE $2 ESCAPE '\\'
        )
      `;
    }

    const rowConditions: string[] = [];
    const rowParams: unknown[] = [];

    if (searchTerm) {
      rowParams.push(`%${this.escapeLike(searchTerm)}%`);
      const sIdx = rowParams.length;
      rowConditions.push(`(
        title ILIKE $${sIdx} ESCAPE '\\'
        OR COALESCE(description, '') ILIKE $${sIdx} ESCAPE '\\'
        OR COALESCE(supporting_text, '') ILIKE $${sIdx} ESCAPE '\\'
        OR COALESCE(badge_type, '') ILIKE $${sIdx} ESCAPE '\\'
        OR COALESCE(cta_label, '') ILIKE $${sIdx} ESCAPE '\\'
      )`);
    }

    if (options.status === "inactive") {
      rowConditions.push("is_active = FALSE");
    } else if (options.status === "scheduled") {
      rowParams.push(nowIso);
      const tIdx = rowParams.length;
      rowConditions.push(
        `is_active = TRUE AND starts_at IS NOT NULL AND starts_at > $${tIdx}::timestamptz`,
      );
    } else if (options.status === "expired") {
      rowParams.push(nowIso);
      const tIdx = rowParams.length;
      rowConditions.push(
        `is_active = TRUE AND (starts_at IS NULL OR starts_at <= $${tIdx}::timestamptz) AND ends_at IS NOT NULL AND ends_at <= $${tIdx}::timestamptz`,
      );
    } else if (options.status === "active") {
      rowParams.push(nowIso);
      const tIdx = rowParams.length;
      rowConditions.push(
        `is_active = TRUE AND (starts_at IS NULL OR starts_at <= $${tIdx}::timestamptz) AND (ends_at IS NULL OR ends_at > $${tIdx}::timestamptz)`,
      );
    }

    const rowWhereClause =
      rowConditions.length > 0 ? `WHERE ${rowConditions.join(" AND ")}` : "";

    const page = Math.max(1, options.page);
    const limit = Math.max(1, options.limit);
    const offset = (page - 1) * limit;

    rowParams.push(limit);
    const limitIdx = rowParams.length;
    rowParams.push(offset);
    const offsetIdx = rowParams.length;

    const [metricsRes, rowsRes] = await Promise.all([
      this.query<{
        total: number;
        active_count: number;
        scheduled_count: number;
        expired_count: number;
        inactive_count: number;
      }>(
        `SELECT
           COUNT(*)::int AS total,
           COUNT(*) FILTER (
             WHERE is_active = TRUE
               AND (starts_at IS NULL OR starts_at <= $1::timestamptz)
               AND (ends_at IS NULL OR ends_at > $1::timestamptz)
           )::int AS active_count,
           COUNT(*) FILTER (
             WHERE is_active = TRUE
               AND starts_at IS NOT NULL
               AND starts_at > $1::timestamptz
           )::int AS scheduled_count,
           COUNT(*) FILTER (
             WHERE is_active = TRUE
               AND (starts_at IS NULL OR starts_at <= $1::timestamptz)
               AND ends_at IS NOT NULL
               AND ends_at <= $1::timestamptz
           )::int AS expired_count,
           COUNT(*) FILTER (
             WHERE is_active = FALSE
           )::int AS inactive_count
         FROM banners
         ${searchWhereClause}`,
        metricsParams,
      ),
      this.query<BannerEntity>(
        `SELECT
           id,
           title,
           description,
           supporting_text,
           badge_type,
           cta_label,
           cta_url,
           show_cta,
           is_dismissible,
           appearance,
           priority,
           is_active,
           starts_at,
           ends_at,
           timezone,
           created_by,
           created_at,
           updated_at
         FROM banners
         ${rowWhereClause}
         ORDER BY priority DESC, created_at DESC
         LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
        rowParams,
      ),
    ]);

    const mRow = metricsRes.rows[0];
    const metrics: BannerSummaryMetrics = {
      total: Number(mRow?.total ?? 0),
      activeCount: Number(mRow?.active_count ?? 0),
      scheduledCount: Number(mRow?.scheduled_count ?? 0),
      expiredCount: Number(mRow?.expired_count ?? 0),
      inactiveCount: Number(mRow?.inactive_count ?? 0),
    };

    const filteredTotal =
      options.status === "active"
        ? metrics.activeCount
        : options.status === "scheduled"
          ? metrics.scheduledCount
          : options.status === "expired"
            ? metrics.expiredCount
            : options.status === "inactive"
              ? metrics.inactiveCount
              : metrics.total;

    return {
      rows: rowsRes.rows,
      metrics,
      filteredTotal,
    };
  }

  /**
   * Finds a single banner by UUID.
   */
  async findById(id: string): Promise<BannerEntity | null> {
    const res = await this.query<BannerEntity>(
      `SELECT
         id,
         title,
         description,
         supporting_text,
         badge_type,
         cta_label,
         cta_url,
         show_cta,
         is_dismissible,
         appearance,
         priority,
         is_active,
         starts_at,
         ends_at,
         timezone,
         created_by,
         created_at,
         updated_at
       FROM banners
       WHERE id = $1`,
      [id],
    );
    return res.rows[0] ?? null;
  }

  /**
   * Creates a new promotional banner record in PostgreSQL.
   */
  async create(input: CreateBannerDbInput): Promise<BannerEntity> {
    const res = await this.query<BannerEntity>(
      `INSERT INTO banners (
         title,
         description,
         supporting_text,
         badge_type,
         cta_label,
         cta_url,
         show_cta,
         is_dismissible,
         appearance,
         priority,
         is_active,
         starts_at,
         ends_at,
         timezone,
         created_by
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7,
         $8, $9, $10, $11, $12, $13, $14, $15
       )
       RETURNING
         id,
         title,
         description,
         supporting_text,
         badge_type,
         cta_label,
         cta_url,
         show_cta,
         is_dismissible,
         appearance,
         priority,
         is_active,
         starts_at,
         ends_at,
         timezone,
         created_by,
         created_at,
         updated_at`,
      [
        input.title,
        input.description,
        input.supporting_text,
        input.badge_type,
        input.cta_label,
        input.cta_url,
        input.show_cta,
        input.is_dismissible,
        input.appearance,
        input.priority,
        input.is_active,
        input.starts_at,
        input.ends_at,
        input.timezone,
        input.created_by,
      ],
    );
    return res.rows[0]!;
  }

  /**
   * Updates an existing promotional banner by UUID using parameterized fields.
   */
  async update(
    id: string,
    input: UpdateBannerDbInput,
  ): Promise<BannerEntity | null> {
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIdx = 1;

    const addField = (column: string, val: unknown) => {
      setClauses.push(`${column} = $${paramIdx++}`);
      values.push(val);
    };

    if (input.title !== undefined) addField("title", input.title);
    if (input.description !== undefined) addField("description", input.description);
    if (input.supporting_text !== undefined) addField("supporting_text", input.supporting_text);
    if (input.badge_type !== undefined) addField("badge_type", input.badge_type);
    if (input.cta_label !== undefined) addField("cta_label", input.cta_label);
    if (input.cta_url !== undefined) addField("cta_url", input.cta_url);
    if (input.show_cta !== undefined) addField("show_cta", input.show_cta);
    if (input.is_dismissible !== undefined) addField("is_dismissible", input.is_dismissible);
    if (input.appearance !== undefined) addField("appearance", input.appearance);
    if (input.priority !== undefined) addField("priority", input.priority);
    if (input.is_active !== undefined) addField("is_active", input.is_active);
    if (input.starts_at !== undefined) addField("starts_at", input.starts_at);
    if (input.ends_at !== undefined) addField("ends_at", input.ends_at);
    if (input.timezone !== undefined) addField("timezone", input.timezone);

    if (setClauses.length === 0) {
      return this.findById(id);
    }

    setClauses.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);

    const res = await this.query<BannerEntity>(
      `UPDATE banners
       SET ${setClauses.join(", ")}
       WHERE id = $${paramIdx}
       RETURNING
         id,
         title,
         description,
         supporting_text,
         badge_type,
         cta_label,
         cta_url,
         show_cta,
         is_dismissible,
         appearance,
         priority,
         is_active,
         starts_at,
         ends_at,
         timezone,
         created_by,
         created_at,
         updated_at`,
      values,
    );

    return res.rows[0] ?? null;
  }

  /**
   * Permanently deletes a promotional banner by UUID.
   */
  async deleteById(id: string): Promise<boolean> {
    const res = await this.query(
      "DELETE FROM banners WHERE id = $1 RETURNING id",
      [id],
    );
    return (res.rowCount ?? 0) > 0;
  }
}

export const bannersRepository = new BannersRepository();
export default bannersRepository;
