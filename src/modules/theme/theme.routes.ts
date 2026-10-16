import { Router } from "express";
import { themeController } from "./theme.controller.js";
import {
  authenticate,
  authorize,
} from "../../core/middleware/auth.middleware.js";
import {
  validateBody,
  validateParams,
} from "../../core/validation/validate.middleware.js";
import {
  UpdateActiveThemeSchema,
  CreateThemeSchema,
  IdParamSchema,
} from "./theme.schema.js";

const router = Router();

// 1. GET /api/v1/theme: Get currently active theme colors & design tokens (JSON)
router.get("/", themeController.getActiveTheme.bind(themeController));
router.get("/active", themeController.getActiveTheme.bind(themeController));

// 2. GET /api/v1/theme/all: List all registered themes in the database
router.get("/all", themeController.getAllThemes.bind(themeController));

// 3. POST /api/v1/theme: Administrator creates a new theme
router.post(
  "/",
  authenticate,
  authorize("admin"),
  validateBody(CreateThemeSchema),
  themeController.createTheme.bind(themeController),
);

// 4. POST /api/v1/theme/:id/activate: Administrator activates a specific theme
router.post(
  "/:id/activate",
  authenticate,
  authorize("admin"),
  validateParams(IdParamSchema),
  themeController.activateTheme.bind(themeController),
);

// 5. PUT & PATCH /api/v1/theme: Administrator updates active theme colors in PostgreSQL
router.put(
  "/",
  authenticate,
  authorize("admin"),
  validateBody(UpdateActiveThemeSchema),
  themeController.updateActiveTheme.bind(themeController),
);
router.patch(
  "/",
  authenticate,
  authorize("admin"),
  validateBody(UpdateActiveThemeSchema),
  themeController.updateActiveTheme.bind(themeController),
);
router.put(
  "/active",
  authenticate,
  authorize("admin"),
  validateBody(UpdateActiveThemeSchema),
  themeController.updateActiveTheme.bind(themeController),
);

// 6. GET /api/v1/theme/css: Get dynamic compiled CSS stylesheet (:root and .dark CSS variables)
router.get("/css", themeController.getCssVariables.bind(themeController));

export default router;
