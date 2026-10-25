import dns from "node:dns";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { fileURLToPath } from "node:url";
import pg from "pg";
import dotenv from "dotenv";
import sharp from "sharp";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import {
  isSslRequired,
  resilientDnsLookup,
  createResilientSocket,
  installResilientDns,
} from "../config/database.js";
import {
  assetTemplates,
  generateRandomTiers,
  type DigitalAssetData,
  type AssetTierSeed,
  type AssetFileSeed,
  type AssetMediaSeed,
} from "../data/assets.js";

// Prioritize IPv4 DNS lookups and activate resilient public DNS fallback
installResilientDns();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Ensures .env is reliably loaded from project root regardless of CWD.
 */
function loadEnv(): void {
  let dir = __dirname;
  while (dir && dir !== path.dirname(dir)) {
    const envPath = path.join(dir, ".env");
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
      return;
    }
    dir = path.dirname(dir);
  }
  dotenv.config();
}

loadEnv();

export const DEFAULT_LOCAL_DATABASE_URL =
  process.env.LOCAL_DATABASE_URL ||
  (process.env.DATABASE_URL && !isSslRequired(process.env.DATABASE_URL) ? process.env.DATABASE_URL : undefined) ||
  "postgresql://postgres:P%40ssw0rd@localhost:5432/sell_digital_assets";

export const DEFAULT_LIVE_DATABASE_URL =
  process.env.PROD_DATABASE_URL ||
  (isSslRequired(process.env.DATABASE_URL || "") ? process.env.DATABASE_URL : "");

export const ASSETS_FOLDER_PATH =
  process.env.ASSETS_FOLDER_PATH ||
  (process.platform === "win32" ? "C:\\GH\\assets" : "./assets");

export const LOCAL_STORAGE_PATH =
  process.env.LOCAL_STORAGE_PATH ||
  (process.platform === "win32" ? "C:\\GH\\sell-digital-assets-storage" : "./storage");

export const BUCKET_PREVIEWS = process.env.AWS_BUCKET_PREVIEWS || "sell-digital-assets-storage-previews";
export const BUCKET_PRIVATE = process.env.AWS_BUCKET_PRIVATE || "sell-digital-assets-storage-private";

export interface ActiveSeller {
  id: string;
  name: string;
  email: string;
  status: string;
  role: string;
}

export interface AvailableAssetFile {
  name: string;
  path: string;
  sizeBytes: number;
}

export interface CategoryRecord {
  id: number;
  name: string;
  slug: string;
}

/**
 * Maps file extension to standard MIME Content-Type.
 */
export function getContentType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  switch (ext) {
    case ".zip":
      return "application/zip";
    case ".blend":
    case ".fig":
    case ".prproj":
      return "application/octet-stream";
    case ".psd":
      return "image/vnd.adobe.photoshop";
    case ".pdf":
      return "application/pdf";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".wav":
      return "audio/wav";
    case ".mp3":
      return "audio/mpeg";
    default:
      return "application/octet-stream";
  }
}

/**
 * Converts a text title into a URL-friendly slug.
 */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Interactively prompts or resolves target database.
 * Supports:
 *   [1] Local Database (localhost:5432/sell_digital_assets)
 *   [2] Live Database  (Supabase / Cloud Database)
 * As well as command line shortcuts: --local, -1, --live, -2, --cloud.
 */
