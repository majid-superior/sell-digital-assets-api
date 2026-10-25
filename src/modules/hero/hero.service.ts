import path from "node:path";
import { env } from "../../config/env.js";
import { AppError } from "../../core/errors/app-error.js";
import { storageService, localStorageService } from "../../core/storage/index.js";
import {
  heroRepository,
  type HeroImageEntity,
  type UpdateHeroImageDbInput,
} from "../../database/repositories/hero.repository.js";

export class HeroService {
  /**
   * Resolves a public accessible URL for a stored hero image key.
   */
  public resolvePublicUrl(storageKey: string): string {
    if (
      (env.STORAGE_DRIVER === "r2" || env.STORAGE_DRIVER === "s3") &&
      env.AWS_ENDPOINT
    ) {
      return `${env.AWS_ENDPOINT}/${storageKey}`;
    }

    // Local storage driver token generation
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

  /**
   * Returns active hero images for public landing page display.
   */
  async getActiveImages(): Promise<HeroImageEntity[]> {
    return heroRepository.findActive(15);
  }

  /**
   * Returns all hero images for admin management.
   */
  async getAllImages(): Promise<HeroImageEntity[]> {
    return heroRepository.findAll();
  }

  /**
   * Uploads a new hero image file, persists to storage and database.
   */
  async uploadHeroImage(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    data: {
      title?: string;
      subtitle?: string;
      sort_order?: number;
      is_active?: boolean;
    },
  ): Promise<HeroImageEntity> {
    if (!mimeType.startsWith("image/")) {
      throw new AppError("Invalid file type: Hero images must be an image format (JPEG, PNG, WebP)", 400);
    }

    const ext = path.extname(fileName).replace(/^\./, "").toLowerCase() || "webp";
    const timestamp = Date.now();
    const randomHex = Math.random().toString(36).substring(2, 8);
    const storageKey = `hero/hero-${timestamp}-${randomHex}.${ext}`;

    await storageService.uploadBuffer(storageKey, fileBuffer, mimeType);
    const imageUrl = this.resolvePublicUrl(storageKey);

    try {
      return await heroRepository.create({
        title: data.title?.trim() || "Hero Slide",
        subtitle: data.subtitle?.trim() || null,
        image_url: imageUrl,
        storage_key: storageKey,
        sort_order: Number.isFinite(data.sort_order) ? Number(data.sort_order) : 0,
        is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
      });
    } catch (err) {
      // Rollback: remove uploaded file from storage if database saving fails
      await storageService.deleteFile(storageKey).catch(() => {});
      throw err;
    }
  }

  /**
   * Toggles active / inactive state of a hero image.
   */
  async toggleStatus(id: string, isActive: boolean): Promise<HeroImageEntity> {
    const existing = await heroRepository.findById(id);
    if (!existing) {
      throw new AppError("Hero image not found", 404);
    }
    const updated = await heroRepository.toggleStatus(id, isActive);
    if (!updated) {
      throw new AppError("Failed to update hero image status", 500);
    }
    return updated;
  }

  /**
   * Updates hero image metadata.
   */
  async updateHeroImage(id: string, input: UpdateHeroImageDbInput): Promise<HeroImageEntity> {
    const existing = await heroRepository.findById(id);
    if (!existing) {
      throw new AppError("Hero image not found", 404);
    }
    const updated = await heroRepository.update(id, input);
    if (!updated) {
      throw new AppError("Failed to update hero image", 500);
    }
    return updated;
  }

  /**
   * Deletes a hero image and removes its file from storage.
   */
  async deleteHeroImage(id: string): Promise<void> {
    const existing = await heroRepository.findById(id);
    if (!existing) {
      throw new AppError("Hero image not found", 404);
    }

    if (existing.storage_key) {
      try {
        await storageService.deleteFile(existing.storage_key);
      } catch {
        // Storage cleanup non-blocking
      }
    }

    await heroRepository.delete(id);
  }
}

export const heroService = new HeroService();

