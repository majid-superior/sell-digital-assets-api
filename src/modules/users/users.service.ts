import { userRepository, type UserEntity, type PaginationQuery, type PaginatedResult } from "../../database/repositories/user.repository.js";
import { AppError } from "../../core/errors/app-error.js";

import type { CreateUserInput } from "./users.schema.js";
import { hashPassword } from "../../core/security/password.js";

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

    let passwordHash: string | null = null;
    if (data.password) {
      passwordHash = await hashPassword(data.password);
    }

    const user = await userRepository.create({
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role || "customer",
    });

    const { password_hash, ...safeUser } = user;
    return safeUser;
  }
}

export const usersService = new UsersService();
