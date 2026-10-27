import { Router } from "express";
import { usersController } from "./users.controller.js";
import { authenticate, requireOrgAdmin, requireSellerAccess } from "../../core/middleware/auth.middleware.js";
import { validateBody, validateQuery, validateParams } from "../../core/validation/validate.middleware.js";
import {
  PaginationQuerySchema,
  UuidParamSchema,
  UpdateUserSchema,
  CreateTeamMemberSchema,
  UpdateTeamMemberSchema,
} from "./users.schema.js";

const router = Router();

// Only admin can list all users
router.get(
  "/",
  authenticate,
  requireOrgAdmin,
  validateQuery(PaginationQuerySchema),
  usersController.getAllUsers.bind(usersController),
);

// Get user by ID (admin only)
router.get(
  "/:id",
  authenticate,
  requireOrgAdmin,
  validateParams(UuidParamSchema),
  usersController.getUserById.bind(usersController),
);

// Update user status (active/deactive) by ID (admin only)
router.patch(
  "/:id",
  authenticate,
  requireOrgAdmin,
  validateParams(UuidParamSchema),
  validateBody(UpdateUserSchema),
  usersController.updateUser.bind(usersController),
);

// Deactivate user by ID (admin only)
router.delete(
  "/:id",
  authenticate,
  requireOrgAdmin,
  validateParams(UuidParamSchema),
  usersController.deleteUser.bind(usersController),
);

// ============================================================================
// Seller Team Management Router (/api/v1/seller/team & /v1/seller/team)
// ============================================================================
export const sellerTeamRouter = Router();
sellerTeamRouter.use(authenticate, requireSellerAccess);

// GET /api/v1/seller/team — List team members
sellerTeamRouter.get("/", usersController.getSellerTeam.bind(usersController));

// POST /api/v1/seller/team — Add team member (STORE_MANAGER, CONTENT_UPLOADER, ANALYST)
sellerTeamRouter.post(
  "/",
  validateBody(CreateTeamMemberSchema),
  usersController.createTeamMember.bind(usersController),
);

// PATCH /api/v1/seller/team/:id — Update team member
sellerTeamRouter.patch(
  "/:id",
  validateParams(UuidParamSchema),
  validateBody(UpdateTeamMemberSchema),
  usersController.updateTeamMember.bind(usersController),
);

// DELETE /api/v1/seller/team/:id — Remove team member
sellerTeamRouter.delete(
  "/:id",
  validateParams(UuidParamSchema),
  usersController.deleteTeamMember.bind(usersController),
);

export default router;