export async function promptTargetDatabase(): Promise<{
  url: string;
  target: "local" | "live";
}> {
  const localUrl = DEFAULT_LOCAL_DATABASE_URL;
  const liveUrl = DEFAULT_LIVE_DATABASE_URL;

  // 1. Command-line flag shortcuts (e.g. npm run db:assets -- --local or -1)
  if (process.argv.includes("--local") || process.argv.includes("-1")) {
    return { url: localUrl, target: "local" };
  }
  if (
    process.argv.includes("--live") ||
    process.argv.includes("--cloud") ||
    process.argv.includes("-2")
  ) {
    if (!liveUrl) {
      throw new Error("PROD_DATABASE_URL environment variable is missing for live database.");
    }
    if (process.env.ALLOW_LIVE_DB_RESET !== "true") {
      throw new Error("🛑 SAFEGUARD BLOCKED: Seeding live database via CLI flags requires ALLOW_LIVE_DB_RESET=true.");
    }
    return { url: liveUrl, target: "live" };
  }

  // 2. Interactive menu prompt when in TTY
  if (process.stdin.isTTY) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    try {
      console.log("\n=======================================================");
      console.log("             DIGITAL ASSETS SEED UTILITY               ");
      console.log("=======================================================");
      console.log("  [1] Local Database (localhost:5432/sell_digital_assets) [SAFE]");
      console.log("  [2] Live Database  (Supabase / Cloud Database) [PRODUCTION]");
      console.log("=======================================================");

      while (true) {
        const choice = (
          await rl.question("Select option (1 for Local, 2 for Live): ")
        ).trim();

        if (choice === "1") {
          return { url: localUrl, target: "local" };
        }
        if (choice === "2") {
          if (!liveUrl) {
            console.error("❌ Error: PROD_DATABASE_URL environment variable is missing for live database.");
            process.exit(1);
          }

          console.log("\n⚠️  WARNING: You selected the LIVE / PRODUCTION CLOUD database!");
          const confirmText = (
            await rl.question("Type 'CONFIRM ASSETS LIVE' to proceed or anything else to cancel: ")
          ).trim();

          if (confirmText !== "CONFIRM ASSETS LIVE") {
            console.log("🛡️  Live database asset seed cancelled by user.");
            process.exit(0);
          }
          return { url: liveUrl, target: "live" };
        }
        console.log("⚠️  Invalid option. Please enter '1' for Local or '2' for Live.");
      }
    } finally {
      rl.close();
    }
  }

  // 3. Non-interactive fallback strictly defaults to local database
  return { url: localUrl, target: "local" };
}

/**
 * Scans C:\GH\assets and returns all available digital asset files with sizes.
 */
export function getAvailableAssetFiles(assetsFolder = ASSETS_FOLDER_PATH): AvailableAssetFile[] {
  if (!fs.existsSync(assetsFolder)) {
    fs.mkdirSync(assetsFolder, { recursive: true });
  }

  let entries = fs.readdirSync(assetsFolder);

  if (entries.length === 0) {
    const defaultSampleNames = [
      "nextjs-enterprise-saas-starter-v2.zip",
      "figma-enterprise-design-system-2026.fig",
      "cyberpunk-street-environment-3d.blend",
      "pbr-sci-fi-materials-pack-4k.zip",
      "mobile-banking-fintech-ui-kit.fig",
      "express-postgres-microservices-kit.zip",
      "vector-brand-icon-library-1200.zip",
      "kinetic-typography-after-effects.zip",
      "low-poly-medieval-game-characters.zip",
      "ambient-game-soundtracks-wav-bundle.zip",
    ];

    for (const name of defaultSampleNames) {
      const filePath = path.join(assetsFolder, name);
      fs.writeFileSync(
        filePath,
        `Sample digital asset deliverable for: ${name}\nCreated: ${new Date().toISOString()}\nPlatform: sell-digital-assets`,
      );
    }

    entries = fs.readdirSync(assetsFolder);
  }

  const result: AvailableAssetFile[] = [];

  for (const entry of entries) {
    const fullPath = path.join(assetsFolder, entry);
    try {
      const stats = fs.statSync(fullPath);
      if (stats.isFile()) {
        result.push({
          name: entry,
          path: fullPath,
          sizeBytes: stats.size,
        });
      }
    } catch {
      // Ignore unreadable entries
    }
  }

  return result;
}

/**
 * Escapes characters for safe inclusion in SVG XML text nodes.
 */
export function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Truncates text safely before XML escaping.
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

/**
 * Generates an optimized WebP thumbnail or screenshot buffer using sharp.
 */
