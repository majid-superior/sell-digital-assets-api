import { Router } from "express";
import { assetsController } from "./assets.controller.js";
import { validateBody } from "../../core/validation/validate.middleware.js";
import {
  VerifyLicenseSchema,
  ActivateLicenseSchema,
  IssueLicenseSchema,
} from "./assets.schema.js";

const router = Router();

// POST /api/v1/licenses/verify — Validates license key structure, active status, tier & seat status
router.post(
  "/verify",
  validateBody(VerifyLicenseSchema),
  assetsController.verifyLicense.bind(assetsController),
);

// POST /api/v1/licenses/activate — Registers domain or client machine to an extended/commercial license
router.post(
  "/activate",
  validateBody(ActivateLicenseSchema),
  assetsController.activateLicense.bind(assetsController),
);

// POST /api/v1/licenses/issue — Issues new cryptographic license key on purchase completion
router.post(
  "/issue",
  validateBody(IssueLicenseSchema),
  assetsController.issueLicense.bind(assetsController),
);

export default router;

