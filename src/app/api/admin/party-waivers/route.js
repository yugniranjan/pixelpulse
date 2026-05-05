import { NextResponse } from "next/server";
import { db } from "@/lib/firestore";
import { partyWaiverDocId } from "@/lib/partyWaivers";
import { hasPostgres, upsertPostgresPartyWaiver } from "@/lib/postgresData";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function cleanText(value = "") {
  return String(value || "").trim();
}

export async function POST(req) {
  if (!db && !hasPostgres()) {
    return NextResponse.json(
      { error: "Firestore is not configured." },
      { status: 503 },
    );
  }

  const body = await req.json();
  const partyId = cleanText(body.partyId);

  if (!partyId) {
    return NextResponse.json(
      { error: "Party ID is required." },
      { status: 400 },
    );
  }

  const now = new Date();
  const partyWaiver = {
    partyId,
    primaryParticipant: cleanText(body.primaryParticipant || body.guestName || body.partyName),
    visitDate: cleanText(body.visitDate || body.date),
    visitTime: cleanText(body.visitTime || body.time),
    passType: "Birthday Party Package",
    updatedAt: now,
  };

  if (hasPostgres()) {
    await upsertPostgresPartyWaiver({ ...partyWaiver, createdAt: now, updatedAt: now });
  } else {
    await db.collection("partyWaivers").doc(partyWaiverDocId(partyId)).set(
      {
        ...partyWaiver,
        createdAt: now,
      },
      { merge: true },
    );
  }

  return NextResponse.json({
    success: true,
    partyWaiver,
  });
}
