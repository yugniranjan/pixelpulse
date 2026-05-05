import { NextResponse } from "next/server";
import { db } from "@/lib/firestore";
import { createPostgresBlog, hasPostgres } from "@/lib/postgresData";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req) {
  if (!db && !hasPostgres()) {
    return NextResponse.json(
      { error: "Database is not configured locally" },
      { status: 503 }
    );
  }

  const body = await req.formData();
  if (!body.get("title") || !body.get("content") || !body.get("featuredImage")) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }
  
  const title = body.get("title");
  const content = body.get("content");
  const featuredImage = body.get("featuredImage");

  if (hasPostgres()) {
    let parsedContent = content;
    try {
      parsedContent = JSON.parse(content);
    } catch {}
    const id = await createPostgresBlog({ title, content: parsedContent, featuredImage });
    return NextResponse.json({ success: true, id });
  }

  const doc = {
    title,
    content,
    featuredImage,
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
