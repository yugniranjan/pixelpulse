import { getPostgresPool, query } from "@/lib/postgres";
import { db } from "@/lib/firestore";

const VALID_DURATIONS = new Set([30, 60, 90]);
const VALID_STATUSES = new Set(["active", "redeemed", "void"]);

let tableReady;

export function hasPostgres() {
  return Boolean(getPostgresPool());
}

export function hasGiftCardStore() {
  return hasPostgres() || Boolean(db);
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
  if (typeof value.toDate === "function") return value.toDate().toISOString();
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
  const durationMinutes = row.duration_minutes ?? row.durationMinutes ?? raw.durationMinutes ?? null;
  const priceCents = row.price_cents ?? row.priceCents ?? raw.priceCents ?? 0;
  return {
    id: row.id,
    code: row.code || "",
    durationMinutes,
    priceCents,
    price: (priceCents / 100).toFixed(2),
    recipientName: row.recipient_name || row.recipientName || raw.recipientName || "",
    senderName: row.sender_name || row.senderName || raw.senderName || "",
    status: row.status || raw.status || "active",
    createdBy: row.created_by || row.createdBy || raw.createdBy || "",
    redeemedBy: row.redeemed_by || row.redeemedBy || raw.redeemedBy || "",
    redeemedAt: iso(row.redeemed_at || row.redeemedAt || raw.redeemedAt),
    createdAt: iso(row.created_at || row.createdAt || raw.createdAt),
    updatedAt: iso(row.updated_at || row.updatedAt || raw.updatedAt),
  };
}

export async function listGiftCards({ limit = 200, q = "", status = "" } = {}) {
  if (!hasGiftCardStore()) return [];

  const maxLimit = Math.min(Math.max(Number(limit) || 200, 1), 1000);

  if (!hasPostgres()) {
    const snapshot = await db
      .collection("giftCards")
      .orderBy("createdAt", "desc")
      .limit(maxLimit)
      .get();
    const needle = String(q || "").trim().toLowerCase();
    return snapshot.docs
      .map((doc) => normalizeRow({ id: doc.id, ...doc.data() }))
      .filter((card) => {
        if (status && VALID_STATUSES.has(status) && card.status !== status) return false;
        if (!needle) return true;
        return [card.code, card.recipientName, card.senderName]
          .some((value) => String(value || "").toLowerCase().includes(needle));
      });
  }

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

  values.push(maxLimit);
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
  if (!hasGiftCardStore()) return { error: "Gift card database is not configured." };

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

  if (!hasPostgres()) {
    const now = new Date();
    const ref = db.collection("giftCards").doc(code);
    const giftCardData = {
      code,
      durationMinutes,
      priceCents,
      recipientName,
      senderName,
      status: "active",
      createdBy,
      redeemedBy: "",
      redeemedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (snapshot.exists) return { duplicate: true, error: "That redemption code already exists." };
      transaction.set(ref, giftCardData);
      return { giftCard: normalizeRow({ id: code, ...giftCardData }) };
    });

    return result;
  }

  await ensureTable();

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
  if (!hasGiftCardStore()) return { error: "Gift card database is not configured." };

  const normalizedCode = normalizeGiftCardCode(code);
  if (!normalizedCode) return { error: "Gift card code is required." };

  if (!hasPostgres()) {
    const ref = db.collection("giftCards").doc(normalizedCode);
    return db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists) return { notFound: true, error: "Gift card code not found." };

      const current = { id: snapshot.id, ...snapshot.data() };
      const normalizedCurrent = normalizeRow(current);
      if (normalizedCurrent.status !== "active" || normalizedCurrent.redeemedAt) {
        return {
          alreadyRedeemed: true,
          giftCard: normalizedCurrent,
          error: "This gift card has already been redeemed or is not active.",
        };
      }

      const now = new Date();
      const next = {
        ...current,
        status: "redeemed",
        redeemedBy: String(redeemedBy || "admin").trim() || "admin",
        redeemedAt: now,
        updatedAt: now,
      };
      transaction.update(ref, {
        status: next.status,
        redeemedBy: next.redeemedBy,
        redeemedAt: next.redeemedAt,
        updatedAt: next.updatedAt,
      });

      return { giftCard: normalizeRow(next) };
    });
  }

  await ensureTable();

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

