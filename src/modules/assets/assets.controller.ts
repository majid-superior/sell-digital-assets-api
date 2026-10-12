import type { Request, Response, NextFunction } from "express";
import { assetsService } from "./assets.service.js";
import type {
  CreateAssetInput,
  UpdateAssetInput,
  UpdateAssetStatusInput,
  AssetQueryInput,
  SellerAssetQueryInput,
  PresignFileUploadInput,
  ConfirmFileUploadInput,
  PresignMediaUploadInput,
  ConfirmMediaUploadInput,
  GenerateDownloadLinkInput,
  VerifyLicenseInput,
  ActivateLicenseInput,
  IssueLicenseInput,
} from "./assets.schema.js";

const DEFAULT_SELLER_ID = "00000000-0000-0000-0000-000000000001";

export class AssetsController {
  private getSellerId(req: Request): string {
    return req.user?.id || (req.headers["x-seller-id"] as string) || DEFAULT_SELLER_ID;
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

  // ============================================================================
  // SECURE FULFILLMENT & DOWNLOADS
  // ============================================================================

  async generateDownloadLink(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { assetId } = req.params as { assetId: string };
      const body = (req.body as GenerateDownloadLinkInput) || {};
      const ipAddress = (req.headers["x-forwarded-for"] as string) || req.ip || "127.0.0.1";
      const userAgent = req.headers["user-agent"];

      const result = await assetsService.generateDownloadLink(
        assetId,
        body,
        ipAddress,
        userAgent,
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
}

export const assetsController = new AssetsController();

