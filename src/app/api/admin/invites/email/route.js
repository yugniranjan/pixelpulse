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

function renderTextLines(lines = []) {
  let html = "";
  let listOpen = false;
  const closeList = () => {
    if (!listOpen) return;
    html += "</ul>";
    listOpen = false;
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      closeList();
      return;
    }

    if (trimmed.startsWith("- ")) {
      if (!listOpen) {
        html += '<ul style="margin:8px 0 14px 20px;padding:0;color:#374151;">';
        listOpen = true;
      }
      html += `<li style="margin:4px 0;">${escapeHtml(trimmed.slice(2))}</li>`;
      return;
    }

    closeList();

    if (/^\d+\.\s/.test(trimmed)) {
      html += `<h3 style="margin:24px 0 8px;font-size:16px;line-height:1.35;color:#111827;">${escapeHtml(trimmed)}</h3>`;
      return;
    }

    if (
      [
        "Your Party Details",
        "Booking Details",
        "Important Information - Please Read Carefully",
      ].includes(trimmed)
    ) {
      html += `<h2 style="margin:22px 0 10px;font-size:18px;line-height:1.3;color:#111827;">${escapeHtml(trimmed)}</h2>`;
      return;
    }

    html += `<p style="margin:8px 0;color:#374151;">${escapeHtml(trimmed)}</p>`;
  });

  closeList();
  return html;
}

