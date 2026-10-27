import { Router } from "express";
import { assetsController } from "./assets.controller.js";
import { authenticate, requireOrgAdmin } from "../../core/middleware/auth.middleware.js";
import {
  validateBody,
  validateQuery,
  validateParams,
} from "../../core/validation/validate.middleware.js";
import {
  AdminReviewAssetSchema,
  AdminAssetQuerySchema,
  CurateAssetSchema,
  IdParamSchema,
} from "./assets.schema.js";

const router = Router();

// Strict Admin RBAC defense
router.use(authenticate);
router.use(requireOrgAdmin);

// GET /api/v1/admin/assets — List all assets for review (filters: status, sellerId, search, etc.)
router.get(
  "/",
  validateQuery(AdminAssetQuerySchema),
  assetsController.getAdminAssets.bind(assetsController),
);

// GET /api/v1/admin/assets/counts — Counters for review queue & sidebar
router.get(
  "/counts",
  assetsController.getAdminAssetCounts.bind(assetsController),
);

// GET /api/v1/admin/assets/:id — Full asset review details
router.get(
  "/:id",
  validateParams(IdParamSchema),
  assetsController.getAdminAssetById.bind(assetsController),
);

// POST /api/v1/admin/assets/:id/review — Admin governance decision (approve, reject, needs_update)
router.post(
  "/:id/review",
  validateParams(IdParamSchema),
  validateBody(AdminReviewAssetSchema),
  assetsController.adminReviewAsset.bind(assetsController),
);

// PATCH /api/v1/admin/assets/:id/curate — Toggle curated status
router.patch(
  "/:id/curate",
  validateParams(IdParamSchema),
  validateBody(CurateAssetSchema),
  assetsController.setCuratedStatus.bind(assetsController),
);

export default router;

