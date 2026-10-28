import {
  userRepository,
  type UserEntity,
  type RoleEntity,
  type PermissionEntity,
  type SellerRolePermissionEntity,
  type PaginationQuery,
  type PaginatedResult,
} from "../../database/repositories/user.repository.js";
import { AppError } from "../../core/errors/app-error.js";
import { hashPassword } from "../../core/security/password.js";
import { revokeAllUserTokens } from "../../core/security/tokens.js";
import { invalidateAuthUserCache } from "../../core/middleware/auth.middleware.js";
import { authService } from "../auth/auth.service.js";
import type {
  UpdateUserInput,
  CreateTeamMemberInput,
  UpdateTeamMemberInput,
  CreateRoleInput,
  UpdateRoleStatusInput,
  UpdatePermissionMatrixInput,
} from "./users.schema.js";
import { resolveRoleId } from "../../database/repositories/user.repository.js";

export class UsersService {
  async getAllUsers(params?: PaginationQuery): Promise<PaginatedResult<Omit<UserEntity, "password_hash">>> {
    return userRepository.findAll(params);
  }

  async getUserById(id: string): Promise<Omit<UserEntity, "password_hash">> {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    const { password_hash, ...safeUser } = user;
    return safeUser;
  }

  async updateUser(
    id: string,
    data: UpdateUserInput,
    actorId?: string,
  ): Promise<Omit<UserEntity, "password_hash">> {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (user.role === "admin") {
      throw new AppError(
        "Administrator accounts cannot be modified through the standard user management endpoint.",
        403,
      );
    }

    if (actorId && user.id === actorId && data.status && data.status !== "active") {
      throw new AppError(
        "You cannot suspend, deactivate, or ban your own account.",
        400,
      );
    }

    let passwordHash: string | undefined;
    if (data.password) {
      authService.validatePasswordPolicy(data.password);
      passwordHash = await hashPassword(data.password);
    }

    const normalizedStatus =
      data.status === "deactive" ? "suspended" : data.status;

    const updated = await userRepository.update(id, {
      name: data.name,
      passwordHash,
      status: normalizedStatus,
      ...(normalizedStatus === "active" && !user.email_verified_at
        ? { emailVerifiedAt: new Date() }
        : {}),
    });

    if (!updated) {
      throw new AppError("User not found", 404);
    }

    if (passwordHash || (normalizedStatus && normalizedStatus !== "active")) {
      await revokeAllUserTokens(id);
    }

    const { password_hash, ...safeUser } = updated;
    return safeUser;
  }

  async deleteUser(id: string, actorId?: string): Promise<void> {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (user.role === "admin" || (actorId && user.id === actorId)) {
      throw new AppError(
        "Administrator accounts and your own active account cannot be deactivated.",
        403,
      );
    }

    await userRepository.update(id, { status: "suspended" });
    await revokeAllUserTokens(id);
  }

  async getStoreRoles(includeInactive = false): Promise<RoleEntity[]> {
    return userRepository.findStoreRoles(includeInactive);
  }

  async getPermissionsCatalog(): Promise<PermissionEntity[]> {
    return userRepository.getPermissionsCatalog();
  }

  async getStoreRolePermissions(
    sellerId: string,
    includeInactive = false,
  ): Promise<
    Array<{
      roleId: number;
      roleName: string;
      roleSlug: string;
      description: string;
      is_active: boolean;
      isCustomized: boolean;
      permissions: string[];
    }>
  > {
    const roles = await userRepository.findStoreRoles(includeInactive);
    const defaults = await userRepository.getRoleDefaultPermissions();
    const sellerConfigs = await userRepository.getSellerRolePermissions(sellerId);
    const sellerConfigMap = new Map<number, string[]>();
    for (const sc of sellerConfigs) {
      sellerConfigMap.set(sc.role_id, sc.permissions);
    }

    return roles.map((role) => {
      const isCustomized = sellerConfigMap.has(role.id);
      const permissions = isCustomized
        ? sellerConfigMap.get(role.id)!
        : defaults[role.id] || [];

      return {
        roleId: role.id,
        roleName: role.name,
        roleSlug: role.slug,
        description: role.description,
        is_active: role.is_active !== false,
        isCustomized,
        permissions,
      };
    });
  }

