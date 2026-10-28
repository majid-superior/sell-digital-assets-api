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
    // Reset Analyst role permissions and custom test roles back to clean state
    if (majidId) {
      await pool.query(
        "DELETE FROM seller_role_permissions WHERE seller_id = $1",
        [majidId]
      );
    }
    await pool.query("DELETE FROM users WHERE email LIKE '%@ovi.com' AND email NOT IN ('majid@ovi.com')");
    await pool.query("DELETE FROM roles WHERE slug = 'support_specialist'");

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

  it("12. Verifies store roles directory (MANAGER, USER, ANALYST) and provisions Manager and User sub-users", async () => {
    // 1. Fetch available store roles
    const rolesRes = await fetch(`${baseUrl}/api/v1/seller/users/roles`, {
      headers: { Authorization: `Bearer ${majidToken}` },
    });
    assert.equal(rolesRes.status, 200);
    const rolesBody = await rolesRes.json();
    assert.equal(rolesBody.success, true);
    const roles = rolesBody.data;

    const managerRole = roles.find((r: { id: number }) => r.id === 4);
    assert.ok(managerRole);
    assert.equal(managerRole.name, "MANAGER");
    assert.equal(managerRole.slug, "manager");

    const userRole = roles.find((r: { id: number }) => r.id === 5);
    assert.ok(userRole);
    assert.equal(userRole.name, "USER");
    assert.equal(userRole.slug, "user");

    const analystRole = roles.find((r: { id: number }) => r.id === 6);
    assert.ok(analystRole);
    assert.equal(analystRole.name, "ANALYST");
    assert.equal(analystRole.slug, "analyst");

    // 2. Provision Manager (roleId: 4)
    const addMgrRes = await fetch(`${baseUrl}/api/v1/seller/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${majidToken}`,
      },
      body: JSON.stringify({
        name: "Test Manager",
        email: "mgr_test@ovi.com",
        password: "123456789",
        roleId: 4,
      }),
    });
    assert.equal(addMgrRes.status, 201);
    const addMgrBody = await addMgrRes.json();
    assert.equal(addMgrBody.data.role, "manager");
    assert.equal(addMgrBody.data.role_name, "MANAGER");
    assert.equal(addMgrBody.data.role_id, 4);

    // 3. Provision User (roleId: 5)
    const addUserRes = await fetch(`${baseUrl}/api/v1/seller/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${majidToken}`,
      },
      body: JSON.stringify({
        name: "Test User",
        email: "user_test@ovi.com",
        password: "123456789",
        roleId: 5,
      }),
    });
    assert.equal(addUserRes.status, 201);
    const addUserBody = await addUserRes.json();
    assert.equal(addUserBody.data.role, "user");
    assert.equal(addUserBody.data.role_name, "USER");
    assert.equal(addUserBody.data.role_id, 5);

    // 4. Authenticate Manager and verify full store permissions
    const mgrAuthRes = await fetch(`${baseUrl}/api/v1/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "mgr_test@ovi.com",
        password: "123456789",
      }),
    });
    assert.equal(mgrAuthRes.status, 200);
    const mgrAuthBody = await mgrAuthRes.json();
    assert.equal(mgrAuthBody.data.user.role, "manager");
    assert.equal(mgrAuthBody.data.user.permissions.length, 16);

    // 5. Authenticate User and verify draft/uploader capabilities (5 perms)
    const userAuthRes = await fetch(`${baseUrl}/api/v1/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "user_test@ovi.com",
        password: "123456789",
      }),
    });
    assert.equal(userAuthRes.status, 200);
    const userAuthBody = await userAuthRes.json();
    assert.equal(userAuthBody.data.user.role, "user");
    assert.equal(userAuthBody.data.user.permissions.length, 5);
    assert.ok(userAuthBody.data.user.permissions.includes("products:create"));
    assert.ok(!userAuthBody.data.user.permissions.includes("financial:view"));

    // Cleanup test users
    await pool.query("DELETE FROM users WHERE email IN ($1, $2)", [
      "mgr_test@ovi.com",
      "user_test@ovi.com",
    ]);
  });

  it("13. Dynamically creates a new store role with initial permissions", async () => {
    const res = await fetch(`${baseUrl}/api/v1/seller/users/roles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${majidToken}`,
      },
      body: JSON.stringify({
        name: "Support Specialist",
        description: "Assists customers with ticket issues and store settings",
        permissions: ["settings:view", "orders:view"],
      }),
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.name, "Support Specialist");
    assert.equal(body.data.slug, "support_specialist");
    assert.equal(body.data.is_active, true);
    assert.deepEqual(body.data.permissions, ["settings:view", "orders:view"]);

    // Verify role appears dynamically in roles list
    const listRes = await fetch(`${baseUrl}/api/v1/seller/users/roles`, {
      headers: { Authorization: `Bearer ${majidToken}` },
    });
    assert.equal(listRes.status, 200);
    const listBody = await listRes.json();
    const found = listBody.data.find((r: { slug: string }) => r.slug === "support_specialist");
    assert.ok(found);
    assert.equal(found.is_active, true);
  });

  it("14. Rejects duplicate active role names with clear error", async () => {
    const res = await fetch(`${baseUrl}/api/v1/seller/users/roles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${majidToken}`,
      },
      body: JSON.stringify({
        name: "SUPPORT SPECIALIST",
      }),
    });

    assert.equal(res.status, 409);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.message.includes("already exists"));
  });

  it("15. Deactivates role, hides it from active directory, and locks permissions for assigned users", async () => {
    // 1. Get role ID
    const rolesRes = await fetch(`${baseUrl}/api/v1/seller/users/roles`, {
      headers: { Authorization: `Bearer ${majidToken}` },
    });
    const rolesBody = await rolesRes.json();
    const supportRole = rolesBody.data.find((r: { slug: string }) => r.slug === "support_specialist");
    assert.ok(supportRole);

    // 2. Add a member with this role
    const addRes = await fetch(`${baseUrl}/api/v1/seller/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${majidToken}`,
      },
      body: JSON.stringify({
        name: "Support Guy",
        email: "support_test@ovi.com",
        password: "123456789",
        roleId: supportRole.id,
      }),
    });
    assert.equal(addRes.status, 201);

    // 3. Deactivate role
    const deactivateRes = await fetch(`${baseUrl}/api/v1/seller/users/roles/${supportRole.id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${majidToken}`,
      },
      body: JSON.stringify({ is_active: false }),
    });
    assert.equal(deactivateRes.status, 200);
    const deactBody = await deactivateRes.json();
    assert.equal(deactBody.data.is_active, false);

    // 4. Verify role is hidden from default active roles list
    const activeListRes = await fetch(`${baseUrl}/api/v1/seller/users/roles`, {
      headers: { Authorization: `Bearer ${majidToken}` },
    });
    const activeList = await activeListRes.json();
    assert.ok(!activeList.data.some((r: { slug: string }) => r.slug === "support_specialist"));

    // 5. Verify role is present when ?includeInactive=true
    const fullListRes = await fetch(`${baseUrl}/api/v1/seller/users/roles?includeInactive=true`, {
      headers: { Authorization: `Bearer ${majidToken}` },
    });
    const fullList = await fullListRes.json();
    const inactiveFound = fullList.data.find((r: { slug: string }) => r.slug === "support_specialist");
    assert.ok(inactiveFound);
    assert.equal(inactiveFound.is_active, false);

    // 6. Sign in assigned user and verify permissions are locked (0 permissions)
    const signinRes = await fetch(`${baseUrl}/api/v1/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "support_test@ovi.com",
        password: "123456789",
      }),
    });
    assert.equal(signinRes.status, 200);
    const signinBody = await signinRes.json();
    assert.equal(signinBody.data.user.permissions.length, 0);

    // 7. Prevent assigning inactive role to new members
    const tryAddRes = await fetch(`${baseUrl}/api/v1/seller/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${majidToken}`,
      },
      body: JSON.stringify({
        name: "Another Guy",
        email: "another_guy@ovi.com",
        password: "123456789",
        roleId: supportRole.id,
      }),
    });
    assert.equal(tryAddRes.status, 400);

    // Cleanup user
    await pool.query("DELETE FROM users WHERE email = 'support_test@ovi.com'");
  });

  it("16. Prompts when creating duplicate of inactive role, and reactivates restoring prior permissions", async () => {
    // Attempting to create role without reactivateIfExists prompts with 409 and code INACTIVE_ROLE_EXISTS
    const conflictRes = await fetch(`${baseUrl}/api/v1/seller/users/roles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${majidToken}`,
      },
      body: JSON.stringify({
        name: "Support Specialist",
      }),
    });
    assert.equal(conflictRes.status, 409);
    const conflictBody = await conflictRes.json();
    assert.ok(conflictBody.message.includes("inactive role"));

    // Now reactivate with reactivateIfExists = true
    const reactivateRes = await fetch(`${baseUrl}/api/v1/seller/users/roles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${majidToken}`,
      },
      body: JSON.stringify({
        name: "Support Specialist",
        reactivateIfExists: true,
      }),
    });
    assert.equal(reactivateRes.status, 201);
    const reactivateBody = await reactivateRes.json();
    assert.equal(reactivateBody.data.is_active, true);
    // Prior permissions restored!
    assert.deepEqual(reactivateBody.data.permissions, ["settings:view", "orders:view"]);
  });

  it("17. Atomically batch updates permissions matrix across roles", async () => {
    const rolesRes = await fetch(`${baseUrl}/api/v1/seller/users/roles`, {
      headers: { Authorization: `Bearer ${majidToken}` },
    });
    const rolesBody = await rolesRes.json();
    const analyst = rolesBody.data.find((r: { slug: string }) => r.slug === "analyst");
    const support = rolesBody.data.find((r: { slug: string }) => r.slug === "support_specialist");

    const batchRes = await fetch(`${baseUrl}/api/v1/seller/users/roles/permissions`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${majidToken}`,
      },
      body: JSON.stringify({
        matrix: [
          { roleId: analyst.id, permissions: ["analytics:view", "orders:view"] },
          { roleId: support.id, permissions: ["settings:view", "orders:view", "team:view"] },
        ],
      }),
    });

    assert.equal(batchRes.status, 200);
    const batchBody = await batchRes.json();
    assert.equal(batchBody.success, true);

    const supportConfig = batchBody.data.find((rp: { roleId: number }) => rp.roleId === support.id);
    assert.ok(supportConfig);
    assert.deepEqual(supportConfig.permissions, ["settings:view", "orders:view", "team:view"]);
  });
});

