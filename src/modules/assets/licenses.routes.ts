import { Router } from "express";
import { assetsController } from "./assets.controller.js";
import { authenticate, authorize } from "../../core/middleware/auth.middleware.js";
import { validateBody } from "../../core/validation/validate.middleware.js";
import {
  VerifyLicenseSchema,
  ActivateLicenseSchema,
  IssueLicenseSchema,
} from "./assets.schema.js";

const router = Router();

// GET /api/v1/licenses/tiers — List default licensing tiers and standard configuration
router.get("/tiers", assetsController.getLicenseTiers.bind(assetsController));

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

// POST /api/v1/licenses/issue — Issues new cryptographic license key on purchase completion (Admin only)
router.post(
  "/issue",
  authenticate,
  authorize("admin"),
  validateBody(IssueLicenseSchema),
  assetsController.issueLicense.bind(assetsController),
);

// GET /api/v1/licenses/buyer — Retrieves all active cryptographic licenses owned by authenticated buyer
router.get(
  "/buyer",
  authenticate,
  assetsController.getBuyerLicenses.bind(assetsController),
);

export default router;


