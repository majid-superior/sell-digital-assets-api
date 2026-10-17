import fs from "node:fs";
import { pipeline } from "node:stream/promises";
import type { Request, Response, NextFunction } from "express";
import { assetsService } from "./assets.service.js";
import { AppError } from "../../core/errors/app-error.js";
import type {
  CreateAssetInput,
  UpdateAssetInput,
  UpdateAssetStatusInput,
  AssetQueryInput,
  SellerAssetQueryInput,
  AdminReviewAssetInput,
  AdminAssetQueryInput,
  PresignFileUploadInput,
  ConfirmFileUploadInput,
  PresignMediaUploadInput,
  ConfirmMediaUploadInput,
  GenerateDownloadLinkInput,
  VerifyLicenseInput,
  ActivateLicenseInput,
  IssueLicenseInput,
} from "./assets.schema.js";

export class AssetsController {
  private getSellerId(req: Request): string {
    const sellerId = req.user?.id;
    if (!sellerId) {
      throw new AppError("Authentication required: Seller identity is missing.", 401);
    }
    return sellerId;
  }

  // ============================================================================
  // PUBLIC / DISCOVERY CATALOG
  // ============================================================================

  async getPublicAssets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = (req.query as unknown as AssetQueryInput) || {};
      const result = await assetsService.getPublicAssets(query);

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAssetBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params as { slug: string };
      const asset = await assetsService.getAssetBySlug(slug);

