import crypto from "node:crypto";
import { env } from "../../config/env.js";
import { AppError } from "../../core/errors/app-error.js";
import { storageService, resolvePublicStorageUrl } from "../../core/storage/index.js";
import { storefrontRepository } from "../../database/repositories/storefront.repository.js";
import { userRepository } from "../../database/repositories/user.repository.js";
import { assetsRepository } from "../../database/repositories/assets.repository.js";
import {
  MAX_STOREFRONT_BANNER_BYTES,
  RESERVED_STOREFRONT_SLUGS,
  type PresignStorefrontBannerInput,
  type UpdateStorefrontInput,
} from "./storefront.schema.js";

/**
 * Extracts a storefront storage key from a stored banner URL if it belongs to managed storage.
 */
function extractStorefrontStorageKey(bannerUrl?: string | null): string | null {
  if (!bannerUrl) return null;
  try {
    const queryIdx = bannerUrl.indexOf("?");
    if (queryIdx !== -1) {
      const searchParams = new URLSearchParams(bannerUrl.slice(queryIdx + 1));
      const key = searchParams.get("key");
      if (
        key &&
        key.startsWith("public/media/storefront/") &&
        !key.includes("..") &&
        !key.includes("\\") &&
        !key.includes("\0")
      ) {
        return key;
      }
    }
  } catch {
    // Ignore malformed URLs
  }
  return null;
}

function sanitizePublicAsset<T extends Record<string, any>>(asset: T): Omit<T, "storage_path" | "rejection_reason" | "admin_feedback" | "seller_feedback"> {
  const {
    storage_path: _storagePath,
    rejection_reason: _rejectionReason,
    admin_feedback: _adminFeedback,
    seller_feedback: _sellerFeedback,
    ...publicAsset
  } = asset;
  return publicAsset;
}

export class StorefrontService {
  /**
   * Resolves a publicly accessible URL for a storefront banner storage key.
   * Uses a relative path in local development so Vite proxy and canvas operations remain same-origin.
   */
  public resolvePublicBannerUrl(storageKey: string): string {
    return resolvePublicStorageUrl(storageKey);
  }

  /**
   * Generates a presigned direct-to-storage PUT upload URL for a storefront banner (max 3 MB, no min limit).
   */
  async presignBannerUpload(
    sellerId: string,
    input: PresignStorefrontBannerInput
  ) {
    if (input.fileSizeBytes > MAX_STOREFRONT_BANNER_BYTES) {
      throw new AppError(
        "Banner image exceeds the 3 MB maximum size limit.",
        400
      );
    }

    const sanitizedFileName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const randomSuffix = crypto.randomBytes(4).toString("hex");
    const storageKey = `public/media/storefront/${sellerId}/${Date.now()}-${randomSuffix}-${sanitizedFileName}`;

    const presigned = await storageService.generatePresignedUploadUrl(
      storageKey,
      input.contentType,
      900 // 15 minutes
    );

    const bannerUrl = this.resolvePublicBannerUrl(storageKey);

    return {
      ...presigned,
      bannerUrl,
    };
  }

  /**
   * Checks whether a custom storefront URL slug is valid and available for the given seller.
   */
  async checkUrlAvailability(sellerId: string, rawUrl: string) {
    const normalizedUrl = rawUrl.toLowerCase().trim();

    if (normalizedUrl.length < 3) {
      return {
        available: false,
        url: normalizedUrl,
        reason: "Custom URL must be at least 3 characters (e.g., seller01).",
      };
    }

    if (normalizedUrl.length > 30) {
      return {
        available: false,
        url: normalizedUrl,
        reason: "Custom URL cannot exceed 30 characters.",
      };
    }

    if (!/^[a-z0-9][a-z0-9_-]*$/i.test(normalizedUrl)) {
      return {
        available: false,
        url: normalizedUrl,
        reason: "Only letters, numbers, hyphens (-), and underscores (_) are allowed.",
      };
    }

    if (RESERVED_STOREFRONT_SLUGS.has(normalizedUrl)) {
      return {
        available: false,
        url: normalizedUrl,
        reason: "This URL name is reserved by the system. Please choose another.",
      };
    }

    const existing = await storefrontRepository.findByUrl(normalizedUrl);
    if (existing && existing.seller_id !== sellerId) {
      return {
        available: false,
        url: normalizedUrl,
        reason:
          "This custom storefront URL is already in use by another creator. Please choose a different URL.",
      };
    }

    return {
      available: true,
      url: normalizedUrl,
    };
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
      updatedAt: entity?.updated_at
        ? new Date(entity.updated_at).toISOString()
        : undefined,
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

    if (input.featuredAssetId) {
      const featuredCandidate = await assetsRepository.findById(input.featuredAssetId);
      if (
        !featuredCandidate ||
        featuredCandidate.seller_id !== sellerId ||
        featuredCandidate.status !== "published"
      ) {
        throw new AppError(
          "The selected featured asset must be a published asset owned by your seller account.",
          400
        );
      }
    }

    const previousEntity = await storefrontRepository.findBySellerId(sellerId);
    const oldStorageKey = extractStorefrontStorageKey(previousEntity?.banner_url);
    const newStorageKey = extractStorefrontStorageKey(input.bannerUrl);

    if (newStorageKey) {
      const expectedSellerPrefix = `public/media/storefront/${sellerId}/`;
      const legacySellerPrefix = `public/media/storefront/${sellerId}-`;
      if (
        !newStorageKey.startsWith(expectedSellerPrefix) &&
        !newStorageKey.startsWith(legacySellerPrefix)
      ) {
        throw new AppError("Unauthorized banner storage key for this seller.", 403);
      }

      if (env.STORAGE_DRIVER === "local") {
        const stats = await storageService.getFileStats(newStorageKey);
        if (!stats.exists) {
          throw new AppError(
            "Uploaded banner file was not found in storage. Please re-upload the banner image.",
            400
          );
        }
      }
    }

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

  async getPublicStorefront(sellerUrl: string) {
    const normalized = sellerUrl.toLowerCase().trim();
    const entity = await storefrontRepository.findByUrl(normalized);
    if (!entity || !entity.is_visible || !entity.url) {
      throw new AppError(
        `Storefront "${sellerUrl}" was not found or is currently private.`,
        404
      );
    }

    const sellerUser = await userRepository.findById(entity.seller_id);
    if (!sellerUser || sellerUser.status !== "active") {
      throw new AppError("Creator account is not active or not found.", 404);
    }

    const assetsResult = await assetsRepository.findBySeller(entity.seller_id, {
      status: "published",
    });
    const publicAssets = (assetsResult.data || []).map((a) =>
      sanitizePublicAsset(a as Record<string, any>)
    );

    let featuredAsset = null;
    if (entity.featured_asset_id) {
      const matchedFromList = publicAssets.find(
        (a: any) => a.id === entity.featured_asset_id
      );
      if (matchedFromList) {
        featuredAsset = matchedFromList;
      } else {
        const rawFeatured = await assetsRepository.findById(entity.featured_asset_id);
        if (
          rawFeatured &&
          rawFeatured.seller_id === entity.seller_id &&
          rawFeatured.status === "published" &&
          rawFeatured.is_active !== false
        ) {
          featuredAsset = sanitizePublicAsset(rawFeatured as Record<string, any>);
        }
      }
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
      assets: publicAssets,
      rating: 5.0,
      reviewCount: 0,
      joinedAt: new Date(sellerUser.created_at).toISOString(),
    };
  }
}

export const storefrontService = new StorefrontService();
