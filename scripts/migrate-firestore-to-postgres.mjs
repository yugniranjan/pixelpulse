import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import pg from "pg";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const { Pool } = pg;

async function loadEnvFile(path = ".env") {
  if (!existsSync(path)) return;

  const envText = await readFile(path, "utf8");
  envText.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) return;

    const [, key, rawValue] = match;
    if (process.env[key]) return;

    process.env[key] = rawValue
      .replace(/^['"]|['"]$/g, "")
      .replace(/\\n/g, "\n");
  });
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

function getDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const username = process.env.DATABASE_USERNAME;
  const password = process.env.DATABASE_PASSWORD;
  const host = process.env.DATABASE_HOST;
  const port = process.env.DATABASE_PORT || "5432";
  const database = process.env.DATABASE_DATABASE;

  if (!username || !password || !host || !database) {
    throw new Error(
      "DATABASE_URL is required, or provide DATABASE_USERNAME, DATABASE_PASSWORD, DATABASE_HOST, and DATABASE_DATABASE.",
    );
  }

  return `postgresql://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${encodeURIComponent(database)}`;
}

function initFirestore() {
  const serviceAccount = {
    projectId: requireEnv("GCP_PROJECT_ID"),
    clientEmail: requireEnv("GCP_CLIENT_EMAIL"),
    privateKey: requireEnv("GCP_PRIVATE_KEY").replace(/\\n/g, "\n"),
  };

  if (!getApps().length) {
    initializeApp({
      credential: cert(serviceAccount),
    });
  }

  return getFirestore(undefined, process.env.FIRESTORE_DATABASE_ID || "pixelpulse");
}

function toPlainValue(value) {
  if (!value) return value;

  if (typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(toPlainValue);
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, toPlainValue(nestedValue)]),
    );
  }

  return value;
}

