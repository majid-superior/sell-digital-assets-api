import { userRepository, type UserEntity, type PaginationQuery, type PaginatedResult } from "../../database/repositories/user.repository.js";
import { AppError } from "../../core/errors/app-error.js";

import type { CreateUserInput, UpdateMeInput, UpdateUserInput } from "./users.schema.js";
import { hashPassword, comparePassword } from "../../core/security/password.js";

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

  async createUser(data: CreateUserInput): Promise<Omit<UserEntity, "password_hash">> {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      throw new AppError("A user with this email address already exists.", 409);
    }

    const passwordHash = await hashPassword(data.password);

    const user = await userRepository.create({
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role || "customer",
    });

    const { password_hash, ...safeUser } = user;
    return safeUser;
  }

  async updateMe(
    userId: string,
    data: UpdateMeInput,
  ): Promise<Omit<UserEntity, "password_hash">> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    let passwordHash: string | undefined;
    if (data.password) {
      if (data.currentPassword) {
        const hashToCompare = user.password_hash || "";
        const isValid = await comparePassword(data.currentPassword, hashToCompare);
        if (!isValid) {
          throw new AppError("Current password does not match", 400);
        }
      }
      passwordHash = await hashPassword(data.password);
    }

    const updated = await userRepository.update(userId, {
      name: data.name,
      passwordHash,
    });

    if (!updated) {
      throw new AppError("User not found", 404);
    }

    const { password_hash, ...safeUser } = updated;
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

    const normalizedStatus =
      data.status === "deactive" ? "suspended" : data.status;

    const updated = await userRepository.update(id, {
      name: data.name,
      status: normalizedStatus,
      role: data.role,
    });

    if (!updated) {
      throw new AppError("User not found", 404);
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
  }
}

export const usersService = new UsersService();
