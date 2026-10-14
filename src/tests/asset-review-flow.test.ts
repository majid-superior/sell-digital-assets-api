import test from "node:test";
import assert from "node:assert/strict";
import { assetsService } from "../modules/assets/assets.service.js";
import { assetsRepository } from "../database/repositories/assets.repository.js";
import { notificationsService } from "../modules/notifications/notifications.service.js";
import { pool } from "../config/database.js";

const TEST_SELLER_ID = "00000000-0000-0000-0000-000000000001";
const TEST_ADMIN_ID = "00000000-0000-0000-0000-000000000001";

test("End-to-End Asset Submission, Admin Review & Notification Lifecycle", async (t) => {
  let assetId = "";
  let assetSlug = "";

  await t.test("1. Seller creates new asset — default status is 'draft'", async () => {
    const asset = await assetsService.createDraftAsset(TEST_SELLER_ID, {
      categoryId: 1,
      title: "Automated Test Boilerplate Kit",
      shortDescription: "A comprehensive starter kit designed for high-scale apps.",
      fullDescription: "Detailed markdown description for testing full review lifecycle.",
      tags: ["test", "boilerplate", "saas"],
      tiers: [
        { tierType: "personal", price: 29 },
        { tierType: "commercial", price: 89 },
      ],
    });

    assert.ok(asset.id);
    assert.equal(asset.status, "draft");
    assetId = asset.id;
    assetSlug = asset.slug;
  });

  await t.test("2. Seller CANNOT directly publish an asset", async () => {
    await assert.rejects(
      async () => {
        await assetsService.updateAssetStatus(assetId, TEST_SELLER_ID, "published");
      },
      {
        message: /Sellers cannot directly publish assets/,
      },
    );
  });

  await t.test("3. Draft asset is NOT visible on public marketplace", async () => {
    await assert.rejects(
      async () => {
        await assetsService.getAssetBySlug(assetSlug);
      },
      {
        message: /not found/,
      },
    );

    const publicList = await assetsService.getPublicAssets({ search: "Automated Test Boilerplate Kit" });
    const found = publicList.data.find((a: any) => a.id === assetId);
    assert.equal(found, undefined, "Draft asset must not appear in public catalog");
  });

  await t.test("4. Seller attaches deliverable file & submits for review ('pending')", async () => {
    // Add deliverable file
    await assetsRepository.createFile({
      assetId,
      version: "1.0.0",
      fileName: "boilerplate-v1.zip",
      storageKey: "test/boilerplate-v1.zip",
      fileSizeBytes: 1024000,
    });

    // Submit for review
    const submitted = await assetsService.updateAssetStatus(assetId, TEST_SELLER_ID, "pending");
    assert.equal(submitted.status, "pending");

    // Verify Admin received notification
    const adminNotifs = await notificationsService.getUserNotifications(TEST_ADMIN_ID, { unreadOnly: true });
    const submissionNotif = adminNotifs.data.find((n) => n.data?.assetId === assetId && n.type === "asset_submitted");
    assert.ok(submissionNotif, "Admin should receive asset_submitted notification");
  });

  await t.test("5. Admin checks review queue and marks as 'needs_update' with feedback", async () => {
    const feedback = "Please provide higher-resolution preview screenshots and update documentation.";
    const reviewed = await assetsService.adminReviewAsset(assetId, TEST_ADMIN_ID, {
      action: "needs_update",
      feedback,
    });

    assert.equal(reviewed.status, "needs_update");
    assert.equal(reviewed.admin_feedback, feedback);

    // Verify Seller received notification
    const sellerNotifs = await notificationsService.getUserNotifications(TEST_SELLER_ID, { unreadOnly: true });
    const updateReqNotif = sellerNotifs.data.find((n) => n.data?.assetId === assetId && n.type === "asset_needs_update");
    assert.ok(updateReqNotif, "Seller must receive asset_needs_update notification");
    assert.match(updateReqNotif.message, /Please provide higher-resolution/);
  });

  await t.test("6. Seller updates and resubmits asset -> Admin receives resubmit notification", async () => {
    const resubmitted = await assetsService.updateAssetStatus(assetId, TEST_SELLER_ID, "pending");
    assert.equal(resubmitted.status, "pending");

    // Verify Admin received resubmit notification
    const adminNotifs = await notificationsService.getUserNotifications(TEST_ADMIN_ID, { unreadOnly: true });
    const resubmitNotif = adminNotifs.data.find((n) => n.data?.assetId === assetId && n.type === "asset_resubmitted");
    assert.ok(resubmitNotif, "Admin must receive asset_resubmitted notification");
  });

  await t.test("7. Admin approves asset -> Status becomes 'published' and live on marketplace", async () => {
    const approved = await assetsService.adminReviewAsset(assetId, TEST_ADMIN_ID, {
      action: "approve",
    });

    assert.equal(approved.status, "published");
    assert.equal(approved.admin_feedback, null);

    // Verify Seller received approval notification
    const sellerNotifs = await notificationsService.getUserNotifications(TEST_SELLER_ID, { unreadOnly: true });
    const approvedNotif = sellerNotifs.data.find((n) => n.data?.assetId === assetId && n.type === "asset_approved");
    assert.ok(approvedNotif, "Seller must receive asset_approved notification");

    // Public marketplace can now discover and view it
    const publicAsset = await assetsService.getAssetBySlug(assetSlug);
    assert.equal(publicAsset.id, assetId);
    assert.equal(publicAsset.status, "published");
  });

  await t.test("8. Admin rejects an asset -> Marked as 'rejected', hidden from marketplace", async () => {
    const rejectReason = "Violates trademark terms. Cannot be approved.";
    const rejected = await assetsService.adminReviewAsset(assetId, TEST_ADMIN_ID, {
      action: "reject",
      feedback: rejectReason,
    });

    assert.equal(rejected.status, "rejected");
    assert.equal(rejected.admin_feedback, rejectReason);

    // Must NOT be available on public marketplace
    await assert.rejects(
      async () => {
        await assetsService.getAssetBySlug(assetSlug);
      },
      {
        message: /not found/,
      },
    );

    // Verify Seller received rejection notification
    const sellerNotifs = await notificationsService.getUserNotifications(TEST_SELLER_ID, { unreadOnly: true });
    const rejectNotif = sellerNotifs.data.find((n) => n.data?.assetId === assetId && n.type === "asset_rejected");
    assert.ok(rejectNotif, "Seller must receive asset_rejected notification");
  });

  // Cleanup test asset
  await pool.query("DELETE FROM assets WHERE id = $1", [assetId]);
});

