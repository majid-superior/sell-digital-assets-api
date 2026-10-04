import { Router } from "express";
import { usersController } from "./users.controller.js";
import { authenticate, authorize } from "../../core/middleware/auth.middleware.js";
import { validateBody, validateQuery, validateParams } from "../../core/validation/validate.middleware.js";
import { CreateUserSchema, PaginationQuerySchema, UuidParamSchema, UpdateMeSchema } from "./users.schema.js";

const router = Router();

// Only admin can list all users
router.get(
  "/",
  authenticate,
  authorize("admin"),
  validateQuery(PaginationQuerySchema),
  usersController.getAllUsers.bind(usersController),
);

// Authenticated user gets own profile
router.get("/me", authenticate, usersController.getMe.bind(usersController));

// Authenticated user updates own profile
router.patch(
  "/me",
  authenticate,
  validateBody(UpdateMeSchema),
  usersController.updateMe.bind(usersController),
);

// Get user by ID (admin only)
router.get(
  "/:id",
  authenticate,
  authorize("admin"),
  validateParams(UuidParamSchema),
  usersController.getUserById.bind(usersController),
);

// Create user (admin only)
router.post(
  "/",
  authenticate,
  authorize("admin"),
  validateBody(CreateUserSchema),
  usersController.createUser.bind(usersController),
);

export default router;

