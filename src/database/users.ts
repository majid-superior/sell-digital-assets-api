import dns from "node:dns";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { fileURLToPath } from "node:url";
import pg from "pg";
import dotenv from "dotenv";
import {
  isSslRequired,
  resilientDnsLookup,
  createResilientSocket,
  installResilientDns,
} from "../config/database.js";
import { hashPassword, comparePassword } from "../core/security/password.js";
import { authService } from "../modules/auth/auth.service.js";
import { generateTokens } from "../core/security/tokens.js";
import {
  defaultUsers,
  resolveConfiguredRole,
  type UserProfile,
} from "../data/users.js";

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

export const DEFAULT_TEST_PASSWORD = "123456789";

export const DEFAULT_LOCAL_DATABASE_URL =
  process.env.LOCAL_DATABASE_URL ||
  (process.env.DATABASE_URL && !isSslRequired(process.env.DATABASE_URL) ? process.env.DATABASE_URL : undefined) ||
  "postgresql://postgres:P%40ssw0rd@localhost:5432/sell_digital_assets";

export const DEFAULT_LIVE_DATABASE_URL =
  process.env.PROD_DATABASE_URL ||
  (isSslRequired(process.env.DATABASE_URL || "") ? process.env.DATABASE_URL : "");

export interface SeedOptions {
  /**
   * Target database selection: 'local' for local PostgreSQL, 'live' for remote cloud.
   */
  target?: "local" | "live" | undefined;
  /**
   * Explicit database connection URL (overrides target selection).
   */
  databaseUrl?: string | undefined;
  /**
   * Number of sellers among the 10 users (1-9).
   * Default: 5 sellers (and 5 buyers).
   */
  sellerCount?: number | undefined;
  /**
   * Default test password for seeded accounts.
   * Default: '123456789'
   */
  password?: string | undefined;
  /**
   * Whether to test and verify authentication for all accounts after seeding.
   * Default: true
   */
  verifyAuth?: boolean | undefined;
  /**
   * Suppress console logging (useful in automated tests).
   * Default: false
   */
  quiet?: boolean | undefined;
}

export interface UserSummaryItem {
  id: string;
  name: string;
  email: string;
  city: string;
  role: string;
  status: string;
  title: string;
}

export interface SkippedSummaryItem {
  id: string;
  name: string;
  email: string;
  city: string;
  role: string;
  reason: string;
}

export interface FailedSummaryItem {
  name: string;
  email: string;
  error: string;
}

export interface SeedResult {
  target: "local" | "live";
  databaseUrl: string;
  targetDbName: string;
  targetHost: string;
  total: number;
  created: UserSummaryItem[];
  skipped: SkippedSummaryItem[];
  failed: FailedSummaryItem[];
  verifiedCount: number;
  verificationFailures: Array<{ email: string; error: string }>;
  sellerCount: number;
  buyerCount: number;
}

/**
 * Validates the execution environment.
 * Strictly prevents accidental execution against production databases.
 */
export function assertSafeEnvironment(): void {
  const currentEnv = (process.env.NODE_ENV || "development").toLowerCase().trim();
  if (currentEnv === "production") {
    throw new Error(
      "CRITICAL SAFETY ABORT: Seeding test users is strictly forbidden in production mode (NODE_ENV=production). " +
      "Please set NODE_ENV to 'development' or 'test' to seed test users."
    );
  }
}

/**
 * Interactively prompts or resolves target database.
 * Supports:
 *   [1] Local Database (localhost:5432/sell_digital_assets)
 *   [2] Live Database  (Supabase / Cloud)
 * As well as command line shortcuts: --local, -1, --live, -2.
 */
