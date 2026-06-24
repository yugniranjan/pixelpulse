// Import a LilYPad "Report List Of Customer Waivers" CSV into the waivers table.
//
// The CSV is one row per person:
//   Name, Phone, Email, "DOB (Age: N)", Adult|Child, SignedDate, Version
// A waiver record is one family group, so rows are grouped by email + signed
// date: the Adult becomes the primary participant, Children become family
// members (type "minor"), which is exactly what the waiver report reads.
//
// Safe by default: runs as a DRY RUN unless you pass --commit. Skips any email
// already present in the waivers table, so re-running won't create duplicates.
//
// Usage:
//   node import-waivers.mjs [path-to-csv]            # dry run (default file)
//   node import-waivers.mjs [path-to-csv] --commit   # actually insert

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import crypto from "node:crypto";
import pg from "pg";

const { Pool } = pg;

const MONTHS = {
  Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
  Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
};

// ---- env / db --------------------------------------------------------------
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

// ---- csv parsing -----------------------------------------------------------
// Minimal CSV line parser: handles quoted fields with embedded commas.
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

function toIsoDate(value) {
  // "May 09, 1981 (Age: 45)" or "Apr 01, 2026" -> "1981-05-09"
  const m = String(value).match(/([A-Za-z]{3})\s+(\d{1,2}),\s*(\d{4})/);
  if (!m) return "";
  const month = MONTHS[m[1]];
  if (!month) return "";
  return `${m[3]}-${month}-${String(m[2]).padStart(2, "0")}`;
}

function splitName(full) {
  const clean = String(full).trim().replace(/\s+/g, " ");
  const parts = clean.split(" ");
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function parseRow(fields) {
  const [name, phone, email, dobAge, type, signed] = fields;
  const { firstName, lastName } = splitName(name);
  return {
    fullName: String(name).trim().replace(/\s+/g, " "),
    firstName,
    lastName,
    phone: String(phone).trim(),
    email: String(email).trim(),
    emailLower: String(email).trim().toLowerCase(),
    dob: toIsoDate(dobAge),
    type: /child/i.test(type) ? "minor" : "adult",
    signedDate: toIsoDate(signed),
  };
}

// ---- build waiver docs -----------------------------------------------------
function buildParticipant(row, role) {
  return {
    type: role,
    firstName: row.firstName,
    lastName: row.lastName,
    dob: row.dob,
    gender: "",
    email: row.emailLower,
    phone: row.phone,
    city: "",
    healthCondition: "Not Applicable",
    medicalNotes: "",
    fullLegalName: row.fullName,
  };
}

function buildWaiverDoc(rows) {
  const primaryRow = rows.find((r) => r.type === "adult") || rows[0];
  const others = rows.filter((r) => r !== primaryRow);
  const primary = buildParticipant(primaryRow, "primary");
  const familyMembers = others.map((r) => buildParticipant(r, r.type));
  const signed = primaryRow.signedDate;
  // Noon local-ish to avoid any date rollover when stored as timestamptz.
  const submittedAt = signed ? new Date(`${signed}T12:00:00-04:00`) : new Date();
  return {
    primary: { ...primary, emailNormalized: primary.email },
    familyMembers,
    visit: {
      partyId: "",
      partyName: "",
      passType: "",
      visitDate: signed,
      visitTime: "",
      emergencyName: "",
      emergencyRelation: "",
      emergencyPhone: "",
      printName: primary.fullLegalName,
      signDate: signed,
    },
    checks: {},
    attractions: [],
    signatureDataUrl: "",
    participantCount: rows.length,
    primaryName: primary.fullLegalName,
    source: "lilypad-waiver-import",
    userAgent: "",
    submittedAt,
    updatedAt: submittedAt,
  };
}

// ---- main ------------------------------------------------------------------
async function main() {
  const args = process.argv.slice(2);
  const commit = args.includes("--commit");
  const csvPath = args.find((a) => !a.startsWith("--")) ||
    new URL("./ReportListOfCustomerWaivers.csv", import.meta.url).pathname;

  await loadEnvFile(new URL("../../.env", import.meta.url).pathname);

  const raw = await readFile(csvPath, "utf8");
  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  const rows = lines.map((l) => parseRow(parseCsvLine(l)));

  // Group by email + signed date.
  const groups = new Map();
  const problems = [];
  for (const row of rows) {
    if (!row.emailLower) { problems.push(`No email: ${row.fullName}`); continue; }
    if (!row.signedDate) { problems.push(`No signed date: ${row.fullName}`); continue; }
    if (!row.dob) { problems.push(`No/!parsed DOB: ${row.fullName}`); }
    const key = `${row.emailLower}|${row.signedDate}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }

  const pool = new Pool({
    connectionString: getDatabaseUrl(),
    ssl: process.env.POSTGRES_SSL === "true" ? { rejectUnauthorized: false } : false,
  });

  // Existing emails -> skip (idempotent re-runs, no clobbering live waivers).
  const existing = new Set();
  const res = await pool.query(
    "select distinct lower(primary_participant->>'email') as email from waivers",
  );
  res.rows.forEach((r) => r.email && existing.add(r.email));

  const docs = [];
  const skipped = [];
  for (const [key, groupRows] of groups) {
    const email = key.split("|")[0];
    if (existing.has(email)) { skipped.push(key); continue; }
    docs.push(buildWaiverDoc(groupRows));
  }

  const totalParticipants = docs.reduce((n, d) => n + d.participantCount, 0);

  console.log(`\nParsed rows:        ${rows.length}`);
  console.log(`Waiver groups:      ${groups.size}`);
  console.log(`Already in DB (skip): ${skipped.length}`);
  console.log(`To insert:          ${docs.length}  (${totalParticipants} participants)`);
  if (problems.length) {
    console.log(`\n⚠ Data notes (${problems.length}):`);
    problems.slice(0, 20).forEach((p) => console.log(`   - ${p}`));
  }
  console.log(`\nSample of waivers to insert:`);
  docs.slice(0, 12).forEach((d) => {
    const kids = d.familyMembers.filter((m) => m.type === "minor").length;
    console.log(
      `   ${d.visit.signDate}  ${d.primaryName.padEnd(26)} ` +
      `${String(d.participantCount).padStart(2)} ppl (${kids} child)  ${d.primary.email}`,
    );
  });

  if (!commit) {
    console.log(`\nDRY RUN — nothing written. Re-run with --commit to insert.\n`);
    await pool.end();
    return;
  }

  console.log(`\nInserting ${docs.length} waivers…`);
  let inserted = 0;
  for (const d of docs) {
    await pool.query(
      `insert into waivers (
         id, primary_participant, family_members, visit, checks, attractions,
         signature_data_url, participant_count, primary_name, source, user_agent,
         submitted_at, updated_at, raw
       ) values ($1,$2::jsonb,$3::jsonb,$4::jsonb,$5::jsonb,$6::jsonb,$7,$8,$9,$10,$11,$12,$13,$14::jsonb)`,
      [
        crypto.randomUUID(),
        JSON.stringify(d.primary),
        JSON.stringify(d.familyMembers),
        JSON.stringify(d.visit),
        JSON.stringify(d.checks),
        JSON.stringify(d.attractions),
        d.signatureDataUrl,
        d.participantCount,
        d.primaryName,
        d.source,
        d.userAgent,
        d.submittedAt,
        d.updatedAt,
        JSON.stringify(d),
      ],
    );
    inserted++;
  }
  console.log(`✅ Inserted ${inserted} waivers.\n`);
  await pool.end();
}

main().catch((err) => {
  console.error("Import failed:", err.message);
  process.exit(1);
});
