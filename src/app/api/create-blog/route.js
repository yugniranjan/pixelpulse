import { NextResponse } from "next/server";
import { db } from "@/lib/firestore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req) {
  const body = await req.formData();
  if (!body.get("title") || !body.get("content") || !body.get("featuredImage")) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }
  
  const doc = {
    title: body.get("title"),
    content: body.get("content"),
    featuredImage: body.get("featuredImage"),
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

