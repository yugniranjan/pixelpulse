import { NextResponse } from "next/server";
import { deleteFeedbackSubmission, hasFeedbackStore, issueFeedbackGiftCard, listFeedbackSubmissions, markFeedbackGiftCardSent } from "@/lib/feedback";
import { isEmail, mailerConfigured, sendBrandedEmail } from "@/lib/mailer";

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

function escapeHtml(value = "") {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function textToHtml(value = "") {
  return escapeHtml(value).replace(/\n/g, "<br />");
}

function applyTemplate(value = "", values = {}) {
  return String(value || "")
    .replace(/\{name\}/gi, values.name || "")
    .replace(/\{code\}/gi, values.code || "")
    .replace(/\{email\}/gi, values.email || "");
}

function giftCardEmailText({ name, code }) {
  return [
    name ? `Hi ${name},` : "Hi,",
    "",
    "Thanks for sharing your feedback with Pixel Pulse!",
    "",
    "As promised, here is your FREE 60-Minute Play Pass for your next visit.",
    "",
    `Redemption code: ${code}`,
    "Value: FREE 60-Minute Play Pass",
    "From: Pixel Pulse Team",
    "",
    "Valid for 30 days from issue. Terms and conditions apply.",
    "",
    "The Pixel Pulse Team",
    "Vaughan, Ontario",
    "https://www.pixelpulseplay.ca",
  ].join("\n");
}

function giftCardEmailHtml({ name, code, message }) {
  const emailMessage = message || giftCardEmailText({ name, code });

  return `
    <div style="margin:0;padding:0;background:#f3f4f6;">
      <div style="max-width:660px;margin:0 auto;padding:24px;font-family:Arial,sans-serif;color:#111827;">
        <div style="height:5px;background:linear-gradient(90deg,#a4cf5f,#fbae7b,#f59e0b);border-radius:14px 14px 0 0;"></div>
        <div style="background:#111827;color:#ffffff;padding:24px;">
          <p style="margin:0 0 6px;font-size:12px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#a4cf5f;">Pixel Pulse Play</p>
          <h1 style="margin:0;font-size:28px;line-height:1.15;">Your FREE 60-Minute Play Pass</h1>
        </div>
        <div style="background:#ffffff;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 14px 14px;padding:24px;font-size:15px;line-height:1.7;color:#374151;">
          <div style="white-space:normal;">${textToHtml(emailMessage)}</div>
        </div>
      </div>
    </div>
  `;
}

export async function PATCH(request) {
  if (!hasFeedbackStore()) {
    return NextResponse.json(
      { error: "Feedback database is not configured." },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => ({}));
  if (body.action !== "issue-gift-card") {
    return NextResponse.json({ error: "Unsupported feedback action." }, { status: 400 });
  }

  const requestedSubject = String(body.emailSubject || "").trim();
  const requestedMessage = String(body.emailMessage || "").trim();

  if (requestedMessage && !/\{code\}/i.test(requestedMessage)) {
    return NextResponse.json(
      { error: "Email message must include the {code} placeholder." },
      { status: 400 },
    );
  }

  const result = await issueFeedbackGiftCard(body.id);
  if (result.notFound) return NextResponse.json({ error: result.error }, { status: 404 });
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });

  if (!isEmail(result.feedback?.email)) {
    return NextResponse.json({ error: "Feedback recipient does not have a valid email." }, { status: 400 });
  }

  if (!mailerConfigured()) {
    return NextResponse.json({ error: "Email sending is not configured." }, { status: 503 });
  }

  const templateValues = {
    name: result.feedback.name || "there",
    email: result.feedback.email,
    code: result.giftCard.code,
  };
  const subject = applyTemplate(
    requestedSubject || "Your FREE 60-Minute Pixel Pulse Play Pass",
    templateValues,
  );
  const message = applyTemplate(
    requestedMessage || giftCardEmailText({ name: result.feedback.name, code: "{code}" }),
    templateValues,
  );

  await sendBrandedEmail({
    to: result.feedback.email,
    subject,
    message,
    html: giftCardEmailHtml({ name: result.feedback.name, code: result.giftCard.code, message }),
  });

  const sentResult = await markFeedbackGiftCardSent(result.feedback.id);

  return NextResponse.json({
    feedback: sentResult.feedback || result.feedback,
    giftCard: result.giftCard,
  });
}

export async function DELETE(request) {
  if (!hasFeedbackStore()) {
    return NextResponse.json(
      { error: "Feedback database is not configured." },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id") || "";

  try {
    const result = await deleteFeedbackSubmission(id);
    if (result.notFound) return NextResponse.json({ error: result.error }, { status: 404 });
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });

    return NextResponse.json({ success: true, deleted: result.deleted });
  } catch (error) {
    console.error("delete feedback failed:", error);
    return NextResponse.json({ error: "Unable to delete feedback." }, { status: 500 });
  }
}
