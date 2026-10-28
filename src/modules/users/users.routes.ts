import { Router } from "express";
import { usersController } from "./users.controller.js";
import {
  authenticate,
  requireOrgAdmin,
  requireSellerAccess,
  requireStoreManagementAccess,
  requireStoreOwnerAccess,
} from "../../core/middleware/auth.middleware.js";
import {
  validateBody,
  validateQuery,
  validateParams,
} from "../../core/validation/validate.middleware.js";
import {
  PaginationQuerySchema,
  UuidParamSchema,
  UpdateUserSchema,
  CreateTeamMemberSchema,
  UpdateTeamMemberSchema,
  UpdateRolePermissionsSchema,
  RoleIdParamSchema,
  CreateRoleSchema,
  UpdateRoleStatusSchema,
  UpdatePermissionMatrixSchema,
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

// GET /roles — List available database store roles (MANAGER, USER, ANALYST)
sellerTeamRouter.get(
  "/roles",
  requireStoreManagementAccess,
  usersController.getStoreRoles.bind(usersController),
);

// POST /roles — Create new store role (or reactivate inactive role)
sellerTeamRouter.post(
  "/roles",
  requireStoreOwnerAccess,
  validateBody(CreateRoleSchema),
  usersController.createStoreRole.bind(usersController),
);

// PATCH /roles/:roleId/status — Activate / Deactivate store role
sellerTeamRouter.patch(
  "/roles/:roleId/status",
  requireStoreOwnerAccess,
  validateParams(RoleIdParamSchema),
  validateBody(UpdateRoleStatusSchema),
  usersController.updateStoreRoleStatus.bind(usersController),
);

// GET /permissions — List available store permissions catalog
sellerTeamRouter.get(
  "/permissions",
  requireStoreManagementAccess,
  usersController.getPermissionsCatalog.bind(usersController),
);

// GET /roles/permissions — List configured role permissions for this seller
sellerTeamRouter.get(
  "/roles/permissions",
  requireStoreManagementAccess,
  usersController.getStoreRolePermissions.bind(usersController),
);

// PUT /roles/permissions — Batch update permissions matrix atomically across roles
sellerTeamRouter.put(
  "/roles/permissions",
  requireStoreOwnerAccess,
  validateBody(UpdatePermissionMatrixSchema),
  usersController.updateStoreRolePermissionsMatrix.bind(usersController),
);

// PUT /roles/:roleId/permissions — Update permissions for a single store role in this seller's store
sellerTeamRouter.put(
  "/roles/:roleId/permissions",
  requireStoreOwnerAccess,
  validateParams(RoleIdParamSchema),
  validateBody(UpdateRolePermissionsSchema),
  usersController.updateStoreRolePermissions.bind(usersController),
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
