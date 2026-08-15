import { NextResponse } from "next/server";
import { deleteFeedbackSubmission, hasFeedbackStore, issueFeedbackGiftCard, listFeedbackSubmissions, markFeedbackGiftCardSent } from "@/lib/feedback";
import { redeemGiftCard } from "@/lib/giftCards";
import { isEmail, mailerConfigured, sendBrandedEmail } from "@/lib/mailer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const GOOGLE_REVIEW_URL = "https://g.page/r/CQzE8tFOGzEYEBM/review";
const PIXEL_PULSE_URL = "https://www.pixelpulseplay.ca";
const DEFAULT_FEEDBACK_REWARD_SUBJECT = "Thank You For Your Feedback. Here's Your FREE 60-Minute Pixel Pulse Play Pass!";

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

function giftCardMessageToHtml(value = "") {
  const reviewQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(GOOGLE_REVIEW_URL)}`;

  return String(value || "")
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (/^Redemption code:/i.test(trimmed) || /^Value:/i.test(trimmed)) {
        const [label, ...rest] = trimmed.split(":");
        const detail = rest.join(":").trim();
        return `
          <div style="margin:10px 0;padding:12px 14px;border:1px solid #d8e6b8;border-radius:12px;background:#f7fbea;">
            <span style="display:block;margin:0 0 3px;color:#3f6212;font-size:12px;font-weight:900;letter-spacing:0.06em;text-transform:uppercase;">${escapeHtml(label)}</span>
            <strong style="display:block;color:#111827;font-size:${/^Redemption code/i.test(trimmed) ? "20px" : "16px"};line-height:1.3;">${escapeHtml(detail)}</strong>
          </div>
        `;
      }

      if (/^Leave your review here:/i.test(trimmed)) {
        const url = trimmed.replace(/^Leave your review here:\s*/i, "") || GOOGLE_REVIEW_URL;
        return `
          <p style="margin:18px 0 8px;color:#374151;"><strong style="color:#111827;">Leave your review here:</strong></p>
          <p style="margin:0 0 16px;">
            <a href="${escapeHtml(url)}" style="display:inline-block;border-radius:10px;background:#111827;color:#ffffff;padding:12px 16px;font-weight:800;text-decoration:none;">Leave a Google Review</a>
          </p>
        `;
      }

      if (/^Generate QR code$/i.test(trimmed)) {
        return `
          <div style="margin:14px 0 20px;padding:14px;border:1px solid #e5e7eb;border-radius:12px;background:#f9fafb;display:inline-block;">
            <img src="${escapeHtml(reviewQrUrl)}" alt="Google review QR code" width="180" height="180" style="display:block;border:0;" />
            <p style="margin:8px 0 0;color:#667085;font-size:12px;text-align:center;">Scan to leave a review</p>
          </div>
        `;
      }

      if (trimmed === PIXEL_PULSE_URL || trimmed === "www.pixelpulseplay.ca") {
        return `<p style="margin:0 0 14px;"><a href="${PIXEL_PULSE_URL}" style="color:#175cd3;text-decoration:none;">${escapeHtml(trimmed)}</a></p>`;
      }

      return line ? textToHtml(line) : "<br />";
    })
    .join("");
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
    "Thank you for taking the time to share your feedback. We truly appreciate it and are committed to continuously improving based on suggestions from guests like you.",
    "",
    "As promised, here is your FREE 60-Minute Play Pass for your next visit.",
    "",
    `Redemption code: ${code}`,
    "Value: FREE 60-Minute Play Pass",
    "",
    "Valid for 30 days from issue. Terms and conditions apply.",
    "",
    "If you enjoyed your experience, we'd be incredibly grateful if you could share it with others by leaving us a Google review. And we'll send you one more complimentary 60-minute Play Pass for your next visit!",
    "",
    `Leave your review here: ${GOOGLE_REVIEW_URL}`,
    "Generate QR code",
    "",
    "Looking forward to seeing you soon.",
    "",
    "The Pixel Pulse Team",
    "Vaughan, Ontario",
    PIXEL_PULSE_URL,
    "",
    "960, Edgeley Blvd, Vaughan, ON, L4K 4V4",
    "Visit www.pixelpulseplay.ca  Call: (905)-760-2922",
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
          <div style="white-space:normal;">${giftCardMessageToHtml(emailMessage)}</div>
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
  if (!["issue-gift-card", "redeem-gift-card"].includes(body.action)) {
    return NextResponse.json({ error: "Unsupported feedback action." }, { status: 400 });
  }

  if (body.action === "redeem-gift-card") {
    const result = await redeemGiftCard({
      code: body.code,
      redeemedBy: body.redeemedBy || "feedback-admin",
    });

    if (result.notFound) return NextResponse.json({ error: result.error }, { status: 404 });
    if (result.alreadyRedeemed || result.error) {
      return NextResponse.json(
        { error: result.error || "This code cannot be redeemed.", giftCard: result.giftCard },
        { status: 409 },
      );
    }

    return NextResponse.json({ giftCard: result.giftCard });
  }

  const requestedSubject = String(body.emailSubject || "").trim();
  const requestedMessage = String(body.emailMessage || "").trim();
  const requestedRecipientEmail = String(body.recipientEmail || "").trim();

  if (requestedMessage && !/\{code\}/i.test(requestedMessage)) {
    return NextResponse.json(
      { error: "Email message must include the {code} placeholder." },
      { status: 400 },
    );
  }

  const result = await issueFeedbackGiftCard(body.id);
  if (result.notFound) return NextResponse.json({ error: result.error }, { status: 404 });
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });

  const recipientEmail = requestedRecipientEmail || result.feedback?.email;

  if (!isEmail(recipientEmail)) {
    return NextResponse.json({ error: "Recipient does not have a valid email." }, { status: 400 });
  }

  if (!mailerConfigured()) {
    return NextResponse.json({ error: "Email sending is not configured." }, { status: 503 });
  }

  const templateValues = {
    name: result.feedback.name || "there",
    email: recipientEmail,
    code: result.giftCard.code,
  };
  const subject = applyTemplate(
    requestedSubject || DEFAULT_FEEDBACK_REWARD_SUBJECT,
    templateValues,
  );
  const message = applyTemplate(
    requestedMessage || giftCardEmailText({ name: result.feedback.name, code: "{code}" }),
    templateValues,
  );

  await sendBrandedEmail({
    to: recipientEmail,
    subject,
    message,
    html: giftCardEmailHtml({ name: result.feedback.name, code: result.giftCard.code, message }),
  });

  const sentResult = await markFeedbackGiftCardSent(result.feedback.id);

  return NextResponse.json({
    feedback: sentResult.feedback || result.feedback,
    giftCard: result.giftCard,
    sentTo: recipientEmail,
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
