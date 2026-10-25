import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { assetsService } from "../modules/assets/assets.service.js";
import { assetsRepository } from "../database/repositories/assets.repository.js";
import { CurateAssetSchema, CuratedAssetQuerySchema } from "../modules/assets/assets.schema.js";
import { AppError } from "../core/errors/app-error.js";
import { pool } from "../config/database.js";

describe("Curated Assets Service, Authorization & Filtering", () => {
  let publishedAssetId: string | null = null;
  let draftAssetId: string | null = null;

  test("0. Setup test assets in database", async () => {
    // Find or identify a published asset and a draft/pending asset for testing
    const publishedRes = await pool.query(
      `SELECT id FROM assets WHERE status = 'published' AND is_active = TRUE AND deleted_at IS NULL LIMIT 1;`
    );
    if (publishedRes.rows.length > 0) {
      publishedAssetId = publishedRes.rows[0].id;
    }

    const nonPublishedRes = await pool.query(
      `SELECT id FROM assets WHERE status != 'published' AND deleted_at IS NULL LIMIT 1;`
    );
    if (nonPublishedRes.rows.length > 0) {
      draftAssetId = nonPublishedRes.rows[0].id;
    }
  });

  test("1. CuratedAssetQuerySchema validates limit and category slug", () => {
    const defaultParsed = CuratedAssetQuerySchema.parse({});
    assert.equal(defaultParsed.limit, 24);

    const customParsed = CuratedAssetQuerySchema.parse({ limit: "10", categorySlug: "graphics" });
    assert.equal(customParsed.limit, 10);
    assert.equal(customParsed.categorySlug, "graphics");

    assert.throws(
      () => CuratedAssetQuerySchema.parse({ limit: 0 }),
      /Too small/i,
      "Limit < 1 must be rejected"
    );

    assert.throws(
      () => CuratedAssetQuerySchema.parse({ limit: 100 }),
      /Too big/i,
      "Limit > 50 must be rejected"
    );
  });

  test("2. CurateAssetSchema validates boolean payload", () => {
    const valid = CurateAssetSchema.parse({ is_curated: true });
    assert.equal(valid.is_curated, true);

    const validFalse = CurateAssetSchema.parse({ is_curated: false });
    assert.equal(validFalse.is_curated, false);

    assert.throws(() => CurateAssetSchema.parse({ is_curated: "invalid" }));
  });

  test("3. Eligibility Guard: Non-published asset cannot be marked as curated", async () => {
    if (!draftAssetId) {
      // Create a temporary draft asset if none exists
      const sellerRes = await pool.query(`SELECT id FROM users LIMIT 1;`);
      const catRes = await pool.query(`SELECT id FROM categories LIMIT 1;`);
      if (sellerRes.rows.length > 0 && catRes.rows.length > 0) {
        const insertRes = await pool.query(
          `INSERT INTO assets (seller_id, category_id, title, slug, short_description, status)
           VALUES ($1, $2, 'Draft Test Asset', 'draft-test-asset-curate-guard', 'Short desc', 'draft')
           RETURNING id;`,
          [sellerRes.rows[0].id, catRes.rows[0].id]
        );
        draftAssetId = insertRes.rows[0].id;
      }
    }

    if (draftAssetId) {
      await assert.rejects(
        async () => {
          await assetsService.setCuratedStatus(draftAssetId!, true);
        },
        (err: unknown) => {
          assert.ok(err instanceof AppError);
          assert.equal(err.statusCode, 400);
          assert.match(err.message, /Only published assets can be marked as curated/i);
          return true;
        }
      );
    }
  });

  test("4. Persistence: Admin marks published asset as curated and uncurates it", async () => {
    if (!publishedAssetId) {
      return; // Skip if no published assets in DB
    }

    // Step A: Mark as curated
    const curated = await assetsService.setCuratedStatus(publishedAssetId, true);
    assert.ok(curated, "Must return updated asset entity");
    assert.equal(curated.is_curated, true);

    // Verify in database directly
    const dbCheck1 = await pool.query(`SELECT is_curated FROM assets WHERE id = $1;`, [publishedAssetId]);
    assert.equal(dbCheck1.rows[0].is_curated, true);

    // Step B: Mark as uncurated
    const uncurated = await assetsService.setCuratedStatus(publishedAssetId, false);
    assert.ok(uncurated, "Must return updated asset entity");
    assert.equal(uncurated.is_curated, false);

    // Verify in database directly
    const dbCheck2 = await pool.query(`SELECT is_curated FROM assets WHERE id = $1;`, [publishedAssetId]);
    assert.equal(dbCheck2.rows[0].is_curated, false);

    // Restore curated state for landing page display
    await assetsService.setCuratedStatus(publishedAssetId, true);
  });

  test("5. Public Filtering: getCuratedAssets returns only published, active curated assets", async () => {
    const curatedList = await assetsService.getCuratedAssets(20);
    assert.ok(Array.isArray(curatedList), "Must return an array");

    for (const asset of curatedList) {
      assert.equal(asset.status, "published", "All curated items must have status=published");
      assert.equal(asset.is_curated, true, "All items returned from curated endpoint must have is_curated=true");
      assert.equal(asset.is_active, true, "All curated items must be active");
      assert.equal(
        (asset as any).storage_path,
        undefined,
        "storage_path must be stripped from public curated response"
      );
    }
  });
});

