import type { QueryResultRow } from "pg";
import { BaseRepository } from "./base.repository.js";

export interface HeroImageEntity extends QueryResultRow {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  storage_key: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface CreateHeroImageDbInput {
  title: string;
  subtitle?: string | null;
  image_url: string;
  storage_key?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

export interface UpdateHeroImageDbInput {
  title?: string;
  subtitle?: string | null;
  image_url?: string;
  storage_key?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

export class HeroRepository extends BaseRepository<HeroImageEntity> {
  private tableEnsured = false;

  /**
   * Lazily ensures the hero_images table exists in PostgreSQL so existing deployments
   * work immediately without requiring manual migrations.
   */
  private async ensureTable(): Promise<void> {
    if (this.tableEnsured) return;
    await this.query(`
      CREATE TABLE IF NOT EXISTS hero_images (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(200) NOT NULL DEFAULT 'Hero Slide',
        subtitle VARCHAR(200),
        image_url TEXT NOT NULL,
        storage_key VARCHAR(500),
        sort_order INT NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_hero_images_active_order 
        ON hero_images (is_active, sort_order ASC, created_at DESC);
    `);
    this.tableEnsured = true;
  }

  /**
   * Returns active hero images for public landing page showcase, up to limit.
   */
  async findActive(limit = 15): Promise<HeroImageEntity[]> {
    await this.ensureTable();
    const res = await this.query<HeroImageEntity>(
      `SELECT
         id,
         title,
         subtitle,
         image_url,
         storage_key,
         sort_order,
         is_active,
         created_at,
         updated_at
       FROM hero_images
       WHERE is_active = TRUE
       ORDER BY sort_order ASC, created_at DESC
       LIMIT $1`,
      [limit],
    );
    return res.rows;
  }

  /**
   * Returns all hero images for admin management.
   */
  async findAll(): Promise<HeroImageEntity[]> {
    await this.ensureTable();
    const res = await this.query<HeroImageEntity>(
      `SELECT
         id,
         title,
         subtitle,
         image_url,
         storage_key,
         sort_order,
         is_active,
         created_at,
         updated_at
       FROM hero_images
       ORDER BY sort_order ASC, created_at DESC`,
    );
    return res.rows;
  }

  /**
   * Finds a single hero image by ID.
   */
  async findById(id: string): Promise<HeroImageEntity | null> {
    await this.ensureTable();
    const res = await this.query<HeroImageEntity>(
      `SELECT
         id,
         title,
         subtitle,
         image_url,
         storage_key,
         sort_order,
         is_active,
         created_at,
         updated_at
       FROM hero_images
       WHERE id = $1`,
      [id],
    );
    return res.rows[0] ?? null;
  }

  /**
   * Creates a new hero image record.
   */
  async create(input: CreateHeroImageDbInput): Promise<HeroImageEntity> {
    await this.ensureTable();
    const res = await this.query<HeroImageEntity>(
      `INSERT INTO hero_images (
         title,
         subtitle,
         image_url,
         storage_key,
         sort_order,
         is_active
       ) VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        input.title,
        input.subtitle ?? null,
        input.image_url,
        input.storage_key ?? null,
        input.sort_order ?? 0,
        input.is_active ?? true,
      ],
    );
    if (!res.rows[0]) {
      throw new Error("Failed to insert hero image record");
    }
    return res.rows[0];
  }

  /**
   * Toggles the active status of a hero image.
   */
  async toggleStatus(id: string, isActive: boolean): Promise<HeroImageEntity | null> {
    await this.ensureTable();
    const res = await this.query<HeroImageEntity>(
      `UPDATE hero_images
       SET is_active = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [isActive, id],
    );
    return res.rows[0] ?? null;
  }

  /**
   * Updates hero image metadata.
   */
  async update(id: string, input: UpdateHeroImageDbInput): Promise<HeroImageEntity | null> {
    await this.ensureTable();
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (input.title !== undefined) {
      fields.push(`title = $${idx++}`);
      values.push(input.title);
    }
    if (input.subtitle !== undefined) {
      fields.push(`subtitle = $${idx++}`);
      values.push(input.subtitle);
    }
    if (input.image_url !== undefined) {
      fields.push(`image_url = $${idx++}`);
      values.push(input.image_url);
    }
    if (input.storage_key !== undefined) {
      fields.push(`storage_key = $${idx++}`);
      values.push(input.storage_key);
    }
    if (input.sort_order !== undefined) {
      fields.push(`sort_order = $${idx++}`);
      values.push(input.sort_order);
    }
    if (input.is_active !== undefined) {
      fields.push(`is_active = $${idx++}`);
      values.push(input.is_active);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const res = await this.query<HeroImageEntity>(
      `UPDATE hero_images
       SET ${fields.join(", ")}
       WHERE id = $${idx}
       RETURNING *`,
      values,
    );
    return res.rows[0] ?? null;
  }

  /**
   * Deletes a hero image record.
   */
  async delete(id: string): Promise<boolean> {
    await this.ensureTable();
    const res = await this.query(
      `DELETE FROM hero_images WHERE id = $1`,
      [id],
    );
    return (res.rowCount ?? 0) > 0;
  }
}

export const heroRepository = new HeroRepository();
