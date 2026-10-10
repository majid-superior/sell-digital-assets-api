import { Router } from "express";
import { themeController } from "./theme.controller.js";
import {
  authenticate,
  authorize,
} from "../../core/middleware/auth.middleware.js";
import { validateBody } from "../../core/validation/validate.middleware.js";
import { UpdateActiveThemeSchema } from "./theme.schema.js";

const router = Router();

// 1. GET /api/theme: Get currently active theme colors & design tokens (JSON)
router.get("/", themeController.getActiveTheme.bind(themeController));
router.get("/active", themeController.getActiveTheme.bind(themeController));

// 2. PUT /api/theme: Administrator updates active theme colors in PostgreSQL
router.put(
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

// 3. GET /api/theme/css: Get dynamic compiled CSS stylesheet (:root and .dark CSS variables)
router.get("/css", themeController.getCssVariables.bind(themeController));

export default router;

