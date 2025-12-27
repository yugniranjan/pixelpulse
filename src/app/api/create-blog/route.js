import { NextResponse } from "next/server";
import { db } from "@/lib/firestore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req) {
  const body = await req.json();
  if (!body.title || !body.content) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }
  const doc = {
    title: body.title,
    content: body.content,
    status: "published",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const ref = await db.collection("blogs").add(doc);

  return NextResponse.json({
    success: true,
    id: ref.id,
  });
}