  async createStoreRole(
    sellerId: string,
    payload: CreateRoleInput,
  ): Promise<RoleEntity & { permissions: string[] }> {
    const rawName = payload.name.trim();
    if (!rawName) {
      throw new AppError("Role name cannot be empty.", 400);
    }

    // Normalized slug derivation
    const slug = rawName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

    if (!slug) {
      throw new AppError("Role name must contain at least one alphanumeric character.", 400);
    }

    // Step 4: Check if role with same normalized name or slug exists (active or inactive)
    const existing = await userRepository.findRoleByNameOrSlug(rawName, slug);
    if (existing) {
      if (existing.is_active !== false) {
        throw new AppError(
          `A store role with the name '${existing.name}' already exists.`,
          409,
        );
      }

      // If inactive, check if reactivation was explicitly requested
      if (payload.reactivateIfExists) {
        const reactivated = await userRepository.updateRoleStatus(existing.id, true);
        let perms: string[] = [];
        if (payload.permissions && Array.isArray(payload.permissions)) {
          const updated = await this.updateStoreRolePermissions(
            sellerId,
            existing.id,
            payload.permissions,
          );
          perms = updated.permissions;
        } else {
          // preserve existing permissions
          const currentConfigs = await userRepository.getSellerRolePermissions(sellerId);
          const found = currentConfigs.find((c) => c.role_id === existing.id);
          if (found) {
            perms = found.permissions;
          } else {
            const defaults = await userRepository.getRoleDefaultPermissions(existing.id);
            perms = defaults[existing.id] || [];
          }
        }

        return {
          ...reactivated,
          permissions: perms,
        };
      }

      // Inactive role exists, prompt client with structured error code
      const conflictError = new AppError(
        `An inactive role with the name '${existing.name}' already exists. Would you like to reactivate it and restore its previous permissions, or choose a different name?`,
        409,
      );
      (conflictError as any).code = "INACTIVE_ROLE_EXISTS";
      (conflictError as any).data = {
        existingRole: {
          id: existing.id,
          name: existing.name,
          slug: existing.slug,
          is_active: false,
        },
      };
      throw conflictError;
    }

    // Create new store role
    try {
      const created = await userRepository.createStoreRole({
        name: rawName,
        slug,
        description: payload.description || `Store role ${rawName}`,
      });

      let permissions: string[] = [];
      if (payload.permissions && Array.isArray(payload.permissions) && payload.permissions.length > 0) {
        const updated = await this.updateStoreRolePermissions(
          sellerId,
          created.id,
          payload.permissions,
        );
        permissions = updated.permissions;
      }

      return {
        ...created,
        permissions,
      };
    } catch (err: any) {
      if (err.code === "23505") {
        throw new AppError(`A store role with the name '${rawName}' already exists.`, 409);
      }
      throw err;
    }
  }

  async updateStoreRoleStatus(roleId: number, isActive: boolean): Promise<RoleEntity> {
    const role = await userRepository.findRoleById(roleId);
    if (!role) {
      throw new AppError("Role not found.", 404);
    }

    if (role.scope === "PLATFORM" || [1, 2, 3].includes(role.id)) {
      throw new AppError("Platform system roles cannot be modified.", 403);
    }

    const updated = await userRepository.updateRoleStatus(roleId, isActive);

    // Invalidate auth cache for any sub-users with this role so inactive state takes effect immediately
    const members = await userRepository.findMembersByRoleId(roleId);
    for (const member of members) {
      invalidateAuthUserCache(member.id);
    }

    return updated;
  }