export async function generateThumbnailBuffer(params: {
  title: string;
  categoryName: string;
  sellerName: string;
  domain: string;
  width?: number;
  height?: number;
}): Promise<Buffer> {
  const width = params.width || 640;
  const height = params.height || 400;

  const colorSchemes: Record<string, { start: string; end: string; accent: string; badge: string }> = {
    "3d": { start: "#180f33", end: "#09041a", accent: "#a855f7", badge: "3D MODEL &amp; CGI" },
    "ui-ux": { start: "#0c1f38", end: "#050b14", accent: "#38bdf8", badge: "UI/UX DESIGN SYSTEM" },
    "code": { start: "#06231a", end: "#020d0a", accent: "#34d399", badge: "FULL-STACK CODE" },
    "motion": { start: "#2c0b24", end: "#10030d", accent: "#f43f5e", badge: "MOTION GRAPHICS" },
    "graphics": { start: "#1a162b", end: "#0c0a17", accent: "#f59e0b", badge: "VECTOR ASSET PACK" },
    "audio": { start: "#1f1033", end: "#090312", accent: "#818cf8", badge: "AUDIO &amp; SOUND FX" },
    "general": { start: "#111827", end: "#030712", accent: "#6366f1", badge: "DIGITAL ASSET" },
  };

  const scheme = colorSchemes[params.domain] || colorSchemes.general!;
  const displayTitle = escapeXml(truncateText(params.title, 36));
  const cleanCat = escapeXml(params.categoryName);
  const cleanSeller = escapeXml(params.sellerName);

  const svg = `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${scheme.start}" />
      <stop offset="100%" stop-color="${scheme.end}" />
    </linearGradient>
    <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${scheme.accent}" stop-opacity="0.3" />
      <stop offset="100%" stop-color="${scheme.accent}" stop-opacity="0.1" />
    </linearGradient>
    <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
      <path d="M 32 0 L 0 0 0 32" fill="none" stroke="${scheme.accent}" stroke-width="0.5" stroke-opacity="0.12" />
    </pattern>
  </defs>

  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#bgGrad)" />
  <rect width="${width}" height="${height}" fill="url(#grid)" />

  <!-- Glows -->
  <circle cx="${width * 0.85}" cy="${height * 0.2}" r="${width * 0.35}" fill="${scheme.accent}" fill-opacity="0.08" />
  <circle cx="${width * 0.15}" cy="${height * 0.85}" r="${width * 0.25}" fill="${scheme.accent}" fill-opacity="0.06" />

  <!-- Badge -->
  <rect x="36" y="36" width="180" height="28" rx="14" fill="url(#badgeGrad)" stroke="${scheme.accent}" stroke-width="1" stroke-opacity="0.4" />
  <text x="50" y="55" fill="${scheme.accent}" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="700" letter-spacing="1.2">
    ${scheme.badge}
  </text>

  <!-- Title & Category -->
  <text x="36" y="140" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="800">
    ${displayTitle}
  </text>
  <text x="36" y="172" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="500">
    ${cleanCat}
  </text>

  <!-- Separator -->
  <line x1="36" y1="${height - 70}" x2="${width - 36}" y2="${height - 70}" stroke="#334155" stroke-width="1" stroke-opacity="0.6" />

  <!-- Footer -->
  <text x="36" y="${height - 40}" fill="#cbd5e1" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="600">
    Seller: ${cleanSeller}
  </text>
  <text x="${width - 36}" y="${height - 40}" text-anchor="end" fill="${scheme.accent}" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="700" letter-spacing="1">
    VERIFIED DELIVERABLE
  </text>
</svg>
`;

  return await sharp(Buffer.from(svg))
    .webp({ quality: 85, effort: 4 })
    .toBuffer();
}

/**
 * Uploads buffers to storage (Local disk and/or Supabase S3 buckets).
 */
export class AssetsStorageUploader {
  private s3Client: S3Client | null = null;
  private isCloud: boolean;
  private supabaseUrl: string;

  constructor(target: "local" | "live") {
    this.isCloud = target === "live";
    this.supabaseUrl = process.env.SUPABASE_URL || "https://kvhntcdqispownhlsoxo.supabase.co";

    if (this.isCloud && process.env.AWS_ENDPOINT && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      this.s3Client = new S3Client({
        region: process.env.AWS_REGION || "auto",
        endpoint: process.env.AWS_ENDPOINT,
        forcePathStyle: true,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      });
    }

    // Ensure local directories exist
    if (!fs.existsSync(LOCAL_STORAGE_PATH)) {
      fs.mkdirSync(LOCAL_STORAGE_PATH, { recursive: true });
    }
  }

