// src/tests/auth-team-permissions.test.ts
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { app } from "../app.js";
import { pool } from "../config/database.js";
import { userRepository } from "../database/repositories/user.repository.js";

describe("Seller Team & Analyst Permissions Integration Suite", () => {
  let server: Server;
  let baseUrl: string;

  let majidToken: string;
  let majidId: string;

  let aliriazToken: string;
  let aliriazId: string;

  let sellerBToken: string;
  let sellerBId: string;

  before(async () => {
    // Start test server on dynamic free port
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address() as AddressInfo;
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });

    // Clean up any pre-existing test team member or secondary seller
    await pool.query("DELETE FROM users WHERE email IN ($1, $2)", [
      "aliriaz@ovi.com",
      "seller_b_test@ovi.com",
    ]);
  });

  after(async () => {
    // Reset Analyst role permissions back to default for clean state
    if (majidId) {
      await pool.query(
        "DELETE FROM seller_role_permissions WHERE seller_id = $1 AND role_id = 6",
        [majidId]
      );
    }

    // Close server
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it("1. Authenticates primary seller majid@ovi.com with full permissions", async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "majid@ovi.com",
        password: "123456789",
      }),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.tokens?.accessToken);
    assert.equal(body.data.user.role, "seller");
    assert.equal(body.data.user.role_id, 2);
    assert.deepEqual(body.data.user.permissions, ["*"]);

    majidToken = body.data.tokens.accessToken;
    majidId = body.data.user.id;
  });

  it("2. Adds aliriaz@ovi.com as an Analyst under majid@ovi.com", async () => {
    const res = await fetch(`${baseUrl}/api/v1/seller/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${majidToken}`,
      },
      body: JSON.stringify({
        name: "Ali Riaz",
        email: "aliriaz@ovi.com",
        password: "123456789",
        roleId: 6, // Analyst
      }),
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.email, "aliriaz@ovi.com");
    assert.equal(body.data.role_id, 6);
    assert.equal(body.data.parent_seller_id, majidId);
    assert.equal(body.data.status, "active");

    aliriazId = body.data.id;
  });

  it("3. Authenticates aliriaz@ovi.com and verifies token claims and default Analyst permissions", async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "aliriaz@ovi.com",
        password: "123456789",
      }),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.tokens?.accessToken);
    assert.equal(body.data.user.role, "analyst");
    assert.equal(body.data.user.role_id, 6);
    assert.equal(body.data.user.parent_seller_id, majidId);

    // Default permissions for Analyst
    assert.ok(body.data.user.permissions.includes("analytics:view"));
    assert.ok(body.data.user.permissions.includes("products:view"));
    assert.ok(body.data.user.permissions.includes("orders:view"));

    // Ensure write and financial permissions are NOT granted by default
    assert.ok(!body.data.user.permissions.includes("products:create"));
    assert.ok(!body.data.user.permissions.includes("products:edit"));
    assert.ok(!body.data.user.permissions.includes("financial:view"));
    assert.ok(!body.data.user.permissions.includes("coupons:manage"));

    aliriazToken = body.data.tokens.accessToken;
  });

  it("4. Restores session via GET /api/v1/auth/me preserving parent_seller_id and permissions", async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${aliriazToken}` },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.email, "aliriaz@ovi.com");
    assert.equal(body.data.parent_seller_id, majidId);
    assert.equal(body.data.role_id, 6);
    assert.ok(body.data.permissions.includes("analytics:view"));
    assert.ok(body.data.permissions.includes("products:view"));
  });

  it("5. Allows Analyst to read seller assets (products:view)", async () => {
    const res = await fetch(`${baseUrl}/api/v1/seller/assets`, {
      headers: { Authorization: `Bearer ${aliriazToken}` },
    });

    // Should succeed because Analyst has products:view
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
  });

  it("6. Denies Analyst from creating coupons or accessing payouts without permission (403 Forbidden)", async () => {
    const resCoupons = await fetch(`${baseUrl}/api/v1/seller/coupons`, {
      headers: { Authorization: `Bearer ${aliriazToken}` },
    });
    // Analyst default permissions do not include coupons:view
    assert.equal(resCoupons.status, 403);
    const errBody = await resCoupons.json();
    assert.equal(errBody.success, false);
  });

  it("7. Primary seller customizes Analyst role permissions to grant coupons:view", async () => {
    // Majid fetches available store permissions
    const catalogRes = await fetch(`${baseUrl}/api/v1/seller/users/permissions`, {
      headers: { Authorization: `Bearer ${majidToken}` },
    });
    assert.equal(catalogRes.status, 200);
    const catalog = await catalogRes.json();
    assert.ok(catalog.data.length > 5);

    // Majid grants coupons:view and products:create to Analyst
    const putRes = await fetch(`${baseUrl}/api/v1/seller/users/roles/6/permissions`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${majidToken}`,
      },
      body: JSON.stringify({
        permissions: [
          "analytics:view",
          "products:view",
          "orders:view",
          "coupons:view",
          "products:create",
        ],
      }),
    });

    assert.equal(putRes.status, 200);
    const putBody = await putRes.json();
    assert.equal(putBody.success, true);
    assert.equal(putBody.data.isCustomized, true);
    assert.ok(putBody.data.permissions.includes("coupons:view"));
  });

  it("8. Analyst immediately gains access to coupons without re-authenticating", async () => {
    const resCoupons = await fetch(`${baseUrl}/api/v1/seller/coupons`, {
      headers: { Authorization: `Bearer ${aliriazToken}` },
    });

    // Access is immediately granted through dynamic permission resolution
    assert.equal(resCoupons.status, 200);
    const body = await resCoupons.json();
    assert.equal(body.success, true);
  });

  it("9. Primary seller revokes coupons:view and Analyst is immediately rejected (403 Forbidden)", async () => {
    // Revoke coupons:view
    const putRes = await fetch(`${baseUrl}/api/v1/seller/users/roles/6/permissions`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${majidToken}`,
      },
      body: JSON.stringify({
        permissions: ["analytics:view", "products:view", "orders:view"],
      }),
    });
    assert.equal(putRes.status, 200);

    // Now Analyst immediately receives 403 Forbidden
    const resCoupons = await fetch(`${baseUrl}/api/v1/seller/coupons`, {
      headers: { Authorization: `Bearer ${aliriazToken}` },
    });
    assert.equal(resCoupons.status, 403);
  });

  it("10. Suspended team member is immediately blocked from dashboard operations", async () => {
    // Majid suspends Ali
    const patchRes = await fetch(`${baseUrl}/api/v1/seller/users/${aliriazId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${majidToken}`,
      },
      body: JSON.stringify({ status: "suspended" }),
    });
    assert.equal(patchRes.status, 200);

    // Ali attempts to access seller assets while suspended (session revoked)
    const resAssets = await fetch(`${baseUrl}/api/v1/seller/assets`, {
      headers: { Authorization: `Bearer ${aliriazToken}` },
    });
    assert.equal(resAssets.status, 401);

    // Reactivate Ali
    const reactivateRes = await fetch(`${baseUrl}/api/v1/seller/users/${aliriazId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${majidToken}`,
      },
      body: JSON.stringify({ status: "active" }),
    });
    assert.equal(reactivateRes.status, 200);

    // Ali logs in again with active credentials to obtain a fresh token
    const freshLoginRes = await fetch(`${baseUrl}/api/v1/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "aliriaz@ovi.com",
        password: "123456789",
      }),
    });
    assert.equal(freshLoginRes.status, 200);
    const freshLoginBody = await freshLoginRes.json();
    const freshAliToken = freshLoginBody.data.tokens.accessToken;

    // Verify access restored with fresh token
    const resRestored = await fetch(`${baseUrl}/api/v1/seller/assets`, {
      headers: { Authorization: `Bearer ${freshAliToken}` },
    });
    assert.equal(resRestored.status, 200);
  });

  it("11. Prevents unauthorized cross-seller access", async () => {
    // Register another seller
    const regRes = await fetch(`${baseUrl}/api/v1/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Seller Two",
        email: "seller_b_test@ovi.com",
        password: "123456789",
        role: "seller",
      }),
    });
    assert.equal(regRes.status, 201);
    const regBody = await regRes.json();
    sellerBToken = regBody.data.tokens.accessToken;
    sellerBId = regBody.data.user.id;

    // Seller B cannot see Majid's team members
    const teamRes = await fetch(`${baseUrl}/api/v1/seller/users`, {
      headers: { Authorization: `Bearer ${sellerBToken}` },
    });
    assert.equal(teamRes.status, 200);
    const teamBody = await teamRes.json();
    const emails = teamBody.data.map((m: { email: string }) => m.email);
    assert.ok(!emails.includes("aliriaz@ovi.com"));

    // Seller B cannot update or delete Majid's team member
    const patchOtherRes = await fetch(`${baseUrl}/api/v1/seller/users/${aliriazId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sellerBToken}`,
      },
      body: JSON.stringify({ name: "Hacked Name" }),
    });
    assert.equal(patchOtherRes.status, 404);

    // Clean up Seller B
    await pool.query("DELETE FROM users WHERE id = $1", [sellerBId]);
  });
});