  async updateStoreRolePermissionsMatrix(
    sellerId: string,
    matrix: Array<{ roleId: number; permissions: string[] }>,
  ): Promise<
    Array<{
      roleId: number;
      roleName: string;
      roleSlug: string;
      description: string;
      is_active: boolean;
      isCustomized: boolean;
      permissions: string[];
    }>
  > {
    const storeRoles = await userRepository.findStoreRoles(true);
    const storeRoleMap = new Map<number, RoleEntity>();
    for (const r of storeRoles) storeRoleMap.set(r.id, r);

    const catalog = await userRepository.getPermissionsCatalog();
    const validPermNames = new Set(catalog.map((p) => p.name));

    for (const item of matrix) {
      const role = storeRoleMap.get(item.roleId);
      if (!role) {
        throw new AppError(`Invalid store role ID '${item.roleId}'.`, 400);
      }
      const invalid = item.permissions.filter((p) => !validPermNames.has(p));
      if (invalid.length > 0) {
        throw new AppError(
          `Invalid permission(s) for role '${role.name}': ${invalid.join(", ")}.`,
          400,
        );
      }
    }

    // Atomic database transaction
    await userRepository.upsertSellerRolePermissionsBatch(sellerId, matrix);

    return this.getStoreRolePermissions(sellerId, false);
  }

  async updateStoreRolePermissions(
    sellerId: string,
    roleOrId: string | number,
    permissions: string[],
  ): Promise<{
    roleId: number;
    roleName: string;
    roleSlug: string;
    description: string;
    isCustomized: boolean;
    permissions: string[];
  }> {
    const targetRole = await this.resolveValidStoreRole(roleOrId, true);

    // Validate all permission names against the database catalog
    const catalog = await userRepository.getPermissionsCatalog();
    const validNames = new Set(catalog.map((p) => p.name));
    const invalid = permissions.filter((p) => !validNames.has(p));
    if (invalid.length > 0) {
      throw new AppError(
        `Invalid permission(s): ${invalid.join(", ")}. Permitted store permissions are: ${Array.from(validNames).join(", ")}`,
        400,
      );
    }

    const updated = await userRepository.upsertSellerRolePermissions(
      sellerId,
      targetRole.id,
      permissions,
    );

    return {
      roleId: updated.role_id,
      roleName: targetRole.name,
      roleSlug: targetRole.slug,
      description: targetRole.description,
      isCustomized: true,
      permissions: updated.permissions,
    };
  }

  private async resolveValidStoreRole(
    roleOrId?: string | number,
    allowInactive = false,
  ): Promise<RoleEntity> {
    const roles = await userRepository.findStoreRoles(allowInactive);
    if (!roleOrId && roleOrId !== 0) {
      throw new AppError("A store team role is required.", 400);
    }
    const roleStr = String(roleOrId).trim().toLowerCase();
    const roleNum = Number(roleOrId);

    const matched = roles.find((r) => {
      if (!Number.isNaN(roleNum) && r.id === roleNum) return true;
      if (r.slug.toLowerCase() === roleStr) return true;
      if (r.name.toLowerCase() === roleStr) return true;
      return false;
    });

    if (!matched) {
      throw new AppError(
        `Invalid store role '${roleOrId}'. Permitted store team roles are: ${roles.map((r) => r.slug).join(", ")}.`,
        400,
      );
    }
    return matched;
  }

  async getSellerTeam(parentSellerId: string): Promise<Array<Omit<UserEntity, "password_hash">>> {
    const members = await userRepository.findTeamMembers(parentSellerId);
    return members.map(({ password_hash, ...m }) => m);
  }

