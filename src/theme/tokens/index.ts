// src/theme/tokens/index.ts
import { COLOR_HEX_MAP, COLOR_TOKENS, type ColorHexMap, type ColorTokens } from "./colors.js";
import { TYPOGRAPHY_TOKENS, type TypographyTokens } from "./typography.js";
import { LAYOUT_TOKENS, type LayoutTokens } from "./layout.js";

export const TOKENS = {
  colors: COLOR_TOKENS,
  palette: COLOR_HEX_MAP,
  typography: TYPOGRAPHY_TOKENS,
  layout: LAYOUT_TOKENS,
} as const;

export type ThemeTokens = typeof TOKENS;

export {
  COLOR_HEX_MAP,
  COLOR_TOKENS,
  TYPOGRAPHY_TOKENS,
  LAYOUT_TOKENS,
  type ColorHexMap,
  type ColorTokens,
  type TypographyTokens,
  type LayoutTokens,
};