function renderConfirmationHtml({ emailText, partyId }) {
  const lines = emailText.split("\n");
  const greetingLines = lines.slice(0, 3);
  const detailStart = lines.findIndex((line) => line.trim() === "Your Party Details");
  const importantStart = lines.findIndex((line) => line.trim() === "Important Information - Please Read Carefully");
  const detailLines = detailStart >= 0 && importantStart > detailStart
    ? lines.slice(detailStart, importantStart)
    : [];
  const importantLines = importantStart >= 0 ? lines.slice(importantStart) : lines.slice(3);
  const detailRows = detailLines
    .filter((line) => line.includes(":"))
    .map((line) => {
      const [label, ...rest] = line.split(":");
      return {
        label: label.trim(),
        value: rest.join(":").trim(),
      };
    });

  return `
    <div style="margin:0;padding:0;background:#f3f4f6;">
      <div style="max-width:720px;margin:0 auto;padding:24px;font-family:Arial,sans-serif;color:#111827;">
        <div style="background:#111827;color:#ffffff;border-radius:14px 14px 0 0;padding:24px;">
          <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#a4cf5f;">Pixel Pulse Play</p>
          <h1 style="margin:0;font-size:24px;line-height:1.25;">Your Birthday Party is Confirmed</h1>
          ${partyId ? `<p style="margin:10px 0 0;color:#e5e7eb;">Party ID: <strong>${escapeHtml(partyId)}</strong></p>` : ""}
        </div>
        <div style="background:#ffffff;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 14px 14px;padding:24px;">
          <div style="font-size:15px;line-height:1.6;">
            ${renderTextLines(greetingLines)}
          </div>

          ${detailRows.length ? `
            <div style="margin:22px 0;padding:18px;border:1px solid #d1d5db;border-radius:12px;background:#f9fafb;">
              <h2 style="margin:0 0 14px;font-size:18px;color:#111827;">Party Details</h2>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                <tbody>
                  ${detailRows.map((row) => `
                    <tr>
                      <td style="padding:9px 10px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:13px;font-weight:700;width:38%;">${escapeHtml(row.label)}</td>
                      <td style="padding:9px 10px;border-top:1px solid #e5e7eb;color:#111827;font-size:14px;">${escapeHtml(row.value || "As confirmed")}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          ` : ""}

          <div style="font-size:15px;line-height:1.6;">
            ${renderTextLines(importantLines)}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderThankYouHtml({ feedbackUrl, partyId }) {
  return `
    <div style="margin:0;padding:0;background:#f3f4f6;">
      <div style="max-width:680px;margin:0 auto;padding:24px;font-family:Arial,sans-serif;color:#111827;">
        <div style="background:#111827;color:#ffffff;border-radius:14px 14px 0 0;padding:24px;">
          <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#a4cf5f;">Pixel Pulse Play</p>
          <h1 style="margin:0;font-size:24px;line-height:1.25;">Thanks for playing with us</h1>
          ${partyId ? `<p style="margin:10px 0 0;color:#e5e7eb;">Party ID: <strong>${escapeHtml(partyId)}</strong></p>` : ""}
        </div>
        <div style="background:#ffffff;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 14px 14px;padding:24px;font-size:15px;line-height:1.7;color:#374151;">
          <p style="margin:0 0 12px;">Thank you for visiting Pixel Pulse Play Zone. We hope your group had a great run through the challenge rooms.</p>
          <p style="margin:0 0 12px;">Your quick feedback helps us tune the games, staff flow, and party experience for the next squad.</p>
          <p style="margin:0 0 18px;padding:12px 14px;border-radius:10px;background:#f7fbea;border:1px solid #d8e6b8;color:#374151;"><strong style="color:#111827;">Get 10% off your next visit</strong><br />Submit the review and we will send you a 10% off thank-you offer.</p>
          <p style="margin:22px 0;">
            <a href="${escapeHtml(feedbackUrl)}" style="display:inline-block;border-radius:8px;background:#111827;color:#ffffff;padding:13px 18px;font-weight:700;text-decoration:none;">Rate your run</a>
          </p>
          <p style="margin:0;color:#6b7280;">The form takes about two minutes. If anything needs direct follow-up, you can also reply to this email.</p>
        </div>
      </div>
    </div>
  `;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const to = cleanEmail(body?.email);
    const smsText = cleanText(body?.smsText);
    const confirmationEmailText = cleanText(body?.confirmationEmailText);
    const feedbackUrl = cleanText(body?.feedbackUrl);
    const sendThankYou = body?.type === "thank-you" || Boolean(body?.thankYouEmail);
    const inviteUrl = cleanText(body?.inviteUrl);
    const waiverUrl = cleanText(body?.waiverUrl);
    const qrCodeUrl = cleanText(body?.qrCodeUrl);
    const partyId = cleanText(body?.partyId);
    const emailText = confirmationEmailText || smsText;

    if (!to) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    if (sendThankYou && !feedbackUrl) {
      return NextResponse.json(
        { error: "Feedback URL is required." },
        { status: 400 },
      );
    }

    if (!sendThankYou && (!emailText || !inviteUrl)) {
      return NextResponse.json(
        { error: "Email text and invite URL are required." },
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

    const text = sendThankYou
      ? [
          partyId ? `Party ID: ${partyId}` : "",
          "Thank you for visiting Pixel Pulse Play Zone.",
          "Please take two minutes to rate your run and help us improve the experience.",
          "Submit the review and we will send you a 10% off thank-you offer for your next visit.",
          "",
          `Feedback form: ${feedbackUrl}`,
        ].filter(Boolean).join("\n")
      : confirmationEmailText
      ? [
          partyId ? `Party ID: ${partyId}` : "",
          emailText,
        ].filter(Boolean).join("\n")
      : [
          partyId ? `Party ID: ${partyId}` : "",
          emailText,
          "",
          qrCodeUrl ? `QR Code: ${qrCodeUrl}` : "",
        ].filter(Boolean).join("\n");

    const html = sendThankYou
      ? renderThankYouHtml({ feedbackUrl, partyId })
      : confirmationEmailText
      ? renderConfirmationHtml({ emailText, partyId })
      : `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;">
          ${partyId ? `<p><strong>Party ID:</strong> ${escapeHtml(partyId)}</p>` : ""}
          <div style="white-space:normal;padding:14px;border:1px solid #e5e7eb;border-radius:10px;background:#f9fafb;">
            ${textToHtml(emailText)}
          </div>
          ${qrCodeUrl ? `
            <p><strong>QR Code</strong></p>
            <p>
              <a href="${escapeHtml(inviteUrl)}">
                <img src="${escapeHtml(qrCodeUrl)}" alt="Invite QR code" width="220" height="220" style="display:block;border:0;" />
              </a>
            </p>
          ` : ""}
        </div>
      `;

    await transporter.sendMail({
      from: {
        name: BUSINESS_NAME,
        address: authenticatedSender,
      },
      to,
      replyTo: CONTACT_EMAIL,
      subject: sendThankYou
        ? "Thanks for visiting Pixel Pulse Play"
        : confirmationEmailText
        ? "Your Pixel Pulse Birthday Party is Confirmed"
        : "Your Party Invite at Pixel Pulse Playzone! 🎉",
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
