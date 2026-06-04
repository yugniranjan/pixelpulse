import { NextResponse } from "next/server";
import { mailerConfigured, isEmail, sendBrandedEmail } from "@/lib/mailer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Safety cap on a single bulk send.
const MAX_RECIPIENTS = 300;

function substitute(text, name) {
  return String(text || "").replace(/\{name\}/gi, name || "there");
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

  let sent = 0;
  const failures = [];
  for (const recipient of recipients) {
    try {
      await sendBrandedEmail({
        to: recipient.email,
        subject: substitute(subject, recipient.name),
        message: substitute(message, recipient.name),
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
