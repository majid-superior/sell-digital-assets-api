/**
 * Utility functions for HTML sanitization and string formatting across pages
 */

export function escapeHtml(str: string | number | undefined | null): string {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Capitalizes the first letter of a string (e.g., "development" -> "Development")
 */
export function capitalizeFirstLetter(str?: string | null): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Formats a database identifier into Title Case with spaces replacing underscores
 * without using a default fallback (e.g., "sell_digital_assets" -> "Sell Digital Assets")
 */
export function formatDatabaseName(str?: string | null): string {
  if (!str) return "";
  return str
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
