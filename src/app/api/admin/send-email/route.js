import { NextResponse } from "next/server";
import { mailerConfigured, isEmail, sendBrandedEmail } from "@/lib/mailer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Safety cap on a single bulk send.
const MAX_RECIPIENTS = 300;
const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024;

function substitute(text, name) {
  return String(text || "").replace(/\{name\}/gi, name || "there");
}

function escapeHtml(value = "") {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderGiftCardEmailHtml(message = "") {
  const rows = [];
  const paragraphs = [];

  String(message || "").split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    if (/^(Redemption code|Value|From):/i.test(trimmed)) {
      const [label, ...rest] = trimmed.split(":");
      rows.push({ label, value: rest.join(":").trim() });
      return;
    }
    paragraphs.push(trimmed);
  });

  return `
    <div style="margin:0;padding:0;background:#f3f4f6;">
      <div style="max-width:660px;margin:0 auto;padding:24px;font-family:Arial,sans-serif;color:#111827;">
        <div style="height:5px;background:linear-gradient(90deg,#a4cf5f,#fbae7b,#f59e0b);border-radius:14px 14px 0 0;"></div>
        <div style="background:#111827;color:#ffffff;padding:24px;">
          <p style="margin:0 0 6px;font-size:12px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#a4cf5f;">Pixel Pulse Play</p>
          <h1 style="margin:0;font-size:28px;line-height:1.15;">Your Pixel Pulse Gift Card</h1>
        </div>
        <div style="background:#ffffff;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 14px 14px;padding:24px;font-size:15px;line-height:1.7;color:#374151;">
          ${paragraphs.map((line) => {
            if (line === "You have a Pixel Pulse Play gift card waiting for you!") {
              return `<h2 style="margin:0 0 16px;font-size:22px;line-height:1.25;color:#111827;">${escapeHtml(line)}</h2>`;
            }
            if (line === "Skip the Screen. Enter the Challenge.") {
              return `<p style="margin:20px 0 14px;font-weight:800;color:#111827;">${escapeHtml(line)}</p>`;
            }
            if (line === "The Pixel Pulse Team") {
              return `<p style="margin:18px 0 6px;"><strong style="color:#111827;">${escapeHtml(line)}</strong></p>`;
            }
            if (/^https?:\/\//i.test(line)) {
              return `<p style="margin:0 0 12px;"><a href="${escapeHtml(line)}" style="color:#175cd3;text-decoration:none;">${escapeHtml(line)}</a></p>`;
            }
            return `<p style="margin:0 0 14px;color:#374151;">${escapeHtml(line)}</p>`;
          }).join("")}
          ${rows.length ? `
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:20px 0;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;background:#f9fafb;">
              <tbody>
                ${rows.map((row) => `
                  <tr>
                    <td style="padding:10px 12px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:13px;font-weight:800;width:42%;">${escapeHtml(row.label)}</td>
                    <td style="padding:10px 12px;border-top:1px solid #e5e7eb;color:#111827;font-size:15px;font-weight:700;">${escapeHtml(row.value)}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          ` : ""}
          <div style="margin:22px 0 0;padding:14px 16px;border-radius:12px;background:#f7fbea;border:1px solid #d8e6b8;color:#374151;">
            The gift card image is attached to this email. Please bring the redemption code when you visit.
          </div>
        </div>
      </div>
    </div>
  `;
}

export async function POST(req) {
  if (!mailerConfigured()) {
    return NextResponse.json(
      { error: "Email sending is not configured (GMAIL_USER / GMAIL_APP_PASSWORD)." },
      { status: 503 },
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const subject = String(body.subject || "").trim();
  const message = String(body.message || "").trim();
  const template = String(body.template || "").trim();
  if (!subject || !message) {
    return NextResponse.json({ error: "Subject and message are required." }, { status: 400 });
  }

  // Normalize + dedupe recipients by email; keep the first name seen.
  const seen = new Set();
  const recipients = [];
  let skipped = 0;
  for (const item of Array.isArray(body.recipients) ? body.recipients : []) {
    const email = String(item?.email || "").trim();
    if (!isEmail(email)) {
      skipped += 1;
      continue;
    }
    const key = email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    recipients.push({ email, name: String(item?.name || "").trim() });
  }

  if (!recipients.length) {
    return NextResponse.json({ error: "No valid recipient email addresses." }, { status: 400 });
  }
  if (recipients.length > MAX_RECIPIENTS) {
    return NextResponse.json(
      { error: `Too many recipients (${recipients.length}). The limit per send is ${MAX_RECIPIENTS}.` },
      { status: 400 },
    );
  }

  const attachments = [];
  let totalAttachmentBytes = 0;
  for (const item of Array.isArray(body.attachments) ? body.attachments : []) {
    const filename = String(item?.filename || "attachment").trim().replace(/[/\\]/g, "-");
    const contentType = String(item?.contentType || "application/octet-stream").trim();
    const contentBase64 = String(item?.contentBase64 || "").replace(/^data:[^;]+;base64,/, "");
    if (!contentBase64) continue;

    const content = Buffer.from(contentBase64, "base64");
    totalAttachmentBytes += content.byteLength;
    if (totalAttachmentBytes > MAX_ATTACHMENT_BYTES) {
      return NextResponse.json(
        { error: "Attachments must be 15 MB or less per send." },
        { status: 400 },
      );
    }

    attachments.push({
      filename,
      content,
      contentType,
    });
  }

  let sent = 0;
  const failures = [];
  for (const recipient of recipients) {
    try {
      await sendBrandedEmail({
        to: recipient.email,
        subject: substitute(subject, recipient.name),
        message: substitute(message, recipient.name),
        html: template === "gift-card" ? renderGiftCardEmailHtml(substitute(message, recipient.name)) : undefined,
        attachments,
      });
      sent += 1;
    } catch (error) {
      console.error("send-email failed for", recipient.email, error?.message);
      failures.push(recipient.email);
    }
  }

  return NextResponse.json({
    success: failures.length === 0,
    sent,
    failed: failures.length,
    skipped,
    total: recipients.length,
    failures,
  });
}
