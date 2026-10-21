import { Router } from "express";
import multer from "multer";
import { assetsController } from "./assets.controller.js";
import { authenticate, authorize } from "../../core/middleware/auth.middleware.js";
import { downloadLimiter } from "../../core/middleware/rate-limit.middleware.js";
import {
  validateBody,
  validateQuery,
  validateParams,
} from "../../core/validation/validate.middleware.js";
import {
  CreateAssetSchema,
  UpdateAssetSchema,
  UpdateAssetStatusSchema,
  AssetQuerySchema,
  SellerAssetQuerySchema,
  PresignFileUploadSchema,
  ConfirmFileUploadSchema,
  PresignMediaUploadSchema,
  ConfirmMediaUploadSchema,
  IdParamSchema,
  SlugParamSchema,
  FileIdParamSchema,
  MediaIdParamSchema,
} from "./assets.schema.js";

const router = Router();
const sellerAuth = [authenticate, authorize("seller", "admin")] as const;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

// ============================================================================
// Public / Discovery Endpoints (/api/v1/assets)
// ============================================================================

// GET /api/v1/assets/tiers — License pricing tiers configuration
router.get(
  "/tiers",
  assetsController.getLicenseTiers.bind(assetsController),
);

// GET /api/v1/assets/categories — Category taxonomy tree
router.get(
  "/categories",
  assetsController.getCategoriesTree.bind(assetsController),
);

// GET /api/v1/assets — Filtered & paginated discovery list
router.get(
  "/",
  validateQuery(AssetQuerySchema),
  assetsController.getPublicAssets.bind(assetsController),
);

// ============================================================================
// Seller Studio Management Endpoints (/api/v1/assets/seller/*)
// ============================================================================

// POST /api/v1/assets/seller — Create draft asset
router.post(
  "/seller",
  ...sellerAuth,
  validateBody(CreateAssetSchema),
  assetsController.createDraftAsset.bind(assetsController),
);

// GET /api/v1/assets/seller — Get seller's assets & performance stats
router.get(
  "/seller",
  ...sellerAuth,
  validateQuery(SellerAssetQuerySchema),
  assetsController.getSellerAssets.bind(assetsController),
);

// GET /api/v1/assets/seller/:id — Get seller's single asset by ID (any status)
router.get(
  "/seller/:id",
  ...sellerAuth,
  validateParams(IdParamSchema),
  assetsController.getSellerAssetById.bind(assetsController),
);

// PATCH /api/v1/assets/seller/:id — Update asset info, description, or specs
router.patch(
  "/seller/:id",
  ...sellerAuth,
  validateParams(IdParamSchema),
  validateBody(UpdateAssetSchema),
  assetsController.updateAsset.bind(assetsController),
);

// POST /api/v1/assets/seller/:id/status — Transition status (DRAFT, PENDING, ARCHIVED)
router.post(
  "/seller/:id/status",
  ...sellerAuth,
  validateParams(IdParamSchema),
  validateBody(UpdateAssetStatusSchema),
  assetsController.updateAssetStatus.bind(assetsController),
);

// DELETE /api/v1/assets/seller/:id — Soft-delete and archive asset
router.delete(
  "/seller/:id",
  ...sellerAuth,
  validateParams(IdParamSchema),
  assetsController.deleteAsset.bind(assetsController),
);

// ============================================================================
// Media & Deliverable File Handling (/api/v1/assets/seller/:id/*)
// ============================================================================

// POST /api/v1/assets/seller/:id/files/presign-upload — Presigned upload URL + S3 object key
router.post(
  "/seller/:id/files/presign-upload",
  ...sellerAuth,
  validateParams(IdParamSchema),
  validateBody(PresignFileUploadSchema),
  assetsController.presignFileUpload.bind(assetsController),
);

// POST /api/v1/assets/seller/:id/files/confirm — Validate upload completion & associate version
router.post(
  "/seller/:id/files/confirm",
  ...sellerAuth,
  validateParams(IdParamSchema),
  validateBody(ConfirmFileUploadSchema),
  assetsController.confirmFileUpload.bind(assetsController),
);

// POST /api/v1/assets/seller/:id/media/presign-upload — Upload thumbnails and showcase images/videos
router.post(
  "/seller/:id/media/presign-upload",
  ...sellerAuth,
  validateParams(IdParamSchema),
  validateBody(PresignMediaUploadSchema),
  assetsController.presignMediaUpload.bind(assetsController),
);

