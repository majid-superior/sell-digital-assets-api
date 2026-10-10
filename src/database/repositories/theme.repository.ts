import { BaseRepository } from "./base.repository.js";
import type { ThemeEntity } from "../types.js";

export class ThemeRepository extends BaseRepository<ThemeEntity> {
  /**
   * Retrieves the currently active theme from the database.
   */
  async getActiveTheme(): Promise<ThemeEntity | null> {
    const result = await this.query<ThemeEntity>(
      `SELECT * FROM themes WHERE is_active = TRUE LIMIT 1`,
    );
    return result.rows[0] || null;
  }

  /**
   * Retrieves a theme by its unique numeric ID.
   */
  async getThemeById(id: number): Promise<ThemeEntity | null> {
    const result = await this.query<ThemeEntity>(
      `SELECT * FROM themes WHERE id = $1 LIMIT 1`,
      [id],
    );
    return result.rows[0] || null;
  }

  /**
   * Retrieves a theme by its unique slug identifier.
   */
  async getThemeBySlug(slug: string): Promise<ThemeEntity | null> {
    const result = await this.query<ThemeEntity>(
      `SELECT * FROM themes WHERE slug = $1 LIMIT 1`,
      [slug],
    );
    return result.rows[0] || null;
  }

  /**
   * Retrieves all available themes ordered with the active theme first.
   */
  async getAllThemes(): Promise<ThemeEntity[]> {
    const result = await this.query<ThemeEntity>(
      `SELECT * FROM themes ORDER BY is_active DESC, name ASC`,
    );
    return result.rows;
  }

  /**
   * Updates active theme settings directly in the themes table.
   */
  async updateActiveThemeSettings(data: {
    color_hex_map: Record<string, any>;
    name?: string | undefined;
    mode?: string | undefined;
    typography?: Record<string, any> | undefined;
    border_radius?: string | undefined;
    color_tokens?: Record<string, string> | undefined;
    metadata?: Record<string, unknown> | undefined;
  }): Promise<ThemeEntity> {
    const existing = await this.getActiveTheme();
    const name = data.name || existing?.name || "Default Theme";
    const mode = data.mode || existing?.mode || "dark";
    const typography = data.typography || existing?.typography || {};
    const borderRadius =
      data.border_radius || existing?.border_radius || "rounded-lg";
    const colorHexMap = data.color_hex_map;
    const colorTokens = data.color_tokens || existing?.color_tokens || {};
    const metadata = data.metadata || existing?.metadata || {};

    if (existing) {
      const result = await this.query<ThemeEntity>(
        `UPDATE themes 
         SET name = $1,
             mode = $2,
             color_hex_map = $3::jsonb,
             color_tokens = $4::jsonb,
             typography = $5::jsonb,
             border_radius = $6,
             metadata = $7::jsonb,
             updated_at = CURRENT_TIMESTAMP
         WHERE is_active = TRUE
         RETURNING *;`,
        [
          name,
          mode,
          JSON.stringify(colorHexMap),
          JSON.stringify(colorTokens),
          JSON.stringify(typography),
          borderRadius,
          JSON.stringify(metadata),
        ],
      );

      if (result.rows[0]) {
        return result.rows[0];
      }
    }

    return this.createTheme({
      name,
      slug: "default",
      mode,
      is_active: true,
      color_hex_map: colorHexMap,
      color_tokens: colorTokens,
      typography,
      border_radius: borderRadius,
      metadata,
    });
  }

  /**
   * Updates colors and tokens for the currently active theme (backward compatibility).
   */
  async updateActiveThemeColors(
    colorHexMap: Record<string, any>,
    colorTokens?: Record<string, string>,
  ): Promise<ThemeEntity> {
    return this.updateActiveThemeSettings({
      color_hex_map: colorHexMap,
      color_tokens: colorTokens,
    });
  }

  /**
   * Updates an existing theme by its ID.
   */
  async updateTheme(
    id: number,
    data: Partial<Omit<ThemeEntity, "id" | "created_at" | "updated_at">>,
  ): Promise<ThemeEntity | null> {
    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${idx++}`);
      values.push(data.name);
    }
    if (data.mode !== undefined) {
      updates.push(`mode = $${idx++}`);
      values.push(data.mode);
    }
    if (data.color_hex_map !== undefined) {
      updates.push(`color_hex_map = $${idx++}::jsonb`);
      values.push(JSON.stringify(data.color_hex_map));
    }
    if (data.color_tokens !== undefined) {
      updates.push(`color_tokens = $${idx++}::jsonb`);
      values.push(JSON.stringify(data.color_tokens));
    }
    if (data.typography !== undefined) {
      updates.push(`typography = $${idx++}::jsonb`);
      values.push(JSON.stringify(data.typography));
    }
    if (data.border_radius !== undefined) {
      updates.push(`border_radius = $${idx++}`);
      values.push(data.border_radius);
    }
    if (data.metadata !== undefined) {
      updates.push(`metadata = $${idx++}::jsonb`);
      values.push(JSON.stringify(data.metadata));
    }

    if (updates.length === 0) {
      const existing = await this.getThemeById(id);
      return existing;
    }

    values.push(id);
    const queryStr = `
      UPDATE themes
      SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${idx}
      RETURNING *;
    `;

    const result = await this.query<ThemeEntity>(queryStr, values);
    return result.rows[0] || null;
  }

  /**
   * Sets a specific theme as active, deactivating all others in a transaction.
   */
  async setActiveTheme(id: number): Promise<ThemeEntity> {
    return this.withTransaction(async (client) => {
      await client.query(
        "UPDATE themes SET is_active = FALSE WHERE is_active = TRUE",
      );
      const result = await client.query<ThemeEntity>(
        "UPDATE themes SET is_active = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
        [id],
      );
      if (!result.rows[0]) {
        throw new Error(`Theme with id ${id} not found`);
      }
      return result.rows[0];
    });
  }

  /**
   * Creates a new theme record in the database.
   */
  async createTheme(data: {
    name: string;
    slug: string;
    mode?: string | undefined;
    is_active?: boolean | undefined;
    color_hex_map: Record<string, any>;
    color_tokens?: Record<string, string>;
    typography?: Record<string, unknown> | null | undefined;
    border_radius?: string | null | undefined;
    metadata?: Record<string, unknown> | null | undefined;
  }): Promise<ThemeEntity> {
    const result = await this.query<ThemeEntity>(
      `INSERT INTO themes (
         name, slug, mode, is_active, color_hex_map, color_tokens, typography, border_radius, metadata
       ) VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::jsonb, $8, $9::jsonb)
       RETURNING *;`,
      [
        data.name,
        data.slug,
        data.mode || "dark",
        data.is_active ?? false,
        JSON.stringify(data.color_hex_map),
        JSON.stringify(data.color_tokens ?? {}),
        JSON.stringify(data.typography ?? {}),
        data.border_radius || "rounded-lg",
        JSON.stringify(data.metadata ?? {}),
      ],
    );
    return result.rows[0]!;
  }
}

export const themeRepository = new ThemeRepository();
