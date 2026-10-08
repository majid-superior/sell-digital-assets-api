import { Router } from "express";
import { companyController } from "./company.controller.js";
import { authenticate, authorize } from "../../core/middleware/auth.middleware.js";
import { validateBody } from "../../core/validation/validate.middleware.js";
import { UpdateCompanySchema } from "./company.schema.js";

const router = Router();

// Public: Get company & platform configuration
router.get("/", companyController.getCompany.bind(companyController));

// Public: Get all supported currencies from currencies table
router.get("/currencies", companyController.getCurrencies.bind(companyController));

// Protected: Only Administrator (sell-digital-assets-admin) can update company configuration
router.put(
  "/",
  authenticate,
  authorize("admin"),
  validateBody(UpdateCompanySchema),
  companyController.updateCompany.bind(companyController),
);

router.patch(
  "/",
  authenticate,
  authorize("admin"),
  validateBody(UpdateCompanySchema),
  companyController.updateCompany.bind(companyController),
);

export default router;
