import { themeRepository } from "../../database/repositories/theme.repository.js";
import { COLOR_HEX_MAP, COLOR_TOKENS } from "../../theme/tokens/colors.js";
import { defaultTheme } from "../../data/themes.js";
import { AppError } from "../../core/errors/app-error.js";
import type { ThemeEntity } from "../../database/types.js";
import type {
  UpdateActiveThemeInput,
  CreateThemeInput,
} from "./theme.schema.js";

let cachedActiveTheme: ThemeEntity | null = null;
let cachedCssString: string | null = null;
let cachedEtag: string | null = null;
let lastFetchedTime = 0;
const CACHE_TTL_MS = 60000; // 1 minute in-memory cache

function camelToKebab(str: string): string {
  return str
    .replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, "$1-$2")
    .toLowerCase();
}

export class ThemeService {
  /**
   * Invalidate all in-memory and Redis caches.
   */
  async invalidateCache(): Promise<void> {
    cachedActiveTheme = null;
    cachedCssString = null;
    cachedEtag = null;
    lastFetchedTime = 0;
  }

  /**
   * Retrieves the currently active theme from the database with in-memory caching.
   */
  async getActiveTheme(forceRefresh = false): Promise<ThemeEntity> {
    const now = Date.now();
    if (!forceRefresh && cachedActiveTheme && now - lastFetchedTime < CACHE_TTL_MS) {
      return cachedActiveTheme;
    }

    try {
      const dbTheme = await themeRepository.getActiveTheme();
      if (dbTheme) {
        cachedActiveTheme = dbTheme;
        cachedCssString = null;
        const updatedAtTime = dbTheme.updated_at
          ? new Date(dbTheme.updated_at).getTime()
          : now;
        cachedEtag = `W/"theme-${dbTheme.id || 1}-${updatedAtTime}"`;
        lastFetchedTime = now;
        return dbTheme;
      }
    } catch (_err) {
      // Fallback if database is offline or not yet migrated
    }

    // Default fallback representation sourced from src/data/themes.ts
    const fallback: ThemeEntity = {
      id: defaultTheme.id ?? 1,
      name: defaultTheme.name,
      slug: defaultTheme.slug,
      mode: "dark",
      is_active: defaultTheme.is_active,
      color_hex_map: defaultTheme.color_hex_map as unknown as Record<string, any>,
      color_tokens: defaultTheme.color_tokens as unknown as Record<string, string>,
      typography: (defaultTheme.metadata?.typography || {}) as Record<string, unknown>,
      border_radius: "rounded-lg",
      metadata: defaultTheme.metadata ?? {},
    };
    cachedActiveTheme = fallback;
    cachedCssString = null;
    cachedEtag = `W/"theme-default-${now}"`;
    lastFetchedTime = now;
    return fallback;
  }

  /**
   * Returns current ETag for the active theme.
   */
  async getActiveThemeEtag(): Promise<string> {
    const theme = await this.getActiveTheme();
    if (cachedEtag) return cachedEtag;
    const updatedAt = theme.updated_at ? new Date(theme.updated_at).getTime() : Date.now();
    cachedEtag = `W/"theme-${theme.id || 1}-${updatedAt}"`;
    return cachedEtag;
  }

  /**
   * Generates CSS variable stylesheets dynamically from active database theme colors.
   * Injected variables include !important to guarantee overriding Tailwind v3/v4 @theme fallbacks.
   */
  async getCssVariables(): Promise<string> {
    if (cachedCssString && cachedActiveTheme) {
      return cachedCssString;
    }

    const theme = await this.getActiveTheme();
    const rawMap = (theme.color_hex_map as any) || {};

    const lightPalette: Record<string, string> = {
      ...COLOR_HEX_MAP.light,
      ...(rawMap.light && typeof rawMap.light === "object" ? rawMap.light : {}),
    };
    const darkPalette: Record<string, string> = {
      ...COLOR_HEX_MAP.dark,
      ...(rawMap.dark && typeof rawMap.dark === "object" ? rawMap.dark : {}),
    };

    // If rawMap has flat properties without light/dark nesting:
    if (!rawMap.light && !rawMap.dark) {
      for (const [k, v] of Object.entries(rawMap)) {
        if (typeof v === "string") {
          lightPalette[k] = v;
          darkPalette[k] = v;
        }
      }
    }

    const lightLines: string[] = [];
    for (const [key, val] of Object.entries(lightPalette)) {
      if (val && typeof val === "string") {
        lightLines.push(`  --color-${camelToKebab(key)}: ${val} !important;`);
      }
    }

    const darkLines: string[] = [];
    for (const [key, val] of Object.entries(darkPalette)) {
      if (val && typeof val === "string") {
        darkLines.push(`  --color-${camelToKebab(key)}: ${val} !important;`);
      }
    }

    const css = `/* ==========================================================================
   Dynamically Generated Theme CSS Variables (Source: PostgreSQL Database)
   Theme: ${theme.name} (${theme.slug || "active"})
   Updated: ${theme.updated_at || new Date().toISOString()}
   ========================================================================== */

:root {
${lightLines.join("\n")}
}

.dark,
[data-theme="dark"] {
${darkLines.join("\n")}
}
`;

    cachedCssString = css;
    return css;
  }

