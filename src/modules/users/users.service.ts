import {
  userRepository,
  type UserEntity,
  type RoleEntity,
  type PaginationQuery,
  type PaginatedResult,
} from "../../database/repositories/user.repository.js";
import { AppError } from "../../core/errors/app-error.js";
import { hashPassword } from "../../core/security/password.js";
import { revokeAllUserTokens } from "../../core/security/tokens.js";
import { authService } from "../auth/auth.service.js";
import type { UpdateUserInput, CreateTeamMemberInput, UpdateTeamMemberInput } from "./users.schema.js";
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

  async getStoreRoles(): Promise<RoleEntity[]> {
    return userRepository.findStoreRoles();
  }

  private async resolveValidStoreRole(roleOrId?: string | number): Promise<RoleEntity> {
    const roles = await userRepository.findStoreRoles();
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
    const targetRole = await this.resolveValidStoreRole(data.roleId ?? data.role);
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
      const targetRole = await this.resolveValidStoreRole(data.roleId ?? data.role);
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
