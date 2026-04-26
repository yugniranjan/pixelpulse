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