  /**
   * Updates the active theme colors, mode, and tokens in PostgreSQL.
   */
  async updateActiveTheme(input: UpdateActiveThemeInput): Promise<ThemeEntity> {
    const current = await this.getActiveTheme(true);
    const currentColorHexMap = (current.color_hex_map as any) || {};

    const rawInputMap = (input.color_hex_map || input.colorHexMap || {}) as Record<string, any>;
    const hasNested = Boolean(rawInputMap.light || rawInputMap.dark);

    let updatedColorHexMap: Record<string, any>;

    if (hasNested) {
      updatedColorHexMap = {
        light: {
          ...(currentColorHexMap.light || COLOR_HEX_MAP.light),
          ...(rawInputMap.light || {}),
        },
        dark: {
          ...(currentColorHexMap.dark || COLOR_HEX_MAP.dark),
          ...(rawInputMap.dark || {}),
        },
      };
    } else if (Object.keys(rawInputMap).length > 0) {
      // Flat map passed
      const currentMode = input.mode || current.mode || "dark";
      const targetSub = currentMode === "dark" ? "dark" : "light";
      const otherSub = currentMode === "dark" ? "light" : "dark";

      updatedColorHexMap = {
        light: {
          ...(currentColorHexMap.light || COLOR_HEX_MAP.light),
          ...(targetSub === "light" ? rawInputMap : {}),
        },
        dark: {
          ...(currentColorHexMap.dark || COLOR_HEX_MAP.dark),
          ...(targetSub === "dark" ? rawInputMap : {}),
        },
        ...rawInputMap,
      };
    } else {
      updatedColorHexMap = currentColorHexMap;
    }

    const rawTokens = input.color_tokens || input.colorTokens;
    const updatedTokens: Record<string, string> = rawTokens
      ? {
          ...((current.color_tokens as any) || {}),
          ...rawTokens,
        }
      : ((current.color_tokens as any) || {});

    const updatedName = input.name || current.name;
    const updatedMode = input.mode || current.mode || "dark";
    const updatedBorderRadius = input.border_radius || input.borderRadius || current.border_radius || "rounded-lg";
    const updatedTypography = input.typography || current.typography || {};

    const saved = await themeRepository.updateActiveThemeSettings({
      name: updatedName,
      mode: updatedMode,
      color_hex_map: updatedColorHexMap,
      color_tokens: updatedTokens,
      border_radius: updatedBorderRadius,
      typography: updatedTypography,
    });

    // Invalidate caches
    await this.invalidateCache();

    // Re-prime cache with freshly saved entity
    cachedActiveTheme = saved;
    const updatedAt = saved.updated_at ? new Date(saved.updated_at).getTime() : Date.now();
    cachedEtag = `W/"theme-${saved.id || 1}-${updatedAt}"`;
    lastFetchedTime = Date.now();

    return saved;
  }

  /**
   * Lists all registered themes in the database.
   */
  async getAllThemes(): Promise<ThemeEntity[]> {
    return await themeRepository.getAllThemes();
  }

  /**
   * Activates a theme by its unique numeric ID.
   */
  async setActiveTheme(id: number): Promise<ThemeEntity> {
    const theme = await themeRepository.getThemeById(id);
    if (!theme) {
      throw new AppError(`Theme with ID ${id} not found`, 404);
    }
    const activated = await themeRepository.setActiveTheme(id);
    await this.invalidateCache();
    cachedActiveTheme = activated;
    const updatedAt = activated.updated_at ? new Date(activated.updated_at).getTime() : Date.now();
    cachedEtag = `W/"theme-${activated.id || 1}-${updatedAt}"`;
    lastFetchedTime = Date.now();
    return activated;
  }

  /**
   * Creates a new theme record in the database.
   */
  async createTheme(input: CreateThemeInput): Promise<ThemeEntity> {
    const existing = await themeRepository.getThemeBySlug(input.slug);
    if (existing) {
      throw new AppError(
        `A theme with slug '${input.slug}' already exists`,
        409,
      );
    }

    const rawHex = input.color_hex_map || input.colorHexMap || COLOR_HEX_MAP;
    const rawTokens = input.color_tokens || input.colorTokens || COLOR_TOKENS;

    const created = await themeRepository.createTheme({
      name: input.name,
      slug: input.slug,
      mode: input.mode || "dark",
      is_active: input.is_active ?? input.isActive ?? false,
      color_hex_map: rawHex as any,
      color_tokens: rawTokens as any,
      typography: input.typography,
      border_radius: input.border_radius || input.borderRadius || "rounded-lg",
      metadata: input.metadata,
    });

    if (input.is_active || input.isActive) {
      await this.setActiveTheme(created.id as number);
    }

    return created;
  }
}

export const themeService = new ThemeService();
