import { Router } from "express";
import { categoriesController } from "./categories.controller.js";
import { authenticate, authorize } from "../../core/middleware/auth.middleware.js";
import {
  validateBody,
  validateQuery,
  validateParams,
} from "../../core/validation/validate.middleware.js";
import {
  CreateCategorySchema,
  UpdateCategorySchema,
  CategoryQuerySchema,
  IdParamSchema,
} from "./categories.schema.js";

const router = Router();

// GET all categories (supports ?includeInactive=true, ?page=, ?limit=, ?search=, ?tree=true)
router.get(
  "/",
  validateQuery(CategoryQuerySchema),
  categoriesController.getCategories.bind(categoriesController)
);

// GET single category by ID
router.get(
  "/:id",
  validateParams(IdParamSchema),
  categoriesController.getCategoryById.bind(categoriesController)
);

// POST create category (admin only)
router.post(
  "/",
  authenticate,
  authorize("admin"),
  validateBody(CreateCategorySchema),
  categoriesController.createCategory.bind(categoriesController)
);

// PATCH update category by ID (admin only)
router.patch(
  "/:id",
  authenticate,
  authorize("admin"),
  validateParams(IdParamSchema),
  validateBody(UpdateCategorySchema),
  categoriesController.updateCategory.bind(categoriesController)
);

// PUT update category by ID (admin only)
router.put(
  "/:id",
  authenticate,
  authorize("admin"),
  validateParams(IdParamSchema),
  validateBody(UpdateCategorySchema),
  categoriesController.updateCategory.bind(categoriesController)
);

// DELETE category by ID (admin only - soft-delete rule: sets is_active = FALSE)
router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  validateParams(IdParamSchema),
  categoriesController.deleteCategory.bind(categoriesController)
);

// POST restore category by ID (admin only - reactivates is_active = TRUE)
router.post(
  "/:id/restore",
  authenticate,
  authorize("admin"),
  validateParams(IdParamSchema),
  categoriesController.restoreCategory.bind(categoriesController)
);

export default router;

