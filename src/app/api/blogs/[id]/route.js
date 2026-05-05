
import { NextResponse } from "next/server";
import { db } from "@/lib/firestore";
import {
  deletePostgresBlog,
  getPostgresBlogById,
  hasPostgres,
  updatePostgresBlog,
} from "@/lib/postgresData";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_, { params }) {
  const { id } = await params;

  if (hasPostgres()) {
    const blog = await getPostgresBlogById(id);
    if (!blog) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(blog);
  }

  if (!db) {
    return NextResponse.json(
      { error: "Firestore is not configured locally" },
      { status: 503 }
    );
  }

  const doc = await db.collection("blogs").doc(id).get();

  if (!doc.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data = doc.data();

  let content = data.content;

  // 🔥 FIX: agar string hai to object banao
  if (typeof content === "string") {
    try {
      content = JSON.parse(content);
    } catch (err) {
      console.error("Invalid content JSON:", content);
      content = null;
    }
  }

  return NextResponse.json({
    id: doc.id,
    ...data,
    content, // ✅ always object
  });
}


export async function PUT(req, { params }) {
  const { id } = await params;

  if (!db && !hasPostgres()) {
    return NextResponse.json(
      { error: "Firestore is not configured locally" },
      { status: 503 }
    );
  }

  const formData = await req.formData();

  const title = formData.get("title");
  const rawContent = formData.get("content");
  const featuredImage = formData.get("featuredImage"); // STRING | null

  if (!title || !rawContent) {
    return NextResponse.json(
      { error: "Invalid data" },
      { status: 400 }
    );
  }

  // 🔥 content string → object
  let content;
  try {
    content = JSON.parse(rawContent);
  } catch {
    return NextResponse.json(
      { error: "Invalid content JSON" },
      { status: 400 }
    );
  }

  const updateData = {
    title,
    content,
    updatedAt: new Date(),
  };

  // ⭐ only update image if URL exists
  if (featuredImage && typeof featuredImage === "string") {
    updateData.featuredImage = featuredImage;
  }

  if (hasPostgres()) {
    const updated = await updatePostgresBlog(id, {
      title,
      content,
      featuredImage: featuredImage && typeof featuredImage === "string" ? featuredImage : "",
    });
    return updated
      ? NextResponse.json({ success: true })
      : NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.collection("blogs").doc(id).update(updateData);

  return NextResponse.json({ success: true });
}


export async function DELETE(_, { params }) {
  const { id } = await params;

  if (hasPostgres()) {
    const deleted = await deletePostgresBlog(id);
    return deleted
      ? NextResponse.json({ success: true })
      : NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!db) {
    return NextResponse.json(
      { error: "Firestore is not configured locally" },
      { status: 503 }
    );
  }

  await db.collection("blogs").doc(id).delete();

  return NextResponse.json({ success: true });
}
