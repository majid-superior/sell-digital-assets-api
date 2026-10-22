import { Router } from "express";
import { bannersController } from "./banners.controller.js";
import {
  authenticate,
  authorize,
} from "../../core/middleware/auth.middleware.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../core/validation/validate.middleware.js";
import {
  BannerIdParamSchema,
  BannerQuerySchema,
  CreateBannerSchema,
  ToggleBannerStatusSchema,
  UpdateBannerSchema,
} from "./banners.schema.js";

const router = Router();

// Public endpoints: Fetch currently active and schedule-eligible banners for PromoBar
router.get(
  "/active",
  bannersController.getActiveBanners.bind(bannersController),
);

router.get(
  "/public",
  bannersController.getActiveBanners.bind(bannersController),
);

// Admin endpoints: Full CRUD, scheduling, and status management
router.get(
  "/",
  authenticate,
  authorize("admin"),
  validateQuery(BannerQuerySchema),
  bannersController.getAdminBanners.bind(bannersController),
);

router.get(
  "/:id",
  authenticate,
  authorize("admin"),
  validateParams(BannerIdParamSchema),
  bannersController.getBannerById.bind(bannersController),
);

router.post(
  "/",
  authenticate,
  authorize("admin"),
  validateBody(CreateBannerSchema),
  bannersController.createBanner.bind(bannersController),
);

router.patch(
  "/:id/status",
  authenticate,
  authorize("admin"),
  validateParams(BannerIdParamSchema),
  validateBody(ToggleBannerStatusSchema),
  bannersController.toggleBannerStatus.bind(bannersController),
);

router.patch(
  "/:id",
  authenticate,
  authorize("admin"),
  validateParams(BannerIdParamSchema),
  validateBody(UpdateBannerSchema),
  bannersController.updateBanner.bind(bannersController),
);

router.put(
  "/:id",
  authenticate,
  authorize("admin"),
  validateParams(BannerIdParamSchema),
  validateBody(UpdateBannerSchema),
  bannersController.updateBanner.bind(bannersController),
);

router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  validateParams(BannerIdParamSchema),
  bannersController.deleteBanner.bind(bannersController),
);

export default router;

