import { NextResponse } from "next/server";
import { db } from "@/lib/firestore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function serializeDate(value) {
  if (!value) return "";
  if (typeof value.toDate === "function") return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function serializeWaiver(doc) {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    submittedAt: serializeDate(data.submittedAt),
    updatedAt: serializeDate(data.updatedAt),
  };
}

function cleanText(value = "") {
  return String(value || "").trim();
}

function getWaiverId(req) {
  return new URL(req.url).searchParams.get("id")?.trim();
}

export async function GET() {
  if (!db) {
    return NextResponse.json(
      { error: "Firestore is not configured." },
      { status: 503 },
    );
  }

  const snapshot = await db
    .collection("waivers")
    .orderBy("submittedAt", "desc")
    .limit(100)
    .get();

  return NextResponse.json({
    waivers: snapshot.docs.map(serializeWaiver),
  });
}

export async function PUT(req) {
  if (!db) {
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
  const updateData = {
    primary: {
      firstName: cleanText(primary.firstName),
      lastName: cleanText(primary.lastName),
      dob: cleanText(primary.dob),
      gender: cleanText(primary.gender),
      email: cleanText(primary.email),
      phone: cleanText(primary.phone),
      city: cleanText(primary.city),
      medicalNotes: cleanText(primary.medicalNotes),
    },
    visit: {
      partyId: cleanText(visit.partyId),
      passType: cleanText(visit.passType),
      visitDate: cleanText(visit.visitDate),
      emergencyName: cleanText(visit.emergencyName),
      emergencyRelation: cleanText(visit.emergencyRelation),
      emergencyPhone: cleanText(visit.emergencyPhone),
      printName: cleanText(visit.printName),
      signDate: cleanText(visit.signDate),
    },
    primaryName: [primary.firstName, primary.lastName].map(cleanText).filter(Boolean).join(" "),
    updatedAt: new Date(),
  };

  if (!updateData.primary.firstName || !updateData.primary.lastName) {
    return NextResponse.json(
      { error: "First and last name are required." },
      { status: 400 },
    );
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
  if (!db) {
    return NextResponse.json(
      { error: "Firestore is not configured." },
      { status: 503 },
    );
  }

  const id = getWaiverId(req);
  if (!id) {
    return NextResponse.json({ error: "Waiver ID is required." }, { status: 400 });
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
