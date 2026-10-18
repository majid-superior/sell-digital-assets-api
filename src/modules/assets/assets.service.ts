import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { Transform, type TransformCallback } from "node:stream";
import { pipeline } from "node:stream/promises";
import { assetsRepository } from "../../database/repositories/assets.repository.js";
import { licensesRepository } from "../../database/repositories/licenses.repository.js";
import { categoriesService } from "../categories/categories.service.js";
import { slugify } from "../../data/categories.js";
import { storageService, localStorageService } from "../../core/storage/index.js";
import { AppError } from "../../core/errors/app-error.js";
import { env } from "../../config/env.js";
import { notificationsService } from "../notifications/notifications.service.js";
import { userRepository } from "../../database/repositories/user.repository.js";
import { CreateAssetSchema } from "./assets.schema.js";
import type {
  CreateAssetInput,
  UpdateAssetInput,
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

const MAX_UPLOAD_BYTES = 500 * 1024 * 1024; // 500 MB maximum upload stream size

const DOWNLOAD_MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".bmp": "image/bmp",
  ".avif": "image/avif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".pdf": "application/pdf",
  ".zip": "application/zip",
  ".gz": "application/gzip",
  ".tar": "application/x-tar",
  ".7z": "application/x-7z-compressed",
  ".json": "application/json",
};

export class AssetsService {
  // ============================================================================
  // PUBLIC / DISCOVERY CATALOG
  // ============================================================================

  async getPublicAssets(query: Partial<AssetQueryInput> = {}) {
    const tagsArray = query.tags
      ? Array.isArray(query.tags)
        ? query.tags
        : [query.tags]
      : undefined;

    return assetsRepository.findPublic({
      categoryId: query.category,
      categorySlug: query.categorySlug,
      search: query.search,
      tags: tagsArray,
      priceMin: query.priceMin,
      priceMax: query.priceMax,
      sort: query.sort,
      page: query.page,
      limit: query.limit,
    });
  }

  async getAssetBySlug(slug: string) {
    const asset = await assetsRepository.findBySlug(slug);
    if (!asset || asset.status !== "published") {
      throw new AppError(`Asset '${slug}' not found`, 404);
    }
    return asset;
  }

  async getCategoriesTree() {
    return categoriesService.getCategories({ tree: true });
  }

  async getLicenseTiers() {
    return licensesRepository.getLicenseTiers();
  }

  // ============================================================================
  // SELLER MANAGEMENT
  // ============================================================================

  async createDraftAsset(sellerId: string, rawInput: CreateAssetInput) {
    const input = CreateAssetSchema.parse(rawInput);
    let baseSlug = input.slug ? slugify(input.slug) : slugify(input.title);
    if (!baseSlug) {
      baseSlug = `asset-${crypto.randomBytes(4).toString("hex")}`;
    }
    let slug = baseSlug;
    let counter = 1;

    while (await assetsRepository.slugExists(slug)) {
      slug = `${baseSlug}-${counter++}`;
    }

    const initialStatus = input.status === "pending" ? "pending" : "draft";

    const asset = await assetsRepository.create({
      sellerId,
      categoryId: input.categoryId,
      title: input.title,
      slug,
      shortDescription: input.shortDescription,
      fullDescription: input.fullDescription ?? null,
      status: initialStatus,
      tags: input.tags,
      technicalSpecs: input.technicalSpecs,
      tiers: input.tiers,
    });

    if (initialStatus === "pending") {
      const seller = await userRepository.findById(sellerId);
      const sellerName = seller?.name || "A seller";
      await notificationsService.notifyAdmins({
        type: "asset_submitted",
        title: "New Digital Asset Submitted",
        message: `${sellerName} submitted a new digital asset for approval: "${asset.title}".`,
        data: { assetId: asset.id, slug: asset.slug, sellerId, title: asset.title },
      });
    }

    return asset;
  }

  async getSellerAssets(sellerId: string, query: Partial<SellerAssetQueryInput> = {}) {
    return assetsRepository.findBySeller(sellerId, {
      status: query.status,
      search: query.search,
      page: query.page,
      limit: query.limit,
    });
  }