  /**
   * Uploads low-res preview image (WebP) to the public previews bucket.
   * Returns public URL accessible by browser.
   */
  async uploadPreview(storageKey: string, buffer: Buffer): Promise<string> {
    // 1. Always write to local storage
    const localFile = path.resolve(LOCAL_STORAGE_PATH, storageKey);
    fs.mkdirSync(path.dirname(localFile), { recursive: true });
    fs.writeFileSync(localFile, buffer);

    // 2. If live cloud S3, upload to sell-digital-assets-storage-previews with ContentType: image/webp
    if (this.s3Client) {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: BUCKET_PREVIEWS,
          Key: storageKey,
          Body: buffer,
          ContentType: "image/webp",
        }),
      );

      // Return direct public Supabase Storage CDN URL
      return `${this.supabaseUrl}/storage/v1/object/public/${BUCKET_PREVIEWS}/${storageKey}`;
    }

    // Local URL
    return `/api/v1/storage/download?key=${encodeURIComponent(storageKey)}`;
  }

  /**
   * Uploads high-res asset deliverable to the private vault bucket.
   * Returns storage key.
   */
  async uploadPrivateDeliverable(
    storageKey: string,
    fileBuffer: Buffer,
    contentType: string,
  ): Promise<string> {
    // 1. Always write to local storage vault
    const localFile = path.resolve(LOCAL_STORAGE_PATH, storageKey);
    fs.mkdirSync(path.dirname(localFile), { recursive: true });
    fs.writeFileSync(localFile, fileBuffer);

    // 2. If live cloud S3, upload to sell-digital-assets-storage-private
    if (this.s3Client) {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: BUCKET_PRIVATE,
          Key: storageKey,
          Body: fileBuffer,
          ContentType: contentType,
        }),
      );
    }

    return storageKey;
  }
}

/**
 * Selects an appropriate asset template based on the seller's domain or randomly.
 */
export function pickTemplateForSeller(
  sellerName: string,
  categories: CategoryRecord[],
): { template: (typeof assetTemplates)[number]; category: CategoryRecord } {
  const normalized = sellerName.toLowerCase();
  let domain = "general";

  if (normalized.includes("majid")) {
    domain = "3d";
  } else if (normalized.includes("ali")) {
    domain = "ui-ux";
  } else if (normalized.includes("asif")) {
    domain = "code";
  } else if (normalized.includes("tariq")) {
    domain = "motion";
  } else if (normalized.includes("noreen")) {
    domain = "graphics";
  } else {
    const domains = ["3d", "ui-ux", "code", "motion", "graphics", "audio"];
    domain = domains[Math.floor(Math.random() * domains.length)]!;
  }

  const matchingTemplate =
    assetTemplates.find((t) => t.domain === domain) ||
    assetTemplates[Math.floor(Math.random() * assetTemplates.length)]!;

  let category = categories.find((c) => c.slug === matchingTemplate.categorySlug);
  if (!category && categories.length > 0) {
    category = categories[Math.floor(Math.random() * categories.length)];
  }

  return {
    template: matchingTemplate,
    category: category || { id: 1, name: "General Digital Assets", slug: "general" },
  };
}

/**
 * Writes the generated assets to C:\GH\sell-digital-assets-api\src\data\assets.ts.
 */
