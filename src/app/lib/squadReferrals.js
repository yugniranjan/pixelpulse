import crypto from "node:crypto";
import { getPostgresPool, query } from "@/lib/postgres";

export function hasPostgres() {
  return Boolean(getPostgresPool());
}

// Award tiers, highest first. `min` is the number of CONFIRMED referrals needed.
export const REFERRAL_TIERS = [
  { min: 20, label: "VIP access" },
  { min: 10, label: "Free 60-minute play pass" },
  { min: 5, label: "Arcade credits" },
];

export function getReferralTier(confirmedCount = 0) {
  return REFERRAL_TIERS.find((tier) => confirmedCount >= tier.min) || null;
}

let tableReady = false;

// Lazily ensure the table exists so the feature works even before db/schema.sql
// is (re)applied. Mirrors the canonical definition in db/schema.sql.
async function ensureTable() {
  if (tableReady) return;

  await query(`
    create table if not exists squad_referrals (
      id text primary key,
      referrer_name text,
      referrer_email text not null,
      friend_name text,
      friend_email text not null,
      promo_code text not null,
      status text not null default 'pending',
      source text,
      created_at timestamptz not null default now(),
      confirmed_at timestamptz,
      raw jsonb not null default '{}'::jsonb,
      unique (referrer_email, friend_email)
    )
  `);
  await query(
    "create index if not exists squad_referrals_referrer_idx on squad_referrals (referrer_email)",
  );
  await query(
    "create index if not exists squad_referrals_status_idx on squad_referrals (status)",
  );
  await query(
    "create unique index if not exists squad_referrals_promo_code_idx on squad_referrals (promo_code)",
  );

  tableReady = true;
}

function iso(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

/**
 * Record a batch of friend referrals from one referrer.
 *
 * @param {object} params
 * @param {string} params.referrerName
 * @param {string} params.referrerEmail
 * @param {string} [params.source]
 * @param {Array<{ email: string, promoCode: string }>} params.friends
 */
export async function recordSquadReferrals({
  referrerName = "",
  referrerEmail = "",
  source = "",
  friends = [],
}) {
  if (!hasPostgres() || !referrerEmail || !friends.length) {
    return;
  }

  await ensureTable();

  const normalizedReferrer = referrerEmail.trim().toLowerCase();

  for (const friend of friends) {
    const friendEmail = String(friend?.email || "").trim().toLowerCase();
    const promoCode = String(friend?.promoCode || "").trim();

    if (!friendEmail || !promoCode) continue;

    // A friend already referred by this referrer is not re-counted. While the
    // referral is still pending we refresh the promo code to the latest one
    // that was emailed; once confirmed, the row is left untouched.
    await query(
      `
        insert into squad_referrals (
          id, referrer_name, referrer_email, friend_email, promo_code, status, source, created_at
        )
        values ($1, $2, $3, $4, $5, 'pending', $6, now())
        on conflict (referrer_email, friend_email) do update
          set promo_code = excluded.promo_code,
              referrer_name = excluded.referrer_name,
              source = excluded.source
          where squad_referrals.status = 'pending'
      `,
      [
        crypto.randomUUID(),
        referrerName || null,
        normalizedReferrer,
        friendEmail,
        promoCode,
        source || null,
      ],
    );
  }
}

function normalizeRow(row = {}) {
  return {
    id: row.id,
    referrerName: row.referrer_name || "",
    referrerEmail: row.referrer_email || "",
    friendName: row.friend_name || "",
    friendEmail: row.friend_email || "",
    promoCode: row.promo_code || "",
    status: row.status || "pending",
    source: row.source || "",
    createdAt: iso(row.created_at),
    confirmedAt: iso(row.confirmed_at),
  };
}

/**
 * Return referrers grouped with their referral rows and confirmed counts,
 * ordered by who is closest to / furthest past an award tier.
 */
export async function listSquadReferrers() {
  if (!hasPostgres()) return [];

  await ensureTable();

  const result = await query(
    "select * from squad_referrals order by referrer_email asc, created_at asc",
  );

  const byReferrer = new Map();

  for (const raw of result.rows) {
    const row = normalizeRow(raw);
    const key = row.referrerEmail;
    if (!byReferrer.has(key)) {
      byReferrer.set(key, {
        referrerEmail: key,
        referrerName: row.referrerName,
        referrals: [],
      });
    }
    const group = byReferrer.get(key);
    if (!group.referrerName && row.referrerName) {
      group.referrerName = row.referrerName;
    }
    group.referrals.push(row);
  }

  const referrers = [...byReferrer.values()].map((group) => {
    const confirmed = group.referrals.filter((r) => r.status === "confirmed").length;
    const pending = group.referrals.filter((r) => r.status === "pending").length;
    const tier = getReferralTier(confirmed);
    return {
      ...group,
      total: group.referrals.length,
      confirmed,
      pending,
      tier: tier ? tier.label : "",
      tierMin: tier ? tier.min : 0,
    };
  });

  referrers.sort((a, b) => b.confirmed - a.confirmed || b.total - a.total);
  return referrers;
}

const ALLOWED_STATUSES = new Set(["pending", "confirmed", "rejected"]);

/**
 * Update a single referral's status. Confirming stamps confirmed_at; any other
 * status clears it.
 */
export async function setSquadReferralStatus(id, status) {
  if (!hasPostgres() || !id || !ALLOWED_STATUSES.has(status)) {
    return null;
  }

  await ensureTable();

  const confirmedAt = status === "confirmed" ? new Date() : null;
  const result = await query(
    `
      update squad_referrals
      set status = $2,
          confirmed_at = $3
      where id = $1
      returning *
    `,
    [id, status, confirmedAt],
  );

  return result.rows[0] ? normalizeRow(result.rows[0]) : null;
}
