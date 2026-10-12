import { BaseRepository } from "./base.repository.js";
import type {
  AssetEntity,
  AssetTierEntity,
  AssetFileEntity,
  AssetMediaEntity,
} from "../types.js";

export interface AssetPublicFilter {
  categoryId?: number | undefined;
  categorySlug?: string | undefined;
  search?: string | undefined;
  tags?: string[] | undefined;
  priceMin?: number | undefined;
  priceMax?: number | undefined;
  sort?: "newest" | "popular" | "price_asc" | "price_desc" | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}

export interface AssetSellerFilter {
  status?: string | undefined;
  search?: string | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}

export interface CreateAssetDto {
  sellerId: string;
  categoryId: number;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  status?: "draft" | "under_review" | "published" | "archived";
  tags?: string[];
  technicalSpecs?: Record<string, unknown>;
  tiers: Array<{
    tierType: "personal" | "commercial" | "extended";
    price: number;
    licenseTermsSummary?: string | undefined;
  }>;
}

export interface UpdateAssetDto {
  categoryId?: number | undefined;
  title?: string | undefined;
  slug?: string | undefined;
  shortDescription?: string | undefined;
  fullDescription?: string | undefined;
  tags?: string[] | undefined;
  technicalSpecs?: Record<string, unknown> | undefined;
  tiers?: Array<{
    tierType: "personal" | "commercial" | "extended";
    price: number;
    licenseTermsSummary?: string | undefined;
  }> | undefined;
}

