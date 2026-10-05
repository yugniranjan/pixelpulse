import { NextResponse } from "next/server";
import { hasPostgres } from "@/lib/postgresData";
import { query } from "@/lib/postgres";

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
      name: cleanText(waiver.signer_first_name) || "Guest",
      participantsCovered: participantCount(waiver),
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
        select coalesce(visit->>'partyId', '') as party_id,
               coalesce(primary_participant->>'email', '') as email,
               coalesce(primary_participant->>'firstName', '') as signer_first_name,
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
