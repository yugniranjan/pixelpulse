// Import the LilYPad "Export Customers" report into customer_children.
//
// This export has structured child columns (C1/C2/C3) WITH birthdates, so it is
// the best source for a host's children — real ages, up to 3 kids per customer.
// It upserts customer_children (keyed by email) with source='customer-export',
// which the Party Hosts roster uses as a child fallback (ranked above the
// lower-quality sales report).
//
// Safe by default: DRY RUN unless --commit. Idempotent upsert by email.
//
// Usage:
//   node import-customer-children.mjs "/path/to/ReportExportCustomers.csv"
//   node import-customer-children.mjs "/path/to/ReportExportCustomers.csv" --commit

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import pg from "pg";

const { Pool } = pg;

const MONTHS = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

// Child column blocks start at index 20, each 11 wide (C1, C2, C3).
const CHILD_BASES = [20, 31, 42];
const EMAIL_COL = 4;

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

// Full CSV parser — handles quoted fields, "" escapes, and newlines INSIDE
// quotes (this export has multi-line address fields).
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field); field = "";
    } else if (ch === "\n") {
      row.push(field); field = "";
      rows.push(row); row = [];
    } else if (ch === "\r") {
      // ignore; newline handled on \n
    } else field += ch;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function ageFromDob(dob) {
  const m = String(dob || "").trim().match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (!m) return "";
  const month = MONTHS[m[2].toLowerCase()];
  if (month == null) return "";
  const birth = new Date(Date.UTC(Number(m[3]), month, Number(m[1])));
  if (Number.isNaN(birth.getTime())) return "";
  const now = new Date();
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const md = now.getUTCMonth() - birth.getUTCMonth();
  if (md < 0 || (md === 0 && now.getUTCDate() < birth.getUTCDate())) age -= 1;
  return age >= 0 && age < 120 ? age : "";
}

async function main() {
  const args = process.argv.slice(2);
  const commit = args.includes("--commit");
  const csvPath = args.find((a) => !a.startsWith("--")) ||
    new URL("./ReportExportCustomers.csv", import.meta.url).pathname;

  if (!existsSync(csvPath)) {
    throw new Error(`CSV not found: ${csvPath}\nPass the path as the first argument.`);
  }

  await loadEnvFile(new URL("../../.env", import.meta.url).pathname);

  const rows = parseCsv(await readFile(csvPath, "utf8"));
  rows.shift(); // header

  const records = [];
  let noChildren = 0;
  for (const row of rows) {
    if (!row || row.length < 5) continue;
    const email = String(row[EMAIL_COL] || "").trim().toLowerCase();
    if (!email) continue;
    const children = [];
    for (const base of CHILD_BASES) {
      const first = String(row[base + 1] || "").trim().replace(/\s+/g, " ");
      const last = String(row[base + 2] || "").trim().replace(/\s+/g, " ");
      const dob = String(row[base + 4] || "").trim();
      if (!first && !last) continue;
      children.push({ name: [first, last].filter(Boolean).join(" "), age: ageFromDob(dob) });
    }
    if (!children.length) { noChildren++; continue; }
    records.push({
      email,
      childNames: children.map((c) => c.name).join(", "),
      childAges: children.map((c) => c.age).filter((a) => a !== "").join(", "),
    });
  }

  console.log(`\nParsed customer rows:   ${rows.length}`);
  console.log(`Rows with children:     ${records.length}`);
  console.log(`Rows without children:  ${noChildren}`);
  console.log(`\nSample:`);
  records.slice(0, 12).forEach((r) =>
    console.log(`   ${r.email.padEnd(32)} ${r.childNames}  [${r.childAges}]`),
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
  await pool.query(`alter table customer_children add column if not exists source text not null default ''`);

  let upserted = 0;
  for (const r of records) {
    await pool.query(
      `insert into customer_children (email, child_names, child_ages, source, updated_at)
       values ($1, $2, $3, 'customer-export', now())
       on conflict (email) do update
         set child_names = excluded.child_names,
             child_ages = excluded.child_ages,
             source = 'customer-export',
             updated_at = now()`,
      [r.email, r.childNames, r.childAges],
    );
    upserted++;
  }
  console.log(`\n✅ Upserted ${upserted} customer_children rows (source=customer-export).\n`);
  await pool.end();
}

main().catch((err) => {
  console.error("Import failed:", err.message);
  process.exit(1);
});
