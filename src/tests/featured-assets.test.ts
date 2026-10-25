import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { assetsService } from "../modules/assets/assets.service.js";
import { assetsRepository } from "../database/repositories/assets.repository.js";
import { FeaturedAssetQuerySchema } from "../modules/assets/assets.schema.js";

describe("Featured Assets Service & Query Validation", () => {
  test("1. FeaturedAssetQuerySchema validates default and custom limit", () => {
    const defaultParsed = FeaturedAssetQuerySchema.parse({});
    assert.equal(defaultParsed.limit, 12);

    const customParsed = FeaturedAssetQuerySchema.parse({ limit: "8" });
    assert.equal(customParsed.limit, 8);

    assert.throws(
      () => FeaturedAssetQuerySchema.parse({ limit: 0 }),
      /Too small/,
      "Limit < 1 must be rejected"
    );

    assert.throws(
      () => FeaturedAssetQuerySchema.parse({ limit: 100 }),
      /Too big/,
      "Limit > 50 must be rejected"
    );
  });

  test("2. getFeaturedAssets executes and handles empty/populated results gracefully", async () => {
    const assets = await assetsService.getFeaturedAssets(10);
    assert.ok(Array.isArray(assets), "Featured assets must return an array");

    // All returned assets must be published and have storage_path stripped for security
    for (const asset of assets) {
      assert.equal(asset.status, "published", "Only published assets may be featured");
      assert.equal(
        (asset as any).storage_path,
        undefined,
        "storage_path must be stripped from public responses"
      );
    }
  });

  test("3. findFeatured in repository enforces publication and visibility filters", async () => {
    const repoResults = await assetsRepository.findFeatured(5);
    assert.ok(Array.isArray(repoResults), "Repository findFeatured must return an array");

    for (const item of repoResults) {
      assert.equal(item.status, "published");
      assert.equal(item.is_active, true);
    }
  });
});