  async updateAsset(id: string, sellerId: string, input: UpdateAssetInput) {
    const existing = await assetsRepository.findById(id);
    if (!existing || existing.seller_id !== sellerId) {
      throw new AppError("Asset not found or unauthorized", 404);
    }

    let slug: string | undefined;
    if (input.slug !== undefined) {
      const baseSlug = slugify(input.slug) || `asset-${crypto.randomBytes(4).toString("hex")}`;
      slug = baseSlug;
      if (slug !== existing.slug) {
        let counter = 1;
        while (await assetsRepository.slugExists(slug, id)) {
          slug = `${baseSlug}-${counter++}`;
        }
      }
    }

    const updated = await assetsRepository.update(id, sellerId, {
      ...input,
      slug,
    });

    if (!updated) {
      throw new AppError("Failed to update asset", 500);
    }

    return updated;
  }

  async updateAssetStatus(id: string, sellerId: string, status: string) {
    const existing = await assetsRepository.findById(id);
    if (!existing || existing.seller_id !== sellerId) {
      throw new AppError("Asset not found or unauthorized", 404);
    }

    // Sellers cannot directly publish assets
    if (status === "published") {
      throw new AppError(
        "Sellers cannot directly publish assets. Please submit your asset for admin review by setting status to 'pending'.",
        403,
      );
    }

    if (status !== "draft" && status !== "pending" && status !== "archived") {
      throw new AppError(
        `Invalid status '${status}'. Sellers can only set status to 'draft', 'pending' (submit for review), or 'archived'.`,
        400,
      );
    }

    // When submitting for review, ensure at least one active file upload exists
    if (status === "pending") {
      const activeFile = await licensesRepository.findActiveFile(id);
      if (!activeFile) {
        throw new AppError(
          "Cannot submit asset for review without at least one active deliverable payload file uploaded.",
          400,
        );
      }
    }

    const updated = await assetsRepository.updateStatus(id, sellerId, status);
    if (!updated) {
      throw new AppError("Failed to transition asset status", 500);
    }

    // If submitted or resubmitted for review, notify admins
    if (status === "pending") {
      const isResubmit =
        existing.status === "needs_update" || existing.status === "rejected";
      const seller = await userRepository.findById(sellerId);
      const sellerName = seller?.name || "A seller";

      await notificationsService.notifyAdmins({
        type: isResubmit ? "asset_resubmitted" : "asset_submitted",
        title: isResubmit
          ? "Digital Asset Resubmitted for Review"
          : "New Digital Asset Submitted",
        message: isResubmit
          ? `${sellerName} has updated and resubmitted "${existing.title}" after review feedback.`
          : `${sellerName} has submitted "${existing.title}" for approval.`,
        data: {
          assetId: id,
          slug: existing.slug,
          sellerId,
          title: existing.title,
          isResubmit,
        },
      });
    }

    return updated;
  }

  // ============================================================================
  // ADMIN GOVERNANCE & APPROVAL WORKFLOW
  // ============================================================================

  async getAdminAssets(filter: AdminAssetQueryInput) {
    return assetsRepository.findForAdmin(filter);
  }

  async getAdminAssetCounts() {
    return assetsRepository.getAdminCounts();
  }

  async getAdminAssetById(id: string) {
    const asset = await assetsRepository.findByIdForAdmin(id);
    if (!asset) {
      throw new AppError(`Asset with ID '${id}' not found`, 404);
    }
    return asset;
  }

  async adminReviewAsset(
    assetId: string,
    adminId: string,
    input: AdminReviewAssetInput,
  ) {
    const asset = await assetsRepository.findById(assetId);
    if (!asset) {
      throw new AppError("Asset not found", 404);
    }

    if (input.action === "approve") {
      const activeFile = await licensesRepository.findActiveFile(assetId);
      if (!activeFile) {
        throw new AppError(
          "Cannot approve an asset without at least one active deliverable payload file uploaded",
          400,
        );
      }
    }

    const updated = await assetsRepository.adminReview(
      assetId,
      adminId,
      input.action,
      input.feedback,
    );

    if (!updated) {
      throw new AppError("Failed to update asset review state", 500);
    }

    // Dispatch notification to seller based on admin decision
    if (input.action === "approve") {
      await notificationsService.notifySeller(asset.seller_id, {
        type: "asset_approved",
        title: "Your Asset Has Been Approved! 🎉",
        message: `Congratulations! Your digital asset "${asset.title}" has been approved by an administrator and is now live on the marketplace.`,
        data: { assetId, slug: asset.slug, title: asset.title },
      });
    } else if (input.action === "reject") {
      await notificationsService.notifySeller(asset.seller_id, {
        type: "asset_rejected",
        title: "Asset Submission Rejected",
        message: `Your digital asset "${asset.title}" was rejected. Reason: ${input.feedback}`,
        data: {
          assetId,
          slug: asset.slug,
          title: asset.title,
          feedback: input.feedback,
        },
      });
    } else if (input.action === "needs_update") {
      await notificationsService.notifySeller(asset.seller_id, {
        type: "asset_needs_update",
        title: "Updates Requested for Your Asset",
        message: `An administrator reviewed "${asset.title}" and requested changes: ${input.feedback}. Please make the required updates and resubmit.`,
        data: {
          assetId,
          slug: asset.slug,
          title: asset.title,
          feedback: input.feedback,
        },
      });
    }

    return updated;
  }

