import crypto from "node:crypto";
import sharp from "sharp";
import { env } from "../../config/env.js";
import { AppError } from "../../core/errors/app-error.js";
import { storageService, localStorageService } from "../../core/storage/index.js";
import { storefrontRepository } from "./storefront.repository.js";
import { userRepository } from "../../database/repositories/user.repository.js";
import { assetsRepository } from "../../database/repositories/assets.repository.js";
import type { UpdateStorefrontInput } from "./storefront.schema.js";

const MAX_STOREFRONT_BANNER_BYTES = 3 * 1024 * 1024; // 3 MB max file size (no min limit)
const ALLOWED_BANNER_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const BANNER_WIDTH = 1200;
const BANNER_HEIGHT = 400;

/**
 * Verifies binary magic bytes for PNG, JPEG, and WebP formats to prevent MIME spoofing.
 */
function hasValidImageMagicBytes(buf: Buffer): boolean {
  if (buf.length < 4) return false;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return true;
  }

  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return true;
  }

  // WebP: "RIFF" (52 49 46 46) at 0..3 and "WEBP" (57 45 42 50) at 8..11
  if (
    buf.length >= 12 &&
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  ) {
    return true;
  }

  return false;
}

/**
 * Extracts a storefront storage key from a stored banner URL if it belongs to local/managed storage.
 */
function extractStorefrontStorageKey(bannerUrl?: string | null): string | null {
  if (!bannerUrl) return null;
  try {
    const queryIdx = bannerUrl.indexOf("?");
    if (queryIdx !== -1) {
      const searchParams = new URLSearchParams(bannerUrl.slice(queryIdx + 1));
      const key = searchParams.get("key");
      if (key && key.startsWith("public/media/storefront/") && !key.includes("..")) {
        return key;
      }
    }
  } catch {
    // Ignore malformed URLs
  }
  return null;
}

export class StorefrontService {
  /**
   * Resolves a publicly accessible URL for a storefront banner storage key.
   * Uses a relative path in local development so Vite proxy and canvas operations remain same-origin.
   */
  public resolvePublicBannerUrl(storageKey: string): string {
    if (
      (env.STORAGE_DRIVER === "r2" || env.STORAGE_DRIVER === "s3") &&
      env.AWS_ENDPOINT
    ) {
      return `${env.AWS_ENDPOINT}/${storageKey}`;
    }

    const expiresAt = Date.now() + 31536000000; // 1 year
    const token = localStorageService.signToken(
      storageKey,
      expiresAt,
      "download"
    );
    const baseUrl = env.SERVER_URL ? env.SERVER_URL.replace(/\/+$/, "") : "";
    return `${baseUrl}/api/v1/storage/download?key=${encodeURIComponent(
      storageKey
    )}&token=${token}&expires=${expiresAt}`;
  }

  async getStorefrontConfig(sellerId: string) {
    const entity = await storefrontRepository.findBySellerId(sellerId);
    return {
      url: entity?.url ?? "",
      title: entity?.title ?? "",
      description: entity?.description ?? "",
      bannerUrl: entity?.banner_url ?? "",
      featuredAssetId: entity?.featured_asset_id ?? "",
      isVisible: Boolean(entity?.is_visible && entity?.url),
      updatedAt: entity?.updated_at ? new Date(entity.updated_at).toISOString() : undefined,
    };
  }

  async updateStorefrontConfig(sellerId: string, input: UpdateStorefrontInput) {
    const normalizedUrl = input.url.toLowerCase().trim();
    const existingByUrl = await storefrontRepository.findByUrl(normalizedUrl);
    if (existingByUrl && existingByUrl.seller_id !== sellerId) {
      throw new AppError(
        "This custom storefront URL is already in use by another creator. Please choose a different URL.",
        409
      );
    }

    const previousEntity = await storefrontRepository.findBySellerId(sellerId);
    const oldStorageKey = extractStorefrontStorageKey(previousEntity?.banner_url);
    const newStorageKey = extractStorefrontStorageKey(input.bannerUrl);

    const entity = await storefrontRepository.upsert(sellerId, {
      ...input,
      url: normalizedUrl,
    });

    // Asynchronously clean up superseded banner file to prevent orphaned storage bloat
    if (oldStorageKey && oldStorageKey !== newStorageKey) {
      void storageService.deleteFile(oldStorageKey).catch(() => {});
    }

    return {
      url: entity.url ?? "",
      title: entity.title ?? "",
      description: entity.description ?? "",
      bannerUrl: entity.banner_url ?? "",
      featuredAssetId: entity.featured_asset_id ?? "",
      isVisible: Boolean(entity.is_visible && entity.url),
      updatedAt: new Date(entity.updated_at).toISOString(),
    };
  }