export async function updateGiftCard(input = {}) {
  if (!hasGiftCardStore()) return { error: "Gift card database is not configured." };

  const id = String(input.id || "").trim();
  const currentCode = normalizeGiftCardCode(input.currentCode || input.code);
  const code = normalizeGiftCardCode(input.code);
  const durationMinutes = Number(input.durationMinutes);
  const priceCents = parsePriceCents(input.price ?? input.priceCents / 100);
  const senderName = String(input.senderName || "").trim();

  if (!id && !currentCode) return { error: "Gift card id or code is required." };
  if (!code) return { error: "Gift card code is required." };
  if (!VALID_DURATIONS.has(durationMinutes)) {
    return { error: "Duration must be 30, 60, or 90 minutes." };
  }
  if (priceCents === null) return { error: "Enter a valid price." };

  if (!hasPostgres()) {
    const lookupId = id || currentCode;
    const currentRef = db.collection("giftCards").doc(lookupId);
    const nextRef = db.collection("giftCards").doc(code);
    return db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(currentRef);
      if (!snapshot.exists) return { notFound: true, error: "Gift card not found." };

      const current = { id: snapshot.id, ...snapshot.data() };
      const normalizedCurrent = normalizeRow(current);
      if (normalizedCurrent.status !== "active" || normalizedCurrent.redeemedAt) {
        return { notActive: true, giftCard: normalizedCurrent, error: "Only active gift cards can be edited." };
      }

      if (code !== lookupId) {
        const duplicate = await transaction.get(nextRef);
        if (duplicate.exists) return { duplicate: true, error: "That redemption code already exists." };
      }

      const now = new Date();
      const next = {
        code,
        durationMinutes,
        priceCents,
        recipientName: "",
        senderName,
        status: normalizedCurrent.status,
        createdBy: normalizedCurrent.createdBy,
        redeemedBy: normalizedCurrent.redeemedBy,
        redeemedAt: normalizedCurrent.redeemedAt || null,
        createdAt: current.createdAt || now,
        updatedAt: now,
      };

      if (code === lookupId) {
        transaction.update(currentRef, next);
      } else {
        transaction.set(nextRef, next);
        transaction.delete(currentRef);
      }

      return { giftCard: normalizeRow({ ...next, id: code }) };
    });
  }

  await ensureTable();

  try {
    const result = await query(
      `
        update gift_cards
        set code = $3,
            duration_minutes = $4,
            price_cents = $5,
            recipient_name = '',
            sender_name = $6,
            updated_at = now(),
            raw = raw || $7::jsonb
        where (${id ? "id = $1" : "false"} or code = $2)
          and status = 'active'
          and redeemed_at is null
        returning *
      `,
      [
        id,
        currentCode,
        code,
        durationMinutes,
        priceCents,
        senderName,
        JSON.stringify({
          code,
          durationMinutes,
          priceCents,
          senderName,
          updatedAt: new Date().toISOString(),
        }),
      ],
    );

    if (result.rows[0]) return { giftCard: normalizeRow(result.rows[0]) };

    const existing = await query(`select * from gift_cards where ${id ? "id = $1" : "false"} or code = $2 limit 1`, [
      id,
      currentCode,
    ]);
    if (!existing.rows[0]) return { notFound: true, error: "Gift card not found." };

    return { notActive: true, giftCard: normalizeRow(existing.rows[0]), error: "Only active gift cards can be edited." };
  } catch (error) {
    if (error?.code === "23505") {
      return { duplicate: true, error: "That redemption code already exists." };
    }
    throw error;
  }
}

export async function deleteRedeemedGiftCard({ id = "", code = "" } = {}) {
  if (!hasGiftCardStore()) return { error: "Gift card database is not configured." };

  const normalizedId = String(id || "").trim();
  const normalizedCode = normalizeGiftCardCode(code);
  if (!normalizedId && !normalizedCode) return { error: "Gift card id or code is required." };

  if (!hasPostgres()) {
    const lookupId = normalizedId || normalizedCode;
    const ref = db.collection("giftCards").doc(lookupId);
    return db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists) return { notFound: true, error: "Gift card not found." };

      const giftCard = normalizeRow({ id: snapshot.id, ...snapshot.data() });
      if (giftCard.status !== "redeemed") {
        return { notRedeemed: true, giftCard, error: "Only redeemed gift cards can be deleted." };
      }

      transaction.delete(ref);
      return { giftCard };
    });
  }

  await ensureTable();

  const result = await query(
    `
      delete from gift_cards
      where (${normalizedId ? "id = $1" : "false"} or code = $2)
        and status = 'redeemed'
      returning *
    `,
    [normalizedId, normalizedCode],
  );

  if (result.rows[0]) return { giftCard: normalizeRow(result.rows[0]) };

  const existing = await query(`select * from gift_cards where ${normalizedId ? "id = $1" : "false"} or code = $2 limit 1`, [
    normalizedId,
    normalizedCode,
  ]);
  if (!existing.rows[0]) return { notFound: true, error: "Gift card not found." };

  return { notRedeemed: true, giftCard: normalizeRow(existing.rows[0]), error: "Only redeemed gift cards can be deleted." };
}