  async softDeleteAsset(id: string, sellerId: string) {
    const existing = await assetsRepository.findById(id);
    if (!existing || existing.seller_id !== sellerId) {
      throw new AppError("Asset not found or unauthorized", 404);
    }

    const success = await assetsRepository.softDelete(id, sellerId);
    if (!success) {
      throw new AppError("Failed to delete asset", 500);
    }

    return { id, deleted: true };
  }

  // ============================================================================
  // MEDIA & DELIVERABLE FILE HANDLING
  // ============================================================================

  async presignFileUpload(
    assetId: string,
    sellerId: string,
    input: PresignFileUploadInput,
  ) {
    const asset = await assetsRepository.findById(assetId);
    if (!asset || asset.seller_id !== sellerId) {
      throw new AppError("Asset not found or unauthorized", 404);
    }

    const sanitizedFileName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storageKey = `vault/assets/${assetId}/v${input.version}/${Date.now()}-${sanitizedFileName}`;

    return storageService.generatePresignedUploadUrl(
      storageKey,
      input.contentType,
      900, // 15 mins
    );
  }

  async confirmFileUpload(
    assetId: string,
    sellerId: string,
    input: ConfirmFileUploadInput,
  ) {
    const asset = await assetsRepository.findById(assetId);
    if (!asset || asset.seller_id !== sellerId) {
      throw new AppError("Asset not found or unauthorized", 404);
    }

    const expectedPrefix = `vault/assets/${assetId}/`;
    if (
      !input.storageKey.startsWith(expectedPrefix) ||
      input.storageKey.includes("..") ||
      input.storageKey.includes("\\") ||
      input.storageKey.includes("\0")
    ) {
      throw new AppError("Invalid storage key for this asset", 400);
    }

    const stats = await storageService.getFileStats(input.storageKey);
    if (!stats.exists && env.STORAGE_DRIVER === "local") {
      throw new AppError(
        `File was not found in storage at key: ${input.storageKey}. Ensure upload completed.`,
        400,
      );
    }

    const finalSize = stats.size || input.fileSizeBytes || 0;

    return assetsRepository.createFile({
      assetId,
      version: input.version,
      storageKey: input.storageKey,
      fileName: input.fileName,
      fileSizeBytes: finalSize,
      fileChecksumSha256: input.fileChecksumSha256 || null,
      manifestTree: input.manifestTree || [],
    });
  }

  private resolvePublicMediaUrl(storageKey: string): string {
    if ((env.STORAGE_DRIVER === "r2" || env.STORAGE_DRIVER === "s3") && env.AWS_ENDPOINT) {
      if (env.AWS_ENDPOINT.includes("supabase.co")) {
        const bucket = env.AWS_BUCKET_NAME || "sell-digital-assets";
        try {
          const parsed = new URL(env.AWS_ENDPOINT);
          const host = parsed.hostname.replace(".storage.supabase.co", ".supabase.co");
          return `https://${host}/storage/v1/object/public/${bucket}/${storageKey}`;
        } catch {
          return `${env.AWS_ENDPOINT}/${storageKey}`;
        }
      }
      return `${env.AWS_ENDPOINT}/${storageKey}`;
    }

    const expiresAt = Date.now() + 31536000000;
    const token = localStorageService.signToken(storageKey, expiresAt, "download");
    const baseUrl = env.SERVER_URL ? env.SERVER_URL.replace(/\/+$/, "") : "";
    return `${baseUrl}/api/v1/storage/download?key=${encodeURIComponent(
      storageKey,
    )}&token=${token}&expires=${expiresAt}`;
  }

