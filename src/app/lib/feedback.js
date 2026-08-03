import crypto from "node:crypto";
import { getPostgresPool, query } from "@/lib/postgres";
import { createGiftCard } from "@/lib/giftCards";

let tableReady;

export function hasFeedbackStore() {
  return Boolean(getPostgresPool());
}

async function ensureTable() {
  if (!tableReady) {
    tableReady = query(`
      create table if not exists feedback_submissions (
        id text primary key,
        name text not null,
        email text not null,
        phone text,
        visit_date text,
        party_id text,
        heard_about_us text,
        visit_reasons text[] not null default '{}',
        rooms text[] not null default '{}',
        ratings jsonb not null default '{}'::jsonb,
        rating_reasons jsonb not null default '{}'::jsonb,
        average_score numeric(3, 1),
        recommend text,
        return_visit text,
        favorite_moment text,
        upgrade_idea text,
        future_experiences text[] not null default '{}',
        other_future_experience text,
        marketing_consent boolean not null default false,
        gift_card_id text,
        gift_card_code text,
        gift_card_sent_at timestamptz,
        created_at timestamptz not null default now(),
        raw jsonb not null default '{}'::jsonb
      );
      alter table feedback_submissions add column if not exists gift_card_id text;
      alter table feedback_submissions add column if not exists gift_card_code text;
      alter table feedback_submissions add column if not exists gift_card_sent_at timestamptz;
      create index if not exists feedback_submissions_created_at_idx on feedback_submissions (created_at desc);
      create index if not exists feedback_submissions_average_idx on feedback_submissions (average_score);
      create index if not exists feedback_submissions_heard_about_idx on feedback_submissions (heard_about_us);
      create index if not exists feedback_submissions_gift_card_code_idx on feedback_submissions (gift_card_code);
    `).catch((error) => {
      tableReady = undefined;
      throw error;
    });
  }

  return tableReady;
}

function cleanText(value = "") {
  return String(value || "").trim();
}

function cleanArray(values = []) {
  return Array.isArray(values) ? values.map(cleanText).filter(Boolean) : [];
}

