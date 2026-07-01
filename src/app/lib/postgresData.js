import crypto from "node:crypto";
import { getPostgresPool, query } from "@/lib/postgres";

export function hasPostgres() {
  return Boolean(getPostgresPool());
}

function timestampObject(value) {
  if (!value) return null;
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return null;
  return { _seconds: Math.floor(time / 1000), _nanoseconds: 0 };
}

function iso(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function json(value, fallback) {
  return JSON.stringify(value ?? fallback);
}

function normalizeBlogRow(row = {}) {
  const raw = row.raw || {};
  return {
    id: row.id,
    ...raw,
    title: row.title || raw.title || "",
    content: row.content ?? raw.content ?? null,
    featuredImage:
      row.featured_image ||
      raw.featuredImage ||
      raw.image ||
      raw.imageUrl ||
      raw.coverImage ||
      raw.thumbnail ||
      "",
    status: row.status || raw.status || "published",
    metaDescription:
      row.meta_description ||
      raw.metaDescription ||
      raw.excerpt ||
      raw.description ||
      "",
    createdAt: timestampObject(row.created_at || raw.createdAt),
    updatedAt: timestampObject(row.updated_at || raw.updatedAt),
  };
}

function normalizeWaiverRow(row = {}, { includeSignature = true } = {}) {
  const raw = row.raw || {};
  const waiver = {
    id: row.id,
    ...raw,
    primary: row.primary_participant || raw.primary || {},
    familyMembers: row.family_members || raw.familyMembers || [],
    visit: row.visit || raw.visit || {},
    checks: row.checks || raw.checks || {},
    attractions: row.attractions || raw.attractions || [],
    signatureDataUrl: includeSignature ? row.signature_data_url || raw.signatureDataUrl || "" : "",
    participantCount: row.participant_count || raw.participantCount || 1,
    primaryName: row.primary_name || raw.primaryName || "",
    source: row.source || raw.source || "",
    userAgent: row.user_agent || raw.userAgent || "",
    submittedAt: iso(row.submitted_at || raw.submittedAt),
    updatedAt: iso(row.updated_at || raw.updatedAt),
  };

  if (!includeSignature) {
    delete waiver.signatureDataUrl;
    if (waiver.raw?.signatureDataUrl) delete waiver.raw.signatureDataUrl;
  }

  return waiver;
}

function normalizeInviteRow(row = {}) {
  const raw = row.raw || {};
  return {
    id: row.slug,
    ...raw,
    slug: row.slug,
    active: row.active ? "1" : "0",
    childName: row.child_name || raw.childName || "",
    title: row.title || raw.title || "",
    date: row.date || raw.date || "",
    time: row.time || raw.time || "",
    waiverLink: row.waiver_link || raw.waiverLink || "",
    inviteUrl: row.invite_url || raw.inviteUrl || "",
    smsText: row.sms_text || raw.smsText || "",
    createdAt: iso(row.created_at || raw.createdAt),
    updatedAt: iso(row.updated_at || raw.updatedAt),
  };
}

function normalizePartyWaiverRow(row = {}) {
  const raw = row.raw || {};
  return {
    ...raw,
    partyId: row.party_id || raw.partyId || "",
    primaryParticipant: row.primary_participant || raw.primaryParticipant || "",
    visitDate: row.visit_date || raw.visitDate || "",
    visitTime: row.visit_time || raw.visitTime || "",
    passType: row.pass_type || raw.passType || "",
    createdAt: iso(row.created_at || raw.createdAt),
    updatedAt: iso(row.updated_at || raw.updatedAt),
  };
}

export async function fetchPostgresBlogs() {
  const result = await query(
    "select * from blogs order by created_at desc nulls last",
  );
  return result.rows.map(normalizeBlogRow);
}

export async function getPostgresBlogById(id) {
  const result = await query("select * from blogs where id = $1", [id]);
  return result.rows[0] ? normalizeBlogRow(result.rows[0]) : null;
}

export async function createPostgresBlog({ title, content, featuredImage }) {
  const id = crypto.randomUUID();
  const now = new Date();
  await query(
    `
      insert into blogs (id, title, content, featured_image, status, created_at, updated_at, raw)
      values ($1, $2, $3::jsonb, $4, 'published', $5, $5, $6::jsonb)
    `,
    [
      id,
      title,
      json(content, null),
      featuredImage || "",
      now,
      json({ title, content, featuredImage, status: "published", createdAt: now.toISOString(), updatedAt: now.toISOString() }, {}),
    ],
  );
  return id;
}

export async function updatePostgresBlog(id, { title, content, featuredImage }) {
  const existing = await getPostgresBlogById(id);
  if (!existing) return false;

  const raw = {
    ...(existing.raw || {}),
    title,
    content,
    updatedAt: new Date().toISOString(),
  };
  if (featuredImage) raw.featuredImage = featuredImage;

  await query(
    `
      update blogs
      set title = $2,
          content = $3::jsonb,
          featured_image = coalesce($4, featured_image),
          updated_at = $5,
          raw = raw || $6::jsonb
      where id = $1
    `,
    [id, title, json(content, null), featuredImage || null, new Date(), json(raw, {})],
  );
  return true;
}

export async function deletePostgresBlog(id) {
  const result = await query("delete from blogs where id = $1", [id]);
  return result.rowCount > 0;
}

export async function getPostgresAdminByEmail(email) {
  const result = await query(
    "select * from admins where lower(email) = lower($1) and active = true limit 1",
    [email],
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    active: row.active,
  };
}

export async function listPostgresWaivers(limit = 300, { includeSignature = false } = {}) {
  const columns = includeSignature
    ? "*"
    : `
      id,
      primary_participant,
      family_members,
      visit,
      checks,
      attractions,
      participant_count,
      primary_name,
      source,
      user_agent,
      submitted_at,
      updated_at
    `;
  const result = await query(
    `select ${columns} from waivers order by submitted_at desc nulls last limit $1`,
    [limit],
  );
  return result.rows.map((row) => normalizeWaiverRow(row, { includeSignature }));
}

export async function getPostgresWaiverById(id, { includeSignature = false } = {}) {
  const columns = includeSignature
    ? "*"
    : `
      id,
      primary_participant,
      family_members,
      visit,
      checks,
      attractions,
      participant_count,
      primary_name,
      source,
      user_agent,
      submitted_at,
      updated_at
    `;
  const result = await query(`select ${columns} from waivers where id = $1`, [id]);
  return result.rows[0] ? normalizeWaiverRow(result.rows[0], { includeSignature }) : null;
}

export async function getPostgresWaiverByEmail(email) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) return null;

  const result = await query(
    `
      select *
      from waivers
      where lower(primary_participant->>'email') = $1
         or lower(raw->'primary'->>'email') = $1
         or lower(raw->>'primaryEmail') = $1
      order by submitted_at desc nulls last
      limit 1
    `,
    [normalizedEmail],
  );

  return result.rows[0] ? normalizeWaiverRow(result.rows[0]) : null;
}

