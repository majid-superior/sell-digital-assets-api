import { BaseRepository } from "./base.repository.js";
import type { ThemeEntity } from "../types.js";

export class ThemeRepository extends BaseRepository<ThemeEntity> {
  /**
   * Retrieves the currently active theme from the database.
   * Priority: theme_settings (latest active) -> themes (active)
   */
  async getActiveTheme(): Promise<ThemeEntity | null> {
    try {
      const result = await this.query<any>(
        `SELECT * FROM theme_settings WHERE is_active = true ORDER BY updated_at DESC LIMIT 1`,
      );
      if (result.rows[0]) {
        const row = result.rows[0];
        return {
          id: row.id,
          name: row.name,
          slug: row.slug || "active-theme",
          mode: row.mode || "dark",
          is_active: row.is_active,
          color_hex_map: row.color_hex_map,
          color_tokens: row.color_tokens || {},
          typography: row.typography || {},
          border_radius: row.border_radius || "rounded-lg",
          metadata: row.metadata || {},
          updated_at: row.updated_at,
        };
      }
    } catch (_err) {
      // Fallback if theme_settings table is temporarily unavailable
    }

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
   * Updates active theme in both theme_settings and themes tables.
   */
  async updateActiveThemeSettings(data: {
    color_hex_map: Record<string, any>;
    name?: string | undefined;
    mode?: string | undefined;
    typography?: Record<string, any> | undefined;
    border_radius?: string | undefined;
    color_tokens?: Record<string, string> | undefined;
  }): Promise<ThemeEntity> {
    const existing = await this.getActiveTheme();
    const name = data.name || existing?.name || "Active Theme";
    const mode = data.mode || existing?.mode || "dark";
    const typography = data.typography || existing?.typography || {};
    const borderRadius = data.border_radius || existing?.border_radius || "rounded-lg";
    const colorHexMap = data.color_hex_map;
    const colorTokens = data.color_tokens || existing?.color_tokens || {};

    let savedTheme: ThemeEntity | null = null;

    // 1. Update or Insert into theme_settings
    try {
      const tsCheck = await this.query<any>(
        `SELECT id FROM theme_settings WHERE is_active = TRUE ORDER BY updated_at DESC LIMIT 1`,
      );
      if (tsCheck.rows[0]) {
        const updateTs = await this.query<any>(
          `UPDATE theme_settings
           SET name = $1,
               mode = $2,
               color_hex_map = $3::jsonb,
               typography = $4::jsonb,
               border_radius = $5,
               is_active = TRUE,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $6
           RETURNING *;`,
          [
            name,
            mode,
            JSON.stringify(colorHexMap),
            JSON.stringify(typography),
            borderRadius,
            tsCheck.rows[0].id,
          ],
        );
        savedTheme = {
          id: updateTs.rows[0].id,
          name: updateTs.rows[0].name,
          mode: updateTs.rows[0].mode,
          is_active: updateTs.rows[0].is_active,
          color_hex_map: updateTs.rows[0].color_hex_map,
          typography: updateTs.rows[0].typography,
          border_radius: updateTs.rows[0].border_radius,
          color_tokens: colorTokens,
          updated_at: updateTs.rows[0].updated_at,
        };
      } else {
        const insertTs = await this.query<any>(
          `INSERT INTO theme_settings (name, mode, color_hex_map, typography, border_radius, is_active, updated_at)
           VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, TRUE, CURRENT_TIMESTAMP)
           RETURNING *;`,
          [
            name,
            mode,
            JSON.stringify(colorHexMap),
            JSON.stringify(typography),
            borderRadius,
          ],
        );
        savedTheme = {
          id: insertTs.rows[0].id,
          name: insertTs.rows[0].name,
          mode: insertTs.rows[0].mode,
          is_active: insertTs.rows[0].is_active,
          color_hex_map: insertTs.rows[0].color_hex_map,
          typography: insertTs.rows[0].typography,
          border_radius: insertTs.rows[0].border_radius,
          color_tokens: colorTokens,
          updated_at: insertTs.rows[0].updated_at,
        };
      }
    } catch (_err) {
      // Fallback if theme_settings update fails
    }

    // 2. Also keep themes table synchronized
    try {
      const themesUpdate = await this.query<ThemeEntity>(
        `UPDATE themes 
         SET name = COALESCE($1, name),
             color_hex_map = $2::jsonb,
             color_tokens = COALESCE($3::jsonb, color_tokens),
             updated_at = CURRENT_TIMESTAMP
         WHERE is_active = TRUE
         RETURNING *;`,
        [name, JSON.stringify(colorHexMap), JSON.stringify(colorTokens)],
      );
      if (themesUpdate.rows[0] && !savedTheme) {
        savedTheme = themesUpdate.rows[0];
      }
    } catch (_err) {
      // Ignored if themes table update fails
    }

    if (!savedTheme) {
      savedTheme = {
        id: 1,
        name,
        mode,
        is_active: true,
        color_hex_map: colorHexMap,
        color_tokens: colorTokens,
        typography,
        border_radius: borderRadius,
        updated_at: new Date().toISOString(),
      };
    }

    return savedTheme;
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
    if (data.color_hex_map !== undefined) {
      updates.push(`color_hex_map = $${idx++}::jsonb`);
      values.push(JSON.stringify(data.color_hex_map));
    }
    if (data.color_tokens !== undefined) {
      updates.push(`color_tokens = $${idx++}::jsonb`);
      values.push(JSON.stringify(data.color_tokens));
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
      const activated = result.rows[0];

      // Synchronize theme_settings table
      try {
        await client.query(
          `UPDATE theme_settings SET is_active = FALSE WHERE is_active = TRUE;
           INSERT INTO theme_settings (name, mode, color_hex_map, typography, border_radius, is_active, updated_at)
           VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, TRUE, CURRENT_TIMESTAMP);`,
          [
            activated.name,
            activated.mode || "dark",
            JSON.stringify(activated.color_hex_map),
            JSON.stringify(activated.typography || {}),
            activated.border_radius || "rounded-lg",
          ],
        );
      } catch (_err) {
        // Ignored if theme_settings update fails
      }

      return activated;
    });
  }

  /**
   * Creates a new theme record in the database.
   */
  async createTheme(data: {
    name: string;
    slug: string;
    is_active?: boolean | undefined;
    color_hex_map: Record<string, any>;
    color_tokens?: Record<string, string>;
    metadata?: Record<string, unknown> | undefined;
  }): Promise<ThemeEntity> {
    const result = await this.query<ThemeEntity>(
      `INSERT INTO themes (
         name, slug, is_active, color_hex_map, color_tokens, metadata
       ) VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6::jsonb)
       RETURNING *;`,
      [
        data.name,
        data.slug,
        data.is_active ?? false,
        JSON.stringify(data.color_hex_map),
        JSON.stringify(data.color_tokens ?? {}),
        JSON.stringify(data.metadata ?? {}),
      ],
    );
    return result.rows[0]!;
  }
}

export const themeRepository = new ThemeRepository();
