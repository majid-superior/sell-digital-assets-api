import { test, describe, after } from "node:test";
import assert from "node:assert/strict";
import { pool } from "../config/database.js";
import {
  verifyAdminPassword,
  createDocAccessToken,
  isDocAuthorized,
  DOC_COOKIE_NAME,
} from "../core/security/doc-auth.service.js";
import { renderDocAuthPage } from "../pages/doc-auth.page.js";

describe("Documentation Security & Admin Password Verification", () => {
  after(async () => {
    await pool.end().catch(() => {});
  });

  test("1. verifyAdminPassword verifies correct Admin password against live database", async () => {
    // Admin password seeded in the database is "P@ssw0rd"
    const isValid = await verifyAdminPassword("P@ssw0rd");
    assert.equal(isValid, true, "Admin password 'P@ssw0rd' must be verified as valid");
  });

  test("2. verifyAdminPassword rejects wrong passwords", async () => {
    const wrong1 = await verifyAdminPassword("wrongPassword123!");
    const wrong2 = await verifyAdminPassword("12345678");
    const empty = await verifyAdminPassword("");
    const whitespace = await verifyAdminPassword("   ");

    assert.equal(wrong1, false);
    assert.equal(wrong2, false);
    assert.equal(empty, false);
    assert.equal(whitespace, false);
  });

  test("3. createDocAccessToken produces a valid grant with doc_access scope", () => {
    const token = createDocAccessToken();
    assert.ok(typeof token === "string" && token.length > 20);

    const fakeReq = {
      cookies: {
        [DOC_COOKIE_NAME]: token,
      },
      headers: {},
    } as any;

    assert.equal(isDocAuthorized(fakeReq), true);
  });

  test("4. isDocAuthorized rejects unauthenticated requests", () => {
    const emptyReq = {
      cookies: {},
      headers: {},
    } as any;

    assert.equal(isDocAuthorized(emptyReq), false);

    const invalidCookieReq = {
      cookies: {
        [DOC_COOKIE_NAME]: "invalid.jwt.token",
      },
      headers: {},
    } as any;

    assert.equal(isDocAuthorized(invalidCookieReq), false);
  });

  test("5. renderDocAuthPage generates complete HTML challenge", () => {
    const html = renderDocAuthPage({ errorMessage: "Invalid password test" });

    assert.ok(html.includes("API Documentation Access"));
    assert.ok(html.includes("Administrator Authorization Required"));
    assert.ok(html.includes('action="/doc/auth"'));
    assert.ok(html.includes('type="password"'));
    assert.ok(html.includes("Invalid password test"));
  });
});

