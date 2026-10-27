import { userRepository } from "../../database/repositories/user.repository.js";
import { hashPassword, comparePassword } from "../../core/security/password.js";
import {
  generateTokens,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAccessToken,
  revokeAllUserTokens,
  isTokenRevokedAsync,
  type AuthUserPayload,
} from "../../core/security/tokens.js";
import { invalidateAuthUserCache } from "../../core/middleware/auth.middleware.js";
import { getSystemSettings } from "../../data/organizations.js";
import { AppError } from "../../core/errors/app-error.js";
import type { RegisterUserInput, SignInUserInput, UpdateMeInput } from "./auth.schema.js";

// Pre-computed dummy hash to mitigate user enumeration via timing attack
const DUMMY_HASH = "$2a$12$K8aUoQZJj4Ptw4q69E/f0u86P4FvL.8Qy/nZgK8Zl3wzMkm1w2KWW";

export class AuthService {
  public validatePasswordPolicy(password: string): void {
    const settings = getSystemSettings();
    const minLength = Math.max(4, settings.passwordMinLength || 8);

    if (password.length < minLength) {
      throw new AppError(`Password must be at least ${minLength} characters long.`, 400);
    }

    if (settings.requireSpecialChar && !/[^a-zA-Z0-9\s]/.test(password)) {
      throw new AppError("Password must contain at least one special character.", 400);
    }
  }

  async register(input: RegisterUserInput) {
    const settings = getSystemSettings();
    if (settings.maintenanceMode) {
      throw new AppError(
        "Platform is currently under maintenance. User registration is temporarily unavailable. Please try again later.",
        503,
      );
    }

    if (!settings.allowUserRegistration) {
      throw new AppError("User registration is currently disabled.", 403);
    }

    this.validatePasswordPolicy(input.password);

    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new AppError("An account with this email address already exists.", 409);
    }

    const rawRole = (input.role || "BUYER").trim().toUpperCase();
    if (rawRole !== "BUYER" && rawRole !== "SELLER") {
      throw new AppError(
        "Public registration is strictly restricted to BUYER or SELLER accounts. Insufficient permissions to register with this role.",
        403,
      );
    }

    const name = input.name.trim();
    const role = rawRole;

