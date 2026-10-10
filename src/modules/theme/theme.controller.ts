import type { Request, Response, NextFunction } from "express";
import { themeService } from "./theme.service.js";
import { COLOR_HEX_MAP } from "../../theme/tokens/colors.js";
import type {
  UpdateActiveThemeInput,
  CreateThemeInput,
} from "./theme.schema.js";

/**
 * Builds a unified color hex map providing both top-level mode keys
 * and nested 'light' and 'dark' objects for universal client compatibility.
 */
function buildCombinedColorHexMap(rawMap: any, mode: string = "dark"): Record<string, any> {
  const light = {
    ...COLOR_HEX_MAP.light,
    ...(rawMap?.light && typeof rawMap.light === "object" ? rawMap.light : {}),
  };
  const dark = {
    ...COLOR_HEX_MAP.dark,
    ...(rawMap?.dark && typeof rawMap.dark === "object" ? rawMap.dark : {}),
  };

  // If rawMap had flat properties without light/dark nesting:
  if (!rawMap?.light && !rawMap?.dark && typeof rawMap === "object") {
    for (const [k, v] of Object.entries(rawMap)) {
      if (typeof v === "string" && k !== "light" && k !== "dark") {
        light[k] = v;
        dark[k] = v;
      }
    }
  }

  const activeModePalette = mode === "light" ? light : dark;

  return {
    ...activeModePalette,
    light,
    dark,
  };
}

export class ThemeController {
  /**
   * GET /api/theme or /api/theme/active
   * Retrieves active theme colors and tokens as JSON with conditional ETag validation.
   * HTTP Headers: Cache-Control: public, max-age=30, stale-while-revalidate=86400
   */
  async getActiveTheme(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const etag = await themeService.getActiveThemeEtag();
      const ifNoneMatch = req.header("if-none-match");

      res.setHeader("ETag", etag);
      res.setHeader("Cache-Control", "public, max-age=30, stale-while-revalidate=86400");

      if (ifNoneMatch && ifNoneMatch === etag) {
        res.status(304).end();
        return;
      }

      const data = await themeService.getActiveTheme();
      const mode = data.mode || "dark";
      const combinedColorMap = buildCombinedColorHexMap(data.color_hex_map, mode);

      res.status(200).json({
        success: true,
        data: {
          id: data.id,
          name: data.name,
          slug: data.slug,
          mode,
          colorHexMap: combinedColorMap,
          color_hex_map: combinedColorMap,
          colorTokens: data.color_tokens || {},
          color_tokens: data.color_tokens || {},
          typography: data.typography || {},
          borderRadius: data.border_radius || "rounded-lg",
          border_radius: data.border_radius || "rounded-lg",
          isActive: Boolean(data.is_active),
          is_active: Boolean(data.is_active),
          metadata: data.metadata || {},
          updatedAt: data.updated_at,
          updated_at: data.updated_at,
          etag,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/theme/css or /api/theme/styles.css
   * Generates dynamic CSS stylesheet (:root and .dark CSS variables) from database colors.
   */
  async getCssVariables(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const etag = await themeService.getActiveThemeEtag();
      const ifNoneMatch = req.header("if-none-match");

      res.setHeader("ETag", etag);
      res.setHeader("Cache-Control", "public, max-age=30, stale-while-revalidate=86400");
      res.setHeader("Content-Type", "text/css; charset=utf-8");

      if (ifNoneMatch && ifNoneMatch === etag) {
        res.status(304).end();
        return;
      }

      const css = await themeService.getCssVariables();
      res.status(200).send(css);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/theme or PATCH /api/theme
   * Updates active theme colors, mode, and tokens in PostgreSQL.
   */
  async updateActiveTheme(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as UpdateActiveThemeInput;
      const data = await themeService.updateActiveTheme(body);
      const etag = await themeService.getActiveThemeEtag();
      const mode = data.mode || "dark";
      const combinedColorMap = buildCombinedColorHexMap(data.color_hex_map, mode);

      res.setHeader("ETag", etag);
      res.status(200).json({
        success: true,
        message: "Theme colors updated successfully",
        data: {
          id: data.id,
          name: data.name,
          slug: data.slug,
          mode,
          colorHexMap: combinedColorMap,
          color_hex_map: combinedColorMap,
          colorTokens: data.color_tokens || {},
          color_tokens: data.color_tokens || {},
          typography: data.typography || {},
          borderRadius: data.border_radius || "rounded-lg",
          border_radius: data.border_radius || "rounded-lg",
          isActive: Boolean(data.is_active),
          is_active: Boolean(data.is_active),
          updatedAt: data.updated_at,
          updated_at: data.updated_at,
          etag,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/theme/all
   * Lists all registered themes in the database.
   */
  async getAllThemes(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const list = await themeService.getAllThemes();
      res.status(200).json({
        success: true,
        data: list.map((item) => {
          const mode = item.mode || "dark";
          const combinedColorMap = buildCombinedColorHexMap(item.color_hex_map, mode);
          return {
            id: item.id,
            name: item.name,
            slug: item.slug,
            mode,
            colorHexMap: combinedColorMap,
            color_hex_map: combinedColorMap,
            colorTokens: item.color_tokens || {},
            color_tokens: item.color_tokens || {},
            typography: item.typography || {},
            borderRadius: item.border_radius || "rounded-lg",
            border_radius: item.border_radius || "rounded-lg",
            isActive: Boolean(item.is_active),
            is_active: Boolean(item.is_active),
            updatedAt: item.updated_at,
            updated_at: item.updated_at,
          };
        }),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/theme/:id/activate
   * Activates a specific theme.
   */
  async activateTheme(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id as string, 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: "Invalid theme ID" });
        return;
      }

      const data = await themeService.setActiveTheme(id);
      const etag = await themeService.getActiveThemeEtag();
      const mode = data.mode || "dark";
      const combinedColorMap = buildCombinedColorHexMap(data.color_hex_map, mode);

      res.setHeader("ETag", etag);
      res.status(200).json({
        success: true,
        message: `Theme '${data.name}' activated successfully`,
        data: {
          id: data.id,
          name: data.name,
          slug: data.slug,
          mode,
          colorHexMap: combinedColorMap,
          color_hex_map: combinedColorMap,
          colorTokens: data.color_tokens || {},
          color_tokens: data.color_tokens || {},
          typography: data.typography || {},
          borderRadius: data.border_radius || "rounded-lg",
          border_radius: data.border_radius || "rounded-lg",
          isActive: Boolean(data.is_active),
          is_active: Boolean(data.is_active),
          updatedAt: data.updated_at,
          updated_at: data.updated_at,
          etag,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/theme
   * Creates a new theme.
   */
  async createTheme(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as CreateThemeInput;
      const data = await themeService.createTheme(body);
      const etag = await themeService.getActiveThemeEtag();
      const mode = data.mode || "dark";
      const combinedColorMap = buildCombinedColorHexMap(data.color_hex_map, mode);

      res.setHeader("ETag", etag);
      res.status(201).json({
        success: true,
        message: "Theme created successfully",
        data: {
          id: data.id,
          name: data.name,
          slug: data.slug,
          mode,
          colorHexMap: combinedColorMap,
          color_hex_map: combinedColorMap,
          colorTokens: data.color_tokens || {},
          color_tokens: data.color_tokens || {},
          typography: data.typography || {},
          borderRadius: data.border_radius || "rounded-lg",
          border_radius: data.border_radius || "rounded-lg",
          isActive: Boolean(data.is_active),
          is_active: Boolean(data.is_active),
          updatedAt: data.updated_at,
          updated_at: data.updated_at,
          etag,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const themeController = new ThemeController();
