import { NextResponse } from "next/server";
import { db } from "@/lib/firestore";
import { hasPostgres } from "@/lib/postgresData";
import { query } from "@/lib/postgres";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Effective date for a waiver: the visit date if present, else the submission date.
const DATE_EXPR = "coalesce(nullif(w.visit->>'visitDate',''), to_char(w.submitted_at, 'YYYY-MM-DD'))";
const PARTY_EXPR = "coalesce(nullif(w.visit->>'partyId',''), '') <> ''";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function ageFromDob(dob) {
  if (!dob) return "";
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return "";
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age >= 0 && age < 120 ? age : "";
}

function extractChildren(familyMembers) {
  const members = Array.isArray(familyMembers) ? familyMembers : [];
  return members
    .filter((member) => member && member.type === "minor")
    .map((member) => ({
      name: (member.fullLegalName || [member.firstName, member.lastName].filter(Boolean).join(" ") || "").trim(),
      age: ageFromDob(member.dob),
    }))
    .filter((child) => child.name);
}

function iso(value) {
  if (!value) return "";
  if (typeof value.toDate === "function") return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function effectiveDate(waiver = {}) {
  const visitDate = String(waiver.visit?.visitDate || "").trim();
  if (DATE_RE.test(visitDate)) return visitDate;
  const submittedAt = iso(waiver.submittedAt);
  return submittedAt ? submittedAt.slice(0, 10) : "";
}

function isPartyWaiver(waiver = {}) {
  return Boolean(String(waiver.visit?.partyId || "").trim());
}

function inRange(date, from, to) {
  if (!DATE_RE.test(date)) return false;
  if (DATE_RE.test(from) && date < from) return false;
  if (DATE_RE.test(to) && date > to) return false;
  return true;
}

function periodStart(kind) {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (kind === "week") {
    const day = start.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + mondayOffset);
  } else {
    start.setDate(1);
  }

  return start;
}

async function buildFirestoreReport(from, to) {
  const snapshot = await db
    .collection("waivers")
    .select(
      "primary",
      "familyMembers",
      "visit",
      "participantCount",
      "primaryName",
      "submittedAt",
    )
    .orderBy("submittedAt", "desc")
    .limit(5000)
    .get();

  const weekStart = periodStart("week");
  const monthStart = periodStart("month");
  let weekWaivers = 0;
  let monthWaivers = 0;
  const byDateMap = new Map();
  const rows = [];

  snapshot.docs.forEach((doc) => {
    const waiver = { id: doc.id, ...(doc.data() || {}) };
    const submittedAt = iso(waiver.submittedAt);
    const submittedDate = submittedAt ? new Date(submittedAt) : null;

    if (submittedDate && submittedDate >= weekStart) weekWaivers += 1;
    if (submittedDate && submittedDate >= monthStart) monthWaivers += 1;

    const date = effectiveDate(waiver);
    if (!inRange(date, from, to)) return;

    const participants = Number(waiver.participantCount) || 1;
    const currentDate = byDateMap.get(date) || { date, waivers: 0, participants: 0 };
    currentDate.waivers += 1;
    currentDate.participants += participants;
    byDateMap.set(date, currentDate);

    rows.push({
      id: doc.id,
      date,
      primaryName: waiver.primaryName || waiver.primary?.fullLegalName || "",
      participants,
      type: isPartyWaiver(waiver) ? "Party" : "Walk-in",
      partyId: waiver.visit?.partyId || "",
      email: waiver.primary?.email || "",
      phone: waiver.primary?.phone || "",
      children: extractChildren(waiver.familyMembers),
      submittedAt,
    });
  });

  const totalWaivers = rows.length;
  const totalParticipants = rows.reduce((sum, row) => sum + row.participants, 0);
  const partyCount = rows.filter((row) => row.type === "Party").length;

  rows.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  return {
    range: { from: DATE_RE.test(from) ? from : "", to: DATE_RE.test(to) ? to : "" },
    summary: {
      totalWaivers,
      totalParticipants,
      partyCount,
      walkInCount: totalWaivers - partyCount,
      weekWaivers,
      monthWaivers,
    },
    byDate: [...byDateMap.values()].sort((a, b) => (a.date < b.date ? 1 : -1)),
    rows,
  };
}

