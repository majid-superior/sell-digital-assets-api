import test from "node:test";
import assert from "node:assert/strict";
import { organizationsService } from "../modules/organizations/organizations.service.js";
import { generateTokens } from "../core/security/tokens.js";
import { pool } from "../config/database.js";

test("System Settings & Dynamic Session/Token Configuration", async (t) => {
  const originalSettings = await organizationsService.getSystemSettings();

  await t.test("1. System settings default values are loaded and well-structured", async () => {
    assert.ok(originalSettings);
    assert.ok(typeof originalSettings.sessionIdleTimeoutMinutes === "number");
    assert.ok(typeof originalSettings.accessTokenTtlMinutes === "number");
    assert.ok(typeof originalSettings.refreshTokenTtlDays === "number");
  });

  await t.test("2. Admin updates system settings in PostgreSQL and in-memory cache reflects instantly", async () => {
    const updated = (await organizationsService.updateSystemSettings({
      sessionIdleTimeoutMinutes: 45,
      accessTokenTtlMinutes: 20,
      refreshTokenTtlDays: 14,
      rememberMeTtlDays: 60,
    })) as Record<string, any>;

    assert.equal(updated.sessionIdleTimeoutMinutes, 45);
    assert.equal(updated.accessTokenTtlMinutes, 20);
    assert.equal(updated.refreshTokenTtlDays, 14);
    assert.equal(updated.rememberMeTtlDays, 60);

    // Verify in-memory retrieval is updated
    const fresh = await organizationsService.getSystemSettings();
    assert.equal(fresh.sessionIdleTimeoutMinutes, 45);
    assert.equal(fresh.accessTokenTtlMinutes, 20);
    assert.equal(fresh.refreshTokenTtlDays, 14);
  });

  await t.test("3. generateTokens dynamically adopts new TTL parameters", async () => {
    const tokens = generateTokens({
      id: "test-user-id",
      email: "test@example.com",
      role: "admin",
    });

    assert.equal(tokens.expiresIn, "20m");
    const diffDays = Math.round(
      (tokens.refreshExpiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
    );
    assert.equal(diffDays, 14);
  });

  await t.test("4. Clean up: restore original system settings", async () => {
    await organizationsService.updateSystemSettings(originalSettings);
    const restored = await organizationsService.getSystemSettings();
    assert.equal(restored.sessionIdleTimeoutMinutes, originalSettings.sessionIdleTimeoutMinutes);
    assert.equal(restored.accessTokenTtlMinutes, originalSettings.accessTokenTtlMinutes);
  });
});