function iso(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function normalizeRow(row = {}) {
  return {
    id: row.id || "",
    name: row.name || "",
    email: row.email || "",
    phone: row.phone || "",
    visitDate: row.visit_date || row.visitDate || "",
    partyId: row.party_id || row.partyId || "",
    heardAboutUs: row.heard_about_us || row.heardAboutUs || "",
    visitReasons: row.visit_reasons || row.visitReasons || [],
    rooms: row.rooms || [],
    ratings: row.ratings || {},
    ratingReasons: row.rating_reasons || row.ratingReasons || {},
    averageScore: row.average_score === null || row.average_score === undefined ? "" : String(row.average_score),
    recommend: row.recommend || "",
    returnVisit: row.return_visit || row.returnVisit || "",
    favoriteMoment: row.favorite_moment || row.favoriteMoment || "",
    upgradeIdea: row.upgrade_idea || row.upgradeIdea || "",
    futureExperiences: row.future_experiences || row.futureExperiences || [],
    otherFutureExperience: row.other_future_experience || row.otherFutureExperience || "",
    marketingConsent: Boolean(row.marketing_consent ?? row.marketingConsent),
    giftCardId: row.gift_card_id || row.giftCardId || "",
    giftCardCode: row.gift_card_code || row.giftCardCode || "",
    giftCardSentAt: iso(row.gift_card_sent_at || row.giftCardSentAt),
    createdAt: iso(row.created_at || row.createdAt),
  };
}

export function normalizeFeedbackInput(input = {}) {
  const ratings = typeof input.ratings === "object" && input.ratings ? input.ratings : {};
  const ratingValues = Object.values(ratings)
    .map((rating) => Number(rating))
    .filter(Boolean);
  const averageScore = ratingValues.length
    ? Number((ratingValues.reduce((total, rating) => total + rating, 0) / ratingValues.length).toFixed(1))
    : null;

  return {
    id: crypto.randomUUID(),
    name: cleanText(input.name),
    email: cleanText(input.email).toLowerCase(),
    phone: cleanText(input.phone),
    visitDate: cleanText(input.visitDate),
    partyId: cleanText(input.partyId),
    heardAboutUs: cleanText(input.heardAboutUs),
    visitReasons: cleanArray(input.visitReasons),
    rooms: cleanArray(input.rooms),
    ratings,
    ratingReasons: typeof input.ratingReasons === "object" && input.ratingReasons ? input.ratingReasons : {},
    averageScore,
    recommend: cleanText(input.recommend),
    returnVisit: cleanText(input.returnVisit),
    favoriteMoment: cleanText(input.favoriteMoment),
    upgradeIdea: cleanText(input.upgradeIdea),
    futureExperiences: cleanArray(input.futureExperiences),
    otherFutureExperience: cleanText(input.otherFutureExperience),
    marketingConsent: Boolean(input.marketingConsent),
  };
}

export async function recordFeedback(input = {}) {
  if (!hasFeedbackStore()) return null;

  await ensureTable();
  const value = normalizeFeedbackInput(input);

  const result = await query(
    `
      insert into feedback_submissions (
        id, name, email, phone, visit_date, party_id, heard_about_us,
        visit_reasons, rooms, ratings, rating_reasons, average_score,
        recommend, return_visit, favorite_moment, upgrade_idea,
        future_experiences, other_future_experience, marketing_consent,
        created_at, raw
      )
      values (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10::jsonb, $11::jsonb, $12,
        $13, $14, $15, $16,
        $17, $18, $19,
        now(), $20::jsonb
      )
      returning *
    `,
    [
      value.id,
      value.name,
      value.email,
      value.phone,
      value.visitDate,
      value.partyId,
      value.heardAboutUs,
      value.visitReasons,
      value.rooms,
      JSON.stringify(value.ratings),
      JSON.stringify(value.ratingReasons),
      value.averageScore,
      value.recommend,
      value.returnVisit,
      value.favoriteMoment,
      value.upgradeIdea,
      value.futureExperiences,
      value.otherFutureExperience,
      value.marketingConsent,
      JSON.stringify(input),
    ],
  );

  return normalizeRow(result.rows[0]);
}

export async function listFeedbackSubmissions({ q = "", source = "", minRating = "", limit = 200 } = {}) {
  if (!hasFeedbackStore()) return [];

  await ensureTable();

  const values = [];
  const where = [];
  const maxLimit = Math.min(Math.max(Number(limit) || 200, 1), 1000);

  if (q) {
    values.push(`%${cleanText(q).toLowerCase()}%`);
    where.push(`(
      lower(name) like $${values.length}
      or lower(email) like $${values.length}
      or lower(coalesce(phone, '')) like $${values.length}
      or lower(coalesce(party_id, '')) like $${values.length}
      or lower(coalesce(favorite_moment, '')) like $${values.length}
      or lower(coalesce(upgrade_idea, '')) like $${values.length}
    )`);
  }

  if (source) {
    values.push(source);
    where.push(`heard_about_us = $${values.length}`);
  }

  if (minRating) {
    const rating = Number(minRating);
    if (Number.isFinite(rating)) {
      values.push(rating);
      where.push(`average_score >= $${values.length}`);
    }
  }

  values.push(maxLimit);
  const result = await query(
    `
      select *
      from feedback_submissions
      ${where.length ? `where ${where.join(" and ")}` : ""}
      order by created_at desc
      limit $${values.length}
    `,
    values,
  );

  return result.rows.map(normalizeRow);
}

export async function deleteFeedbackSubmission(id = "") {
  if (!hasFeedbackStore()) return { error: "Feedback database is not configured." };

  const feedbackId = cleanText(id);
  if (!feedbackId) return { error: "Feedback id is required." };

  await ensureTable();

  const result = await query(
    "delete from feedback_submissions where id = $1 returning id, name, email",
    [feedbackId],
  );

  if (!result.rows[0]) return { notFound: true, error: "Feedback submission not found." };

  return { deleted: result.rows[0] };
}

function feedbackGiftCardCode() {
  return `PPP-60-FB-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

export async function issueFeedbackGiftCard(id = "") {
  if (!hasFeedbackStore()) return { error: "Feedback database is not configured." };

  const feedbackId = cleanText(id);
  if (!feedbackId) return { error: "Feedback id is required." };

  await ensureTable();

  const feedbackResult = await query("select * from feedback_submissions where id = $1", [feedbackId]);
  const feedback = feedbackResult.rows[0] ? normalizeRow(feedbackResult.rows[0]) : null;

  if (!feedback) return { notFound: true, error: "Feedback submission not found." };
  if (feedback.giftCardCode) {
    return { feedback, giftCard: { id: feedback.giftCardId, code: feedback.giftCardCode } };
  }

  let created;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const result = await createGiftCard({
      code: feedbackGiftCardCode(),
      durationMinutes: 60,
      price: "0",
      recipientName: feedback.name,
      senderName: "Pixel Pulse Team",
      createdBy: `feedback:${feedback.id}`,
    });

    if (result.giftCard) {
      created = result.giftCard;
      break;
    }
    if (!result.duplicate) return { error: result.error || "Unable to create gift card." };
  }

  if (!created) return { error: "Unable to create a unique gift card code." };

  const updated = await query(
    `
      update feedback_submissions
      set gift_card_id = $2,
          gift_card_code = $3
      where id = $1
      returning *
    `,
    [feedback.id, created.id, created.code],
  );

  return {
    feedback: normalizeRow(updated.rows[0]),
    giftCard: created,
  };
}

export async function markFeedbackGiftCardSent(id = "") {
  if (!hasFeedbackStore()) return { error: "Feedback database is not configured." };

  const feedbackId = cleanText(id);
  if (!feedbackId) return { error: "Feedback id is required." };

  await ensureTable();

  const result = await query(
    `
      update feedback_submissions
      set gift_card_sent_at = now()
      where id = $1
      returning *
    `,
    [feedbackId],
  );

  if (!result.rows[0]) return { notFound: true, error: "Feedback submission not found." };

  return { feedback: normalizeRow(result.rows[0]) };
}
