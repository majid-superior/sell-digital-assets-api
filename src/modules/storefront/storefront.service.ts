import { AppError } from "../../core/errors/app-error.js";
import { storageService } from "../../core/storage/index.js";
import { storefrontRepository } from "./storefront.repository.js";
import { userRepository } from "../../database/repositories/user.repository.js";
import { assetsRepository } from "../../database/repositories/assets.repository.js";
import type { UpdateStorefrontInput } from "./storefront.schema.js";

const MAX_STOREFRONT_BANNER_BYTES = 3 * 1024 * 1024; // 3 MB max file size
const ALLOWED_BANNER_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export class StorefrontService {
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
    const existing = await storefrontRepository.findByUrl(normalizedUrl);
    if (existing && existing.seller_id !== sellerId) {
      throw new AppError(
        "This custom storefront URL is already in use by another creator. Please choose a different URL.",
        409
      );
    }

    const entity = await storefrontRepository.upsert(sellerId, {
      ...input,
      url: normalizedUrl,
    });

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

    const ext = mimeType === "image/png" ? "png" : mimeType === "image/jpeg" ? "jpg" : "webp";
    const storageKey = `public/media/storefront/${sellerId}-${Date.now()}.${ext}`;

    await storageService.uploadBuffer(storageKey, file.buffer, mimeType);

    // 1-year signed download URL
    const downloadUrl = await storageService.generatePresignedDownloadUrl(
      storageKey,
      `storefront-banner.${ext}`,
      31536000
    );

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
