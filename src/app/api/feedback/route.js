import { NextResponse } from "next/server";
import { isEmail } from "@/lib/mailer";
import { hasFeedbackStore, recordFeedback } from "@/lib/feedback";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function cleanText(value = "") {
  return String(value || "").trim();
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = cleanText(body.name);
  const email = cleanText(body.email);
  const heardAboutUs = cleanText(body.heardAboutUs);
  const ratings = body.ratings || {};

  if (!name || !isEmail(email) || !heardAboutUs || !ratings.overall) {
    return NextResponse.json(
      { error: "Name, valid email, how you heard about us, and overall rating are required." },
      { status: 400 },
    );
  }

  if (!hasFeedbackStore()) {
    return NextResponse.json(
      { error: "Feedback storage is not configured." },
      { status: 503 },
    );
  }

  const ratingValues = Object.values(ratings)
    .map((rating) => Number(rating))
    .filter(Boolean);
  const average = ratingValues.length
    ? (ratingValues.reduce((total, rating) => total + rating, 0) / ratingValues.length).toFixed(1)
    : "";

  await recordFeedback(body);

  return NextResponse.json({ success: true, average });
}
