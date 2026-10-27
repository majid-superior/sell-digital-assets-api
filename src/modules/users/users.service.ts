import { userRepository, type UserEntity, type PaginationQuery, type PaginatedResult } from "../../database/repositories/user.repository.js";
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

  async getSellerTeam(parentSellerId: string): Promise<Array<Omit<UserEntity, "password_hash">>> {
    const members = await userRepository.findTeamMembers(parentSellerId);
    return members.map(({ password_hash, ...m }) => m);
  }

  async createTeamMember(
    parentSellerId: string,
    data: CreateTeamMemberInput,
  ): Promise<Omit<UserEntity, "password_hash">> {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      throw new AppError("An account with this email address already exists.", 409);
    }

    authService.validatePasswordPolicy(data.password);
    const passwordHash = await hashPassword(data.password);
    const roleUpper = data.role.toUpperCase();

    const created = await userRepository.create({
      name: data.name,
      displayName: data.name,
      email: data.email,
      passwordHash,
      role: roleUpper,
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

    let passwordHash: string | undefined;
    if (data.password) {
      authService.validatePasswordPolicy(data.password);
      passwordHash = await hashPassword(data.password);
    }

    const updated = await userRepository.update(memberId, {
      ...(data.name ? { name: data.name, displayName: data.name } : {}),
      ...(passwordHash ? { passwordHash } : {}),
      ...(data.role ? { roleId: resolveRoleId(data.role.toUpperCase()) } : {}),
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

    await userRepository.update(memberId, { status: "suspended", isActive: false });
    await revokeAllUserTokens(memberId);
  }
}

export const usersService = new UsersService();
