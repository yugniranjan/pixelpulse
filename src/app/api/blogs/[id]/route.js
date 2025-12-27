
import { NextResponse } from "next/server";
import { db } from "@/lib/firestore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_, { params }) {
  const doc = await db.collection("blogs").doc(params.id).get();

  if (!doc.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: doc.id,
    ...doc.data(),
  });
}

export async function PUT(req, { params }) {
  const body = await req.json();

  await db.collection("blogs").doc(params.id).update({
    title: body.title,
    content: body.content,
    updatedAt: new Date(),
  });

  return NextResponse.json({ success: true });
}


export async function DELETE(_, { params }) {
  await db.collection("blogs").doc(params.id).delete();

  return NextResponse.json({ success: true });
}