export async function listPostgresWaiversByEmail(email, limit = 50) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) return [];

  const result = await query(
    `
      select *
      from waivers
      where lower(primary_participant->>'email') = $1
         or lower(raw->'primary'->>'email') = $1
         or lower(raw->>'primaryEmail') = $1
      order by submitted_at desc nulls last
      limit $2
    `,
    [normalizedEmail, limit],
  );

  return result.rows.map(normalizeWaiverRow);
}

export async function createPostgresWaiver(doc) {
  const id = crypto.randomUUID();
  await query(
    `
      insert into waivers (
        id, primary_participant, family_members, visit, checks, attractions,
        signature_data_url, participant_count, primary_name, source, user_agent,
        submitted_at, updated_at, raw
      )
      values ($1, $2::jsonb, $3::jsonb, $4::jsonb, $5::jsonb, $6::jsonb, $7, $8, $9, $10, $11, $12, $13, $14::jsonb)
    `,
    [
      id,
      json(doc.primary, {}),
      json(doc.familyMembers, []),
      json(doc.visit, {}),
      json(doc.checks, {}),
      json(doc.attractions, []),
      doc.signatureDataUrl || "",
      doc.participantCount || 1,
      doc.primaryName || "",
      doc.source || "",
      doc.userAgent || "",
      doc.submittedAt || new Date(),
      doc.updatedAt || new Date(),
      json(doc, {}),
    ],
  );
  return id;
}