  async presignMediaUpload(
    assetId: string,
    sellerId: string,
    input: PresignMediaUploadInput,
  ) {
    const asset = await assetsRepository.findById(assetId);
    if (!asset || asset.seller_id !== sellerId) {
      throw new AppError("Asset not found or unauthorized", 404);
    }

    const sanitizedFileName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storageKey = `public/media/${assetId}/${input.mediaType}-${Date.now()}-${sanitizedFileName}`;

    const presigned = await storageService.generatePresignedUploadUrl(
      storageKey,
      input.contentType,
      900,
    );

    const previewUrl = this.resolvePublicMediaUrl(storageKey);

    return {
      ...presigned,
      previewUrl,
    };
  }

  async confirmMediaUpload(
    assetId: string,
    sellerId: string,
    input: ConfirmMediaUploadInput,
  ) {
    const asset = await assetsRepository.findById(assetId);
    if (!asset || asset.seller_id !== sellerId) {
      throw new AppError("Asset not found or unauthorized", 404);
    }

    const expectedPrefix = `public/media/${assetId}/`;
    if (
      !input.storageKey.startsWith(expectedPrefix) ||
      input.storageKey.includes("..") ||
      input.storageKey.includes("\\") ||
      input.storageKey.includes("\0")
    ) {
      throw new AppError("Invalid media storage key for this asset", 400);
    }

    if (env.STORAGE_DRIVER === "local") {
      const stats = await storageService.getFileStats(input.storageKey);
      if (!stats.exists) {
        throw new AppError(
          "Media file was not found in storage. Ensure upload completed.",
          400,
        );
      }
    }

    const url = this.resolvePublicMediaUrl(input.storageKey);

    return assetsRepository.createMedia({
      assetId,
      mediaType: input.mediaType,
      storageKey: input.storageKey,
      url,
      displayOrder: input.displayOrder,
    });
  }

  async decommissionFile(assetId: string, sellerId: string, fileId: string) {
    const asset = await assetsRepository.findById(assetId);
    if (!asset || asset.seller_id !== sellerId) {
      throw new AppError("Asset not found or unauthorized", 404);
    }

    const file = await assetsRepository.findFileById(fileId, assetId);
    if (!file) {
      throw new AppError("File version not found", 404);
    }

    await storageService.deleteFile(file.storage_key).catch(() => {});
    await assetsRepository.decommissionFile(fileId, assetId);

    return { id: fileId, decommissioned: true };
  }

  async deleteMedia(assetId: string, sellerId: string, mediaId: string) {
    const asset = await assetsRepository.findById(assetId);
    if (!asset || asset.seller_id !== sellerId) {
      throw new AppError("Asset not found or unauthorized", 404);
    }

    const media = await assetsRepository.findMediaById(mediaId, assetId);
    if (!media) {
      throw new AppError("Media item not found", 404);
    }

    await storageService.deleteFile(media.storage_key).catch(() => {});
    await assetsRepository.deleteMedia(mediaId, assetId);

    return { id: mediaId, deleted: true };
  }

  // ============================================================================
  // SECURE FULFILLMENT & DOWNLOADS
  // ============================================================================

