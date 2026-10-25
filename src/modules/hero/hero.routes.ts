import { Router } from "express";
import multer from "multer";
import { heroController } from "./hero.controller.js";
import {
  authenticate,
  authorize,
} from "../../core/middleware/auth.middleware.js";
import {
  validateBody,
  validateParams,
} from "../../core/validation/validate.middleware.js";
import {
  HeroIdParamSchema,
  UpdateHeroImageSchema,
  UpdateHeroStatusSchema,
} from "./hero.schema.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB max for hero images
  },
});

// ============================================================================
// Public Endpoints
// ============================================================================
router.get("/active", heroController.getActiveImages.bind(heroController));
router.get("/public", heroController.getActiveImages.bind(heroController));
router.post("/update-frontend-json", heroController.updateFrontendJson.bind(heroController));
router.post("/internal/update-hero-json", heroController.updateFrontendJson.bind(heroController));

// ============================================================================
// Admin Endpoints
// ============================================================================
router.get(
  "/",
  authenticate,
  authorize("admin"),
  heroController.getAllImages.bind(heroController),
);

router.post(
  "/",
  authenticate,
  authorize("admin"),
  upload.single("image"),
  heroController.uploadImage.bind(heroController),
);

router.patch(
  "/:id/status",
  authenticate,
  authorize("admin"),
  validateParams(HeroIdParamSchema),
  validateBody(UpdateHeroStatusSchema),
  heroController.toggleStatus.bind(heroController),
);

router.patch(
  "/:id",
  authenticate,
  authorize("admin"),
  validateParams(HeroIdParamSchema),
  validateBody(UpdateHeroImageSchema),
  heroController.updateImage.bind(heroController),
);

router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  validateParams(HeroIdParamSchema),
  heroController.deleteImage.bind(heroController),
);

export default router;

