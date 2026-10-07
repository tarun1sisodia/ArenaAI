import pg from "pg";
import fs from "fs";
import path from "path";

try {
  process.loadEnvFile?.(".env");
} catch {
  // Ignore
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: databaseUrl,
  connectionTimeoutMillis: 10000,
});

async function run() {
  await client.connect();
  console.log("Connected to PostgreSQL successfully.");

  // 1. Fetch tables and RLS
  const tablesRes = await client.query(`
    SELECT 
      c.relname AS table_name,
      c.relrowsecurity AS rls_enabled
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' 
      AND c.relkind = 'r'
    ORDER BY c.relname;
  `);

  const tables: Array<{ name: string; rls_enabled: boolean; rows: number }> = [];
  for (const row of tablesRes.rows) {
    try {
      const countRes = await client.query(`SELECT count(*)::int AS cnt FROM public."${row.table_name}"`);
      tables.push({
        name: row.table_name,
        rls_enabled: row.rls_enabled,
        rows: countRes.rows[0].cnt,
      });
    } catch (e: any) {
      console.warn(`Could not count rows for ${row.table_name}: ${e.message}`);
      tables.push({
        name: row.table_name,
        rls_enabled: row.rls_enabled,
        rows: 0,
      });
    }
  }

  // 2. Fetch PKs
  const pkRes = await client.query(`
    SELECT
      tc.table_name,
      kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY'
      AND tc.table_schema = 'public'
    ORDER BY tc.table_name, kcu.ordinal_position;
  `);
  const pkMap = new Map<string, string[]>();
  for (const row of pkRes.rows) {
    const list = pkMap.get(row.table_name) || [];
    list.push(row.column_name);
    pkMap.set(row.table_name, list);
  }

  // 3. Fetch Enums
  const enumRes = await client.query(`
    SELECT
      t.typname AS enum_name,
      e.enumlabel AS enum_value
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
    ORDER BY t.typname, e.enumsortorder;
  `);
  const enumMap = new Map<string, string[]>();
  for (const row of enumRes.rows) {
    const list = enumMap.get(row.enum_name) || [];
    list.push(row.enum_value);
    enumMap.set(row.enum_name, list);
  }

  // 4. Fetch Columns
  const colRes = await client.query(`
    SELECT 
      col.table_name,
      col.column_name,
      col.ordinal_position,
      col.is_nullable,
      col.column_default,
      col.data_type,
      col.udt_name,
      col.character_maximum_length,
      col.numeric_precision,
      col.numeric_scale
    FROM information_schema.columns col
    WHERE col.table_schema = 'public'
    ORDER BY col.table_name, col.ordinal_position;
  `);

  // 5. Fetch Check Constraints
  const checkRes = await client.query(`
    SELECT
      tc.table_name,
      tc.constraint_name,
      cc.check_clause
    FROM information_schema.table_constraints tc
    JOIN information_schema.check_constraints cc
      ON tc.constraint_name = cc.constraint_name
    WHERE tc.table_schema = 'public'
      AND tc.constraint_type = 'CHECK'
      AND cc.check_clause NOT LIKE '%IS NOT NULL%';
  `);
  const checkMap = new Map<string, string[]>();
  for (const row of checkRes.rows) {
    const list = checkMap.get(row.table_name) || [];
    list.push(row.check_clause);
    checkMap.set(row.table_name, list);
  }

  // 6. Fetch FK Constraints
  const fkRes = await client.query(`
    SELECT
      tc.constraint_name,
      tc.table_name AS source_table,
      kcu.column_name AS source_column,
      ccu.table_name AS target_table,
      ccu.column_name AS target_column
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
    ORDER BY tc.table_name, tc.constraint_name, kcu.ordinal_position;
  `);

  // Group FKs by constraint_name and table
  interface FkGroup {
    name: string;
    sourceTable: string;
    sourceCols: string[];
    targetTable: string;
    targetCols: string[];
  }
  const fksByTable = new Map<string, FkGroup[]>();
  for (const row of fkRes.rows) {
    const list = fksByTable.get(row.source_table) || [];
    let group = list.find((g) => g.name === row.constraint_name);
    if (!group) {
      group = {
        name: row.constraint_name,
        sourceTable: row.source_table,
        sourceCols: [],
        targetTable: row.target_table,
        targetCols: [],
      };
      list.push(group);
      fksByTable.set(row.source_table, list);
    }
    if (!group.sourceCols.includes(row.source_column)) group.sourceCols.push(row.source_column);
    if (!group.targetCols.includes(row.target_column)) group.targetCols.push(row.target_column);
  }

  // Also incoming FK references (foreign keys targeting this table)
  const incomingFksByTable = new Map<string, FkGroup[]>();
  for (const [, list] of fksByTable.entries()) {
    for (const fk of list) {
      const inc = incomingFksByTable.get(fk.targetTable) || [];
      inc.push(fk);
      incomingFksByTable.set(fk.targetTable, inc);
    }
  }

  // 7. Migrations
  const migRes = await client.query(`SELECT id, applied_at FROM schema_migrations ORDER BY applied_at ASC`);
  console.log(`Total migrations applied: ${migRes.rows.length}`);

  // Build Markdown
  const nowStr = new Date().toISOString().replace("T", " ").substring(0, 19);
  const lines: string[] = [
    `# ArenaAI live Supabase schema inventory`,
    ``,
    `Generated from the live Supabase PostgreSQL inspection on ${nowStr} (IST).`,
    `Total applied migrations: **${migRes.rows.length}**.`,
    ``,
    `## Table summary`,
    ``,
    `| Table | Rows | RLS | Primary key |`,
    `|---|---:|:---:|---|`,
  ];

  for (const t of tables) {
    const pks = pkMap.get(t.name) || [];
    const pkStr = pks.length ? pks.map((k) => `\`${k}\``).join(", ") : "—";
    lines.push(
      `| \`public.${t.name}\` | ${t.rows} | ${t.rls_enabled ? "enabled" : "DISABLED"} | ${pkStr} |`
    );
  }

  lines.push("", "## Columns and types", "");

  for (const t of tables) {
    lines.push(`### \`public.${t.name}\``, "");
    lines.push(
      `| Column | PostgreSQL type | Nullable | Default | Check / enum |`,
      `|---|---|:---:|---|---|`
    );

    const cols = colRes.rows.filter((c: any) => c.table_name === t.name);
    const tableChecks = checkMap.get(t.name) || [];

    for (const c of cols) {
      const isNullable = c.is_nullable === "YES" ? "yes" : "no";
      let typ = c.data_type === "USER-DEFINED" ? c.udt_name : c.udt_name || c.data_type;
      if (typ === "varchar" && c.character_maximum_length) {
        typ = `varchar(${c.character_maximum_length})`;
      }

      // Check if enum
      let checkOrEnum = "—";
      if (enumMap.has(c.udt_name)) {
        checkOrEnum = `enum: ${enumMap.get(c.udt_name)!.join(", ")}`;
      } else {
        // Find matching check clause for this column
        const matched = tableChecks.filter((ck) => ck.includes(`(${c.column_name} `) || ck.includes(`("${c.column_name}" `) || ck.includes(`${c.column_name}::`));
        if (matched.length) {
          checkOrEnum = matched.join("; ").replace(/\|/g, "\\|");
        }
      }

      const defVal = c.column_default ? String(c.column_default).replace(/\|/g, "\\|") : "—";
      lines.push(
        `| \`${c.column_name}\` | \`${typ}\` | ${isNullable} | \`${defVal}\` | ${checkOrEnum} |`
      );
    }

    // Foreign keys
    const outgoing = fksByTable.get(t.name) || [];
    const incoming = incomingFksByTable.get(t.name) || [];

    if (outgoing.length || incoming.length) {
      lines.push("", "**Foreign keys & relations:**", "", "| Constraint | Source | Target | Direction |", "|---|---|---|---|");
      for (const fk of outgoing) {
        lines.push(
          `| \`${fk.name}\` | \`public.${fk.sourceTable}\` (${fk.sourceCols.map((x) => `\`${x}\``).join(", ")}) | \`public.${fk.targetTable}\` (${fk.targetCols.map((x) => `\`${x}\``).join(", ")}) | Outgoing (Foreign Key) |`
        );
      }
      for (const fk of incoming) {
        lines.push(
          `| \`${fk.name}\` | \`public.${fk.sourceTable}\` (${fk.sourceCols.map((x) => `\`${x}\``).join(", ")}) | \`public.${fk.targetTable}\` (${fk.targetCols.map((x) => `\`${x}\``).join(", ")}) | Incoming (Referenced by) |`
        );
      }
    }

    lines.push("");
  }

  // RLS Advisory
  const disabledTables = tables.filter((t) => !t.rls_enabled);
  lines.push(
    "## Live advisory & RLS State",
    "",
    `> **RLS Status Summary:** ${tables.length - disabledTables.length} tables have RLS enabled, and ${disabledTables.length} tables currently have RLS disabled.`,
    "",
    "### Tables with RLS DISABLED:",
    ...disabledTables.map((t) => `- \`public.${t.name}\``),
    ""
  );

  const reportPath = path.resolve("..", "reports", "live-schema-inventory.md");
  fs.writeFileSync(reportPath, lines.join("\n"), "utf-8");
  console.log(`Updated schema report written to: ${reportPath}`);
  console.log(`Processed ${tables.length} tables.`);

  await client.end();
}

run().catch((err) => {
  console.error("Error inspecting schema:", err);
  process.exit(1);
});
