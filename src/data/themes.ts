/**
 * Default Theme Configuration
 * Sourced during database initialization and reset migrations.
 */

import { COLOR_HEX_MAP, COLOR_TOKENS } from "../theme/tokens/colors.js";

export { COLOR_HEX_MAP, COLOR_TOKENS };

export interface DefaultThemeConfig {
  id?: number;
  name: string;
  slug: string;
  is_active: boolean;
  color_hex_map: typeof COLOR_HEX_MAP;
  color_tokens: typeof COLOR_TOKENS;
  metadata?: Record<string, unknown>;
}

export const defaultTheme: DefaultThemeConfig = {
  id: 1,
  name: "Default Theme",
  slug: "default",
  is_active: true,
  color_hex_map: COLOR_HEX_MAP,
  color_tokens: COLOR_TOKENS,
  metadata: {},
};

export const defaultThemes: DefaultThemeConfig[] = [defaultTheme];

