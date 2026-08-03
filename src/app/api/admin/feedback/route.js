import { NextResponse } from "next/server";
import { deleteFeedbackSubmission, hasFeedbackStore, issueFeedbackGiftCard, listFeedbackSubmissions } from "@/lib/feedback";
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

function giftCardEmailHtml({ name, code }) {
  return `
    <div style="margin:0;padding:0;background:#f3f4f6;">
      <div style="max-width:660px;margin:0 auto;padding:24px;font-family:Arial,sans-serif;color:#111827;">
        <div style="height:5px;background:linear-gradient(90deg,#a4cf5f,#fbae7b,#f59e0b);border-radius:14px 14px 0 0;"></div>
        <div style="background:#111827;color:#ffffff;padding:24px;">
          <p style="margin:0 0 6px;font-size:12px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#a4cf5f;">Pixel Pulse Play</p>
          <h1 style="margin:0;font-size:28px;line-height:1.15;">Your FREE 60-Minute Play Pass</h1>
        </div>
        <div style="background:#ffffff;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 14px 14px;padding:24px;font-size:15px;line-height:1.7;color:#374151;">
          <p style="margin:0 0 14px;">${name ? `Hi ${escapeHtml(name)},` : "Hi,"}</p>
          <p style="margin:0 0 14px;">Thanks for sharing your feedback with Pixel Pulse. As promised, here is your FREE 60-Minute Play Pass for your next visit.</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:20px 0;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;background:#f9fafb;">
            <tbody>
              <tr>
                <td style="padding:10px 12px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:13px;font-weight:800;width:42%;">Redemption code</td>
                <td style="padding:10px 12px;border-top:1px solid #e5e7eb;color:#111827;font-size:17px;font-weight:900;">${escapeHtml(code)}</td>
              </tr>
              <tr>
                <td style="padding:10px 12px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:13px;font-weight:800;">Value</td>
                <td style="padding:10px 12px;border-top:1px solid #e5e7eb;color:#111827;font-size:15px;font-weight:700;">FREE 60-Minute Play Pass</td>
              </tr>
              <tr>
                <td style="padding:10px 12px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:13px;font-weight:800;">From</td>
                <td style="padding:10px 12px;border-top:1px solid #e5e7eb;color:#111827;font-size:15px;font-weight:700;">Pixel Pulse Team</td>
              </tr>
            </tbody>
          </table>
          <div style="margin:22px 0 18px;padding:14px 16px;border-radius:12px;background:#f7fbea;border:1px solid #d8e6b8;color:#374151;">
            Valid for 30 days from issue. Terms and conditions apply.
          </div>
          <p style="margin:0 0 6px;"><strong style="color:#111827;">The Pixel Pulse Team</strong></p>
          <p style="margin:0;color:#6b7280;">Vaughan, Ontario<br /><a href="https://www.pixelpulseplay.ca" style="color:#175cd3;text-decoration:none;">https://www.pixelpulseplay.ca</a></p>
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

  const result = await issueFeedbackGiftCard(body.id);
  if (result.notFound) return NextResponse.json({ error: result.error }, { status: 404 });
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });

  if (!isEmail(result.feedback?.email)) {
    return NextResponse.json({ error: "Feedback recipient does not have a valid email." }, { status: 400 });
  }

  if (!mailerConfigured()) {
    return NextResponse.json({ error: "Email sending is not configured." }, { status: 503 });
  }

  const message = giftCardEmailText({
    name: result.feedback.name,
    code: result.giftCard.code,
  });

  await sendBrandedEmail({
    to: result.feedback.email,
    subject: "Your FREE 60-Minute Pixel Pulse Play Pass",
    message,
    html: giftCardEmailHtml({ name: result.feedback.name, code: result.giftCard.code }),
  });

  return NextResponse.json({
    feedback: result.feedback,
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
