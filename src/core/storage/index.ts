import { env } from "../../config/env.js";
import { SUPABASE_BUCKETS } from "../../config/supabase.js";
import type { IStorageService } from "./storage.interface.js";
import { LocalStorageService } from "./local.storage.js";
import { CloudflareR2StorageService } from "./r2.storage.js";

export const localStorageService = new LocalStorageService();

export const storageService: IStorageService =
  (env.STORAGE_DRIVER === "r2" || env.STORAGE_DRIVER === "s3") &&
  env.AWS_ENDPOINT &&
  env.AWS_ACCESS_KEY_ID
    ? new CloudflareR2StorageService()
    : localStorageService;

/**
 * Resolves a publicly accessible URL for a public/preview/hero storage key
 * across Local, Supabase S3, and Cloudflare R2 storage drivers.
 */
export function resolvePublicStorageUrl(storageKey: string): string {
  if (storageKey.startsWith("http://") || storageKey.startsWith("https://")) {
    return storageKey;
  }

  if (
    (env.STORAGE_DRIVER === "r2" || env.STORAGE_DRIVER === "s3") &&
    env.AWS_ENDPOINT
  ) {
    const endpoint = env.AWS_ENDPOINT.replace(/\/+$/, "");
    const bucket = env.AWS_BUCKET_PREVIEWS || SUPABASE_BUCKETS.PREVIEWS;
    if (endpoint.includes("supabase.co")) {
      try {
        const parsed = new URL(endpoint);
        const host = parsed.hostname.replace(
          ".storage.supabase.co",
          ".supabase.co",
        );
        return `https://${host}/storage/v1/object/public/${bucket}/${storageKey}`;
      } catch {
        return `${endpoint}/${bucket}/${storageKey}`;
      }
    }
    return `${endpoint}/${bucket}/${storageKey}`;
  }

  const expiresAt = Date.now() + 31536000000; // 1 year
  const token = localStorageService.signToken(
    storageKey,
    expiresAt,
    "download",
  );
  const baseUrl = env.SERVER_URL ? env.SERVER_URL.replace(/\/+$/, "") : "";
  return `${baseUrl}/api/v1/storage/download?key=${encodeURIComponent(
    storageKey,
  )}&token=${token}&expires=${expiresAt}`;
}

export * from "./storage.interface.js";
export { LocalStorageService } from "./local.storage.js";
export { CloudflareR2StorageService } from "./r2.storage.js";

