import { NextResponse } from "next/server";
import { db } from "@/lib/firestore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const snap = await db
    .collection("blogs")
    .orderBy("createdAt", "desc")
    .get();

  const blogs = snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));

  return NextResponse.json(blogs);
}
