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
      role: "customer",
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
        status: user.status,
      },
      tokens,
    };
  }

  async login(input: LoginUserInput) {
    const user = await userRepository.findByEmail(input.email);

    // 1. Check account lockout BEFORE evaluating credentials
    if (user?.locked_until && new Date(user.locked_until) > new Date()) {
      throw new AppError(
        "Your account is temporarily locked due to multiple failed login attempts. Please try again later.",
        403,
      );
    }

    // 2. Timing-safe password verification
    const hashToCompare = user?.password_hash || DUMMY_HASH;
    const isValid = await comparePassword(input.password, hashToCompare);

    if (!user || !user.password_hash || !isValid) {
      if (user) {
        await userRepository.recordFailedLogin(user.id);
      }
      throw new AppError("Invalid email or password", 401);
    }

    // 3. Account status checks
    if (user.status !== "active") {
      throw new AppError(`Your account is currently ${user.status}. Please contact support.`, 403);
    }

    // 4. Record successful login and reset failure counter
    await userRepository.updateLastLogin(user.id);

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
        status: user.status,
      },
      tokens,
    };
  }

  async refresh(refreshToken: string) {
    const decoded: AuthUserPayload = verifyRefreshToken(refreshToken);

    // Verify user still exists in the database
    const user = await userRepository.findById(decoded.id);
    if (!user) {
      throw new AppError("Account associated with this token no longer exists", 401);
    }

    if (user.status !== "active") {
      throw new AppError(`Account is currently ${user.status}`, 403);
    }

    const tokens = generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return { tokens };
  }

  async logout(_refreshToken?: string): Promise<void> {
    // Stateless token invalidation handled via cookie clearance in controller
  }
}

export const authService = new AuthService();
