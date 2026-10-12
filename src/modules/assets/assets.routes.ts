import { Router } from "express";
import { assetsController } from "./assets.controller.js";
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
} from "./assets.schema.js";

const router = Router();

// ============================================================================
// Public / Discovery Endpoints (/api/v1/assets)
// ============================================================================

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
// Also available under /api/v1/seller/assets
// ============================================================================

// POST /api/v1/assets/seller — Create draft asset
router.post(
  "/seller",
  validateBody(CreateAssetSchema),
  assetsController.createDraftAsset.bind(assetsController),
);

// GET /api/v1/assets/seller — Get seller's assets & performance stats
router.get(
  "/seller",
  validateQuery(SellerAssetQuerySchema),
  assetsController.getSellerAssets.bind(assetsController),
);

// PATCH /api/v1/assets/seller/:id — Update asset info, description, or specs
router.patch(
  "/seller/:id",
  validateParams(IdParamSchema),
  validateBody(UpdateAssetSchema),
  assetsController.updateAsset.bind(assetsController),
);

// POST /api/v1/assets/seller/:id/status — Transition status (DRAFT, PUBLISHED, etc.)
router.post(
  "/seller/:id/status",
  validateParams(IdParamSchema),
  validateBody(UpdateAssetStatusSchema),
  assetsController.updateAssetStatus.bind(assetsController),
);

// DELETE /api/v1/assets/seller/:id — Soft-delete and archive asset
router.delete(
  "/seller/:id",
  validateParams(IdParamSchema),
  assetsController.deleteAsset.bind(assetsController),
);

// ============================================================================
// Media & Deliverable File Handling
// ============================================================================

// POST /api/v1/assets/seller/:id/files/presign-upload — Presigned upload URL + S3 object key
router.post(
  "/seller/:id/files/presign-upload",
  validateParams(IdParamSchema),
  validateBody(PresignFileUploadSchema),
  assetsController.presignFileUpload.bind(assetsController),
);

// POST /api/v1/assets/seller/:id/files/confirm — Validate upload completion & associate version
router.post(
  "/seller/:id/files/confirm",
  validateParams(IdParamSchema),
  validateBody(ConfirmFileUploadSchema),
  assetsController.confirmFileUpload.bind(assetsController),
);

// POST /api/v1/assets/seller/:id/media/presign-upload — Upload thumbnails and showcase images/videos
router.post(
  "/seller/:id/media/presign-upload",
  validateParams(IdParamSchema),
  validateBody(PresignMediaUploadSchema),
  assetsController.presignMediaUpload.bind(assetsController),
);

// POST /api/v1/assets/seller/:id/media/confirm — Confirm media upload and save URL
router.post(
  "/seller/:id/media/confirm",
  validateParams(IdParamSchema),
  validateBody(ConfirmMediaUploadSchema),
  assetsController.confirmMediaUpload.bind(assetsController),
);

// DELETE /api/v1/assets/seller/:id/files/:fileId — Decommission or archive an old file version
router.delete(
  "/seller/:id/files/:fileId",
  validateParams(FileIdParamSchema),
  assetsController.decommissionFile.bind(assetsController),
);

// ============================================================================
// GET /api/v1/assets/:slug — Full details by slug (must be placed after static routes)
// ============================================================================
router.get(
  "/:slug",
  validateParams(SlugParamSchema),
  assetsController.getAssetBySlug.bind(assetsController),
);

export default router;