export async function updatePostgresWaiver(id, updateData) {
  const result = await query(
    `
      update waivers
      set primary_participant = $2::jsonb,
          visit = $3::jsonb,
          primary_name = $4,
          updated_at = $5,
          raw = raw || $6::jsonb
      where id = $1
    `,
    [
      id,
      json(updateData.primary, {}),
      json(updateData.visit, {}),
      updateData.primaryName || "",
      updateData.updatedAt || new Date(),
      json(updateData, {}),
    ],
  );
  if (result.rowCount === 0) return null;
  return getPostgresWaiverById(id);
}

export async function deletePostgresWaiver(id) {
  const result = await query("delete from waivers where id = $1", [id]);
  return result.rowCount > 0;
}

export async function getPostgresPartyWaiver(partyId) {
  const result = await query("select * from party_waivers where party_id = $1", [partyId]);
  return result.rows[0] ? normalizePartyWaiverRow(result.rows[0]) : null;
}

export async function upsertPostgresPartyWaiver(partyWaiver) {
  const now = new Date();
  await query(
    `
      insert into party_waivers (party_id, primary_participant, visit_date, visit_time, pass_type, created_at, updated_at, raw)
      values ($1, $2, $3, $4, $5, $6, $6, $7::jsonb)
      on conflict (party_id) do update set
        primary_participant = excluded.primary_participant,
        visit_date = excluded.visit_date,
        visit_time = excluded.visit_time,
        pass_type = excluded.pass_type,
        updated_at = excluded.updated_at,
        raw = excluded.raw
    `,
    [
      partyWaiver.partyId,
      partyWaiver.primaryParticipant || "",
      partyWaiver.visitDate || "",
      partyWaiver.visitTime || "",
      partyWaiver.passType || "",
      now,
      json({ ...partyWaiver, updatedAt: now.toISOString() }, {}),
    ],
  );
}

export async function getPostgresInviteBySlug(slug) {
  const result = await query("select * from invites where slug = $1", [slug]);
  return result.rows[0] ? normalizeInviteRow(result.rows[0]) : null;
}

export async function getPostgresInviteByPartyId(partyId) {
  const result = await query(
    "select * from invites where raw->>'partyId' = $1 order by updated_at desc nulls last limit 1",
    [partyId],
  );
  return result.rows[0] ? normalizeInviteRow(result.rows[0]) : null;
}

export async function listPostgresInvites(limit = 1000) {
  const result = await query(
    "select * from invites order by updated_at desc nulls last limit $1",
    [limit],
  );
  return result.rows.map(normalizeInviteRow);
}

export async function postgresInviteSlugExists(slug) {
  const result = await query("select 1 from invites where slug = $1 limit 1", [slug]);
  return result.rowCount > 0;
}

export async function upsertPostgresInvite(invite) {
  const now = new Date();
  await query(
    `
      insert into invites (slug, active, child_name, title, date, time, waiver_link, invite_url, sms_text, created_at, updated_at, raw)
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10, $11::jsonb)
      on conflict (slug) do update set
        active = excluded.active,
        child_name = excluded.child_name,
        title = excluded.title,
        date = excluded.date,
        time = excluded.time,
        waiver_link = excluded.waiver_link,
        invite_url = excluded.invite_url,
        sms_text = excluded.sms_text,
        updated_at = excluded.updated_at,
        raw = excluded.raw
    `,
    [
      invite.slug,
      !["0", "false", "no", "inactive"].includes(String(invite.active ?? "1").toLowerCase()),
      invite.childName || "",
      invite.title || "",
      invite.date || "",
      invite.time || "",
      invite.waiverLink || "",
      invite.inviteUrl || "",
      invite.smsText || "",
      now,
      json({ ...invite, updatedAt: now.toISOString() }, {}),
    ],
  );
}

export async function deletePostgresInvite(slug) {
  const result = await query("delete from invites where slug = $1", [slug]);
  return result.rowCount > 0;
}
