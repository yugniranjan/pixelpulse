import { db } from "@/lib/firestore";

export async function POST(req) {
  const body = await req.json();
  if (!body.title || !body.content) {
    return Response.json({ error: "Invalid data" }, { status: 400 });
  }
  const doc = {
    title: body.title,
    content: body.content,
    status: "published",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const ref = await db.collection("blogs").add(doc);

  return Response.json({
    success: true,
    id: ref.id,
  });
}

