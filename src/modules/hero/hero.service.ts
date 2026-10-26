import fs from "node:fs";
import path from "node:path";
import { env } from "../../config/env.js";
import { AppError } from "../../core/errors/app-error.js";
import { storageService, localStorageService } from "../../core/storage/index.js";
import {
  heroRepository,
  type HeroImageEntity,
} from "../../database/repositories/hero.repository.js";

export interface HeroImageDto {
  id: string;
  title: string;
  subtitle: string | null;
  detail: string | null;
  categoryName: string | null;
  category_name: string | null;
  categorySlug: string | null;
  category_slug: string | null;
  imageUrl: string;
  image_url: string;
  storageKey: string | null;
  storage_key: string | null;
  sortOrder: number;
  sort_order: number;
  isActive: boolean;
  is_active: boolean;
  createdAt: string;
  created_at: string;
  updatedAt: string;
  updated_at: string;
}

export function formatHeroDto(r: HeroImageEntity): HeroImageDto {
  const createdAt = r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at);
  const updatedAt = r.updated_at instanceof Date ? r.updated_at.toISOString() : String(r.updated_at);
  return {
    id: r.id,
    title: r.title,
    subtitle: r.subtitle ?? null,
    detail: r.detail ?? null,
    categoryName: r.category_name ?? null,
    category_name: r.category_name ?? null,
    categorySlug: r.category_slug ?? null,
    category_slug: r.category_slug ?? null,
    imageUrl: r.image_url,
    image_url: r.image_url,
    storageKey: r.storage_key ?? null,
    storage_key: r.storage_key ?? null,
    sortOrder: Number(r.sort_order ?? 0),
    sort_order: Number(r.sort_order ?? 0),
    isActive: Boolean(r.is_active),
    is_active: Boolean(r.is_active),
    createdAt,
    created_at: createdAt,
    updatedAt,
    updated_at: updatedAt,
  };
}

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
  async getActiveImages(): Promise<HeroImageDto[]> {
    const rows = await heroRepository.findActive(25);
    return rows.map(formatHeroDto);
  }

  /**
   * Returns all hero images for admin management.
   */
  async getAllImages(): Promise<HeroImageDto[]> {
    const rows = await heroRepository.findAll();
    return rows.map(formatHeroDto);
  }

  /**
   * Uploads a new hero image file, persists to storage and database,
   * then updates cached json files across API and website.
   */
  async uploadHeroImage(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    data: {
      title?: string;
      subtitle?: string | null;
      detail?: string | null;
      category_name?: string | null;
      categoryName?: string | null;
      category_slug?: string | null;
      categorySlug?: string | null;
      sort_order?: number;
      sortOrder?: number;
      is_active?: boolean;
      isActive?: boolean;
    },
  ): Promise<HeroImageDto> {
    if (!mimeType.startsWith("image/")) {
      throw new AppError("Invalid file type: Hero images must be an image format (JPEG, PNG, WebP)", 400);
    }

    const ext = path.extname(fileName).replace(/^\./, "").toLowerCase() || "webp";
    const timestamp = Date.now();
    const randomHex = Math.random().toString(36).substring(2, 8);
    const storageKey = `hero/hero-${timestamp}-${randomHex}.${ext}`;

    await storageService.uploadBuffer(storageKey, fileBuffer, mimeType);
    const imageUrl = this.resolvePublicUrl(storageKey);

    const sortOrderVal = data.sort_order ?? data.sortOrder ?? 0;
    const isActiveVal = data.is_active ?? data.isActive ?? true;

    try {
      const created = await heroRepository.create({
        title: data.title?.trim() || "Hero Slide",
        subtitle: data.subtitle?.trim() || null,
        detail: data.detail?.trim() || null,
        category_name: data.category_name?.trim() || data.categoryName?.trim() || null,
        category_slug: data.category_slug?.trim() || data.categorySlug?.trim() || null,
        image_url: imageUrl,
        storage_key: storageKey,
        sort_order: Number.isFinite(sortOrderVal) ? Number(sortOrderVal) : 0,
        is_active: Boolean(isActiveVal),
      });

      await this.syncJsonFiles().catch(() => {});
      return formatHeroDto(created);
    } catch (err) {
      // Rollback: remove uploaded file from storage if database saving fails
      await storageService.deleteFile(storageKey).catch(() => {});
      throw err;
    }
  }

  /**
   * Toggles active / inactive state of a hero image.
   */
  async toggleStatus(id: string, isActive: boolean): Promise<HeroImageDto> {
    const existing = await heroRepository.findById(id);
    if (!existing) {
      throw new AppError("Hero image not found", 404);
    }
    const updated = await heroRepository.toggleStatus(id, isActive);
    if (!updated) {
      throw new AppError("Failed to update hero image status", 500);
    }
    await this.syncJsonFiles().catch(() => {});
    return formatHeroDto(updated);
  }

  /**
   * Updates hero image metadata and regenerates cached JSON.
   */
  async updateHeroImage(
    id: string,
    data: {
      title?: string;
      subtitle?: string | null;
      detail?: string | null;
      category_name?: string | null;
      categoryName?: string | null;
      category_slug?: string | null;
      categorySlug?: string | null;
      image_url?: string;
      imageUrl?: string;
      storage_key?: string | null;
      storageKey?: string | null;
      sort_order?: number;
      sortOrder?: number;
      is_active?: boolean;
      isActive?: boolean;
    },
  ): Promise<HeroImageDto> {
    const existing = await heroRepository.findById(id);
    if (!existing) {
      throw new AppError("Hero image not found", 404);
    }

    const updated = await heroRepository.update(id, {
      title: data.title?.trim(),
      subtitle: data.subtitle !== undefined ? data.subtitle?.trim() || null : undefined,
      detail: data.detail !== undefined ? data.detail?.trim() || null : undefined,
      category_name:
        data.category_name !== undefined
          ? data.category_name?.trim() || null
          : data.categoryName !== undefined
          ? data.categoryName?.trim() || null
          : undefined,
      category_slug:
        data.category_slug !== undefined
          ? data.category_slug?.trim() || null
          : data.categorySlug !== undefined
          ? data.categorySlug?.trim() || null
          : undefined,
      image_url: data.image_url || data.imageUrl,
      storage_key:
        data.storage_key !== undefined
          ? data.storage_key
          : data.storageKey !== undefined
          ? data.storageKey
          : undefined,
      sort_order:
        data.sort_order !== undefined
          ? Number(data.sort_order)
          : data.sortOrder !== undefined
          ? Number(data.sortOrder)
          : undefined,
      is_active:
        data.is_active !== undefined
          ? Boolean(data.is_active)
          : data.isActive !== undefined
          ? Boolean(data.isActive)
          : undefined,
    });

    if (!updated) {
      throw new AppError("Hero image not found", 404);
    }
    await this.syncJsonFiles().catch(() => {});
    return formatHeroDto(updated);
  }

  /**
   * Deletes a hero image and syncs JSON files.
   */
  async deleteHeroImage(id: string): Promise<void> {
    const existing = await heroRepository.findById(id);
    if (!existing) {
      throw new AppError("Hero image not found", 404);
    }

    if (existing.storage_key) {
      await storageService.deleteFile(existing.storage_key).catch(() => {});
    }

    const success = await heroRepository.delete(id);
    if (!success) {
      throw new AppError("Failed to delete hero image", 500);
    }
    await this.syncJsonFiles().catch(() => {});
  }

  /**
   * Synchronizes active hero images to src/data/hero-images.json and
   * ../sell-digital-assets-website/src/features/website/data/heroImages.json
   */
  async syncJsonFiles(): Promise<void> {
    const activeItems = await heroRepository.findActive(50);
    const images = activeItems.map((img) => ({
      id: img.id,
      title: img.title,
      subtitle: img.subtitle ?? null,
      detail: img.detail ?? null,
      categoryName: img.category_name ?? null,
      categorySlug: img.category_slug ?? null,
      imageUrl: img.image_url,
      storageKey: img.storage_key ?? null,
      sortOrder: Number(img.sort_order ?? 0),
      isActive: Boolean(img.is_active),
      createdAt: img.created_at instanceof Date ? img.created_at.toISOString() : String(img.created_at),
      updatedAt: img.updated_at instanceof Date ? img.updated_at.toISOString() : String(img.updated_at),
    }));

    // Compute deterministic signature hash matching frontend algorithm
    const signature = images
      .map(
        (img) =>
          `${img.id}:${img.updatedAt || ""}:${img.storageKey || ""}:${img.title || ""}:${img.categorySlug || ""}:${img.sortOrder ?? 0}:${img.isActive !== false}`,
      )
      .join("|");

    let hash = 2166136261;
    for (let i = 0; i < signature.length; i++) {
      hash ^= signature.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    const syncHash = `hero-${(hash >>> 0).toString(16)}-${images.length}`;

    const payload = {
      syncHash,
      lastUpdated: new Date().toISOString(),
      version: "1.0.0",
      count: images.length,
      images,
    };

    const targetPath = path.resolve(
      process.cwd(),
      "../sell-digital-assets-website/src/features/website/data/heroImages.json",
    );

    try {
      await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.promises.writeFile(targetPath, JSON.stringify(payload, null, 2), "utf-8");
    } catch {
      // Continue if external directory cannot be accessed
    }
  }
}

export const heroService = new HeroService();
