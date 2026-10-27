import { test, describe } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { pool } from "../config/database.js";
import { env } from "../config/env.js";
import { AppError } from "../core/errors/app-error.js";
import {
  extractAuthToken,
  authenticate,
} from "../core/middleware/auth.middleware.js";
import {
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  revokeAccessToken,
  revokeRefreshToken,
  isTokenRevokedAsync,
} from "../core/security/tokens.js";
import { authService } from "../modules/auth/auth.service.js";

describe("Token Extraction & Authorization Header Parsing", () => {
  test("returns undefined when no authorization header or cookie is provided", () => {
    const req = { headers: {}, cookies: {} } as any;
    const token = extractAuthToken(req);
    assert.equal(token, undefined);
  });

  test("extracts token from standard 'Bearer <token>' header", () => {
    const req = {
      headers: { authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.token" },
      cookies: {},
    } as any;
    const token = extractAuthToken(req);
    assert.equal(token, "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.token");
  });

  test("extracts token from lowercase 'bearer <token>' header", () => {
    const req = {
      headers: { authorization: "bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.token" },
      cookies: {},
    } as any;
    const token = extractAuthToken(req);
    assert.equal(token, "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.token");
  });

  test("extracts token with irregular whitespace ('Bearer    <token>')", () => {
    const req = {
      headers: { authorization: "Bearer    eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.token  " },
      cookies: {},
    } as any;
    const token = extractAuthToken(req);
    assert.equal(token, "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.token");
  });

  test("extracts token from accessToken cookie when no authorization header is present", () => {
    const req = {
      headers: {},
      cookies: { accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.cookie_token" },
    } as any;
    const token = extractAuthToken(req);
    assert.equal(token, "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.cookie_token");
  });

  test("prefers Authorization header over cookie when both are present", () => {
    const req = {
      headers: { authorization: "Bearer header_token" },
      cookies: { accessToken: "cookie_token" },
    } as any;
    const token = extractAuthToken(req);
    assert.equal(token, "header_token");
  });
});

describe("Authentication Middleware & Expiration Protection", () => {
  test("strictly rejects unauthenticated request with 401 Unauthorized", async () => {
    const req = { headers: {}, cookies: {} } as any;
    const res = {} as any;
    let receivedError: any = null;

    await authenticate(req, res, (err) => {
      receivedError = err;
    });

    assert.ok(receivedError instanceof AppError);
    assert.equal(receivedError.statusCode, 401);
    assert.match(receivedError.message, /Authentication required/i);
  });

  test("strictly rejects invalid or malformed token with 401", async () => {
    const req = {
      headers: { authorization: "Bearer invalid.malformed.token" },
      cookies: {},
    } as any;
    const res = {} as any;
    let receivedError: any = null;

    await authenticate(req, res, (err) => {
      receivedError = err;
    });

    assert.ok(receivedError instanceof AppError);
    assert.equal(receivedError.statusCode, 401);
    assert.match(receivedError.message, /Invalid authentication token/i);
  });

  test("strictly rejects expired access token with 401 and refresh prompt", async () => {
    const expiredToken = jwt.sign(
      {
        id: "824c9703-7a68-49ae-91a2-2f483bf6a8f7",
        email: "seller@platform.internal",
        role: "seller",
        jti: "test-expired-jti",
      },
      env.JWT_SECRET,
      { expiresIn: "0s", algorithm: "HS256" },
    );

    await new Promise((resolve) => setTimeout(resolve, 50));

    const req = {
      headers: { authorization: `Bearer ${expiredToken}` },
      cookies: {},
    } as any;
    const res = {} as any;
    let receivedError: any = null;

    await authenticate(req, res, (err) => {
      receivedError = err;
    });

    assert.ok(receivedError instanceof AppError);
    assert.equal(receivedError.statusCode, 401);
    assert.match(receivedError.message, /Access token expired/i);
  });

  test("strictly rejects revoked access token with 401", async () => {
    const { accessToken } = generateTokens({
      id: "824c9703-7a68-49ae-91a2-2f483bf6a8f7",
      email: "seller@platform.internal",
      role: "seller",
    });

    revokeAccessToken(accessToken);

    const req = {
      headers: { authorization: `Bearer ${accessToken}` },
      cookies: {},
    } as any;
    const res = {} as any;
    let receivedError: any = null;

    await authenticate(req, res, (err) => {
      receivedError = err;
    });

    assert.ok(receivedError instanceof AppError);
    assert.equal(receivedError.statusCode, 401);
    assert.match(receivedError.message, /session has ended or been revoked|revoked/i);
  });
});

describe("Token Lifecycle, Lifetimes & Rotation", () => {
  test("generates short-lived access token (15m) and long-lived refresh token (7d default, 30d rememberMe)", () => {
    const standard = generateTokens({
      id: "usr-1",
      email: "seller@test.internal",
      role: "seller",
    });

    assert.equal(standard.expiresIn, "15m");
    const standardDecoded = jwt.decode(standard.refreshToken) as any;
    assert.ok(standardDecoded.exp);
    const standardDurationDays = Math.round((standardDecoded.exp - standardDecoded.iat) / (24 * 3600));
    assert.equal(standardDurationDays, 7);

    const rememberMe = generateTokens(
      {
        id: "usr-1",
        email: "seller@test.internal",
        role: "seller",
      },
      { rememberMe: true, refreshTokenTtlDays: 30 },
    );

    const rememberDecoded = jwt.decode(rememberMe.refreshToken) as any;
    const rememberDurationDays = Math.round((rememberDecoded.exp - rememberDecoded.iat) / (24 * 3600));
    assert.equal(rememberDurationDays, 30);
  });

  test("revokes refresh token and access token on signOut to prevent token reuse", async () => {
    const { accessToken, refreshToken } = generateTokens({
      id: "usr-signout-test",
      email: "user@test.internal",
      role: "seller",
    });

    const refreshDecoded = jwt.decode(refreshToken) as any;
    const accessDecoded = jwt.decode(accessToken) as any;

    await authService.signOut(refreshToken, accessToken);

    const isRefreshRevoked = await isTokenRevokedAsync(refreshDecoded.jti);
    const isAccessRevoked = await isTokenRevokedAsync(accessDecoded.jti);

    assert.equal(isRefreshRevoked, true);
    assert.equal(isAccessRevoked, true);
  });
});
