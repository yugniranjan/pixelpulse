import { getPostgresPool, query } from "@/lib/postgres";

const VALID_DURATIONS = new Set([30, 60, 90]);
const VALID_STATUSES = new Set(["active", "redeemed", "void"]);

let tableReady;

export function hasPostgres() {
  return Boolean(getPostgresPool());
}

async function ensureTable() {
  if (!tableReady) {
    tableReady = query(`
      create table if not exists gift_cards (
        id uuid primary key default gen_random_uuid(),
        code text not null unique,
        duration_minutes integer not null,
        price_cents integer not null default 0,
        recipient_name text,
        sender_name text,
        status text not null default 'active',
        created_by text,
        redeemed_by text,
        redeemed_at timestamptz,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        raw jsonb not null default '{}'::jsonb
      );
      create index if not exists gift_cards_status_idx on gift_cards (status);
      create index if not exists gift_cards_created_at_idx on gift_cards (created_at desc);
    `).catch((error) => {
      tableReady = undefined;
      throw error;
    });
  }

  return tableReady;
}

function iso(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

export function normalizeGiftCardCode(value = "") {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^A-Z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function parsePriceCents(value) {
  const cleaned = String(value ?? "").replace(/[^\d.]/g, "");
  if (!cleaned) return 0;
  const amount = Number(cleaned);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return Math.round(amount * 100);
}

function normalizeRow(row = {}) {
  const raw = row.raw || {};
  return {
    id: row.id,
    code: row.code || "",
    durationMinutes: row.duration_minutes ?? raw.durationMinutes ?? null,
    priceCents: row.price_cents ?? raw.priceCents ?? 0,
    price: ((row.price_cents ?? raw.priceCents ?? 0) / 100).toFixed(2),
    recipientName: row.recipient_name || raw.recipientName || "",
    senderName: row.sender_name || raw.senderName || "",
    status: row.status || raw.status || "active",
    createdBy: row.created_by || raw.createdBy || "",
    redeemedBy: row.redeemed_by || raw.redeemedBy || "",
    redeemedAt: iso(row.redeemed_at || raw.redeemedAt),
    createdAt: iso(row.created_at || raw.createdAt),
    updatedAt: iso(row.updated_at || raw.updatedAt),
  };
}

export async function listGiftCards({ limit = 200, q = "", status = "" } = {}) {
  if (!hasPostgres()) return [];
  await ensureTable();

  const values = [];
  const where = [];

  if (q) {
    values.push(`%${q.trim().toLowerCase()}%`);
    where.push(`(
      lower(code) like $${values.length}
      or lower(coalesce(recipient_name, '')) like $${values.length}
      or lower(coalesce(sender_name, '')) like $${values.length}
    )`);
  }

  if (status && VALID_STATUSES.has(status)) {
    values.push(status);
    where.push(`status = $${values.length}`);
  }

  values.push(Math.min(Math.max(Number(limit) || 200, 1), 1000));
  const result = await query(
    `
      select *
      from gift_cards
      ${where.length ? `where ${where.join(" and ")}` : ""}
      order by created_at desc
      limit $${values.length}
    `,
    values,
  );

  return result.rows.map(normalizeRow);
}

export async function createGiftCard(input = {}) {
  if (!hasPostgres()) return { error: "Postgres is not configured." };
  await ensureTable();

  const code = normalizeGiftCardCode(input.code);
  const durationMinutes = Number(input.durationMinutes);
  const priceCents = parsePriceCents(input.price ?? input.priceCents / 100);
  const recipientName = String(input.recipientName || "").trim();
  const senderName = String(input.senderName || "").trim();
  const createdBy = String(input.createdBy || "admin").trim() || "admin";

  if (!code) return { error: "Gift card code is required." };
  if (!VALID_DURATIONS.has(durationMinutes)) {
    return { error: "Duration must be 30, 60, or 90 minutes." };
  }
  if (priceCents === null) return { error: "Enter a valid price." };

  try {
    const result = await query(
      `
        insert into gift_cards (
          code, duration_minutes, price_cents, recipient_name, sender_name,
          status, created_by, created_at, updated_at, raw
        )
        values ($1, $2, $3, $4, $5, 'active', $6, now(), now(), $7::jsonb)
        returning *
      `,
      [
        code,
        durationMinutes,
        priceCents,
        recipientName,
        senderName,
        createdBy,
        JSON.stringify({
          code,
          durationMinutes,
          priceCents,
          recipientName,
          senderName,
          createdBy,
        }),
      ],
    );

    return { giftCard: normalizeRow(result.rows[0]) };
  } catch (error) {
    if (error?.code === "23505") {
      return { duplicate: true, error: "That redemption code already exists." };
    }
    throw error;
  }
}

export async function redeemGiftCard({ code = "", redeemedBy = "admin" } = {}) {
  if (!hasPostgres()) return { error: "Postgres is not configured." };
  await ensureTable();

  const normalizedCode = normalizeGiftCardCode(code);
  if (!normalizedCode) return { error: "Gift card code is required." };

  const result = await query(
    `
      update gift_cards
      set status = 'redeemed',
          redeemed_at = now(),
          redeemed_by = $2,
          updated_at = now(),
          raw = raw || $3::jsonb
      where code = $1
        and status = 'active'
        and redeemed_at is null
      returning *
    `,
    [
      normalizedCode,
      String(redeemedBy || "admin").trim() || "admin",
      JSON.stringify({
        status: "redeemed",
        redeemedBy: String(redeemedBy || "admin").trim() || "admin",
        redeemedAt: new Date().toISOString(),
      }),
    ],
  );

  if (result.rows[0]) return { giftCard: normalizeRow(result.rows[0]) };

  const existing = await query("select * from gift_cards where code = $1 limit 1", [normalizedCode]);
  if (!existing.rows[0]) return { notFound: true, error: "Gift card code not found." };

  return {
    alreadyRedeemed: true,
    giftCard: normalizeRow(existing.rows[0]),
    error: "This gift card has already been redeemed or is not active.",
  };
}
