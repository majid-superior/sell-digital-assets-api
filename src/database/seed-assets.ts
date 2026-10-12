import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  await client.connect();

  const assetRes = await client.query(`
    INSERT INTO assets (
      seller_id, category_id, title, slug, short_description, full_description, status, tags, technical_specs, view_count, download_count
    ) VALUES (
      '00000000-0000-0000-0000-000000000001',
      3,
      'Next.js Enterprise SaaS Boilerplate',
      'nextjs-enterprise-saas-boilerplate',
      'Production-ready SaaS template with Stripe, Supabase auth, and multi-tenant teams.',
      'A comprehensive full-stack starter kit engineered for high-scale applications.',
      'published',
      ARRAY['nextjs', 'saas', 'stripe', 'typescript'],
      '{"Framework":"Next.js 15","Database":"PostgreSQL"}'::jsonb,
      1420,
      318
    )
    ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title
    RETURNING id;
  `);

  const assetId = assetRes.rows[0].id;

  await client.query(`
    INSERT INTO asset_tiers (asset_id, tier_type, price, license_terms_summary) VALUES
      ('${assetId}', 'personal', 49, 'Single personal project'),
      ('${assetId}', 'commercial', 149, 'Up to 5 commercial projects'),
      ('${assetId}', 'extended', 399, 'Unlimited projects and resale rights')
    ON CONFLICT (asset_id, tier_type) DO UPDATE SET price = EXCLUDED.price;
  `);

  await client.query(`
    INSERT INTO asset_files (asset_id, version, storage_key, file_name, file_size_bytes, is_active) VALUES
      ('${assetId}', '1.0.0', 'sample-saas-v1.0.0.zip', 'NextJSSaaSBoilerplate-v1.0.0.zip', 48500000, TRUE)
    ON CONFLICT DO NOTHING;
  `);

  await client.query(`
    INSERT INTO licenses (license_key, asset_id, buyer_id, tier, status, max_activations, activation_count) VALUES
      ('DV26-LIVE-PROD-TEST-8888', '${assetId}', '00000000-0000-0000-0000-000000000001', 'commercial', 'active', 5, 1)
    ON CONFLICT (license_key) DO UPDATE SET status = 'active';
  `);

  console.log("✅ Seeded Asset & Test License successfully in PostgreSQL! Asset ID:", assetId);
  await client.end();
}

main().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});

