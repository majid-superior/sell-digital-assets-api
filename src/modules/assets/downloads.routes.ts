import { Router } from "express";
import { assetsController } from "./assets.controller.js";
import { optionalAuthenticate } from "../../core/middleware/auth.middleware.js";
import { downloadLimiter } from "../../core/middleware/rate-limit.middleware.js";
import { validateBody, validateParams } from "../../core/validation/validate.middleware.js";
import { AssetIdParamSchema, GenerateDownloadLinkSchema } from "./assets.schema.js";

const router = Router();

// POST /api/v1/downloads/:assetId/generate-link
router.post(
  "/:assetId/generate-link",
  downloadLimiter,
  optionalAuthenticate,
  validateParams(AssetIdParamSchema),
  validateBody(GenerateDownloadLinkSchema),
  assetsController.generateDownloadLink.bind(assetsController),
);

export default router;


