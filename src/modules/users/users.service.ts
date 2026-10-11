import { userRepository, type UserEntity, type PaginationQuery, type PaginatedResult } from "../../database/repositories/user.repository.js";
import { AppError } from "../../core/errors/app-error.js";
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

    const normalizedStatus =
      data.status === "deactive" ? "suspended" : data.status;

    const updated = await userRepository.update(id, {
      status: normalizedStatus,
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
