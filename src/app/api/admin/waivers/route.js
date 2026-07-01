import { NextResponse } from "next/server";
import { db } from "@/lib/firestore";
import {
  deletePostgresWaiver,
  getPostgresWaiverById,
  hasPostgres,
  listPostgresWaivers,
  updatePostgresWaiver,
} from "@/lib/postgresData";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function serializeDate(value) {
  if (!value) return "";
  if (typeof value.toDate === "function") return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function serializeWaiver(doc, { includeSignature = true } = {}) {
  const data = doc.data();
  const waiver = {
    id: doc.id,
    ...data,
    signatureDataUrl: includeSignature ? data.signatureDataUrl || "" : undefined,
    submittedAt: serializeDate(data.submittedAt),
    updatedAt: serializeDate(data.updatedAt),
  };

  if (!includeSignature) {
    delete waiver.signatureDataUrl;
  }

  return waiver;
}

function cleanText(value = "") {
  return String(value || "").trim();
}

function fullLegalName(person = {}) {
  return [person.firstName, person.lastName].map(cleanText).filter(Boolean).join(" ");
}

function getWaiverId(req) {
  return new URL(req.url).searchParams.get("id")?.trim();
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id")?.trim();
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 300, 1), 1000);

  if (hasPostgres()) {
    if (id) {
      const waiver = await getPostgresWaiverById(id);
      return waiver
        ? NextResponse.json({ waiver })
        : NextResponse.json({ error: "Waiver not found." }, { status: 404 });
    }

    return NextResponse.json({ waivers: await listPostgresWaivers(limit, { includeSignature: false }) });
  }

  if (!db) {
    return NextResponse.json(
      { error: "Firestore is not configured." },
      { status: 503 },
    );
  }

  if (id) {
    const snapshot = await db.collection("waivers").doc(id).get();
    return snapshot.exists
      ? NextResponse.json({ waiver: serializeWaiver(snapshot, { includeSignature: true }) })
      : NextResponse.json({ error: "Waiver not found." }, { status: 404 });
  }

  const snapshot = await db
    .collection("waivers")
    .orderBy("submittedAt", "desc")
    .limit(limit)
    .get();

  return NextResponse.json({
    waivers: snapshot.docs.map((doc) => serializeWaiver(doc, { includeSignature: false })),
  });
}

export async function PUT(req) {
  if (!db && !hasPostgres()) {
    return NextResponse.json(
      { error: "Firestore is not configured." },
      { status: 503 },
    );
  }

  const id = getWaiverId(req);
  if (!id) {
    return NextResponse.json({ error: "Waiver ID is required." }, { status: 400 });
  }

  const body = await req.json();
  const primary = body.primary || {};
  const visit = body.visit || {};
  const cleanedPrimary = {
    firstName: cleanText(primary.firstName),
    lastName: cleanText(primary.lastName),
    dob: cleanText(primary.dob),
    gender: cleanText(primary.gender),
    email: cleanText(primary.email),
    phone: cleanText(primary.phone),
    city: cleanText(primary.city),
    healthCondition: cleanText(primary.healthCondition) || "Not Applicable",
    medicalNotes: cleanText(primary.medicalNotes),
  };
  const updateData = {
    primary: {
      ...cleanedPrimary,
      fullLegalName: fullLegalName(cleanedPrimary),
    },
    visit: {
      partyId: cleanText(visit.partyId),
      partyName: cleanText(visit.partyName),
      passType: cleanText(visit.passType),
      visitDate: cleanText(visit.visitDate),
      visitTime: cleanText(visit.visitTime),
      emergencyName: cleanText(visit.emergencyName),
      emergencyRelation: cleanText(visit.emergencyRelation),
      emergencyPhone: cleanText(visit.emergencyPhone),
      printName: cleanText(visit.printName),
      signDate: cleanText(visit.signDate),
    },
    primaryName: fullLegalName(cleanedPrimary),
    updatedAt: new Date(),
  };

  if (!updateData.primary.firstName || !updateData.primary.lastName) {
    return NextResponse.json(
      { error: "First and last name are required." },
      { status: 400 },
    );
  }

  if (hasPostgres()) {
    const waiver = await updatePostgresWaiver(id, updateData);
    return waiver
      ? NextResponse.json({ success: true, waiver })
      : NextResponse.json({ error: "Waiver not found." }, { status: 404 });
  }

  const ref = db.collection("waivers").doc(id);
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    return NextResponse.json({ error: "Waiver not found." }, { status: 404 });
  }

  await ref.update(updateData);
  const updatedSnapshot = await ref.get();

  return NextResponse.json({
    success: true,
    waiver: serializeWaiver(updatedSnapshot),
  });
}

export async function DELETE(req) {
  const id = getWaiverId(req);
  if (!id) {
    return NextResponse.json({ error: "Waiver ID is required." }, { status: 400 });
  }

  if (hasPostgres()) {
    const deleted = await deletePostgresWaiver(id);
    return deleted
      ? NextResponse.json({ success: true, id })
      : NextResponse.json({ error: "Waiver not found." }, { status: 404 });
  }

  if (!db) {
    return NextResponse.json(
      { error: "Firestore is not configured." },
      { status: 503 },
    );
  }

  const ref = db.collection("waivers").doc(id);
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    return NextResponse.json({ error: "Waiver not found." }, { status: 404 });
  }

  await ref.delete();

  return NextResponse.json({
    success: true,
    id,
  });
}
