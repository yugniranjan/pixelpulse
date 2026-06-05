// Import the LilYPad "Customer Emails By Sales" CSV into a small reference
// table (customer_children) keyed by email. The Party Hosts roster uses it as a
// LAST-RESORT fallback for a host's child name/age — only when the booking says
// TBD and the host didn't sign a matchable waiver.
//
// CSV columns: Customer, Email, Phone, Sales, Payments, Children, Children Ages
// Only rows that actually list children are imported.
//
// Safe by default: DRY RUN unless --commit. Upsert by email, so re-running is
// idempotent.
//
// Usage:
//   node import-sales-children.mjs [path-to-csv]            # dry run
//   node import-sales-children.mjs [path-to-csv] --commit   # write

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import pg from "pg";

const { Pool } = pg;

async function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const text = await readFile(path, "utf8");
  text.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) return;
    const [, key, rawValue] = match;
    if (process.env[key]) return;
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, "").replace(/\\n/g, "\n");
  });
}

function getDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const u = process.env.DATABASE_USERNAME;
  const p = process.env.DATABASE_PASSWORD;
  const host = process.env.DATABASE_HOST;
  const port = process.env.DATABASE_PORT || "5432";
  const database = process.env.DATABASE_DATABASE;
  if (!u || !p || !host || !database) {
    throw new Error("Need DATABASE_URL or DATABASE_USERNAME/PASSWORD/HOST/DATABASE.");
  }
  return `postgresql://${encodeURIComponent(u)}:${encodeURIComponent(p)}@${host}:${port}/${encodeURIComponent(database)}`;
}

function parseCsvLine(line) {
  const fields = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = false;
      } else cur += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      fields.push(cur); cur = "";
    } else cur += ch;
  }
  fields.push(cur);
  return fields;
}

function tidyList(value) {
  return String(value || "")
    .split(",")
    .map((s) => s.trim().replace(/\s+/g, " "))
    .filter(Boolean)
    .join(", ");
}

async function main() {
  const args = process.argv.slice(2);
  const commit = args.includes("--commit");
  const csvPath = args.find((a) => !a.startsWith("--")) ||
    new URL("./ReportCustomerEmailsBySales.csv", import.meta.url).pathname;

  await loadEnvFile(new URL("../../.env", import.meta.url).pathname);

  const raw = await readFile(csvPath, "utf8");
  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  lines.shift(); // header

  const records = [];
  for (const line of lines) {
    const [, email, , , , children, ages] = parseCsvLine(line);
    const emailLower = String(email || "").trim().toLowerCase();
    const childNames = tidyList(children);
    if (!emailLower || !childNames) continue; // only rows with children
    records.push({ email: emailLower, childNames, childAges: tidyList(ages) });
  }

  console.log(`\nCSV rows with children: ${records.length}`);
  records.slice(0, 12).forEach((r) =>
    console.log(`   ${r.email.padEnd(34)} ${r.childNames}  [${r.childAges}]`),
  );

  const pool = new Pool({
    connectionString: getDatabaseUrl(),
    ssl: process.env.POSTGRES_SSL === "true" ? { rejectUnauthorized: false } : false,
  });

  if (!commit) {
    console.log(`\nDRY RUN — nothing written. Re-run with --commit to upsert.\n`);
    await pool.end();
    return;
  }

  await pool.query(`
    create table if not exists customer_children (
      email text primary key,
      child_names text not null default '',
      child_ages text not null default '',
      updated_at timestamptz
    )
  `);

  let upserted = 0;
  for (const r of records) {
    await pool.query(
      `insert into customer_children (email, child_names, child_ages, updated_at)
       values ($1, $2, $3, now())
       on conflict (email) do update
         set child_names = excluded.child_names,
             child_ages = excluded.child_ages,
             updated_at = now()`,
      [r.email, r.childNames, r.childAges],
    );
    upserted++;
  }
  console.log(`\n✅ Upserted ${upserted} customer_children rows.\n`);
  await pool.end();
}

main().catch((err) => {
  console.error("Import failed:", err.message);
  process.exit(1);
});
