import { Router } from "express";
import { organizationsController } from "./organizations.controller.js";
import { authenticate, authorize } from "../../core/middleware/auth.middleware.js";
import { validateBody } from "../../core/validation/validate.middleware.js";
import { UpdateOrganizationSchema } from "./organizations.schema.js";

const router = Router();

// Public: Get organization & platform configuration
router.get("/", organizationsController.getOrganization.bind(organizationsController));

// Public: Get all supported currencies from currencies table
router.get("/currencies", organizationsController.getCurrencies.bind(organizationsController));

// Protected: Only Administrator can update organization configuration
router.put(
  "/",
  authenticate,
  authorize("admin"),
  validateBody(UpdateOrganizationSchema),
  organizationsController.updateOrganization.bind(organizationsController),
);

router.patch(
  "/",
  authenticate,
  authorize("admin"),
  validateBody(UpdateOrganizationSchema),
  organizationsController.updateOrganization.bind(organizationsController),
);

export default router;

