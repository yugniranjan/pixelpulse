import { NextResponse } from "next/server";
import { hasPostgres } from "@/lib/postgresData";
import { query } from "@/lib/postgres";
import nodemailer from "nodemailer";
import { waiverParticipants } from "@/lib/waiverParticipants.mjs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function cleanText(value = "") {
  return String(value || "").trim();
}

function cleanEmail(value = "") {
  return cleanText(value).toLowerCase();
}

function normalizePartyId(value = "") {
  return cleanText(value).toLowerCase();
}

function canonicalPartyId(value = "") {
  return cleanText(value).replace(/\s+/g, "");
}

function partyIdExpr(column = "party_id") {
  return `lower(regexp_replace(trim(coalesce(${column}, '')), '\\s+', '', 'g'))`;
}

function waiverLink(partyId = "") {
  return partyId ? `/waiver?partyId=${encodeURIComponent(partyId)}` : "/waiver";
}

function participantCount(row = {}) {
  const value = Number(row.participant_count);
  if (Number.isFinite(value) && value > 0) return value;
  return 1;
}

function formatParty(row = {}, waiverRows = []) {
  const normalizedPartyId = normalizePartyId(canonicalPartyId(row.party_id));
  const hostEmail = cleanEmail(row.email);
  const matchingWaivers = waiverRows.filter(
    (waiver) => normalizePartyId(canonicalPartyId(waiver.party_id)) === normalizedPartyId,
  );
  const participantsCovered = matchingWaivers.reduce(
    (total, waiver) => total + participantCount(waiver),
    0,
  );
  const expectedGuests = Number(row.party_size) || 0;
  const hostSigned = Boolean(
    hostEmail &&
      matchingWaivers.some((waiver) => cleanEmail(waiver.email) === hostEmail),
  );

  return {
    partyId: row.party_id,
    hostName: cleanText(row.customer_name),
    childName: cleanText(row.child_name),
    visitDate: cleanText(row.booking_date),
    startTime: cleanText(row.start_time),
    package: cleanText(row.package),
    expectedGuests,
    waiverFormsCompleted: matchingWaivers.length,
    participantsCovered,
    signedWaivers: matchingWaivers.map((waiver) => ({
      id: waiver.id,
      name: cleanText(waiver.signer_first_name) || "Guest",
      participantsCovered: participantCount(waiver),
      participants: waiverParticipants(waiver),
    })),
    hostSigned,
    waiverLink: waiverLink(row.party_id),
    lastWaiverSubmittedAt:
      matchingWaivers
        .map((waiver) => waiver.submitted_at)
        .filter(Boolean)
        .sort()
        .at(-1) || "",
  };
}

