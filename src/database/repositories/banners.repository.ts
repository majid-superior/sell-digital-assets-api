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

export class BannersRepository extends BaseRepository<BannerEntity> {
  private tableEnsured = false;

  /**
   * Lazily ensures the banners table exists in PostgreSQL so existing deployments
   * work immediately without requiring a destructive database reset.
   */
  private async ensureTable(): Promise<void> {
    if (this.tableEnsured) return;
    await this.query(`
      CREATE TABLE IF NOT EXISTS banners (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(200) NOT NULL,
        description VARCHAR(500),
        supporting_text VARCHAR(200),
        badge_type VARCHAR(30) NOT NULL DEFAULT 'special_offer'
          CHECK (badge_type IN ('special_offer', 'hot_deal', 'new_release', 'limited_time', 'announcement', 'flash_sale', 'none')),
        cta_label VARCHAR(80),
        cta_url VARCHAR(500),
        show_cta BOOLEAN NOT NULL DEFAULT TRUE,
        is_dismissible BOOLEAN NOT NULL DEFAULT TRUE,
        appearance VARCHAR(30) NOT NULL DEFAULT 'primary'
          CHECK (appearance IN ('primary', 'secondary', 'tertiary', 'inverse', 'surface', 'accent')),
        priority INT NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        starts_at TIMESTAMPTZ,
        ends_at TIMESTAMPTZ,
        timezone VARCHAR(80) NOT NULL DEFAULT 'UTC',
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT chk_banners_title_not_empty CHECK (length(trim(title)) > 0),
        CONSTRAINT chk_banners_schedule_window CHECK (starts_at IS NULL OR ends_at IS NULL OR ends_at > starts_at)
      );
      ALTER TABLE banners DROP COLUMN IF EXISTS badge_text;
      CREATE INDEX IF NOT EXISTS idx_banners_active_schedule
        ON banners (is_active, priority DESC, starts_at, ends_at);
    `);
    this.tableEnsured = true;
  }

  /**
   * Returns only currently active and schedule-eligible banners for public display,
   * ordered by display priority (descending) and creation date (descending).
   */
  async findActiveEligible(referenceNow?: Date): Promise<BannerEntity[]> {
    await this.ensureTable();
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
    await this.ensureTable();
    const params: unknown[] = [];
    let whereClause = "";

    if (options?.search && options.search.trim().length > 0) {
      params.push(`%${options.search.trim()}%`);
      whereClause = `
        WHERE (
          title ILIKE $1
          OR COALESCE(description, '') ILIKE $1
          OR COALESCE(supporting_text, '') ILIKE $1
          OR COALESCE(badge_type, '') ILIKE $1
          OR COALESCE(cta_label, '') ILIKE $1
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
   * Finds a single banner by UUID.
   */
  async findById(id: string): Promise<BannerEntity | null> {
    await this.ensureTable();
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
    await this.ensureTable();
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
    await this.ensureTable();

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
    await this.ensureTable();
    const res = await this.query(
      "DELETE FROM banners WHERE id = $1 RETURNING id",
      [id],
    );
    return (res.rowCount ?? 0) > 0;
  }
}

export const bannersRepository = new BannersRepository();
export default bannersRepository;