  async createTeamMember(
    parentSellerId: string,
    data: CreateTeamMemberInput,
  ): Promise<Omit<UserEntity, "password_hash">> {
    const targetRole = await this.resolveValidStoreRole(data.roleId ?? data.role, false);
    if (targetRole.is_active === false) {
      throw new AppError("Cannot assign an inactive role to a store team member.", 400);
    }
    const existing = await userRepository.findByEmail(data.email);

    if (existing) {
      if (existing.parent_seller_id === parentSellerId) {
        throw new AppError("This user is already a member of your store team.", 409);
      }
      if (existing.parent_seller_id && existing.parent_seller_id !== parentSellerId) {
        throw new AppError("This user is already affiliated with another store.", 409);
      }
      if (existing.role === "admin" || existing.role_id === 1) {
        throw new AppError("Administrator accounts cannot be added as store team members.", 403);
      }
      if (existing.role === "seller" || existing.role_id === 2) {
        throw new AppError("Independent seller accounts cannot be added as store team members.", 409);
      }

      // Existing buyer account without parent seller: link to this seller's team
      let passwordHash: string | undefined;
      if (data.password) {
        authService.validatePasswordPolicy(data.password);
        passwordHash = await hashPassword(data.password);
      }

      const updated = await userRepository.update(existing.id, {
        name: data.name,
        displayName: data.name,
        parentSellerId,
        roleId: targetRole.id,
        status: "active",
        isActive: true,
        ...(passwordHash ? { passwordHash } : {}),
        ...(data.allowedPermissions ? { allowedPermissions: data.allowedPermissions } : {}),
      });

      if (!updated) {
        throw new AppError("Failed to add team member to store.", 500);
      }

      const { password_hash, ...safeMember } = updated;
      return safeMember;
    }

    // New user creation
    authService.validatePasswordPolicy(data.password);
    const passwordHash = await hashPassword(data.password);

    const created = await userRepository.create({
      name: data.name,
      displayName: data.name,
      email: data.email,
      passwordHash,
      role: targetRole.id,
      parentSellerId,
      allowedPermissions: data.allowedPermissions || [],
      isActive: true,
      status: "active",
      emailVerifiedAt: new Date(),
    });

    const { password_hash, ...safeMember } = created;
    return safeMember;
  }

  async updateTeamMember(
    parentSellerId: string,
    memberId: string,
    data: UpdateTeamMemberInput,
  ): Promise<Omit<UserEntity, "password_hash">> {
    const member = await userRepository.findById(memberId);
    if (!member || member.parent_seller_id !== parentSellerId) {
      throw new AppError("Team member not found.", 404);
    }

    let roleId: number | undefined;
    if (data.roleId !== undefined || data.role !== undefined) {
      const targetRole = await this.resolveValidStoreRole(data.roleId ?? data.role, false);
      if (targetRole.is_active === false) {
        throw new AppError("Cannot assign an inactive role to a store team member.", 400);
      }
      roleId = targetRole.id;
    }

    let passwordHash: string | undefined;
    if (data.password) {
      authService.validatePasswordPolicy(data.password);
      passwordHash = await hashPassword(data.password);
    }

    const updated = await userRepository.update(memberId, {
      ...(data.name ? { name: data.name, displayName: data.name } : {}),
      ...(passwordHash ? { passwordHash } : {}),
      ...(roleId !== undefined ? { roleId } : {}),
      ...(data.status ? { status: data.status === "deactive" ? "suspended" : data.status } : {}),
      ...(data.allowedPermissions ? { allowedPermissions: data.allowedPermissions } : {}),
    });

    if (!updated) {
      throw new AppError("Team member not found.", 404);
    }

    if (passwordHash || (data.status && data.status !== "active")) {
      await revokeAllUserTokens(memberId);
    }

    const { password_hash, ...safeMember } = updated;
    return safeMember;
  }

  async deleteTeamMember(parentSellerId: string, memberId: string): Promise<void> {
    const member = await userRepository.findById(memberId);
    if (!member || member.parent_seller_id !== parentSellerId) {
      throw new AppError("Team member not found.", 404);
    }

    // Detach member from store team and suspend store access
    await userRepository.update(memberId, {
      parentSellerId: null,
      status: "suspended",
      isActive: false,
    });
    await revokeAllUserTokens(memberId);
  }
}

export const usersService = new UsersService();