export class AssetsRepository extends BaseRepository<AssetEntity> {
  async findPublic(filter: AssetPublicFilter = {}) {
    const page = Math.max(1, filter.page ?? 1);
    const limit = Math.min(50, Math.max(1, filter.limit ?? 12));
    const offset = (page - 1) * limit;

    const conditions: string[] = [
      "a.is_active = TRUE",
      "a.deleted_at IS NULL",
      "a.status = 'published'",
    ];
    const params: unknown[] = [];

    if (filter.categoryId) {
      params.push(filter.categoryId);
      conditions.push(`a.category_id = $${params.length}`);
    } else if (filter.categorySlug) {
      params.push(filter.categorySlug);
      conditions.push(`c.slug = $${params.length}`);
    }

    if (filter.search) {
      params.push(`%${filter.search}%`);
      conditions.push(
        `(a.title ILIKE $${params.length} OR a.short_description ILIKE $${params.length})`,
      );
    }

    if (filter.tags && filter.tags.length > 0) {
      params.push(filter.tags);
      conditions.push(`a.tags && $${params.length}::text[]`);
    }

    if (filter.priceMin !== undefined || filter.priceMax !== undefined) {
      const tierConditions: string[] = ["at.asset_id = a.id"];
      if (filter.priceMin !== undefined) {
        params.push(filter.priceMin);
        tierConditions.push(`at.price >= $${params.length}`);
      }
      if (filter.priceMax !== undefined) {
        params.push(filter.priceMax);
        tierConditions.push(`at.price <= $${params.length}`);
      }
      conditions.push(`EXISTS (SELECT 1 FROM asset_tiers at WHERE ${tierConditions.join(" AND ")})`);
    }

    const whereClause = conditions.join(" AND ");

    // Count query
    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM assets a
      JOIN categories c ON a.category_id = c.id
      WHERE ${whereClause};
    `;
    const countResult = await this.query<{ total: number }>(countSql, params);
    const total = countResult.rows[0]?.total ?? 0;

    // Sorting
    let orderBy = "a.created_at DESC";
    if (filter.sort === "popular") {
      orderBy = "a.download_count DESC, a.view_count DESC";
    } else if (filter.sort === "price_asc") {
      orderBy = "min_price ASC";
    } else if (filter.sort === "price_desc") {
      orderBy = "min_price DESC";
    }

    // Select query
    const dataParams = [...params, limit, offset];
    const limitPlaceholder = `$${params.length + 1}`;
    const offsetPlaceholder = `$${params.length + 2}`;

    const dataSql = `
      SELECT 
        a.id,
        a.seller_id,
        a.category_id,
        a.title,
        a.slug,
        a.short_description,
        a.full_description,
        a.status,
        a.tags,
        a.technical_specs,
        a.view_count,
        a.download_count,
        a.created_at,
        a.updated_at,
        json_build_object(
          'id', c.id,
          'name', c.name,
          'slug', c.slug
        ) AS category,
        json_build_object(
          'id', u.id,
          'name', u.name,
          'email', u.email
        ) AS seller,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', at.id,
                'tier_type', at.tier_type,
                'price', at.price::float,
                'license_terms_summary', at.license_terms_summary
              ) ORDER BY at.price ASC
            )
            FROM asset_tiers at
            WHERE at.asset_id = a.id
          ),
          '[]'::json
        ) AS tiers,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', am.id,
                'media_type', am.media_type,
                'url', am.url,
                'display_order', am.display_order
              ) ORDER BY am.display_order ASC
            )
            FROM asset_media am
            WHERE am.asset_id = a.id
          ),
          '[]'::json
        ) AS media,
        (
          SELECT COALESCE(MIN(at.price), 0)::float
          FROM asset_tiers at
          WHERE at.asset_id = a.id
        ) AS min_price,
        (
          SELECT COUNT(*)::int
          FROM asset_files af
          WHERE af.asset_id = a.id AND af.is_active = TRUE
        ) AS file_count
      FROM assets a
      JOIN categories c ON a.category_id = c.id
      JOIN users u ON a.seller_id = u.id
      WHERE ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder};
    `;

    const dataResult = await this.query<any>(dataSql, dataParams);

    return {
      data: dataResult.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findBySlug(slug: string): Promise<AssetEntity | null> {
    const sql = `
      SELECT 
        a.id,
        a.seller_id,
        a.category_id,
        a.title,
        a.slug,
        a.short_description,
        a.full_description,
        a.status,
        a.tags,
        a.technical_specs,
        a.view_count,
        a.download_count,
        a.created_at,
        a.updated_at,
        json_build_object(
          'id', c.id,
          'name', c.name,
          'slug', c.slug
        ) AS category,
        json_build_object(
          'id', u.id,
          'name', u.name,
          'email', u.email
        ) AS seller,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', at.id,
                'tier_type', at.tier_type,
                'price', at.price::float,
                'license_terms_summary', at.license_terms_summary
              ) ORDER BY at.price ASC
            )
            FROM asset_tiers at
            WHERE at.asset_id = a.id
          ),
          '[]'::json
        ) AS tiers,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', am.id,
                'media_type', am.media_type,
                'url', am.url,
                'display_order', am.display_order
              ) ORDER BY am.display_order ASC
            )
            FROM asset_media am
            WHERE am.asset_id = a.id
          ),
          '[]'::json
        ) AS media,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', af.id,
                'version', af.version,
                'file_name', af.file_name,
                'file_size_bytes', af.file_size_bytes::bigint,
                'file_checksum_sha256', af.file_checksum_sha256,
                'manifest_tree', af.manifest_tree,
                'created_at', af.created_at
              ) ORDER BY af.created_at DESC
            )
            FROM asset_files af
            WHERE af.asset_id = a.id AND af.is_active = TRUE
          ),
          '[]'::json
        ) AS files
      FROM assets a
      JOIN categories c ON a.category_id = c.id
      JOIN users u ON a.seller_id = u.id
      WHERE a.slug = $1 AND a.is_active = TRUE AND a.deleted_at IS NULL;
    `;

    const result = await this.query<any>(sql, [slug]);
    if (result.rows.length === 0) return null;

    // Asynchronously increment view count
    this.query("UPDATE assets SET view_count = view_count + 1 WHERE id = $1", [
      result.rows[0].id,
    ]).catch(() => {});

    return result.rows[0];
  }

  async findById(id: string): Promise<AssetEntity | null> {
    const sql = `
      SELECT a.*
      FROM assets a
      WHERE a.id = $1 AND a.is_active = TRUE AND a.deleted_at IS NULL;
    `;
    const res = await this.query<AssetEntity>(sql, [id]);
    return res.rows[0] || null;
  }

  async findBySeller(sellerId: string, filter: AssetSellerFilter = {}) {
    const page = Math.max(1, filter.page ?? 1);
    const limit = Math.min(50, Math.max(1, filter.limit ?? 20));
    const offset = (page - 1) * limit;

    const conditions: string[] = ["a.seller_id = $1", "a.deleted_at IS NULL"];
    const params: unknown[] = [sellerId];

    if (filter.status) {
      params.push(filter.status);
      conditions.push(`a.status = $${params.length}`);
    }

    if (filter.search) {
      params.push(`%${filter.search}%`);
      conditions.push(
        `(a.title ILIKE $${params.length} OR a.short_description ILIKE $${params.length})`,
      );
    }

    const whereClause = conditions.join(" AND ");

    const statsSql = `
      SELECT 
        COUNT(*)::int AS total_assets,
        COALESCE(SUM(view_count), 0)::int AS total_views,
        COALESCE(SUM(download_count), 0)::int AS total_downloads
      FROM assets a
      WHERE ${whereClause};
    `;
    const statsResult = await this.query<any>(statsSql, params);
    const stats = statsResult.rows[0] || {
      total_assets: 0,
      total_views: 0,
      total_downloads: 0,
    };

    const dataParams = [...params, limit, offset];
    const dataSql = `
      SELECT 
        a.id,
        a.category_id,
        a.title,
        a.slug,
        a.short_description,
        a.status,
        a.tags,
        a.view_count,
        a.download_count,
        a.created_at,
        a.updated_at,
        json_build_object('id', c.id, 'name', c.name, 'slug', c.slug) AS category,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', at.id,
                'tier_type', at.tier_type,
                'price', at.price::float
              )
            )
            FROM asset_tiers at
            WHERE at.asset_id = a.id
          ),
          '[]'::json
        ) AS tiers,
        (
          SELECT am.url
          FROM asset_media am
          WHERE am.asset_id = a.id AND am.media_type = 'thumbnail'
          ORDER BY am.display_order ASC
          LIMIT 1
        ) AS thumbnail_url
      FROM assets a
      JOIN categories c ON a.category_id = c.id
      WHERE ${whereClause}
      ORDER BY a.updated_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2};
    `;
    const dataResult = await this.query<any>(dataSql, dataParams);

    return {
      stats: {
        totalAssets: stats.total_assets,
        totalViews: stats.total_views,
        totalDownloads: stats.total_downloads,
      },
      data: dataResult.rows,
      pagination: {
        total: stats.total_assets,
        page,
        limit,
        totalPages: Math.ceil(stats.total_assets / limit),
      },
    };
  }

  async create(data: CreateAssetDto): Promise<AssetEntity> {
    return this.withTransaction(async (client) => {
      const insertAssetSql = `
        INSERT INTO assets (
          seller_id,
          category_id,
          title,
          slug,
          short_description,
          full_description,
          status,
          tags,
          technical_specs
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *;
      `;

      const assetRes = await client.query<AssetEntity>(insertAssetSql, [
        data.sellerId,
        data.categoryId,
        data.title,
        data.slug,
        data.shortDescription,
        data.fullDescription,
        data.status || "draft",
        data.tags || [],
        JSON.stringify(data.technicalSpecs || {}),
      ]);
      const createdAsset = assetRes.rows[0]!;

      // Insert tiers
      const createdTiers: AssetTierEntity[] = [];
      for (const tier of data.tiers) {
        const tierSql = `
          INSERT INTO asset_tiers (
            asset_id,
            tier_type,
            price,
            license_terms_summary
          ) VALUES ($1, $2, $3, $4)
          RETURNING *;
        `;
        const tierRes = await client.query<AssetTierEntity>(tierSql, [
          createdAsset.id,
          tier.tierType,
          tier.price,
          tier.licenseTermsSummary || null,
        ]);
        createdTiers.push(tierRes.rows[0]!);
      }

      return {
        ...createdAsset,
        tiers: createdTiers,
      };
    });
  }

  async update(id: string, sellerId: string, data: UpdateAssetDto): Promise<AssetEntity | null> {
    return this.withTransaction(async (client) => {
      const updates: string[] = [];
      const params: unknown[] = [id, sellerId];

      if (data.categoryId !== undefined) {
        params.push(data.categoryId);
        updates.push(`category_id = $${params.length}`);
      }
      if (data.title !== undefined) {
        params.push(data.title);
        updates.push(`title = $${params.length}`);
      }
      if (data.slug !== undefined) {
        params.push(data.slug);
        updates.push(`slug = $${params.length}`);
      }
      if (data.shortDescription !== undefined) {
        params.push(data.shortDescription);
        updates.push(`short_description = $${params.length}`);
      }
      if (data.fullDescription !== undefined) {
        params.push(data.fullDescription);
        updates.push(`full_description = $${params.length}`);
      }
      if (data.tags !== undefined) {
        params.push(data.tags);
        updates.push(`tags = $${params.length}`);
      }
      if (data.technicalSpecs !== undefined) {
        params.push(JSON.stringify(data.technicalSpecs));
        updates.push(`technical_specs = $${params.length}`);
      }

      let updatedAsset: AssetEntity | null = null;
      if (updates.length > 0) {
        const updateSql = `
          UPDATE assets
          SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP
          WHERE id = $1 AND seller_id = $2 AND deleted_at IS NULL
          RETURNING *;
        `;
        const res = await client.query<AssetEntity>(updateSql, params);
        if (res.rows.length === 0) return null;
        updatedAsset = res.rows[0]!;
      } else {
        const checkSql = `SELECT * FROM assets WHERE id = $1 AND seller_id = $2 AND deleted_at IS NULL`;
        const res = await client.query<AssetEntity>(checkSql, [id, sellerId]);
        if (res.rows.length === 0) return null;
        updatedAsset = res.rows[0]!;
      }

      // If tiers supplied, replace them
      if (data.tiers && data.tiers.length > 0) {
        await client.query("DELETE FROM asset_tiers WHERE asset_id = $1", [id]);
        const newTiers: AssetTierEntity[] = [];
        for (const tier of data.tiers) {
          const tierSql = `
            INSERT INTO asset_tiers (asset_id, tier_type, price, license_terms_summary)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
          `;
          const tierRes = await client.query<AssetTierEntity>(tierSql, [
            id,
            tier.tierType,
            tier.price,
            tier.licenseTermsSummary || null,
          ]);
          newTiers.push(tierRes.rows[0]!);
        }
        updatedAsset.tiers = newTiers;
      }

      return updatedAsset;
    });
  }

  async updateStatus(id: string, sellerId: string, status: string): Promise<AssetEntity | null> {
    const sql = `
      UPDATE assets
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND seller_id = $3 AND deleted_at IS NULL
      RETURNING *;
    `;
    const res = await this.query<AssetEntity>(sql, [status, id, sellerId]);
    return res.rows[0] || null;
  }

  async softDelete(id: string, sellerId: string): Promise<boolean> {
    const sql = `
      UPDATE assets
      SET is_active = FALSE, status = 'archived', deleted_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND seller_id = $2 AND deleted_at IS NULL
      RETURNING id;
    `;
    const res = await this.query(sql, [id, sellerId]);
    return res.rows.length > 0;
  }

  // --- File & Media Management Sub-Operations ---

  async createFile(data: {
    assetId: string;
    version: string;
    storageKey: string;
    fileName: string;
    fileSizeBytes: number;
    fileChecksumSha256?: string | null;
    manifestTree?: unknown[];
  }): Promise<AssetFileEntity> {
    return this.withTransaction(async (client) => {
      // Deactivate older active files for this asset
      await client.query(
        "UPDATE asset_files SET is_active = FALSE WHERE asset_id = $1",
        [data.assetId],
      );

      const sql = `
        INSERT INTO asset_files (
          asset_id,
          version,
          storage_key,
          file_name,
          file_size_bytes,
          file_checksum_sha256,
          manifest_tree,
          is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
        RETURNING *;
      `;
      const res = await client.query<AssetFileEntity>(sql, [
        data.assetId,
        data.version,
        data.storageKey,
        data.fileName,
        data.fileSizeBytes,
        data.fileChecksumSha256 || null,
        JSON.stringify(data.manifestTree || []),
      ]);
      return res.rows[0]!;
    });
  }

  async createMedia(data: {
    assetId: string;
    mediaType: "thumbnail" | "screenshot" | "preview_audio" | "preview_video";
    storageKey: string;
    url: string;
    displayOrder?: number;
  }): Promise<AssetMediaEntity> {
    const sql = `
      INSERT INTO asset_media (
        asset_id,
        media_type,
        storage_key,
        url,
        display_order
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const res = await this.query<AssetMediaEntity>(sql, [
      data.assetId,
      data.mediaType,
      data.storageKey,
      data.url,
      data.displayOrder || 0,
    ]);
    return res.rows[0]!;
  }

  async findFileById(fileId: string, assetId: string): Promise<AssetFileEntity | null> {
    const sql = `
      SELECT * FROM asset_files
      WHERE id = $1 AND asset_id = $2;
    `;
    const res = await this.query<AssetFileEntity>(sql, [fileId, assetId]);
    return res.rows[0] || null;
  }

  async decommissionFile(fileId: string, assetId: string): Promise<boolean> {
    const sql = `
      UPDATE asset_files
      SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND asset_id = $2
      RETURNING id;
    `;
    const res = await this.query(sql, [fileId, assetId]);
    return res.rows.length > 0;
  }
}

export const assetsRepository = new AssetsRepository();