  async uploadStorefrontBanner(sellerId: string, file?: Express.Multer.File) {
    if (!file || !file.buffer) {
      throw new AppError("No banner image file was uploaded. Please attach an image file.", 400);
    }

    if (file.size > MAX_STOREFRONT_BANNER_BYTES) {
      throw new AppError("Banner image exceeds the 3 MB maximum size limit.", 400);
    }

    const mimeType = (file.mimetype || "image/webp").toLowerCase();
    if (!ALLOWED_BANNER_MIME_TYPES.has(mimeType)) {
      throw new AppError(
        `Unsupported image format (${mimeType}). Please upload a PNG, JPG, or WebP image.`,
        400
      );
    }

    if (file.buffer.length > 0 && !hasValidImageMagicBytes(file.buffer)) {
      throw new AppError(
        "Invalid image file signature. Please upload a genuine PNG, JPG, or WebP image.",
        400
      );
    }

    // Re-encode via sharp to strip EXIF metadata, sanitize polyglots, and optimize WebP payload
    let optimizedBuffer = file.buffer;
    let outputMime = "image/webp";
    let ext = "webp";

    if (file.buffer.length > 0) {
      try {
        optimizedBuffer = await sharp(file.buffer, { limitInputPixels: 4096 * 4096 })
          .rotate() // Auto-orient based on EXIF before stripping metadata
          .resize(BANNER_WIDTH, BANNER_HEIGHT, {
            fit: "cover",
            position: "centre",
          })
          .webp({ quality: 88, effort: 4 })
          .toBuffer();
      } catch {
        throw new AppError(
          "The uploaded file could not be decoded as a valid image. Please try another PNG, JPG, or WebP file.",
          400
        );
      }
    } else {
      ext = mimeType === "image/png" ? "png" : mimeType === "image/jpeg" ? "jpg" : "webp";
      outputMime = mimeType;
    }

    const randomSuffix = crypto.randomBytes(4).toString("hex");
    const storageKey = `public/media/storefront/${sellerId}-${Date.now()}-${randomSuffix}.${ext}`;

    await storageService.uploadBuffer(storageKey, optimizedBuffer, outputMime);
    const downloadUrl = this.resolvePublicBannerUrl(storageKey);

    return {
      url: downloadUrl,
      storageKey,
    };
  }

  async getPublicStorefront(sellerUrl: string) {
    const normalized = sellerUrl.toLowerCase().trim();
    const entity = await storefrontRepository.findByUrl(normalized);
    if (!entity || !entity.is_visible || !entity.url) {
      throw new AppError(`Storefront "${sellerUrl}" was not found or is currently private.`, 404);
    }

    const sellerUser = await userRepository.findById(entity.seller_id);
    if (!sellerUser || sellerUser.status !== "active") {
      throw new AppError("Creator account is not active or not found.", 404);
    }

    const assetsResult = await assetsRepository.findBySeller(entity.seller_id, {
      status: "published",
    });

    let featuredAsset = null;
    if (entity.featured_asset_id) {
      featuredAsset = await assetsRepository.findById(entity.featured_asset_id);
    }

    return {
      sellerId: entity.seller_id,
      url: entity.url,
      displayName: sellerUser.name || "Creator",
      avatarUrl: undefined,
      title: entity.title,
      description: entity.description,
      bannerUrl: entity.banner_url,
      isVisible: entity.is_visible,
      featuredAsset,
      assets: assetsResult.data || [],
      rating: 5.0,
      reviewCount: 0,
      joinedAt: new Date(sellerUser.created_at).toISOString(),
    };
  }
}

export const storefrontService = new StorefrontService();