  async generateDownloadLink(
    assetId: string,
    input: GenerateDownloadLinkInput,
    ipAddress: string,
    userAgent?: string,
    authenticatedUserId?: string,
  ) {
    const asset = await assetsRepository.findById(assetId);
    if (!asset) {
      throw new AppError("Asset not found", 404);
    }

    let verifiedLicenseKey: string | null = null;
    let verifiedBuyerId: string | null = null;

    if (input.licenseKey) {
      const license = await licensesRepository.findByKey(input.licenseKey);
      if (!license || license.asset_id !== assetId) {
        throw new AppError("Invalid license key for this asset", 403);
      }
      if (license.status !== "active") {
        throw new AppError(`License is ${license.status}`, 403);
      }
      verifiedLicenseKey = license.license_key;
      verifiedBuyerId = license.buyer_id;
    } else if (authenticatedUserId) {
      const license = await licensesRepository.findByBuyerAndAsset(authenticatedUserId, assetId);
      if (!license) {
        throw new AppError("No active purchase license found for this user account", 403);
      }
      verifiedLicenseKey = license.license_key;
      verifiedBuyerId = authenticatedUserId;
    } else {
      throw new AppError(
        "Authorization required: Provide a valid licenseKey or authenticated buyer account",
        403,
      );
    }

    const file = await licensesRepository.findActiveFile(assetId, input.fileId);
    if (!file) {
      throw new AppError("No active downloadable package exists for this asset yet", 404);
    }

    const expiresInSeconds = 900; // 15 mins
    const downloadUrl = await storageService.generatePresignedDownloadUrl(
      file.storage_key,
      file.file_name,
      expiresInSeconds,
    );

    const signedUrlToken = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    await licensesRepository.recordDownloadAudit({
      assetId,
      assetFileId: file.id ?? null,
      userId: verifiedBuyerId ?? null,
      licenseKey: verifiedLicenseKey ?? null,
      ipAddress,
      userAgent: userAgent ?? null,
      signedUrlToken,
      expiresAt,
    });

    return {
      downloadUrl,
      fileName: file.file_name,
      fileSizeBytes: file.file_size_bytes,
      version: file.version,
      expiresInSeconds,
      expiresAt: expiresAt.toISOString(),
      verifiedLicenseKey,
    };
  }

  // ============================================================================
  // LICENSING & VERIFICATION ENGINE
  // ============================================================================