export function writeAssetsDataFile(assets: DigitalAssetData[]): string {
  const filePath = path.resolve(__dirname, "../data/assets.ts");

  const fileContent = `/**
 * Digital Assets Dataset & Seed Definitions
 *
 * Generated automatically by 'npm run db:assets'.
 * Contains ${assets.length} realistic digital assets randomized across active platform sellers.
 * Generated at: ${new Date().toISOString()}
 */

export interface AssetTierSeed {
  tierType: "personal" | "commercial" | "extended";
  price: number;
  licenseTermsSummary: string;
}

export interface AssetFileSeed {
  fileName: string;
  fileSizeBytes: number;
  version: string;
  storageKey: string;
}

export interface AssetMediaSeed {
  mediaType: "thumbnail" | "screenshot";
  url: string;
  displayOrder: number;
}

export interface DigitalAssetData {
  id?: string | undefined;
  sellerId?: string | undefined;
  sellerName?: string | undefined;
  sellerEmail?: string | undefined;
  categoryId: number;
  categorySlug: string;
  categoryName: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  previewUrl: string;
  storagePath: string;
  status: "published" | "pending" | "draft";
  tags: string[];
  technicalSpecs: Record<string, string>;
  viewCount: number;
  downloadCount: number;
  tiers: AssetTierSeed[];
  file: AssetFileSeed;
  media: AssetMediaSeed[];
  createdAt?: string | undefined;
}

export interface AssetTemplate {
  domain: "3d" | "ui-ux" | "code" | "motion" | "graphics" | "audio" | "general";
  categorySlug: string;
  titlePrefixes: string[];
  titleNouns: string[];
  titleSuffixes: string[];
  shortDescriptions: string[];
  fullDescriptions: string[];
  tags: string[];
  technicalSpecs: Record<string, string>;
  previewImages: string[];
  galleryImages: string[];
  suggestedFiles: string[];
}

export const assetTemplates: AssetTemplate[] = ${JSON.stringify(assetTemplates, null, 2)};

export function generateRandomTiers(basePriceMultiplier = 1): AssetTierSeed[] {
  const basePersonal = Math.round((19 + Math.random() * 20) * basePriceMultiplier);
  const baseCommercial = Math.round(basePersonal * 2.5 + Math.random() * 15);
  const baseExtended = Math.round(baseCommercial * 2.8 + Math.random() * 40);

  return [
    {
      tierType: "personal",
      price: basePersonal,
      licenseTermsSummary: "Permits use in 1 personal non-commercial project or portfolio display. Redistribution strictly prohibited.",
    },
    {
      tierType: "commercial",
      price: baseCommercial,
      licenseTermsSummary: "Permits use in 1 commercial or client project with revenue up to $10,000. Sublicensing prohibited.",
    },
    {
      tierType: "extended",
      price: baseExtended,
      licenseTermsSummary: "Permits unlimited commercial distribution, SaaS platform integration, and broadcast rights.",
    },
  ];
}

/**
 * Seeded Digital Assets Registry (${assets.length} items)
 */
export const defaultAssets: DigitalAssetData[] = ${JSON.stringify(assets, null, 2)};
`;

  fs.writeFileSync(filePath, fileContent, "utf8");
  return filePath;
}

/**
 * Main database asset generation, physical binary upload, and insertion pipeline.
 */