// POST /api/v1/assets/seller/:id/media/confirm — Confirm media upload and save URL
router.post(
  "/seller/:id/media/confirm",
  ...sellerAuth,
  validateParams(IdParamSchema),
  validateBody(ConfirmMediaUploadSchema),
  assetsController.confirmMediaUpload.bind(assetsController),
);

// DELETE /api/v1/assets/seller/:id/media/:mediaId — Delete media showcase image
router.delete(
  "/seller/:id/media/:mediaId",
  ...sellerAuth,
  validateParams(MediaIdParamSchema),
  assetsController.deleteMedia.bind(assetsController),
);

// DELETE /api/v1/assets/seller/:id/files/:fileId — Decommission or archive an old file version
router.delete(
  "/seller/:id/files/:fileId",
  ...sellerAuth,
  validateParams(FileIdParamSchema),
  assetsController.decommissionFile.bind(assetsController),
);

// ============================================================================
// Authenticated Buyer Download Endpoint (/api/v1/assets/:id/download)
// ============================================================================
router.get(
  "/:id/download",
  authenticate,
  downloadLimiter,
  validateParams(IdParamSchema),
  assetsController.downloadAsset.bind(assetsController),
);

// ============================================================================
// Dual-Upload & Watermarking Endpoint (/api/v1/assets/:id/upload)
// ============================================================================
router.post(
  "/:id/upload",
  ...sellerAuth,
  upload.single("file"),
  validateParams(IdParamSchema),
  assetsController.uploadImageAsset.bind(assetsController),
);

router.post(
  "/seller/:id/upload",
  ...sellerAuth,
  upload.single("file"),
  validateParams(IdParamSchema),
  assetsController.uploadImageAsset.bind(assetsController),
);

// ============================================================================
// GET /api/v1/assets/:slug — Full details by slug (must be placed after static routes)
// ============================================================================
router.get(
  "/:slug",
  validateParams(SlugParamSchema),
  assetsController.getAssetBySlug.bind(assetsController),
);

// ============================================================================
// Dedicated Seller Router for /api/v1/seller/assets
// ============================================================================
export const sellerAssetsRouter = Router();
sellerAssetsRouter.use(authenticate, authorize("seller", "admin"));

sellerAssetsRouter.post(
  "/",
  validateBody(CreateAssetSchema),
  assetsController.createDraftAsset.bind(assetsController),
);
sellerAssetsRouter.get(
  "/",
  validateQuery(SellerAssetQuerySchema),
  assetsController.getSellerAssets.bind(assetsController),
);
sellerAssetsRouter.get(
  "/:id",
  validateParams(IdParamSchema),
  assetsController.getSellerAssetById.bind(assetsController),
);
sellerAssetsRouter.patch(
  "/:id",
  validateParams(IdParamSchema),
  validateBody(UpdateAssetSchema),
  assetsController.updateAsset.bind(assetsController),
);
sellerAssetsRouter.post(
  "/:id/status",
  validateParams(IdParamSchema),
  validateBody(UpdateAssetStatusSchema),
  assetsController.updateAssetStatus.bind(assetsController),
);
sellerAssetsRouter.delete(
  "/:id",
  validateParams(IdParamSchema),
  assetsController.deleteAsset.bind(assetsController),
);
sellerAssetsRouter.post(
  "/:id/files/presign-upload",
  validateParams(IdParamSchema),
  validateBody(PresignFileUploadSchema),
  assetsController.presignFileUpload.bind(assetsController),
);
sellerAssetsRouter.post(
  "/:id/files/confirm",
  validateParams(IdParamSchema),
  validateBody(ConfirmFileUploadSchema),
  assetsController.confirmFileUpload.bind(assetsController),
);
sellerAssetsRouter.post(
  "/:id/media/presign-upload",
  validateParams(IdParamSchema),
  validateBody(PresignMediaUploadSchema),
  assetsController.presignMediaUpload.bind(assetsController),
);
sellerAssetsRouter.post(
  "/:id/media/confirm",
  validateParams(IdParamSchema),
  validateBody(ConfirmMediaUploadSchema),
  assetsController.confirmMediaUpload.bind(assetsController),
);
sellerAssetsRouter.post(
  "/:id/upload",
  upload.single("file"),
  validateParams(IdParamSchema),
  assetsController.uploadImageAsset.bind(assetsController),
);
sellerAssetsRouter.delete(
  "/:id/media/:mediaId",
  validateParams(MediaIdParamSchema),
  assetsController.deleteMedia.bind(assetsController),
);
sellerAssetsRouter.delete(
  "/:id/files/:fileId",
  validateParams(FileIdParamSchema),
  assetsController.decommissionFile.bind(assetsController),
);

export default router;


