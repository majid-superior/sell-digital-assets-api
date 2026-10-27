import { Router } from "express";
import { usersController } from "./users.controller.js";
import {
  authenticate,
  requireOrgAdmin,
  requireSellerAccess,
  requireStoreManagementAccess,
  requireStoreOwnerAccess,
} from "../../core/middleware/auth.middleware.js";
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
// Seller Team Management Router (/api/v1/seller/team, /api/v1/seller/users)
// ============================================================================
export const sellerTeamRouter = Router();
sellerTeamRouter.use(authenticate, requireSellerAccess);

// GET /roles — List available database store roles (STORE_MANAGER, CONTENT_UPLOADER, ANALYST)
sellerTeamRouter.get(
  "/roles",
  requireStoreManagementAccess,
  usersController.getStoreRoles.bind(usersController),
);

// GET / — List team members for the authenticated seller's store
sellerTeamRouter.get(
  "/",
  requireStoreManagementAccess,
  usersController.getSellerTeam.bind(usersController),
);

// POST / — Add team member (store owner / admin only)
sellerTeamRouter.post(
  "/",
  requireStoreOwnerAccess,
  validateBody(CreateTeamMemberSchema),
  usersController.createTeamMember.bind(usersController),
);

// PATCH /:id — Update team member (store owner / admin only)
sellerTeamRouter.patch(
  "/:id",
  requireStoreOwnerAccess,
  validateParams(UuidParamSchema),
  validateBody(UpdateTeamMemberSchema),
  usersController.updateTeamMember.bind(usersController),
);

// DELETE /:id — Remove team member from store (store owner / admin only)
sellerTeamRouter.delete(
  "/:id",
  requireStoreOwnerAccess,
  validateParams(UuidParamSchema),
  usersController.deleteTeamMember.bind(usersController),
);

export default router;

