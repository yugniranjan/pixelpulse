import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

const BUSINESS_NAME = "Pixel Pulse Play Zone";
const CONTACT_EMAIL = "connect@pixelpulseplay.ca";

function getRequiredEnv(name) {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function cleanText(value = "") {
  return String(value || "").trim();
}

function cleanEmail(value = "") {
  const email = cleanText(value).replace(/[\r\n]+/g, "");
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
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

export async function POST(request) {
  try {
    const body = await request.json();
    const to = cleanEmail(body?.email);
    const smsText = cleanText(body?.smsText);
    const inviteUrl = cleanText(body?.inviteUrl);
    const waiverUrl = cleanText(body?.waiverUrl);
    const qrCodeUrl = cleanText(body?.qrCodeUrl);
    const partyId = cleanText(body?.partyId);

    if (!to) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    if (!smsText || !inviteUrl || !qrCodeUrl) {
      return NextResponse.json(
        { error: "SMS text, invite URL, and QR code are required." },
        { status: 400 },
      );
    }

    const gmailUser = getRequiredEnv("GMAIL_USER");
    const gmailAppPassword = getRequiredEnv("GMAIL_APP_PASSWORD");

    if (!gmailUser || !gmailAppPassword) {
      return NextResponse.json(
        { error: "Gmail is not configured for invite email sending." },
        { status: 500 },
      );
    }

    const authenticatedSender = getRequiredEnv("GMAIL_FROM_EMAIL") || gmailUser;
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });

    const text = [
      partyId ? `Party ID: ${partyId}` : "",
      "SMS Text:",
      smsText,
      "",
      `QR Code: ${qrCodeUrl}`,
    ].filter(Boolean).join("\n");

    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;">
        <h2 style="margin:0 0 12px;">Pixel Pulse Party Links</h2>
        ${partyId ? `<p><strong>Party ID:</strong> ${escapeHtml(partyId)}</p>` : ""}
        <p><strong>SMS Text</strong></p>
        <div style="white-space:normal;padding:14px;border:1px solid #e5e7eb;border-radius:10px;background:#f9fafb;">
          ${textToHtml(smsText)}
        </div>
        <p><strong>QR Code</strong></p>
        <p>
          <a href="${escapeHtml(inviteUrl)}">
            <img src="${escapeHtml(qrCodeUrl)}" alt="Invite QR code" width="220" height="220" style="display:block;border:0;" />
          </a>
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: {
        name: BUSINESS_NAME,
        address: authenticatedSender,
      },
      to,
      replyTo: CONTACT_EMAIL,
      subject: "Pixel Pulse party invite SMS and QR code",
      text,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Invite SMS email send failed:", error);
    return NextResponse.json(
      { error: "Failed to send invite SMS email." },
      { status: 500 },
    );
  }
}
