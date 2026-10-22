import { userRepository, type UserEntity, type PaginationQuery, type PaginatedResult } from "../../database/repositories/user.repository.js";
import { AppError } from "../../core/errors/app-error.js";
import { hashPassword } from "../../core/security/password.js";
import { revokeAllUserTokens } from "../../core/security/tokens.js";
import { authService } from "../auth/auth.service.js";
import type { UpdateUserInput } from "./users.schema.js";

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
  ): Promise<Omit<UserEntity, "password_hash">> {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError("User not found", 404);
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

  async deleteUser(id: string): Promise<void> {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    await userRepository.update(id, { status: "suspended" });
    await revokeAllUserTokens(id);
  }
}

export const usersService = new UsersService();