  generateKey(): string {
    const chunk = () => crypto.randomBytes(2).toString("hex").toUpperCase();
    return `DV26-${chunk()}-${chunk()}-${chunk()}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  async issueLicense(input: IssueLicenseInput) {
    const [asset, buyer, tierConfig] = await Promise.all([
      assetsRepository.findById(input.assetId),
      userRepository.findById(input.buyerId),
      licensesRepository.findTierByType(input.tier),
    ]);

    if (!asset) {
      throw new AppError("Asset not found", 404);
    }

    if (!buyer) {
      throw new AppError("Buyer account not found", 404);
    }

    if (buyer.status !== "active") {
      throw new AppError(`Buyer account is ${buyer.status}`, 400);
    }

    if (!tierConfig.is_active) {
      throw new AppError(`License tier '${input.tier}' is currently inactive`, 400);
    }

    const maxActivations = tierConfig.max_activations;

    let licenseKey = this.generateKey();
    while (await licensesRepository.findByKey(licenseKey)) {
      licenseKey = this.generateKey();
    }

    return licensesRepository.issue({
      licenseKey,
      assetId: input.assetId,
      buyerId: input.buyerId,
      tier: input.tier,
      maxActivations,
    });
  }

  async verifyLicense(input: VerifyLicenseInput) {
    const license = await licensesRepository.findByKey(input.licenseKey);
    if (!license) {
      return {
        isValid: false,
        reason: "License key does not exist",
      };
    }

    if (license.status !== "active") {
      return {
        isValid: false,
        reason: `License is ${license.status}`,
        status: license.status,
      };
    }

    if (license.expires_at && new Date() > new Date(license.expires_at)) {
      return {
        isValid: false,
        reason: "License has expired",
        status: "expired",
      };
    }

    let isDomainActivated = false;
    const activations = license.activations || [];
    if (input.domainOrMachineId) {
      isDomainActivated = activations.some(
        (a: any) =>
          a.domain_or_machine_id.toLowerCase() === input.domainOrMachineId?.toLowerCase(),
      );
    }

    const maxActivations = license.max_activations ?? 1;
    const activationCount = license.activation_count ?? 0;

    return {
      isValid: true,
      licenseKey: license.license_key,
      status: license.status,
      tier: license.tier,
      asset: license.asset,
      owner: license.buyer
        ? { id: license.buyer.id, name: license.buyer.name }
        : undefined,
      issuedAt: license.issued_at,
      expiresAt: license.expires_at,
      seats: {
        maxActivations,
        activeCount: activationCount,
        remaining: Math.max(0, maxActivations - activationCount),
      },
      isDomainActivated,
      activeDomains: activations.map((a: any) => a.domain_or_machine_id),
    };
  }

  async activateLicense(input: ActivateLicenseInput, ipAddress?: string) {
    const license = await licensesRepository.findByKey(input.licenseKey);
    if (!license) {
      throw new AppError("License key not found", 404);
    }

    if (license.status !== "active") {
      throw new AppError(`Cannot activate: License is ${license.status}`, 400);
    }

    if (license.expires_at && new Date() > new Date(license.expires_at)) {
      throw new AppError("Cannot activate: License has expired", 400);
    }

    const domain = input.domainOrMachineId.trim().toLowerCase();

    const result = await licensesRepository.activateDomain(
      license.id!,
      domain,
      ipAddress,
    );

    if (result.alreadyExisted) {
      return {
        success: true,
        message: "Domain/Machine is already registered to this license",
        activation: result.activation,
        activeCount: result.activeCount,
        maxActivations: result.maxActivations,
      };
    }

    return {
      success: true,
      message: "License successfully activated",
      domain,
      activeCount: result.activeCount,
      maxActivations: result.maxActivations,
      activatedAt: result.activation.activated_at,
    };
  }

  async getBuyerLicenses(buyerId: string) {
    return licensesRepository.findByBuyer(buyerId);
  }

  // ============================================================================
  // DIRECT LOCAL STORAGE STREAMING
  // ============================================================================

  async streamDirectUpload(
    sourceStream: NodeJS.ReadableStream,
    params: {
      key?: string | undefined;
      token?: string | undefined;
      expires?: string | undefined;
      declaredLength?: number | undefined;
    },
  ) {
    const { key, token, expires, declaredLength = 0 } = params;

    if (!key || !token || !expires) {
      throw new AppError("Missing upload signature parameters (key, token, expires)", 400);
    }

    const expiresAt = parseInt(expires, 10);
    const isValid = localStorageService.verifyToken(key, expiresAt, "upload", token);
    if (!isValid) {
      throw new AppError("Invalid or expired upload signature token", 403);
    }

    if (declaredLength > MAX_UPLOAD_BYTES) {
      throw new AppError("Uploaded file exceeds maximum allowed size (500 MB)", 413);
    }

    const filePath = localStorageService.getAbsolutePath(key);
    const parentDir = path.dirname(filePath);
    await fs.promises.mkdir(parentDir, { recursive: true });

    let bytesReceived = 0;
    const byteLimitTransform = new Transform({
      transform(chunk: Buffer, _encoding: BufferEncoding, callback: TransformCallback) {
        bytesReceived += chunk.length;
        if (bytesReceived > MAX_UPLOAD_BYTES) {
          callback(new AppError("Uploaded file exceeds maximum allowed size (500 MB)", 413));
          return;
        }
        callback(null, chunk);
      },
    });

    const writeStream = fs.createWriteStream(filePath);

    try {
      await pipeline(sourceStream, byteLimitTransform, writeStream);
    } catch (err) {
      await fs.promises.unlink(filePath).catch(() => {});
      throw err;
    }

    const stat = await fs.promises.stat(filePath);

    return {
      storageKey: key,
      sizeBytes: stat.size,
    };
  }

  async resolveDirectDownload(params: {
    key?: string | undefined;
    token?: string | undefined;
    expires?: string | undefined;
    filename?: string | undefined;
  }) {
    const { key, token, expires, filename } = params;

    if (!key || !token || !expires) {
      throw new AppError("Missing download signature parameters (key, token, expires)", 400);
    }

    const expiresAt = parseInt(expires, 10);
    const isValid = localStorageService.verifyToken(key, expiresAt, "download", token);
    if (!isValid) {
      throw new AppError("Invalid or expired download signature token", 403);
    }

    const filePath = localStorageService.getAbsolutePath(key);
    let stat: fs.Stats;
    try {
      stat = await fs.promises.stat(filePath);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        throw new AppError("File not found on storage disk", 404);
      }
      throw err;
    }

    const downloadName = filename || path.basename(filePath);
    const ext = path.extname(downloadName).toLowerCase();
    const mimeType = DOWNLOAD_MIME_TYPES[ext] || "application/octet-stream";
    const isInline =
      mimeType.startsWith("image/") ||
      mimeType.startsWith("video/") ||
      mimeType.startsWith("audio/") ||
      key.startsWith("public/media/");

    return {
      filePath,
      sizeBytes: stat.size,
      downloadName,
      mimeType,
      isInline,
    };
  }
}

export const assetsService = new AssetsService();
