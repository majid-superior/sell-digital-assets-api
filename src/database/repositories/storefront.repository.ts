import type { QueryResultRow } from "pg";
import { BaseRepository } from "./base.repository.js";

export interface StorefrontEntity extends QueryResultRow {
  id: string;
  seller_id: string;
  url: string | null;
  title: string;
  description: string;
  banner_url: string;
  featured_asset_id: string | null;
  is_visible: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface UpsertStorefrontDbInput {
  url: string;
  title: string;
  description: string;
  bannerUrl: string;
  featuredAssetId?: string | null | undefined;
  isVisible: boolean;
}

export class StorefrontRepository extends BaseRepository<StorefrontEntity> {
  async findBySellerId(sellerId: string): Promise<StorefrontEntity | null> {
    const result = await this.query<StorefrontEntity>(
      `SELECT id, seller_id, url, title, description, banner_url, featured_asset_id, is_visible, created_at, updated_at
       FROM seller_storefronts
       WHERE seller_id = $1
       LIMIT 1`,
      [sellerId],
    );
    return result.rows[0] || null;
  }

  async findByUrl(url: string): Promise<StorefrontEntity | null> {
    const normalized = url.toLowerCase().trim();
    const result = await this.query<StorefrontEntity>(
      `SELECT id, seller_id, url, title, description, banner_url, featured_asset_id, is_visible, created_at, updated_at
       FROM seller_storefronts
       WHERE LOWER(url) = $1
       LIMIT 1`,
      [normalized],
    );
    return result.rows[0] || null;
  }

  async upsert(sellerId: string, input: UpsertStorefrontDbInput): Promise<StorefrontEntity> {
    const normalizedUrl = input.url.toLowerCase().trim();
    const rawFeaturedId = input.featuredAssetId?.trim() || "";
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawFeaturedId);
    const safeFeaturedId = isUuid ? rawFeaturedId : null;

    const result = await this.query<StorefrontEntity>(
      `INSERT INTO seller_storefronts (
        seller_id, url, title, description, banner_url, featured_asset_id, is_visible, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      ON CONFLICT (seller_id) DO UPDATE SET
        url = EXCLUDED.url,
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        banner_url = EXCLUDED.banner_url,
        featured_asset_id = EXCLUDED.featured_asset_id,
        is_visible = EXCLUDED.is_visible,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, seller_id, url, title, description, banner_url, featured_asset_id, is_visible, created_at, updated_at`,
      [
        sellerId,
        normalizedUrl,
        input.title.trim(),
        input.description.trim(),
        input.bannerUrl.trim(),
        safeFeaturedId,
        input.isVisible,
      ],
    );

    return result.rows[0]!;
  }
}

export const storefrontRepository = new StorefrontRepository();

