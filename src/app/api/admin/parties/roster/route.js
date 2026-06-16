import { NextResponse } from "next/server";
import { hasPostgres } from "@/lib/postgresData";
import { query } from "@/lib/postgres";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// A booking's child name is often a placeholder from the import.
const PLACEHOLDER = /^(tbd|n\/a|na|none|-|—|)$/i;

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

function childFromMember(member = {}) {
  return {
    name: (member.fullLegalName || [member.firstName, member.lastName].filter(Boolean).join(" ") || "").trim(),
    age: ageFromDob(member.dob),
  };
}

function minorChildren(familyMembers) {
  return (Array.isArray(familyMembers) ? familyMembers : [])
    .filter((m) => m && m.type === "minor")
    .map(childFromMember)
    .filter((c) => c.name);
}

function normalizePartyId(value = "") {
  return String(value || "").trim().toLowerCase();
}

export async function GET() {
  if (!hasPostgres()) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
  }

  try {
    // Hosts come from the booking record — the authoritative "who booked this party".
    const bookingsResult = await query(
      `select party_id, customer_name, email, phone, child_name, child_age,
              package, booking_date, start_time
         from party_bookings
        where coalesce(party_id, '') <> ''`,
    );

    // Every waiver signed under a party (guests + possibly the host).
    const waiversResult = await query(
      `select coalesce(visit->>'partyId', '') as party_id,
              coalesce(primary_name, '') as primary_name,
              coalesce(primary_participant->>'email', '') as email,
              coalesce(primary_participant->>'phone', '') as phone,
              family_members
         from waivers
        where coalesce(visit->>'partyId', '') <> ''`,
    );

    // Seed records (party set up via invite) — fallback host name / visit date.
    const seedResult = await query(
      `select party_id, primary_participant, visit_date from party_waivers`,
    );

    // Sales-report children, keyed by email — last-resort child fallback.
    // The table may not exist yet (import not run); treat that as empty.
    let salesChildrenRows = [];
    try {
      const r = await query(
        `select email, child_names, child_ages, coalesce(source, '') as source from customer_children`,
      );
      salesChildrenRows = r.rows;
    } catch (err) {
      if (err?.code !== "42P01" && err?.code !== "42703") throw err; // missing table/column
    }
    const salesChildrenByEmail = new Map(
      salesChildrenRows.map((r) => [String(r.email || "").toLowerCase(), r]),
    );

    // Group signers by party.
    const signersByParty = new Map();
    for (const row of waiversResult.rows) {
      const normalizedPartyId = normalizePartyId(row.party_id);
      if (!normalizedPartyId) continue;

      const list = signersByParty.get(normalizedPartyId) || [];
      list.push({
        name: row.primary_name,
        email: row.email,
        emailLower: row.email.toLowerCase(),
        phone: row.phone,
        children: minorChildren(row.family_members),
      });
      signersByParty.set(normalizedPartyId, list);
    }

    const seedByParty = new Map(seedResult.rows.map((r) => [normalizePartyId(r.party_id), r]));

    const parties = bookingsResult.rows.map((b) => {
      const partyId = b.party_id;
      const normalizedPartyId = normalizePartyId(partyId);
      const signers = signersByParty.get(normalizedPartyId) || [];
      const seed = seedByParty.get(normalizedPartyId);
      const hostEmailLower = String(b.email || "").trim().toLowerCase();

      // The host's own waiver = the signer whose email matches the booking email.
      const hostWaiver = hostEmailLower
        ? signers.find((s) => s.emailLower === hostEmailLower)
        : null;

      // Host child, in order of trust:
      //   1. the booking field (if a real value)
      //   2. the children on the host's own signed waiver (real DOBs)
      //   3. the sales report, matched by host email (last resort)
      let childName = String(b.child_name || "").trim();
      let childAge = String(b.child_age || "").trim();
      let childSource = PLACEHOLDER.test(childName) ? "" : "booking";
      if (PLACEHOLDER.test(childName) && hostWaiver?.children?.length) {
        childName = hostWaiver.children.map((c) => c.name).join(", ");
        childAge = hostWaiver.children.map((c) => c.age).filter((a) => a !== "").join(", ");
        childSource = "waiver";
      }
      if (PLACEHOLDER.test(childName)) {
        const ref = hostEmailLower ? salesChildrenByEmail.get(hostEmailLower) : null;
        if (ref?.child_names) {
          childName = ref.child_names;
          childAge = ref.child_ages || "";
          childSource = ref.source || "customer-report";
        }
      }

      const participants = signers.reduce((n, s) => n + 1 + s.children.length, 0);

      return {
        partyId,
        host: {
          name: String(b.customer_name || "").trim() || seed?.primary_participant || "",
          email: String(b.email || "").trim(),
          phone: String(b.phone || "").trim(),
          childName,
          childAge,
          childSource,
        },
        package: String(b.package || "").trim(),
        visitDate: String(b.booking_date || "").trim() || String(seed?.visit_date || "").trim(),
        startTime: String(b.start_time || "").trim(),
        signerCount: signers.length,
        participantCount: participants,
        hostSigned: Boolean(hostWaiver),
        signers: signers.map((s) => ({
          name: s.name,
          email: s.email,
          phone: s.phone,
          children: s.children,
        })),
      };
    });

    parties.sort((a, b) => (b.visitDate || "").localeCompare(a.visitDate || ""));

    // Parties that have waivers but no booking row → no host to email.
    const bookedIds = new Set(bookingsResult.rows.map((b) => normalizePartyId(b.party_id)));
    const waiverOnlyParties = [...signersByParty.keys()].filter((id) => !bookedIds.has(id)).length;

    return NextResponse.json({
      parties,
      stats: {
        totalParties: parties.length,
        withHostEmail: parties.filter((p) => p.host.email && !PLACEHOLDER.test(p.host.email)).length,
        waiverOnlyParties,
      },
    });
  } catch (error) {
    console.error("party roster failed:", error);
    return NextResponse.json({ error: "Unable to build party roster." }, { status: 500 });
  }
}