export async function GET(req) {
  if (!hasPostgres()) {
    return NextResponse.json(
      { error: "Party dashboard is not configured yet." },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(req.url);
  const partyId = cleanText(searchParams.get("partyId"));
  const normalizedPartyId = normalizePartyId(canonicalPartyId(partyId));

  if (!partyId) {
    return NextResponse.json(
      { error: "Enter your party ID." },
      { status: 400 },
    );
  }

  try {
    const bookingResult = await query(
          `
            select party_id, customer_name, email, child_name, party_size,
                   package, booking_date, start_time
              from party_bookings
             where ${partyIdExpr()} = $1
             limit 10
          `,
          [normalizedPartyId],
        );

    let bookings = bookingResult.rows.filter((row) => cleanText(row.party_id));

    if (!bookings.length) {
      const waiverOnlyResult = await query(
        `
          select coalesce(visit->>'partyId', '') as party_id,
                 coalesce(visit->>'partyName', '') as party_name,
                 coalesce(visit->>'visitDate', '') as visit_date,
                 coalesce(visit->>'visitTime', '') as visit_time
            from waivers
           where ${partyIdExpr("visit->>'partyId'")} = $1
           order by submitted_at desc nulls last
           limit 1
        `,
        [normalizedPartyId],
      );

      const seedResult = await query(
        `
          select party_id, primary_participant, visit_date, visit_time, pass_type
            from party_waivers
           where ${partyIdExpr()} = $1
           limit 1
        `,
        [normalizedPartyId],
      );

      const waiverOnly = waiverOnlyResult.rows[0];
      const seed = seedResult.rows[0];

      if (!waiverOnly && !seed) {
        return NextResponse.json(
          {
            error:
              "No party was found. Check your party ID.",
          },
          { status: 404 },
        );
      }

      bookings = [
        {
          party_id: seed?.party_id || waiverOnly?.party_id || partyId,
          customer_name: seed?.primary_participant || waiverOnly?.party_name || "",
          email: "",
          child_name: seed?.primary_participant || waiverOnly?.party_name || "",
          party_size: 0,
          package: seed?.pass_type || "Birthday Party Package",
          booking_date: seed?.visit_date || waiverOnly?.visit_date || "",
          start_time: seed?.visit_time || waiverOnly?.visit_time || "",
        },
      ];
    }

    const partyIds = bookings.map((row) => row.party_id);
    const waiversResult = await query(
      `
        select id, coalesce(visit->>'partyId', '') as party_id,
               coalesce(primary_participant->>'email', '') as email,
               coalesce(primary_participant->>'firstName', '') as signer_first_name,
               primary_participant,
               family_members,
               participant_count,
               submitted_at
          from waivers
         where ${partyIdExpr("visit->>'partyId'")} = any($1::text[])
         order by submitted_at desc nulls last
      `,
      [partyIds.map((id) => normalizePartyId(canonicalPartyId(id)))],
    );

    const parties = bookings.map((booking) => formatParty(booking, waiversResult.rows));

    return NextResponse.json({
      parties,
      lookup: {
        type: "partyId",
        value: partyId,
      },
    });
  } catch (error) {
    console.error("party dashboard lookup failed:", error);
    return NextResponse.json(
      { error: "Unable to load party waiver status right now." },
      { status: 500 },
    );
  }
}

const emailRequests = new Map();

export async function POST(req) {
  const origin = req.headers.get("origin");
  const websiteOrigin = origin === "https://pixelpulseplay.ca" || origin === "https://www.pixelpulseplay.ca";
  if (!origin || (!websiteOrigin && origin !== new URL(req.url).origin)) {
    return NextResponse.json({ error: "Invalid request source." }, { status: 403 });
  }
  if (!hasPostgres()) return NextResponse.json({ error: "Party dashboard is not configured yet." }, { status: 503 });
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const partyId = canonicalPartyId(body?.partyId);
  const players = body?.players;
  if (!partyId || partyId.length > 200 || !Array.isArray(players) || !players.length || players.length > 500 ||
      players.some((person) => !person || typeof person.waiverId !== "string" || !/^[a-f0-9]{64}$/.test(person.participantKey))) {
    return NextResponse.json({ error: "Select the people who will play." }, { status: 400 });
  }
  const gmailUser = process.env.GMAIL_USER?.trim();
  const password = process.env.GMAIL_APP_PASSWORD?.trim();
  if (!gmailUser || !password) return NextResponse.json({ error: "Email sending is not configured." }, { status: 503 });
  const now = Date.now();
  const client = `${req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"}:${partyId.toLowerCase()}`;
  for (const [key, times] of emailRequests) if (!times.some((time) => now - time < 600000)) emailRequests.delete(key);
  const recent = (emailRequests.get(client) || []).filter((time) => now - time < 600000);
  if (recent.length >= 5) return NextResponse.json({ error: "Too many emails. Please try again later." }, { status: 429 });
  emailRequests.set(client, [...recent, now]);
  try {
    const result = await query(`select id, primary_participant, family_members from waivers
      where ${partyIdExpr("visit->>'partyId'")} = $1 and id = any($2::text[])`,
    [normalizePartyId(partyId), [...new Set(players.map((person) => person.waiverId))]]);
    const available = new Map(result.rows.flatMap((waiver) => waiverParticipants(waiver)
      .map((person) => [`${waiver.id}:${person.key}`, person])));
    const keys = [...new Set(players.map((person) => `${person.waiverId}:${person.participantKey}`))];
    if (keys.some((key) => !available.has(key))) {
      return NextResponse.json({ error: "Some participants could not be found for this party. Refresh and try again." }, { status: 400 });
    }
    const selected = keys.map((key) => available.get(key));
    const adults = selected.filter((person) => person.type === "adult").length;
    const transporter = nodemailer.createTransport({ service: "gmail", auth: { user: gmailUser, pass: password } });
    await transporter.sendMail({
      from: { name: "Pixel Pulse Play", address: process.env.GMAIL_FROM_EMAIL?.trim() || gmailUser },
      to: "connect@pixelpulseplay.ca",
      subject: `Party ${partyId.replace(/[\r\n]+/g, " ")} — Player list`,
      text: [`Party ID: ${partyId}`, `Total players: ${selected.length}`, `Adults: ${adults}`, `Minors: ${selected.length - adults}`, "", "People who will play:",
        ...selected.map((person) => `- ${person.name.replace(/[\r\n]+/g, " ")} (${person.type === "minor" ? "Minor" : "Adult"})`)].join("\n"),
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("party player email failed:", error);
    return NextResponse.json({ error: "Unable to email player list. Please try again." }, { status: 500 });
  }
}
