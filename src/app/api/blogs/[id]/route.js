
import { db } from "@/lib/firestore";

export async function GET(_, { params }) {
  const doc = await db.collection("blogs").doc(params.id).get();

  if (!doc.exists) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({
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

  return Response.json({ success: true });
}


export async function DELETE(_, { params }) {
  await db.collection("blogs").doc(params.id).delete();

  return Response.json({ success: true });
}