export async function promptTargetDatabase(options?: SeedOptions): Promise<{ url: string; target: "local" | "live" }> {
  const localUrl = DEFAULT_LOCAL_DATABASE_URL;
  const liveUrl = DEFAULT_LIVE_DATABASE_URL;

  // 1. Explicit databaseUrl provided in options
  if (options?.databaseUrl) {
    const isCloud =
      options.databaseUrl.includes("supabase") ||
      options.databaseUrl.includes("render.com") ||
      options.databaseUrl.includes("neon.tech") ||
      options.databaseUrl.includes("aws");
    return { url: options.databaseUrl, target: isCloud ? "live" : "local" };
  }

  // 2. Programmatic target option
  if (options?.target === "local") {
    return { url: localUrl, target: "local" };
  }
  if (options?.target === "live") {
    if (!liveUrl) {
      throw new Error("PROD_DATABASE_URL environment variable is missing for live database.");
    }
    return { url: liveUrl, target: "live" };
  }

  // 3. Command-line flag shortcuts (e.g. npm run db:user -- --local or -1)
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
    return { url: liveUrl, target: "live" };
  }

  // 4. Interactive menu prompt when in TTY
  if (process.stdin.isTTY) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    try {
      console.log("\n=======================================================");
      console.log("             TEST USERS SEED UTILITY                   ");
      console.log("=======================================================");
      console.log("  [1] Local Database (localhost:5432/sell_digital_assets)");
      console.log("  [2] Live Database  (Supabase / Cloud Database)");
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
          return { url: liveUrl, target: "live" };
        }
        console.log("⚠️  Invalid option. Please enter '1' for Local or '2' for Live.");
      }
    } finally {
      rl.close();
    }
  }

  // 5. Non-interactive fallback defaults strictly to local database to protect live database
  return { url: localUrl, target: "local" };
}

/**
 * Core seeding function for 10 test users.
 * Inserts into chosen target database (Local or Live).
 * Fully idempotent: existing accounts are detected and skipped without mutation.
 */
