import { NextResponse } from "next/server";
import { hasFeedbackStore, listFeedbackSubmissions } from "@/lib/feedback";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request) {
  if (!hasFeedbackStore()) {
    return NextResponse.json(
      { error: "Feedback database is not configured." },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);

  try {
    const feedback = await listFeedbackSubmissions({
      q: searchParams.get("q") || "",
      source: searchParams.get("source") || "",
      minRating: searchParams.get("minRating") || "",
      limit: Number(searchParams.get("limit") || 300),
    });

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error("list feedback failed:", error);
    return NextResponse.json({ error: "Unable to load feedback." }, { status: 500 });
  }
}
