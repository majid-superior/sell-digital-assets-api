import { Router } from "express";
import { assetsController } from "./assets.controller.js";
import { authenticate, authorize } from "../../core/middleware/auth.middleware.js";
import {
  validateBody,
  validateQuery,
  validateParams,
} from "../../core/validation/validate.middleware.js";
import {
  AdminReviewAssetSchema,
  AdminAssetQuerySchema,
  IdParamSchema,
} from "./assets.schema.js";

const router = Router();

// Strict Admin RBAC defense
router.use(authenticate);
router.use(authorize("admin"));

// GET /api/v1/admin/assets — List all assets for review (filters: status, sellerId, search, etc.)
router.get(
  "/",
  validateQuery(AdminAssetQuerySchema),
  assetsController.getAdminAssets.bind(assetsController),
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

export default router;

