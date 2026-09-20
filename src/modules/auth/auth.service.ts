import { userRepository } from "../../database/repositories/user.repository.js";
import { hashPassword, comparePassword } from "../../core/security/password.js";
import { generateTokens, verifyRefreshToken, type AuthUserPayload } from "../../core/security/tokens.js";
import { AppError } from "../../core/errors/app-error.js";
import type { RegisterUserInput, LoginUserInput } from "./auth.schema.js";

// Pre-computed dummy hash to mitigate user enumeration via timing attack
const DUMMY_HASH = "$2a$12$K8aUoQZJj4Ptw4q69E/f0u86P4FvL.8Qy/nZgK8Zl3wzMkm1w2KWW";

export class AuthService {
  async register(input: RegisterUserInput) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new AppError("An account with this email address already exists.", 409);
    }

    const passwordHash = await hashPassword(input.password);
    const user = await userRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: "user",
    });

    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      tokens,
    };
  }

  async login(input: LoginUserInput) {
    const user = await userRepository.findByEmail(input.email);
    const hashToCompare = user?.password_hash || DUMMY_HASH;
    const isValid = await comparePassword(input.password, hashToCompare);

    if (!user || !user.password_hash || !isValid) {
      throw new AppError("Invalid email or password", 401);
    }

    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      tokens,
    };
  }

  async refresh(refreshToken: string) {
    const decoded: AuthUserPayload = verifyRefreshToken(refreshToken);

    // Verify user still exists in the database
    const user = await userRepository.findById(decoded.id);
    if (!user) {
      throw new AppError("Account associated with this token no longer exists or was deactivated", 401);
    }

    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return { tokens };
  }
}

export const authService = new AuthService();
