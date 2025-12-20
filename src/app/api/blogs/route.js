// src/app/api/blog/list/route.js
import { db } from "@/lib/firestore";

export async function GET() {
  const snap = await db
    .collection("blogs")
    .orderBy("createdAt", "desc")
    .get();

  const blogs = snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));

  return Response.json(blogs);
}
