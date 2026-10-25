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
  revokeAccessToken,
} from "../core/security/tokens.js";

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

describe("Authentication Middleware (/api/v1/auth/me protection)", () => {
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
        email: "majid@ovi.com",
        role: "seller",
        jti: "test-expired-jti",
      },
      env.JWT_SECRET,
      { expiresIn: "0s", algorithm: "HS256" },
    );

    // Give it a moment to ensure it is expired
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

  test("strictly rejects revoked token with 401", async () => {
    const { accessToken, jti } = generateTokens({
      id: "824c9703-7a68-49ae-91a2-2f483bf6a8f7",
      email: "majid@ovi.com",
      role: "seller",
    });

    // Revoke the token
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

  test("accepts valid token, resolves user and attaches req.user", async () => {
    const userRes = await pool.query(
      `SELECT u.id, u.email, r.slug as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.status = 'active' LIMIT 1;`
    );
    assert.ok(userRes.rows.length > 0, "At least one active user must exist for testing");
    const activeUser = userRes.rows[0];

    const { accessToken } = generateTokens({
      id: activeUser.id,
      email: activeUser.email,
      role: activeUser.role,
    });

    const req = {
      headers: { authorization: `Bearer ${accessToken}` },
      cookies: {},
    } as any;
    const res = {} as any;
    let nextCalled = false;
    let receivedError: any = null;

    await authenticate(req, res, (err) => {
      nextCalled = true;
      receivedError = err;
    });

    assert.equal(nextCalled, true);
    assert.equal(receivedError, undefined);
    assert.ok(req.user);
    assert.equal(req.user.id, activeUser.id);
    assert.equal(req.user.email, activeUser.email);
  });
});

