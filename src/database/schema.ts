import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to convert snake_case or plural to PascalCase (e.g., users -> User, products -> Product)
function toPascalCase(str: string): string {
  // Remove trailing 's' for common plurals if sensible
  let singular = str;
  if (singular.endsWith("ies")) {
    singular = singular.slice(0, -3) + "y";
  } else if (singular.endsWith("s") && !singular.endsWith("ss") && !singular.endsWith("status")) {
    singular = singular.slice(0, -1);
  }

  return singular
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

function pgTypeToTs(udtName: string, isNullable: boolean): string {
  let tsType = "string";

  switch (udtName.toLowerCase()) {
    case "int2":
    case "int4":
    case "int8":
    case "float4":
    case "float8":
    case "numeric":
      tsType = "number";
      break;
    case "bool":
      tsType = "boolean";
      break;
    case "timestamp":
    case "timestamptz":
    case "date":
    case "time":
    case "timetz":
      tsType = "Date | string";
      break;
    case "json":
    case "jsonb":
      tsType = "Record<string, unknown> | unknown[]";
      break;
    case "uuid":
    case "varchar":
    case "text":
    case "char":
    case "bpchar":
    default:
      tsType = "string";
      break;
  }

  return isNullable ? `${tsType} | null` : tsType;
}

interface ColumnInfo {
  table_name: string;
  column_name: string;
  data_type: string;
  udt_name: string;
  is_nullable: string;
  column_default: string | null;
  ordinal_position: number;
}

interface PrimaryKeyInfo {
  table_name: string;
  column_name: string;
}

async function generateSchema() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("❌ DATABASE_URL environment variable is missing in .env");
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });

  console.log("=========================================");
  console.log("🔍 Introspecting PostgreSQL Database");
  console.log("=========================================\n");

  try {
    await client.connect();

    // 1. Get all public user tables (excluding internal migration tracking table)
    const tablesRes = await client.query<{ table_name: string }>(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND table_name != 'schema_migrations'
      ORDER BY table_name;
    `);

    const tableNames = tablesRes.rows.map((r) => r.table_name);
    if (tableNames.length === 0) {
      console.log("⚠️ No tables found in public schema.");
      return;
    }

    console.log(`📋 Found ${tableNames.length} tables: ${tableNames.join(", ")}\n`);

    // 2. Fetch all columns
    const columnsRes = await client.query<ColumnInfo>(`
      SELECT
        table_name,
        column_name,
        data_type,
        udt_name,
        is_nullable,
        column_default,
        ordinal_position
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name != 'schema_migrations'
      ORDER BY table_name, ordinal_position;
    `);

    // 3. Fetch primary keys
    const pkRes = await client.query<PrimaryKeyInfo>(`
      SELECT
        kcu.table_name,
        kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = 'public';
    `);

    const primaryKeysByTable = new Map<string, Set<string>>();
    for (const pk of pkRes.rows) {
      if (!primaryKeysByTable.has(pk.table_name)) {
        primaryKeysByTable.set(pk.table_name, new Set());
      }
      primaryKeysByTable.get(pk.table_name)!.add(pk.column_name);
    }

    // Group columns by table
    const tableColumns = new Map<string, ColumnInfo[]>();
    for (const col of columnsRes.rows) {
      if (!tableColumns.has(col.table_name)) {
        tableColumns.set(col.table_name, []);
      }
      tableColumns.get(col.table_name)!.push(col);
    }

    // --- Generate schema.sql ---
    let sqlContent = `-- ========================================================\n`;
    sqlContent += `-- Auto-generated Schema Snapshot from Live PostgreSQL Database\n`;
    sqlContent += `-- Generated on: ${new Date().toISOString()}\n`;
    sqlContent += `-- ========================================================\n\n`;

    for (const tableName of tableNames) {
      const columns = tableColumns.get(tableName) || [];
      const pks = primaryKeysByTable.get(tableName) || new Set();

      sqlContent += `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
      const colDefs: string[] = [];

      for (const col of columns) {
        let def = `    ${col.column_name} ${col.udt_name.toUpperCase()}`;
        if (pks.has(col.column_name)) {
          def += " PRIMARY KEY";
        }
        if (col.column_default) {
          def += ` DEFAULT ${col.column_default}`;
        }
        if (col.is_nullable === "NO" && !pks.has(col.column_name)) {
          def += " NOT NULL";
        }
        colDefs.push(def);
      }

      sqlContent += colDefs.join(",\n");
      sqlContent += `\n);\n\n`;
    }

    const schemaSqlPath = path.join(__dirname, "schema.sql");
    fs.writeFileSync(schemaSqlPath, sqlContent, "utf-8");
    console.log(`📄 Generated SQL schema snapshot: src/database/schema.sql`);

    // --- Generate types.ts ---
    let tsContent = `/**\n`;
    tsContent += ` * Auto-generated TypeScript types from database schema\n`;
    tsContent += ` * Generated on: ${new Date().toISOString()}\n`;
    tsContent += ` * DO NOT EDIT MANUALLY - Re-generate using 'npm run db:schema'\n`;
    tsContent += ` */\n\n`;

    for (const tableName of tableNames) {
      const interfaceName = `${toPascalCase(tableName)}Entity`;
      const columns = tableColumns.get(tableName) || [];

      tsContent += `export interface ${interfaceName} {\n`;
      for (const col of columns) {
        const isNullable = col.is_nullable === "YES";
        const hasDefault = col.column_default !== null;
        const isOptional = isNullable || hasDefault;
        const optSymbol = isOptional ? "?" : "";
        const tsType = pgTypeToTs(col.udt_name, isNullable);

        tsContent += `  ${col.column_name}${optSymbol}: ${tsType};\n`;
      }
      tsContent += `}\n\n`;
    }

    // Add DatabaseSchema union / registry
    tsContent += `export interface DatabaseSchema {\n`;
    for (const tableName of tableNames) {
      const interfaceName = `${toPascalCase(tableName)}Entity`;
      tsContent += `  ${tableName}: ${interfaceName};\n`;
    }
    tsContent += `}\n`;

    const typesPath = path.join(__dirname, "types.ts");
    fs.writeFileSync(typesPath, tsContent, "utf-8");
    console.log(`📘 Generated TypeScript types: src/database/types.ts`);

    console.log("\n🎉 Schema generation completed successfully!");
  } finally {
    await client.end();
  }
}

generateSchema();
