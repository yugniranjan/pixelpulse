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

function ratingReasonLine(label, value, reason) {
  if (!value || Number(value) >= 5 || !reason) return "";
  return `${label} reason: ${reason}`;
}

function listLines(values = []) {
  return values.length ? values.map((value) => `- ${value}`).join("\n") : "Not provided";
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
  const phone = cleanText(body.phone);
  const visitDate = cleanText(body.visitDate);
  const partyId = cleanText(body.partyId);
  const visitReasons = Array.isArray(body.visitReasons) ? body.visitReasons.map(cleanText).filter(Boolean) : [];
  const rooms = Array.isArray(body.rooms) ? body.rooms.map(cleanText).filter(Boolean) : [];
  const ratings = body.ratings || {};
  const ratingReasons = body.ratingReasons || {};
  const recommend = cleanText(body.recommend);
  const returnVisit = cleanText(body.returnVisit);
  const favoriteMoment = cleanText(body.favoriteMoment);
  const upgradeIdea = cleanText(body.upgradeIdea);
  const futureExperiences = Array.isArray(body.futureExperiences) ? body.futureExperiences.map(cleanText).filter(Boolean) : [];
  const otherFutureExperience = cleanText(body.otherFutureExperience);
  const marketingConsent = Boolean(body.marketingConsent);

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
    phone ? `Phone: ${phone}` : "",
    partyId ? `Party ID: ${partyId}` : "",
    visitDate ? `Visit date: ${visitDate}` : "",
    "",
    "Visit reason",
    listLines(visitReasons),
    "",
    "Rooms played",
    listLines(rooms),
    "",
    "Ratings",
    ratingLine("Overall Fun", ratings.overall),
    ratingReasonLine("Overall Fun", ratings.overall, cleanText(ratingReasons.overall)),
    ratingLine("Game Variety", ratings.gameVariety),
    ratingReasonLine("Game Variety", ratings.gameVariety, cleanText(ratingReasons.gameVariety)),
    ratingLine("Staff Friendliness", ratings.staff),
    ratingReasonLine("Staff Friendliness", ratings.staff, cleanText(ratingReasons.staff)),
    ratingLine("Cleanliness", ratings.cleanliness),
    ratingReasonLine("Cleanliness", ratings.cleanliness, cleanText(ratingReasons.cleanliness)),
    ratingLine("Technology & Gameplay", ratings.technology),
    ratingReasonLine("Technology & Gameplay", ratings.technology, cleanText(ratingReasons.technology)),
    ratingLine("Value for Money", ratings.value),
    ratingReasonLine("Value for Money", ratings.value, cleanText(ratingReasons.value)),
    average ? `Average: ${average}/5` : "",
    "",
    `Would recommend: ${recommend || "Not provided"}`,
    `Will play again: ${returnVisit || "Not provided"}`,
    "",
    "Biggest win",
    favoriteMoment || "Not provided",
    "",
    "Upgrade idea",
    upgradeIdea || "Not provided",
    "",
    "Future experiences",
    listLines(futureExperiences),
    otherFutureExperience ? `Other idea: ${otherFutureExperience}` : "",
    "",
    `Marketing consent: ${marketingConsent ? "Yes" : "No"}`,
  ].filter((line) => line !== "").join("\n");

  await sendBrandedEmail({
    to: FEEDBACK_TO,
    subject: `Pixel Pulse feedback from ${name}`,
    message,
    replyTo: email,
  });

  return NextResponse.json({ success: true, average });
}
