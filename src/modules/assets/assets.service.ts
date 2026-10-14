import crypto from "node:crypto";
import { assetsRepository } from "../../database/repositories/assets.repository.js";
import { licensesRepository } from "../../database/repositories/licenses.repository.js";
import { categoriesService } from "../categories/categories.service.js";
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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

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

  // ============================================================================
  // SELLER MANAGEMENT
  // ============================================================================

  async createDraftAsset(sellerId: string, rawInput: CreateAssetInput) {
    const input = CreateAssetSchema.parse(rawInput);
    let baseSlug = input.slug ? slugify(input.slug) : slugify(input.title);
    let slug = baseSlug;
    let counter = 1;

    while (await assetsRepository.findBySlug(slug)) {
      slug = `${baseSlug}-${counter++}`;
    }

    const initialStatus = input.status === "pending" ? "pending" : "draft";

    const asset = await assetsRepository.create({
      sellerId,
      categoryId: input.categoryId,
      title: input.title,
      slug,
      shortDescription: input.shortDescription,
      fullDescription: input.fullDescription,
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

    let slug = input.slug ? slugify(input.slug) : undefined;
    if (slug && slug !== existing.slug) {
      const collision = await assetsRepository.findBySlug(slug);
      if (collision && collision.id !== id) {
        slug = `${slug}-${id.slice(0, 4)}`;
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

  async getAdminAssetById(id: string) {
    const asset = await assetsRepository.findById(id);
    if (!asset) {
      throw new AppError(`Asset with ID '${id}' not found`, 404);
    }
    const result = await assetsRepository.findForAdmin({ search: asset.slug, limit: 1 });
    const match = result.data.find((a: any) => a.id === id);
    return match || asset;
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

    let previewUrl = "";
    if (env.STORAGE_DRIVER === "r2" && env.AWS_ENDPOINT) {
      previewUrl = `${env.AWS_ENDPOINT}/${storageKey}`;
    } else {
      const expiresAt = Date.now() + 31536000000;
      const token = localStorageService.signToken(storageKey, expiresAt, "download");
      previewUrl = `http://localhost:${env.PORT}/api/v1/storage/download?key=${encodeURIComponent(
        storageKey,
      )}&token=${token}&expires=${expiresAt}`;
    }

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

    let url = "";
    if (env.STORAGE_DRIVER === "r2" && env.AWS_ENDPOINT) {
      url = `${env.AWS_ENDPOINT}/${input.storageKey}`;
    } else {
      const expiresAt = Date.now() + 31536000000;
      const token = localStorageService.signToken(input.storageKey, expiresAt, "download");
      url = `http://localhost:${env.PORT}/api/v1/storage/download?key=${encodeURIComponent(
        input.storageKey,
      )}&token=${token}&expires=${expiresAt}`;
    }

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

  // ============================================================================
  // SECURE FULFILLMENT & DOWNLOADS
  // ============================================================================

  async generateDownloadLink(
    assetId: string,
    input: GenerateDownloadLinkInput,
    ipAddress: string,
    userAgent?: string,
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
    } else if (input.buyerId) {
      const license = await licensesRepository.findByBuyerAndAsset(input.buyerId, assetId);
      if (!license) {
        throw new AppError("No active purchase license found for this user account", 403);
      }
      verifiedLicenseKey = license.license_key;
      verifiedBuyerId = input.buyerId;
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
    let maxActivations = 1;
    if (input.tier === "commercial") maxActivations = 5;
    if (input.tier === "extended") maxActivations = 50;

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
      owner: license.buyer,
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

    const domain = input.domainOrMachineId.trim().toLowerCase();
    const activations = license.activations || [];

    const existing = activations.find(
      (a: any) => a.domain_or_machine_id.toLowerCase() === domain,
    );
    if (existing) {
      return {
        success: true,
        message: "Domain/Machine is already registered to this license",
        activation: existing,
        activeCount: license.activation_count,
        maxActivations: license.max_activations,
      };
    }

    const maxActivations = license.max_activations ?? 1;
    const activationCount = license.activation_count ?? 0;

    if (activationCount >= maxActivations) {
      throw new AppError(
        `Activation limit reached (${activationCount}/${maxActivations}). Upgrade to a higher license tier for additional seats.`,
        400,
      );
    }

    const activation = await licensesRepository.activateDomain(
      license.id!,
      domain,
      ipAddress,
    );

    return {
      success: true,
      message: "License successfully activated",
      domain,
      activeCount: activationCount + 1,
      maxActivations,
      activatedAt: activation.activated_at,
    };
  }

  async getBuyerLicenses(buyerId: string) {
    return licensesRepository.findByBuyer(buyerId);
  }
}

export const assetsService = new AssetsService();
