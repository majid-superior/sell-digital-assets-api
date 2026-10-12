import { Router } from "express";
import { assetsController } from "./assets.controller.js";
import { downloadLimiter } from "../../core/middleware/rate-limit.middleware.js";
import { validateBody } from "../../core/validation/validate.middleware.js";
import { GenerateDownloadLinkSchema } from "./assets.schema.js";

const router = Router();

// POST /api/v1/downloads/:assetId/generate-link
router.post(
  "/:assetId/generate-link",
  downloadLimiter,
  validateBody(GenerateDownloadLinkSchema),
  assetsController.generateDownloadLink.bind(assetsController),
);

export default router;