export async function seedAssets(): Promise<DigitalAssetData[]> {
  // Step 1: Prompt or resolve database target (Local vs Live)
  const { url: targetUrl, target } = await promptTargetDatabase();

  let targetDbName = "sell_digital_assets";
  let targetHost = "localhost";
  try {
    const parsed = new URL(targetUrl.replace(/^postgresql:\/\//, "http://"));
    targetDbName = parsed.pathname.replace(/^\//, "") || targetDbName;
    targetHost = parsed.hostname || targetHost;
  } catch {
    // fallback
  }

  console.log("\n=======================================================");
  console.log("    DIGITAL ASSETS SEED & STORAGE BINARY UPLOADER      ");
  console.log("=======================================================");
  console.log(`• Target Database:   ${target === "live" ? "☁️  LIVE / CLOUD DATABASE" : "💻 LOCAL DATABASE"}`);
  console.log(`• Database Name:     ${targetDbName}`);
  console.log(`• Host:              ${targetHost}`);
  console.log(`• Source Assets Dir: ${ASSETS_FOLDER_PATH}`);
  console.log(`• Storage Target:    ${target === "live" ? "☁️  Supabase S3 Buckets + Local Disk" : "💻 Local Storage Directory"}`);
  console.log("-------------------------------------------------------\n");

  // Step 2: Initialize connection pool with resilient retries
  const requiresSsl = isSslRequired(targetUrl);
  const pool = new Pool({
    connectionString: targetUrl,
    ssl: requiresSsl ? { rejectUnauthorized: false } : undefined,
    stream: () => createResilientSocket(),
    lookup: resilientDnsLookup,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  } as any);

  const uploader = new AssetsStorageUploader(target);

  try {
    let connected = false;
    let lastError: any = null;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const client = await pool.connect();
        client.release();
        connected = true;
        break;
      } catch (connErr: any) {
        lastError = connErr;
        if (attempt < 3) {
          console.warn(`⚠️  Database connection attempt ${attempt} failed (${connErr.message}). Retrying in 2s...`);
          await new Promise((r) => setTimeout(r, 2000));
        }
      }
    }

    if (!connected) {
      throw new Error(
        `Could not connect to ${target === "live" ? "Live" : "Local"} Database at ${targetHost}: ${lastError?.message || "Connection failed"}.\n` +
          `Verify that PostgreSQL is running and your connection settings are valid.`,
      );
    }

    // Step 3: Fetch active categories from database
    const categoriesRes = await pool.query<CategoryRecord>(
      "SELECT id, name, slug FROM categories WHERE is_active = TRUE ORDER BY id ASC",
    );
    const categories = categoriesRes.rows;
    if (categories.length === 0) {
      throw new Error("No active categories found in database. Run 'npm run db:reset' first.");
    }
    console.log(`📁 Loaded ${categories.length} active categories from database.`);

    // Step 4: Scan and load asset files from C:\GH\assets
    const availableFiles = getAvailableAssetFiles();
    if (availableFiles.length === 0) {
      throw new Error(`No files found in assets folder: ${ASSETS_FOLDER_PATH}`);
    }
    console.log(`📦 Loaded ${availableFiles.length} physical deliverables from ${ASSETS_FOLDER_PATH}.`);

    // Step 5: Clean up previous assets so all database records match newly uploaded binaries
    console.log("🧹 Resetting existing assets table for fresh synchronization...");
    await pool.query("DELETE FROM assets;");
    console.log("✅ Cleaned existing assets records.");

    // Step 6: Get all users who have the role seller and status active
    const sellersRes = await pool.query<ActiveSeller>(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.status,
        r.slug AS role
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE r.slug = 'seller'
        AND u.status = 'active'
        AND u.deleted_at IS NULL
      ORDER BY u.name ASC;
    `);

    const activeSellers = sellersRes.rows;

    if (activeSellers.length === 0) {
      console.warn("⚠️  No users found with role 'seller' and status 'active'.");
      console.log("💡 Tip: You can seed active sellers using: npm run db:user");
      return [];
    }

    console.log(`👤 Found ${activeSellers.length} active sellers:\n`);
    for (const seller of activeSellers) {
      console.log(`   • ${seller.name} (${seller.email}) - ID: ${seller.id}`);
    }
    console.log("\n-------------------------------------------------------\n");

    const allGeneratedAssets: DigitalAssetData[] = [];
    const sellerSummary: Array<{
      sellerName: string;
      email: string;
      assetsCreated: number;
      categories: string;
      uploadedDeliverables: string;
    }> = [];

    // Step 7: Loop through all active sellers one by one
    for (let sIdx = 0; sIdx < activeSellers.length; sIdx++) {
      const seller = activeSellers[sIdx]!;

      // Insert between 10 and 20 random assets for each user
      const assetCount = Math.floor(Math.random() * (20 - 10 + 1)) + 10;
      console.log(
        `▶ [${sIdx + 1}/${activeSellers.length}] Seeding ${assetCount} assets with physical uploads for seller ${seller.name} (${seller.email})...`,
      );

      const sellerCategories = new Set<string>();

      for (let i = 0; i < assetCount; i++) {
        // Pick a random deliverable file from C:\GH\assets
        const pickedFile = availableFiles[Math.floor(Math.random() * availableFiles.length)]!;
        const { template, category } = pickTemplateForSeller(seller.name, categories);
        sellerCategories.add(category.name);

        const prefix =
          template.titlePrefixes[Math.floor(Math.random() * template.titlePrefixes.length)] || "Premium";
        const noun =
          template.titleNouns[Math.floor(Math.random() * template.titleNouns.length)] || "Asset";
        const suffix =
          template.titleSuffixes[Math.floor(Math.random() * template.titleSuffixes.length)] || "Suite";

        const title = `${prefix} ${noun} ${suffix}`;
        const randomSuffix = Math.random().toString(36).substring(2, 7);
        const slug = `${slugify(title)}-${randomSuffix}`;

        const shortDescription =
          template.shortDescriptions[
            Math.floor(Math.random() * template.shortDescriptions.length)
          ] || "Professional digital product engineered for creators and developers.";

        const fullDescription = template.fullDescriptions.join("\n\n");
        const viewCount = Math.floor(Math.random() * 2500) + 75;
        const downloadCount = Math.floor(Math.random() * (viewCount * 0.25)) + 12;

        const tiers: AssetTierSeed[] = generateRandomTiers(
          template.domain === "code" || template.domain === "3d" ? 1.5 : 1.0,
        );

        // --- PHYSICAL UPLOAD 1: High-Res Asset Deliverable into Private Vault Bucket ---
        const deliverableStorageKey = `vault/assets/${slug}/${pickedFile.name}`;
        const deliverableBuffer = fs.readFileSync(pickedFile.path);
        const deliverableContentType = getContentType(pickedFile.name);

        await uploader.uploadPrivateDeliverable(
          deliverableStorageKey,
          deliverableBuffer,
          deliverableContentType,
        );

        // Insert into assets table first to acquire generated UUID
        const insertAssetQuery = `
          INSERT INTO assets (
            seller_id,
            category_id,
            title,
            slug,
            short_description,
            full_description,
            preview_url,
            storage_path,
            status,
            tags,
            technical_specs,
            view_count,
            download_count,
            is_active,
            submitted_at,
            reviewed_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, 'pending-upload', $7, 'published', $8, $9::jsonb, $10, $11, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          )
          RETURNING id, created_at;
        `;

        const assetRes = await pool.query(insertAssetQuery, [
          seller.id,
          category.id,
          title,
          slug,
          shortDescription,
          fullDescription,
          deliverableStorageKey,
          template.tags,
          JSON.stringify(template.technicalSpecs),
          viewCount,
          downloadCount,
        ]);

        const insertedAssetId = assetRes.rows[0].id;
        const insertedCreatedAt = assetRes.rows[0].created_at;

        // --- PHYSICAL UPLOAD 2: Low-Res Preview Thumbnail into Public Previews Bucket ---
        const thumbnailBuffer = await generateThumbnailBuffer({
          title,
          categoryName: category.name,
          sellerName: seller.name,
          domain: template.domain,
          width: 640,
          height: 400,
        });

        const thumbnailStorageKey = `previews/${insertedAssetId}/thumbnail.webp`;
        const publicThumbnailUrl = await uploader.uploadPreview(
          thumbnailStorageKey,
          thumbnailBuffer,
        );

        // Also generate and upload secondary showcase screenshot (1200x750)
        const screenshotBuffer = await generateThumbnailBuffer({
          title: `${title} (Showcase Gallery)`,
          categoryName: category.name,
          sellerName: seller.name,
          domain: template.domain,
          width: 1200,
          height: 750,
        });

        const screenshotStorageKey = `previews/${insertedAssetId}/screenshot-1.webp`;
        const publicScreenshotUrl = await uploader.uploadPreview(
          screenshotStorageKey,
          screenshotBuffer,
        );

        // Update preview_url in assets table with the public live preview URL
        await pool.query(
          "UPDATE assets SET preview_url = $1 WHERE id = $2;",
          [publicThumbnailUrl, insertedAssetId],
        );

        // Insert pricing tiers into asset_tiers
        for (const tier of tiers) {
          await pool.query(
            `INSERT INTO asset_tiers (asset_id, tier_type, price, license_terms_summary)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (asset_id, tier_type) DO UPDATE SET price = EXCLUDED.price;`,
            [insertedAssetId, tier.tierType, tier.price, tier.licenseTermsSummary],
          );
        }

        // Insert deliverable file into asset_files
        await pool.query(
          `INSERT INTO asset_files (
             asset_id, version, storage_key, file_name, file_size_bytes, is_active
           ) VALUES (
             $1, '1.0.0', $2, $3, $4, TRUE
           );`,
          [
            insertedAssetId,
            deliverableStorageKey,
            pickedFile.name,
            pickedFile.sizeBytes,
          ],
        );

        // Insert showcase media into asset_media
        await pool.query(
          `INSERT INTO asset_media (asset_id, media_type, storage_key, url, display_order)
           VALUES 
             ($1, 'thumbnail', $2, $3, 1),
             ($1, 'screenshot', $4, $5, 2);`,
          [
            insertedAssetId,
            thumbnailStorageKey,
            publicThumbnailUrl,
            screenshotStorageKey,
            publicScreenshotUrl,
          ],
        );

        const fileSeed: AssetFileSeed = {
          fileName: pickedFile.name,
          fileSizeBytes: pickedFile.sizeBytes,
          version: "1.0.0",
          storageKey: deliverableStorageKey,
        };

        const mediaSeed: AssetMediaSeed[] = [
          {
            mediaType: "thumbnail",
            url: publicThumbnailUrl,
            displayOrder: 1,
          },
          {
            mediaType: "screenshot",
            url: publicScreenshotUrl,
            displayOrder: 2,
          },
        ];

        allGeneratedAssets.push({
          id: insertedAssetId,
          sellerId: seller.id,
          sellerName: seller.name,
          sellerEmail: seller.email,
          categoryId: category.id,
          categorySlug: category.slug,
          categoryName: category.name,
          title,
          slug,
          shortDescription,
          fullDescription,
          previewUrl: publicThumbnailUrl,
          storagePath: deliverableStorageKey,
          status: "published",
          tags: template.tags,
          technicalSpecs: template.technicalSpecs,
          viewCount,
          downloadCount,
          tiers,
          file: fileSeed,
          media: mediaSeed,
          createdAt: insertedCreatedAt,
        });

        // Print progress dot
        process.stdout.write(".");
      }

      console.log(`\n   ✅ Uploaded and seeded ${assetCount} assets for ${seller.name}.`);

      sellerSummary.push({
        sellerName: seller.name,
        email: seller.email,
        assetsCreated: assetCount,
        categories: Array.from(sellerCategories).slice(0, 3).join(", "),
        uploadedDeliverables: `${assetCount} packages`,
      });
    }

    // Step 8: Create a file in src/data named assets.ts with all random information for assets
    console.log("\n📝 Writing all generated asset information to src/data/assets.ts...");
    const writtenFilePath = writeAssetsDataFile(allGeneratedAssets);
    console.log(`✅ Saved ${allGeneratedAssets.length} assets to ${writtenFilePath}`);

    // Step 9: Display execution summary
    console.log("\n=======================================================");
    console.log("            ASSET SEEDING & UPLOAD SUMMARY             ");
    console.log("=======================================================");
    console.table(sellerSummary);
    console.log(`• Total Active Sellers Processed: ${activeSellers.length}`);
    console.log(`• Total Assets Seeded:            ${allGeneratedAssets.length}`);
    console.log(`• High-Res Vault Deliverables:    ${allGeneratedAssets.length} uploaded to private bucket`);
    console.log(`• Low-Res WebP Thumbnails:        ${allGeneratedAssets.length * 2} uploaded to previews bucket`);
    console.log(`• Dataset Persisted To:           src/data/assets.ts`);
    console.log("=======================================================\n");

    return allGeneratedAssets;
  } finally {
    await pool.end().catch(() => {});
  }
}

/**
 * CLI execution entrypoint.
 */
async function main(): Promise<void> {
  try {
    const assets = await seedAssets();
    console.log(`🎉 Seeding complete! ${assets.length} assets are now live in the database with uploaded deliverables and previews.`);
    process.exit(0);
  } catch (err: any) {
    console.error(`\n❌ ASSET SEEDING ERROR: ${err.message}\n`);
    process.exit(1);
  }
}

const isDirectExecution = (): boolean => {
  if (!process.argv[1]) return false;
  try {
    const entryPath = path.resolve(process.argv[1]);
    const modulePath = path.resolve(fileURLToPath(import.meta.url));
    return entryPath === modulePath;
  } catch {
    return false;
  }
};

if (isDirectExecution()) {
  main();
}