      res.status(200).json({
        success: true,
        data: asset,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCategoriesTree(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await assetsService.getCategoriesTree();

      res.status(200).json({
        success: true,
        data: (result as any).data || result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getLicenseTiers(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tiers = await assetsService.getLicenseTiers();

      res.status(200).json({
        success: true,
        data: tiers,
      });
    } catch (error) {
      next(error);
    }
  }

  // ============================================================================
  // SELLER STUDIO MANAGEMENT
  // ============================================================================

  async createDraftAsset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = this.getSellerId(req);
      const body = req.body as CreateAssetInput;
      const asset = await assetsService.createDraftAsset(sellerId, body);

      res.status(201).json({
        success: true,
        message: "Draft asset created successfully",
        data: asset,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSellerAssets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = this.getSellerId(req);
      const query = (req.query as unknown as SellerAssetQueryInput) || {};
      const result = await assetsService.getSellerAssets(sellerId, query);

      res.status(200).json({
        success: true,
        data: result.data,
        stats: result.stats,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateAsset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const sellerId = this.getSellerId(req);
      const body = req.body as UpdateAssetInput;

      const asset = await assetsService.updateAsset(id, sellerId, body);

      res.status(200).json({
        success: true,
        message: "Asset updated successfully",
        data: asset,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateAssetStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const sellerId = this.getSellerId(req);
      const { status } = req.body as UpdateAssetStatusInput;

      const asset = await assetsService.updateAssetStatus(id, sellerId, status);

      res.status(200).json({
        success: true,
        message: `Asset status transitioned to '${status}' successfully`,
        data: asset,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteAsset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const sellerId = this.getSellerId(req);

      const result = await assetsService.softDeleteAsset(id, sellerId);

      res.status(200).json({
        success: true,
        message: "Asset successfully archived and soft-deleted",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // ============================================================================
  // MEDIA & DELIVERABLE FILE HANDLING
  // ============================================================================

  async presignFileUpload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const sellerId = this.getSellerId(req);
      const body = req.body as PresignFileUploadInput;

      const presigned = await assetsService.presignFileUpload(id, sellerId, body);

      res.status(200).json({
        success: true,
        message: "Presigned direct upload URL generated",
        data: presigned,
      });
    } catch (error) {
      next(error);
    }
  }

  async confirmFileUpload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const sellerId = this.getSellerId(req);
      const body = req.body as ConfirmFileUploadInput;

      const file = await assetsService.confirmFileUpload(id, sellerId, body);

      res.status(201).json({
        success: true,
        message: "Payload file confirmed and attached to asset version",
        data: file,
      });
    } catch (error) {
      next(error);
    }
  }

  async presignMediaUpload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const sellerId = this.getSellerId(req);
      const body = req.body as PresignMediaUploadInput;

      const presigned = await assetsService.presignMediaUpload(id, sellerId, body);

      res.status(200).json({
        success: true,
        message: "Presigned media upload URL generated",
        data: presigned,
      });
    } catch (error) {
      next(error);
    }
  }

  async confirmMediaUpload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const sellerId = this.getSellerId(req);
      const body = req.body as ConfirmMediaUploadInput;

      const media = await assetsService.confirmMediaUpload(id, sellerId, body);

      res.status(201).json({
        success: true,
        message: "Media showcase preview confirmed",
        data: media,
      });
    } catch (error) {
      next(error);
    }
  }

  async decommissionFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, fileId } = req.params as { id: string; fileId: string };
      const sellerId = this.getSellerId(req);

      const result = await assetsService.decommissionFile(id, sellerId, fileId);

      res.status(200).json({
        success: true,
        message: "File version successfully decommissioned",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteMedia(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, mediaId } = req.params as { id: string; mediaId: string };
      const sellerId = this.getSellerId(req);

      const result = await assetsService.deleteMedia(id, sellerId, mediaId);

      res.status(200).json({
        success: true,
        message: "Media item deleted successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // ============================================================================
  // SECURE FULFILLMENT & DOWNLOADS
  // ============================================================================

  async generateDownloadLink(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { assetId } = req.params as { assetId: string };
      const body = (req.body as GenerateDownloadLinkInput) || {};
      const authenticatedUserId = req.user?.id;
      const ipAddress = (req.headers["x-forwarded-for"] as string) || req.ip || "127.0.0.1";
      const userAgent = req.headers["user-agent"];

      const result = await assetsService.generateDownloadLink(
        assetId,
        body,
        ipAddress,
        userAgent,
        authenticatedUserId,
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // ============================================================================
  // LICENSING & VERIFICATION
  // ============================================================================

  async verifyLicense(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as VerifyLicenseInput;
      const result = await assetsService.verifyLicense(body);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async activateLicense(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as ActivateLicenseInput;
      const ipAddress = (req.headers["x-forwarded-for"] as string) || req.ip;

      const result = await assetsService.activateLicense(body, ipAddress);

      res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async issueLicense(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as IssueLicenseInput;
      const license = await assetsService.issueLicense(body);

      res.status(201).json({
        success: true,
        message: "License issued successfully",
        data: license,
      });
    } catch (error) {
      next(error);
    }
  }

  async getBuyerLicenses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const buyerId = req.user?.id;
      if (!buyerId) {
        throw new AppError("Authentication required", 401);
      }
      const licenses = await assetsService.getBuyerLicenses(buyerId);
      res.status(200).json({
        success: true,
        data: licenses,
      });
    } catch (error) {
      next(error);
    }
  }

  // ============================================================================
  // ADMIN REVIEW & GOVERNANCE
  // ============================================================================

  private getAdminId(req: Request): string {
    const adminId = req.user?.id;
    if (!adminId) {
      throw new AppError("Authentication required: Admin identity is missing.", 401);
    }
    return adminId;
  }

  async getAdminAssets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = (req.query as unknown as AdminAssetQueryInput) || {};
      const result = await assetsService.getAdminAssets(query);

      res.status(200).json({
        success: true,
        data: result.data,
        counts: result.counts,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAdminAssetCounts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const counts = await assetsService.getAdminAssetCounts();

      res.status(200).json({
        success: true,
        data: counts,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAdminAssetById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const asset = await assetsService.getAdminAssetById(id);

      res.status(200).json({
        success: true,
        data: asset,
      });
    } catch (error) {
      next(error);
    }
  }

  async adminReviewAsset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = this.getAdminId(req);
      const { id } = req.params as { id: string };
      const body = req.body as AdminReviewAssetInput;

      const updated = await assetsService.adminReviewAsset(id, adminId, body);

      const actionMessage =
        body.action === "approve"
          ? "Asset approved and published to the marketplace successfully"
          : body.action === "reject"
            ? "Asset rejected successfully"
            : "Asset marked as needing update; feedback dispatched to seller";

      res.status(200).json({
        success: true,
        message: actionMessage,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  // ============================================================================
  // DIRECT LOCAL STORAGE STREAMING
  // ============================================================================

  async handleStorageUpload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { key, token, expires } = req.query as {
        key?: string;
        token?: string;
        expires?: string;
      };
      const declaredLength = req.headers["content-length"]
        ? parseInt(req.headers["content-length"], 10)
        : 0;

      const data = await assetsService.streamDirectUpload(req, {
        key,
        token,
        expires,
        declaredLength,
      });

      res.status(200).json({
        success: true,
        message: "File stored successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async handleStorageDownload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { key, token, expires, filename } = req.query as {
        key?: string;
        token?: string;
        expires?: string;
        filename?: string;
      };

      const { filePath, sizeBytes, downloadName, mimeType, isInline } =
        await assetsService.resolveDirectDownload({ key, token, expires, filename });

      // Remove restrictive CSP on media downloads so browsers can render inline previews
      if (isInline) {
        res.removeHeader("Content-Security-Policy");
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      }

      res.setHeader("Content-Type", mimeType);
      res.setHeader(
        "Content-Disposition",
        `${isInline ? "inline" : "attachment"}; filename="${encodeURIComponent(downloadName)}"`,
      );
      res.setHeader("Content-Length", sizeBytes);

      const readStream = fs.createReadStream(filePath);
      try {
        await pipeline(readStream, res);
      } catch (err: any) {
        if (err?.code === "ERR_STREAM_PREMATURE_CLOSE" || res.headersSent) {
          return;
        }
        throw err;
      }
    } catch (error) {
      next(error);
    }
  }
}

export const assetsController = new AssetsController();
