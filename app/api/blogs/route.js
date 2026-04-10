import { NextResponse } from "next/server";
import { fetchBlogs } from "@/lib/blogs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const blogs = await fetchBlogs();
  return NextResponse.json(blogs);
}
