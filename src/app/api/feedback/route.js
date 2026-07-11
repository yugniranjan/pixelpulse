import { NextResponse } from "next/server";
import { isEmail, mailerConfigured, sendBrandedEmail } from "@/lib/mailer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const FEEDBACK_TO = "connect@pixelpulseplay.ca";

function cleanText(value = "") {
  return String(value || "").trim();
}

function ratingLine(label, value) {
  return `${label}: ${value ? `${value}/5` : "Not provided"}`;
}

export async function POST(request) {
  if (!mailerConfigured()) {
    return NextResponse.json(
      { error: "Email sending is not configured." },
      { status: 503 },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = cleanText(body.name);
  const email = cleanText(body.email);
  const visitDate = cleanText(body.visitDate);
  const partySize = cleanText(body.partySize);
  const partyId = cleanText(body.partyId);
  const rooms = Array.isArray(body.rooms) ? body.rooms.map(cleanText).filter(Boolean) : [];
  const ratings = body.ratings || {};
  const recommend = cleanText(body.recommend);
  const notes = cleanText(body.notes);

  if (!name || !isEmail(email) || !ratings.overall) {
    return NextResponse.json(
      { error: "Name, valid email, and overall rating are required." },
      { status: 400 },
    );
  }

  const ratingValues = Object.values(ratings)
    .map((rating) => Number(rating))
    .filter(Boolean);
  const average = ratingValues.length
    ? (ratingValues.reduce((total, rating) => total + rating, 0) / ratingValues.length).toFixed(1)
    : "";

  const message = [
    "New Pixel Pulse feedback submission",
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    partyId ? `Party ID: ${partyId}` : "",
    visitDate ? `Visit date: ${visitDate}` : "",
    partySize ? `Party size: ${partySize}` : "",
    "",
    "Rooms played",
    rooms.length ? rooms.map((room) => `- ${room}`).join("\n") : "Not provided",
    "",
    "Ratings",
    ratingLine("Overall Experience", ratings.overall),
    ratingLine("Staff & Crew", ratings.staff),
    ratingLine("Cleanliness", ratings.cleanliness),
    ratingLine("Value for Money", ratings.value),
    average ? `Average: ${average}/5` : "",
    "",
    `Would recommend: ${recommend || "Not provided"}`,
    "",
    "Debrief notes",
    notes || "Not provided",
  ].filter((line) => line !== "").join("\n");

  await sendBrandedEmail({
    to: FEEDBACK_TO,
    subject: `Pixel Pulse feedback from ${name}`,
    message,
  });

  return NextResponse.json({ success: true, average });
}
