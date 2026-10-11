import { Router } from "express";
import { usersController } from "./users.controller.js";
import { authenticate, authorize } from "../../core/middleware/auth.middleware.js";
import { validateBody, validateQuery, validateParams } from "../../core/validation/validate.middleware.js";
import { PaginationQuerySchema, UuidParamSchema, UpdateUserSchema } from "./users.schema.js";

const router = Router();

// Only admin can list all users
router.get(
  "/",
  authenticate,
  authorize("admin"),
  validateQuery(PaginationQuerySchema),
  usersController.getAllUsers.bind(usersController),
);

// Get user by ID (admin only)
router.get(
  "/:id",
  authenticate,
  authorize("admin"),
  validateParams(UuidParamSchema),
  usersController.getUserById.bind(usersController),
);

// Update user status (active/deactive) by ID (admin only)
router.patch(
  "/:id",
  authenticate,
  authorize("admin"),
  validateParams(UuidParamSchema),
  validateBody(UpdateUserSchema),
  usersController.updateUser.bind(usersController),
);

// Deactivate user by ID (admin only)
router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  validateParams(UuidParamSchema),
  usersController.deleteUser.bind(usersController),
);

export default router;