    const passwordHash = await hashPassword(input.password);
    const user = await userRepository.create({
      name,
      displayName: name,
      email: input.email,
      passwordHash,
      role,
      emailVerifiedAt: settings.requireEmailVerification ? null : new Date(),
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

  async signIn(input: SignInUserInput) {
    const settings = getSystemSettings();
    const user = await userRepository.findByEmail(input.email);

    // 1. Check account lockout BEFORE evaluating credentials
    if (user?.locked_until && new Date(user.locked_until) > new Date()) {
      throw new AppError(
        "Your account is temporarily locked due to multiple failed sign-in attempts. Please try again later.",
        403,
      );
    }

    // 2. Timing-safe password verification
    const hashToCompare = user?.password_hash || DUMMY_HASH;
    const isValid = await comparePassword(input.password, hashToCompare);

    if (!user || !user.password_hash || !isValid) {
      if (user) {
        await userRepository.recordFailedSignIn(
          user.id,
          settings.maxLoginAttempts || 5,
          settings.lockoutDurationMinutes || 15,
        );
      }
      throw new AppError("Invalid email or password", 401);
    }

    // 3. Maintenance mode check (only admins allowed during maintenance)
    if (settings.maintenanceMode && user.role !== "admin") {
      throw new AppError(
        "Platform is currently under maintenance. Please try again later.",
        503,
      );
    }

    // 4. Account status & email verification checks
    if (user.status !== "active") {
      throw new AppError(`Your account is currently ${user.status}. Please contact support.`, 403);
    }

    if (settings.requireEmailVerification && !user.email_verified_at && user.role !== "admin") {
      throw new AppError(
        "Email verification is required before signing in. Please verify your email address or contact support.",
        403,
      );
    }

    // 5. Record successful sign-in and reset failure counter
    await userRepository.updateLastSignIn(user.id);

    const customSettings = input.rememberMe
      ? { refreshTokenTtlDays: settings.rememberMeTtlDays || 30, rememberMe: true }
      : { rememberMe: false };

    const tokens = generateTokens(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      customSettings,
    );

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

    if (await isTokenRevokedAsync(decoded.jti, decoded.id, decoded.iat, decoded.iatMs)) {
      throw new AppError("Refresh token has been revoked. Please sign in again.", 401);
    }

    // Verify user still exists in the database
    const user = await userRepository.findById(decoded.id);
    if (!user) {
      throw new AppError("Account associated with this token no longer exists", 401);
    }

    if (user.status !== "active") {
      throw new AppError(`Account is currently ${user.status}`, 403);
    }

    const settings = getSystemSettings();
    if (settings.maintenanceMode && user.role !== "admin") {
      throw new AppError("Platform is currently under maintenance. Please try again later.", 503);
    }

    if (settings.requireEmailVerification && !user.email_verified_at && user.role !== "admin") {
      throw new AppError(
        "Email verification is required before signing in. Please verify your email address or contact support.",
        403,
      );
    }

    // Rotate refresh token: revoke the consumed token's jti so it cannot be replayed
    if (decoded.jti) {
      const expMs = decoded.exp ? decoded.exp * 1000 : undefined;
      revokeRefreshToken(decoded.jti, expMs, user.id);
    }

    // Preserve rememberMe TTL across token rotation
    const customSettings = decoded.rememberMe
      ? { refreshTokenTtlDays: settings.rememberMeTtlDays || 30, rememberMe: true }
      : { rememberMe: false };

    const tokens = generateTokens(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      customSettings,
    );

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

  async signOut(refreshToken?: string, accessToken?: string): Promise<void> {
    let userId: string | undefined;
    if (refreshToken) {
      userId = revokeRefreshToken(refreshToken);
    }
    if (accessToken) {
      const accessUserId = revokeAccessToken(accessToken, undefined, userId);
      userId = userId || accessUserId;
    }
    if (userId) {
      invalidateAuthUserCache(userId);
    }
  }

  async getMe(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    const { password_hash, ...safeUser } = user;
    return safeUser;
  }

  async updateMe(userId: string, data: UpdateMeInput) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    let passwordHash: string | undefined;
    if (data.password) {
      if (!data.currentPassword) {
        throw new AppError("Current password is required to set a new password", 400);
      }
      this.validatePasswordPolicy(data.password);
      const hashToCompare = user.password_hash || "";
      const isValid = await comparePassword(data.currentPassword, hashToCompare);
      if (!isValid) {
        throw new AppError("Current password does not match", 400);
      }
      passwordHash = await hashPassword(data.password);
    }

    const updated = await userRepository.update(userId, {
      name: data.name,
      passwordHash,
    });

    if (!updated) {
      throw new AppError("Failed to update user profile", 500);
    }

    if (data.password) {
      await revokeAllUserTokens(userId);
    }
    invalidateAuthUserCache(userId);

    const { password_hash, ...safeUser } = updated;
    return safeUser;
  }

  async becomeSeller(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (user.role === "admin") {
      throw new AppError(
        "Administrator accounts already hold full platform permissions and cannot be converted to a seller account.",
        400,
      );
    }

    const isRoleUpgrade = user.role !== "seller";
    const updated = !isRoleUpgrade
      ? user
      : await userRepository.update(userId, {
          role: "seller",
        });

    if (isRoleUpgrade) {
      await revokeAllUserTokens(userId);
    }
    invalidateAuthUserCache(userId);

    const targetUser = updated || user;
    const { password_hash, ...safeUser } = targetUser;
    const tokens = generateTokens({
      id: targetUser.id,
      email: targetUser.email,
      role: targetUser.role,
    });

    return {
      user: safeUser,
      tokens,
    };
  }
}

export const authService = new AuthService();