export async function seedUsers(options: SeedOptions = {}): Promise<SeedResult> {
  assertSafeEnvironment();

  const quiet = options.quiet ?? false;
  const rawSellerCount = options.sellerCount ?? 5;
  const sellerCount = Math.max(1, Math.min(defaultUsers.length - 1, rawSellerCount));
  const buyerCount = defaultUsers.length - sellerCount;
  const testPassword = options.password ?? DEFAULT_TEST_PASSWORD;
  const shouldVerify = options.verifyAuth ?? true;

  // Resolve target database URL
  const { url: targetUrl, target } = await promptTargetDatabase(options);

  // Parse connection details for display
  let targetDbName = "sell_digital_assets";
  let targetHost = "localhost";
  try {
    const parsed = new URL(targetUrl.replace(/^postgresql:\/\//, "http://"));
    targetDbName = parsed.pathname.replace(/^\//, "") || targetDbName;
    targetHost = parsed.hostname || targetHost;
  } catch {
    // ignore parse error for custom formats
  }

  if (!quiet) {
    console.log("\n=======================================================");
    console.log("             SEEDING TEST USERS                        ");
    console.log("=======================================================");
    console.log(`• Target Mode:    ${target === "live" ? "☁️  LIVE / CLOUD DATABASE" : "💻 LOCAL DATABASE"}`);
    console.log(`• Target Database: ${targetDbName}`);
    console.log(`• Target Host:     ${targetHost}`);
    console.log(`• Environment:    ${process.env.NODE_ENV || "development"}`);
    console.log(`• Target Users:   ${defaultUsers.length}`);
    console.log(`• Distribution:   ${sellerCount} Sellers, ${buyerCount} Buyers`);
    console.log(`• Test Password:  ${testPassword}`);
    console.log(`• Auth Policy:    Pre-verified, Status: Active, Provider: local`);
    console.log("-------------------------------------------------------\n");
  }

  // Initialize pool for target database
  const requiresSsl = isSslRequired(targetUrl);
  const targetPool = new Pool({
    connectionString: targetUrl,
    ssl: requiresSsl ? { rejectUnauthorized: false } : undefined,
    stream: () => createResilientSocket(),
    lookup: resilientDnsLookup,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  } as any);

  try {
    // 1. Verify target database connection
    try {
      const client = await targetPool.connect();
      client.release();
    } catch (connErr: any) {
      throw new Error(
        `Could not connect to ${target === "live" ? "Live" : "Local"} Database at ${targetHost}: ${connErr.message}.\n` +
        `Verify that PostgreSQL is running and your connection settings are valid.`
      );
    }

    // 2. Resolve roles from target database
    const rolesRes = await targetPool.query<{ id: number; slug: string }>(
      "SELECT id, slug FROM roles"
    );
    const roleMap = new Map<string, number>();
    for (const r of rolesRes.rows) {
      roleMap.set(r.slug.toLowerCase(), r.id);
    }

    // 3. Validate password compliance with system security policy
    authService.validatePasswordPolicy(testPassword);

    // 4. Pre-compute password hash once using bcrypt work factor 12
    const passwordHash = await hashPassword(testPassword);

    const result: SeedResult = {
      target,
      databaseUrl: targetUrl,
      targetDbName,
      targetHost,
      total: defaultUsers.length,
      created: [],
      skipped: [],
      failed: [],
      verifiedCount: 0,
      verificationFailures: [],
      sellerCount,
      buyerCount,
    };

    // 5. Seed user accounts idempotently
    for (let idx = 0; idx < defaultUsers.length; idx++) {
      const profile = defaultUsers[idx]!;
      const assignedRole = resolveConfiguredRole(idx, defaultUsers.length, sellerCount);
      const roleId = roleMap.get(assignedRole) ?? (assignedRole === "seller" ? 2 : 3);

      try {
        // Check for existing user by case-insensitive email (CITEXT in Postgres)
        const existingRes = await targetPool.query<{
          id: string;
          role_id: number;
          name: string;
          email: string;
          status: string;
        }>(
          "SELECT id, role_id, name, email, status FROM users WHERE email = $1 AND deleted_at IS NULL LIMIT 1",
          [profile.email.toLowerCase().trim()],
        );

        if (existingRes.rows.length > 0) {
          const existing = existingRes.rows[0]!;
          const existingRoleSlug =
            existing.role_id === 1
              ? "admin"
              : existing.role_id === 2
              ? "seller"
              : "buyer";

          if (!quiet) {
            console.log(
              `  🟡 SKIPPED:  ${profile.name.padEnd(15)} (${profile.email}) - Already exists with role '${existingRoleSlug}'`
            );
          }
          result.skipped.push({
            id: existing.id,
            name: existing.name,
            email: existing.email,
            city: profile.city,
            role: existingRoleSlug,
            reason: "Account with this email already exists in target database",
          });
        } else {
          // Insert new user conforming strictly to the database schema
          const insertRes = await targetPool.query<{
            id: string;
            role_id: number;
            name: string;
            email: string;
            status: string;
          }>(
            `INSERT INTO users (role_id, name, display_name, email, password_hash, auth_provider, status, email_verified_at) 
             VALUES ($1, $2, $2, $3, $4, $5, $6, $7) 
             RETURNING id, role_id, name, email, status`,
            [
              roleId,
              profile.name.trim(),
              profile.email.toLowerCase().trim(),
              passwordHash,
              "local",
              "active",
              new Date(),
            ],
          );

          const createdUser = insertRes.rows[0]!;

          if (!quiet) {
            console.log(
              `  🟢 CREATED:  ${profile.name.padEnd(15)} (${profile.email}) as [${assignedRole.toUpperCase()}] in ${profile.city}`
            );
          }

          result.created.push({
            id: createdUser.id,
            name: createdUser.name,
            email: createdUser.email,
            city: profile.city,
            role: assignedRole,
            status: createdUser.status,
            title: profile.title,
          });
        }
      } catch (err: any) {
        if (!quiet) {
          console.error(`  🔴 FAILED:   ${profile.name} (${profile.email}) -> ${err.message}`);
        }
        result.failed.push({
          name: profile.name,
          email: profile.email,
          error: err.message,
        });
      }
    }

    // 6. Post-seed authentication verification
    if (shouldVerify) {
      if (!quiet) {
        console.log("\n-------------------------------------------------------");
        console.log("  🔐 VERIFYING AUTHENTICATION & ROLE ACCESS");
        console.log("-------------------------------------------------------");
      }

      for (let idx = 0; idx < defaultUsers.length; idx++) {
        const profile = defaultUsers[idx]!;
        const expectedRole = resolveConfiguredRole(idx, defaultUsers.length, sellerCount);

        try {
          // Query user and hash from target database
          const authCheckRes = await targetPool.query<{
            id: string;
            role_id: number;
            name: string;
            email: string;
            password_hash: string;
            status: string;
          }>(
            "SELECT id, role_id, name, email, password_hash, status FROM users WHERE email = $1 AND deleted_at IS NULL LIMIT 1",
            [profile.email.toLowerCase().trim()],
          );

          const user = authCheckRes.rows[0];
          if (!user) {
            throw new Error("User record not found in target database");
          }

          const passwordValid = await comparePassword(testPassword, user.password_hash);
          if (!passwordValid) {
            throw new Error("Password hash verification failed");
          }

          if (user.status !== "active") {
            throw new Error(`Expected status 'active', received '${user.status}'`);
          }

          const actualRole = user.role_id === 2 ? "seller" : "buyer";
          const tokens = generateTokens({
            id: user.id,
            email: user.email,
            role: actualRole,
          });

          if (!tokens.accessToken || !tokens.refreshToken) {
            throw new Error("Missing JWT tokens in authentication response");
          }

          result.verifiedCount++;
          if (!quiet) {
            console.log(`  ✅ AUTH OK:  ${profile.email.padEnd(20)} Role: ${actualRole.padEnd(7)} JWT Issued`);
          }
        } catch (authErr: any) {
          result.verificationFailures.push({
            email: profile.email,
            error: authErr.message,
          });
          if (!quiet) {
            console.error(`  ❌ AUTH ERR: ${profile.email} -> ${authErr.message}`);
          }
        }
      }
    }

    // 7. Print formatted summary report
    if (!quiet) {
      console.log("\n=======================================================");
      console.log("  📊 SEED EXECUTION SUMMARY REPORT");
      console.log("=======================================================");
      console.log(`  Target Database:           ${target === "live" ? "☁️  LIVE / CLOUD" : "💻 LOCAL"} (${targetDbName} on ${targetHost})`);
      console.log(`  Total Profiles Processed:  ${result.total}`);
      console.log(`  Newly Created:             ${result.created.length}`);
      console.log(`  Already Existing (Skipped): ${result.skipped.length}`);
      console.log(`  Failed:                    ${result.failed.length}`);
      if (shouldVerify) {
        console.log(`  Verified Authentications:  ${result.verifiedCount} / ${result.total}`);
      }
      console.log("-------------------------------------------------------");
      console.log("  ROLES BREAKDOWN:");
      console.log(`  • Sellers: ${sellerCount} (Merchant accounts)`);
      console.log(`  • Buyers:  ${buyerCount} (Purchaser accounts)`);
      console.log("-------------------------------------------------------");
      console.log("  CITIES REPRESENTED:");
      console.log("  • Lahore, Karachi, Islamabad, Rawalpindi, Faisalabad, Peshawar");
      console.log("-------------------------------------------------------");
      console.log("  TEST CREDENTIALS:");
      console.log(`  • Password: ${testPassword}`);
      console.log("  • Sample Signin Request:");
      console.log('    POST /api/v1/auth/signin');
      console.log(`    { "email": "majid@ovi.com", "password": "${testPassword}" }`);
      console.log("=======================================================");
    }

    return result;
  } finally {
    await targetPool.end().catch(() => {});
  }
}

/**
 * Parse command line arguments for CLI usage.
 */
function parseCliArgs(): SeedOptions {
  const args = process.argv.slice(2);
  const options: SeedOptions = {};

  for (const arg of args) {
    if (arg === "--help" || arg === "-h") {
      console.log(`
Usage: npm run db:user [options]
       npx tsx src/database/users.ts [options]

Target Database Options:
  --local, -1          Insert into Local Database without prompt (localhost:5432)
  --live, -2           Insert into Live Database without prompt (Supabase / Cloud)

Profile & Role Options:
  --sellers=<number>   Number of sellers to generate (1-9, default: 5)
  --buyers=<number>    Number of buyers to generate (1-9, default: 5)
  --password=<string>  Test password for accounts (default: '123456789')
  --no-verify          Skip post-seed signin verification
  -h, --help           Show this help message

Environment:
  Requires NODE_ENV=development or NODE_ENV=test.
  Execution against NODE_ENV=production is strictly blocked.
      `);
      process.exit(0);
    }

    if (arg === "--local" || arg === "-1") {
      options.target = "local";
    } else if (arg === "--live" || arg === "--cloud" || arg === "-2") {
      options.target = "live";
    } else if (arg.startsWith("--sellers=")) {
      const val = parseInt(arg.split("=")[1] || "", 10);
      if (!isNaN(val)) options.sellerCount = val;
    } else if (arg.startsWith("--buyers=")) {
      const val = parseInt(arg.split("=")[1] || "", 10);
      if (!isNaN(val)) options.sellerCount = defaultUsers.length - val;
    } else if (arg.startsWith("--password=")) {
      const pass = arg.split("=")[1];
      if (pass !== undefined) {
        options.password = pass;
      }
    } else if (arg === "--no-verify") {
      options.verifyAuth = false;
    }
  }

  return options;
}

/**
 * Entry point when executed directly via Node / tsx CLI.
 */
async function main(): Promise<void> {
  const options = parseCliArgs();
  try {
    const result = await seedUsers(options);
    if (result.failed.length > 0 || result.verificationFailures.length > 0) {
      console.error("⚠️ Seeding completed with one or more warnings/failures.");
      process.exit(1);
    }
    process.exit(0);
  } catch (err: any) {
    console.error(`\n❌ SEED FATAL ERROR: ${err.message}\n`);
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
