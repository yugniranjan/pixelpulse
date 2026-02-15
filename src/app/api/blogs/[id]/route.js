
import { NextResponse } from "next/server";
import { db } from "@/lib/firestore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_, { params }) {
  const doc = await db.collection("blogs").doc(params.id).get();

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

  await db.collection("blogs").doc(params.id).update(updateData);

  return NextResponse.json({ success: true });
}


export async function DELETE(_, { params }) {
  await db.collection("blogs").doc(params.id).delete();

  return NextResponse.json({ success: true });
}
