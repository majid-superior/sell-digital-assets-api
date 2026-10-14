import { BaseRepository } from "./base.repository.js";
import type {
  LicenseEntity,
  LicenseActivationEntity,
  DownloadAuditEntity,
  AssetFileEntity,
} from "../types.js";

export class LicensesRepository extends BaseRepository<LicenseEntity> {
  async issue(data: {
    licenseKey: string;
    assetId: string;
    buyerId: string;
    tier: "personal" | "commercial" | "extended";
    maxActivations: number;
    expiresAt?: Date | null;
  }): Promise<LicenseEntity> {
    const sql = `
      INSERT INTO licenses (
        license_key,
        asset_id,
        buyer_id,
        tier,
        status,
        max_activations,
        expires_at
      ) VALUES ($1, $2, $3, $4, 'active', $5, $6)
      RETURNING *;
    `;
    const res = await this.query<LicenseEntity>(sql, [
      data.licenseKey,
      data.assetId,
      data.buyerId,
      data.tier,
      data.maxActivations,
      data.expiresAt || null,
    ]);
    return res.rows[0]!;
  }

  async findByKey(licenseKey: string): Promise<LicenseEntity | null> {
    const sql = `
      SELECT 
        l.*,
        json_build_object(
          'id', a.id,
          'title', a.title,
          'slug', a.slug,
          'status', a.status
        ) AS asset,
        json_build_object(
          'id', u.id,
          'name', u.name,
          'email', u.email
        ) AS buyer,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', la.id,
                'domain_or_machine_id', la.domain_or_machine_id,
                'activated_at', la.activated_at
              )
            )
            FROM license_activations la
            WHERE la.license_id = l.id
          ),
          '[]'::json
        ) AS activations
      FROM licenses l
      JOIN assets a ON l.asset_id = a.id
      JOIN users u ON l.buyer_id = u.id
      WHERE l.license_key = $1;
    `;
    const res = await this.query<any>(sql, [licenseKey]);
    return res.rows[0] || null;
  }

  async findByBuyer(buyerId: string): Promise<any[]> {
    const sql = `
      SELECT 
        l.*,
        json_build_object(
          'id', a.id,
          'title', a.title,
          'slug', a.slug,
          'status', a.status
        ) AS asset,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', la.id,
                'domain_or_machine_id', la.domain_or_machine_id,
                'activated_at', la.activated_at
              )
            )
            FROM license_activations la
            WHERE la.license_id = l.id
          ),
          '[]'::json
        ) AS activations,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', af.id,
                'version', af.version,
                'file_name', af.file_name,
                'file_size_bytes', af.file_size_bytes::bigint
              ) ORDER BY af.created_at DESC
            )
            FROM asset_files af
            WHERE af.asset_id = a.id AND af.is_active = TRUE
          ),
          '[]'::json
        ) AS files
      FROM licenses l
      JOIN assets a ON l.asset_id = a.id
      WHERE l.buyer_id = $1
      ORDER BY l.issued_at DESC;
    `;
    const res = await this.query<any>(sql, [buyerId]);
    return res.rows;
  }

  async findByBuyerAndAsset(buyerId: string, assetId: string): Promise<LicenseEntity | null> {
    const sql = `
      SELECT *
      FROM licenses
      WHERE buyer_id = $1 AND asset_id = $2 AND status = 'active'
      ORDER BY issued_at DESC
      LIMIT 1;
    `;
    const res = await this.query<LicenseEntity>(sql, [buyerId, assetId]);
    return res.rows[0] || null;
  }

  async activateDomain(
    licenseId: string,
    domainOrMachineId: string,
    ipAddress?: string,
  ): Promise<LicenseActivationEntity> {
    return this.withTransaction(async (client) => {
      const insertSql = `
        INSERT INTO license_activations (
          license_id,
          domain_or_machine_id,
          ip_address
        ) VALUES ($1, $2, $3)
        RETURNING *;
      `;
      const res = await client.query<LicenseActivationEntity>(insertSql, [
        licenseId,
        domainOrMachineId,
        ipAddress || null,
      ]);

      await client.query(
        "UPDATE licenses SET activation_count = activation_count + 1 WHERE id = $1",
        [licenseId],
      );

      return res.rows[0]!;
    });
  }

  async recordDownloadAudit(data: {
    assetId: string;
    assetFileId?: string | null | undefined;
    userId?: string | null | undefined;
    licenseKey?: string | null | undefined;
    ipAddress: string;
    userAgent?: string | null | undefined;
    signedUrlToken: string;
    expiresAt: Date;
  }): Promise<DownloadAuditEntity> {
    return this.withTransaction(async (client) => {
      const insertSql = `
        INSERT INTO download_audits (
          asset_id,
          asset_file_id,
          user_id,
          license_key,
          ip_address,
          user_agent,
          signed_url_token,
          expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *;
      `;
      const res = await client.query<DownloadAuditEntity>(insertSql, [
        data.assetId,
        data.assetFileId || null,
        data.userId || null,
        data.licenseKey || null,
        data.ipAddress,
        data.userAgent || null,
        data.signedUrlToken,
        data.expiresAt,
      ]);

      await client.query(
        "UPDATE assets SET download_count = download_count + 1 WHERE id = $1",
        [data.assetId],
      );

      return res.rows[0]!;
    });
  }

  async findActiveFile(assetId: string, fileId?: string): Promise<AssetFileEntity | null> {
    if (fileId) {
      const res = await this.query<AssetFileEntity>(
        "SELECT * FROM asset_files WHERE id = $1 AND asset_id = $2 AND is_active = TRUE",
        [fileId, assetId],
      );
      return res.rows[0] || null;
    }

    const res = await this.query<AssetFileEntity>(
      "SELECT * FROM asset_files WHERE asset_id = $1 AND is_active = TRUE ORDER BY created_at DESC LIMIT 1",
      [assetId],
    );
    return res.rows[0] || null;
  }
}

export const licensesRepository = new LicensesRepository();