export async function GET(req) {
  if (!hasPostgres() && !db) {
    return NextResponse.json(
      { error: "Reporting database is not configured." },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";

  if (!hasPostgres()) {
    try {
      return NextResponse.json(await buildFirestoreReport(from, to));
    } catch (error) {
      console.error("firestore waiver report failed:", error);
      return NextResponse.json({ error: "Unable to build report." }, { status: 500 });
    }
  }

  const where = [];
  const params = [];
  if (DATE_RE.test(from)) {
    params.push(from);
    where.push(`${DATE_EXPR} >= $${params.length}`);
  }
  if (DATE_RE.test(to)) {
    params.push(to);
    where.push(`${DATE_EXPR} <= $${params.length}`);
  }
  const clause = where.length ? `where ${where.join(" and ")}` : "";

  try {
    const summaryResult = await query(
      `select
         count(*)::int as total_waivers,
         coalesce(sum(w.participant_count), 0)::int as total_participants,
         count(*) filter (where ${PARTY_EXPR})::int as party_count,
         count(*) filter (where not (${PARTY_EXPR}))::int as walkin_count
       from waivers w
       ${clause}`,
      params,
    );

    // Absolute current-period KPIs (not affected by the selected range).
    const periodResult = await query(
      `select
         count(*) filter (where w.submitted_at >= date_trunc('week', now()))::int as week_waivers,
         count(*) filter (where w.submitted_at >= date_trunc('month', now()))::int as month_waivers
       from waivers w`,
    );

    const byDateResult = await query(
      `select ${DATE_EXPR} as date,
              count(*)::int as waivers,
              coalesce(sum(w.participant_count), 0)::int as participants
       from waivers w
       ${clause}
       group by 1
       order by 1 desc`,
      params,
    );

    const rowsResult = await query(
      `select
         w.id,
         ${DATE_EXPR} as date,
         coalesce(w.primary_name, '') as primary_name,
         coalesce(w.participant_count, 0)::int as participants,
         (${PARTY_EXPR}) as is_party,
         coalesce(w.visit->>'partyId', '') as party_id,
         coalesce(w.primary_participant->>'email', '') as email,
         coalesce(w.primary_participant->>'phone', '') as phone,
         w.family_members,
         w.submitted_at
       from waivers w
       ${clause}
       order by ${DATE_EXPR} desc nulls last
       limit 5000`,
      params,
    );

    const summary = summaryResult.rows[0] || {};
    const period = periodResult.rows[0] || {};

    return NextResponse.json({
      range: { from: DATE_RE.test(from) ? from : "", to: DATE_RE.test(to) ? to : "" },
      summary: {
        totalWaivers: summary.total_waivers || 0,
        totalParticipants: summary.total_participants || 0,
        partyCount: summary.party_count || 0,
        walkInCount: summary.walkin_count || 0,
        weekWaivers: period.week_waivers || 0,
        monthWaivers: period.month_waivers || 0,
      },
      byDate: byDateResult.rows.map((row) => ({
        date: row.date || "",
        waivers: row.waivers || 0,
        participants: row.participants || 0,
      })),
      rows: rowsResult.rows.map((row) => ({
        id: row.id,
        date: row.date || "",
        primaryName: row.primary_name || "",
        participants: row.participants || 0,
        type: row.is_party ? "Party" : "Walk-in",
        partyId: row.party_id || "",
        email: row.email || "",
        phone: row.phone || "",
        children: extractChildren(row.family_members),
        submittedAt: row.submitted_at ? new Date(row.submitted_at).toISOString() : "",
      })),
    });
  } catch (error) {
    console.error("waiver report failed:", error);
    return NextResponse.json({ error: "Unable to build report." }, { status: 500 });
  }
}
