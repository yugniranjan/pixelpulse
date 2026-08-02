import { NextResponse } from "next/server";
import { isEmail, mailerConfigured, sendBrandedEmail } from "@/lib/mailer";
import { hasFeedbackStore, recordFeedback } from "@/lib/feedback";

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
  if (!value || Number(value) >= 4 || !reason) return "";
  return `${label}: ${reason}`;
}

function listLines(values = []) {
  return values.length ? values.map((value) => `- ${value}`).join("\n") : "Not provided";
}

function sentenceValue(value = "") {
  return cleanText(value)
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function section(title, lines = []) {
  const body = lines.filter((line) => line !== null && line !== undefined);
  return body.some((line) => line !== "") ? [title, ...body] : [];
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
  const phone = cleanText(body.phone);
  const visitDate = cleanText(body.visitDate);
  const partyId = cleanText(body.partyId);
  const heardAboutUs = cleanText(body.heardAboutUs);
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

  if (!name || !isEmail(email) || !heardAboutUs || !ratings.overall) {
    return NextResponse.json(
      { error: "Name, valid email, how you heard about us, and overall rating are required." },
      { status: 400 },
    );
  }

  if (!hasFeedbackStore() && !mailerConfigured()) {
    return NextResponse.json(
      { error: "Feedback storage and email sending are not configured." },
      { status: 503 },
    );
  }

  const ratingValues = Object.values(ratings)
    .map((rating) => Number(rating))
    .filter(Boolean);
  const average = ratingValues.length
    ? (ratingValues.reduce((total, rating) => total + rating, 0) / ratingValues.length).toFixed(1)
    : "";

  const ratingRows = [
    ["Overall Fun", ratings.overall, cleanText(ratingReasons.overall)],
    ["Game Variety", ratings.gameVariety, cleanText(ratingReasons.gameVariety)],
    ["Staff Friendliness", ratings.staff, cleanText(ratingReasons.staff)],
    ["Cleanliness", ratings.cleanliness, cleanText(ratingReasons.cleanliness)],
    ["Technology & Gameplay", ratings.technology, cleanText(ratingReasons.technology)],
    ["Value for Money", ratings.value, cleanText(ratingReasons.value)],
  ];
  const improvementNotes = ratingRows
    .map(([label, value, reason]) => ratingReasonLine(label, value, reason))
    .filter(Boolean);

  const message = [
    "New Pixel Pulse feedback submission",
    average ? `Overall session score: ${average}/5` : "Overall session score: Not provided",
    `Guest: ${name}`,
    `Reply to: ${email}`,
    "",
    ...section("Guest details", [
      phone ? `Phone: ${phone}` : "",
      partyId ? `Party ID: ${partyId}` : "",
      visitDate ? `Visit date: ${visitDate}` : "",
      heardAboutUs ? `Heard about us: ${heardAboutUs}` : "",
      `Marketing consent: ${marketingConsent ? "Yes" : "No"}`,
    ]),
    "",
    ...section("Visit context", [
      "What brought them in:",
      listLines(visitReasons),
      "",
      "Favourite / played challenges:",
      listLines(rooms),
    ]),
    "",
    ...section("Ratings", [
      ...ratingRows.map(([label, value]) => ratingLine(label, value)),
    ]),
    "",
    ...section("Needs attention", [
      improvementNotes.length ? improvementNotes.join("\n") : "No low-score improvement notes provided.",
    ]),
    "",
    ...section("Recommend / return intent", [
      `Would recommend: ${sentenceValue(recommend) || "Not provided"}`,
      `Will play again: ${sentenceValue(returnVisit) || "Not provided"}`,
    ]),
    "",
    ...section("Guest comments", [
      "Biggest win:",
      favoriteMoment || "Not provided",
      "",
      "Upgrade idea:",
      upgradeIdea || "Not provided",
    ]),
    "",
    ...section("Future experience ideas", [
      listLines(futureExperiences),
      otherFutureExperience ? `Other idea: ${otherFutureExperience}` : "",
    ]),
  ].filter((line) => line !== null && line !== undefined).join("\n");

  if (hasFeedbackStore()) {
    await recordFeedback(body);
  }

  if (mailerConfigured()) {
    await sendBrandedEmail({
      to: FEEDBACK_TO,
      subject: `Pixel Pulse feedback from ${name}${average ? ` - ${average}/5` : ""}`,
      message,
      replyTo: email,
    });
  }

  return NextResponse.json({ success: true, average });
}