function toTimestamp(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  if (value instanceof Date) return value;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function json(value, fallback) {
  return JSON.stringify(value ?? fallback);
}

function parseBlogContent(value) {
  if (!value) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  return value;
}

async function migrateBlogs(firestore, postgres) {
  const snapshot = await firestore.collection("blogs").get();

  for (const doc of snapshot.docs) {
    const data = doc.data() || {};
    const raw = toPlainValue(data);

    await postgres.query(
      `
        insert into blogs (
          id, title, content, featured_image, status, meta_description,
          created_at, updated_at, raw
        )
        values ($1, $2, $3::jsonb, $4, $5, $6, $7, $8, $9::jsonb)
        on conflict (id) do update set
          title = excluded.title,
          content = excluded.content,
          featured_image = excluded.featured_image,
          status = excluded.status,
          meta_description = excluded.meta_description,
          created_at = excluded.created_at,
          updated_at = excluded.updated_at,
          raw = excluded.raw
      `,
      [
        doc.id,
        data.title || "",
        json(parseBlogContent(data.content), null),
        data.featuredImage || data.image || data.imageUrl || data.coverImage || data.thumbnail || "",
        data.status || "published",
        data.metaDescription || data.excerpt || data.description || "",
        toTimestamp(data.createdAt),
        toTimestamp(data.updatedAt),
        json(raw, {}),
      ],
    );
  }

  return snapshot.size;
}

async function migrateWaivers(firestore, postgres) {
  const snapshot = await firestore.collection("waivers").get();

  for (const doc of snapshot.docs) {
    const data = doc.data() || {};
    const raw = toPlainValue(data);

    await postgres.query(
      `
        insert into waivers (
          id, primary_participant, family_members, visit, checks, attractions,
          signature_data_url, participant_count, primary_name, source, user_agent,
          submitted_at, updated_at, raw
        )
        values (
          $1, $2::jsonb, $3::jsonb, $4::jsonb, $5::jsonb, $6::jsonb,
          $7, $8, $9, $10, $11, $12, $13, $14::jsonb
        )
        on conflict (id) do update set
          primary_participant = excluded.primary_participant,
          family_members = excluded.family_members,
          visit = excluded.visit,
          checks = excluded.checks,
          attractions = excluded.attractions,
          signature_data_url = excluded.signature_data_url,
          participant_count = excluded.participant_count,
          primary_name = excluded.primary_name,
          source = excluded.source,
          user_agent = excluded.user_agent,
          submitted_at = excluded.submitted_at,
          updated_at = excluded.updated_at,
          raw = excluded.raw
      `,
      [
        doc.id,
        json(raw.primary, {}),
        json(raw.familyMembers, []),
        json(raw.visit, {}),
        json(raw.checks, {}),
        json(raw.attractions, []),
        data.signatureDataUrl || "",
        Number(data.participantCount) || 1,
        data.primaryName || raw.primary?.fullLegalName || "",
        data.source || "",
        data.userAgent || "",
        toTimestamp(data.submittedAt),
        toTimestamp(data.updatedAt),
        json(raw, {}),
      ],
    );
  }

  return snapshot.size;
}

async function migrateAdmins(firestore, postgres) {
  const snapshot = await firestore.collection("admins").get();

  for (const doc of snapshot.docs) {
    const data = doc.data() || {};
    const raw = toPlainValue(data);

    await postgres.query(
      `
        insert into admins (
          id, email, password_hash, role, active, created_at, updated_at, raw
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
        on conflict (id) do update set
          email = excluded.email,
          password_hash = excluded.password_hash,
          role = excluded.role,
          active = excluded.active,
          created_at = excluded.created_at,
          updated_at = excluded.updated_at,
          raw = excluded.raw
      `,
      [
        doc.id,
        data.email || "",
        data.passwordHash || "",
        data.role || "admin",
        data.active !== false,
        toTimestamp(data.createdAt),
        toTimestamp(data.updatedAt),
        json(raw, {}),
      ],
    );
  }

  return snapshot.size;
}

async function migrateInvites(firestore, postgres) {
  const snapshot = await firestore.collection("invites").get();

  for (const doc of snapshot.docs) {
    const data = doc.data() || {};
    const raw = toPlainValue(data);
    const slug = data.slug || doc.id;

    await postgres.query(
      `
        insert into invites (
          slug, active, child_name, title, date, time, waiver_link,
          invite_url, sms_text, created_at, updated_at, raw
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb)
        on conflict (slug) do update set
          active = excluded.active,
          child_name = excluded.child_name,
          title = excluded.title,
          date = excluded.date,
          time = excluded.time,
          waiver_link = excluded.waiver_link,
          invite_url = excluded.invite_url,
          sms_text = excluded.sms_text,
          created_at = excluded.created_at,
          updated_at = excluded.updated_at,
          raw = excluded.raw
      `,
      [
        slug,
        !["0", "false", "no", "inactive"].includes(String(data.active ?? "1").toLowerCase()),
        data.childName || "",
        data.title || "",
        data.date || "",
        data.time || "",
        data.waiverLink || "",
        data.inviteUrl || "",
        data.smsText || "",
        toTimestamp(data.createdAt),
        toTimestamp(data.updatedAt),
        json(raw, {}),
      ],
    );
  }

  return snapshot.size;
}

async function migratePartyWaivers(firestore, postgres) {
  const snapshot = await firestore.collection("partyWaivers").get();

  for (const doc of snapshot.docs) {
    const data = doc.data() || {};
    const raw = toPlainValue(data);
    const partyId = data.partyId || doc.id;

    await postgres.query(
      `
        insert into party_waivers (
          party_id, primary_participant, visit_date, visit_time,
          pass_type, created_at, updated_at, raw
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
        on conflict (party_id) do update set
          primary_participant = excluded.primary_participant,
          visit_date = excluded.visit_date,
          visit_time = excluded.visit_time,
          pass_type = excluded.pass_type,
          created_at = excluded.created_at,
          updated_at = excluded.updated_at,
          raw = excluded.raw
      `,
      [
        partyId,
        data.primaryParticipant || "",
        data.visitDate || "",
        data.visitTime || "",
        data.passType || "",
        toTimestamp(data.createdAt),
        toTimestamp(data.updatedAt),
        json(raw, {}),
      ],
    );
  }

  return snapshot.size;
}

async function main() {
  await loadEnvFile();

  const firestore = initFirestore();
  const postgres = new Pool({
    connectionString: getDatabaseUrl(),
    ssl:
      process.env.POSTGRES_SSL === "false"
        ? false
        : { rejectUnauthorized: false },
  });

  const schema = await readFile(new URL("../db/schema.sql", import.meta.url), "utf8");
  await postgres.query(schema);

  const counts = {
    blogs: await migrateBlogs(firestore, postgres),
    waivers: await migrateWaivers(firestore, postgres),
    admins: await migrateAdmins(firestore, postgres),
    invites: await migrateInvites(firestore, postgres),
    partyWaivers: await migratePartyWaivers(firestore, postgres),
  };

  await postgres.end();
  console.log("Firestore to Postgres migration complete:", counts);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
