import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

const CONTACT_EMAIL = "connect@pixelpulseplay.ca";
const SITE_URL = process.env.SITE_URL || "https://www.pixelpulseplay.ca";
const LOGO_URL = "https://storage.googleapis.com/pixel-pulse-play/web/h-Logo.png";
const PARTY_BOOKING_URL =
  "https://pixelpulseplayzone.lilypadpos.app/public/onlinebooking/step1.php";
const TICKET_BOOKING_URL =
  "https://pixelpulseplayzone.lilypadpos.app/public/onlinesales/tickets1.php";
const ATTRACTIONS_URL = "https://www.pixelpulseplay.ca/attractions";

function getRequiredEnv(name) {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      fullName,
      email,
      phone,
      date,
      time,
      message,
      selectedEvent,
      subject,
      from,
    } = body || {};

    const gmailUser = getRequiredEnv("GMAIL_USER");
    const gmailAppPassword = getRequiredEnv("GMAIL_APP_PASSWORD");

    if (!gmailUser || !gmailAppPassword) {
      return NextResponse.json(
        { error: "Gmail is not configured for contact form sending." },
        { status: 500 },
      );
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });

    const safeSubject =
      subject ||
      `New Inquiry: ${selectedEvent || "General"} - ${fullName || "Unknown contact"}`;

    const text = [
      `From Location: ${from || "Pixel Pulse Play"}`,
      `Inquiry Type: ${selectedEvent || "Not provided"}`,
      `Name: ${fullName || "Not provided"}`,
      `Email: ${email || "Not provided"}`,
      `Phone: ${phone || "Not provided"}`,
      `Preferred Date: ${date || "Not provided"}`,
      `Preferred Time: ${time || "Not provided"}`,
      "",
      "Message:",
      message || "No message provided",
    ].join("\n");

    const safeName = String(fullName || "there")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    const safeEvent = String(selectedEvent || "your inquiry")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    const normalizedEvent = String(selectedEvent || "").toLowerCase();
    const isGroupBooking = normalizedEvent === "group booking";
    const isBirthdayParty = normalizedEvent === "birthday";
    const primaryCtaHref = isGroupBooking
      ? null
      : isBirthdayParty
        ? PARTY_BOOKING_URL
        : TICKET_BOOKING_URL;
    const primaryCtaLabel = isGroupBooking
      ? ""
      : isBirthdayParty
        ? "Book Birthday Party"
        : "Book Now";

    const html = `
      <div style="margin:0;padding:24px 14px;background:#050810;font-family:Arial,sans-serif;color:#f8fafc;">
        <div style="max-width:760px;margin:0 auto;border:1px solid rgba(251,174,123,0.16);border-radius:24px;overflow:hidden;background:linear-gradient(180deg,#121923 0%,#090e16 100%);box-shadow:0 18px 42px rgba(0,0,0,0.28);">
          <div style="padding:18px 22px;border-bottom:1px solid rgba(255,255,255,0.08);background:linear-gradient(90deg,rgba(251,174,123,0.16),rgba(164,207,95,0.1));">
            <img src="${LOGO_URL}" alt="Pixel Pulse Play" style="display:block;width:170px;max-width:100%;height:auto;margin:0 0 14px;" />
            <div style="font-size:12px;letter-spacing:0.22em;text-transform:uppercase;font-weight:800;color:#fbae7b;">Pixel Pulse Play</div>
            <div style="margin-top:10px;font-size:34px;line-height:1;color:#ffffff;font-weight:800;">New Inquiry</div>
          </div>

          <div style="padding:18px 22px 22px;">
            <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:separate;border-spacing:10px 10px;">
              <tr>
                <td style="width:50%;padding:12px 14px;border-radius:16px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);vertical-align:top;">
                  <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#a4cf5f;font-weight:800;">Location</div>
                  <div style="margin-top:6px;font-size:16px;line-height:1.45;color:#ffffff;">${String(from || "Pixel Pulse Play")
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")}</div>
                </td>
                <td style="width:50%;padding:12px 14px;border-radius:16px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);vertical-align:top;">
                  <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#a4cf5f;font-weight:800;">Inquiry Type</div>
                  <div style="margin-top:6px;font-size:16px;line-height:1.45;color:#ffffff;">${String(selectedEvent || "Not provided")
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")}</div>
                </td>
              </tr>
              <tr>
                <td style="width:50%;padding:12px 14px;border-radius:16px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);vertical-align:top;">
                  <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#a4cf5f;font-weight:800;">Email</div>
                  <div style="margin-top:6px;font-size:16px;line-height:1.45;color:#ffffff;">${String(email || "Not provided")
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")}</div>
                </td>
                <td style="width:50%;padding:12px 14px;border-radius:16px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);vertical-align:top;">
                  <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#a4cf5f;font-weight:800;">Phone</div>
                  <div style="margin-top:6px;font-size:16px;line-height:1.45;color:#ffffff;">${String(phone || "Not provided")
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")}</div>
                </td>
              </tr>
              <tr>
                <td style="width:50%;padding:12px 14px;border-radius:16px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);vertical-align:top;">
                  <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#a4cf5f;font-weight:800;">Preferred Date</div>
                  <div style="margin-top:6px;font-size:16px;line-height:1.45;color:#ffffff;">${String(date || "Not provided")
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")}</div>
                </td>
                <td style="width:50%;padding:12px 14px;border-radius:16px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);vertical-align:top;">
                  <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#a4cf5f;font-weight:800;">Preferred Time</div>
                  <div style="margin-top:6px;font-size:16px;line-height:1.45;color:#ffffff;">${String(time || "Not provided")
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")}</div>
                </td>
              </tr>
            </table>

            <div style="margin-top:10px;padding:16px 18px;border-radius:18px;background:rgba(255,255,255,0.05);border:1px solid rgba(251,174,123,0.12);">
              <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#fbae7b;font-weight:800;">Message</div>
              <div style="margin-top:8px;font-size:16px;line-height:1.7;color:#e2e8f0;white-space:pre-wrap;">${String(
                message || "No message provided",
              )
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")}</div>
            </div>
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Pixel Pulse Play" <${gmailUser}>`,
      to: CONTACT_EMAIL,
      replyTo: email || gmailUser,
      subject: safeSubject,
      text,
      html,
    });

    if (email) {
      const autoReplySubject = `We received your Pixel Pulse Play inquiry`;
      const autoReplyText = [
        `Hi ${fullName || "there"},`,
        "",
        "Thanks for reaching out to Pixel Pulse Play.",
        `We received your inquiry about ${selectedEvent || "your visit"} and our team will get back to you soon.`,
        "",
        "What happens next:",
        "- We review your message",
        "- We follow up with the right next steps or booking details",
        "- We help you plan the smoothest visit possible",
        "",
        `Explore attractions: ${ATTRACTIONS_URL}`,
        "",
        "If your request is time-sensitive, you can also reply directly to this email.",
        "",
        "Pixel Pulse Play",
        CONTACT_EMAIL,
      ].join("\n");

      const autoReplyHtml = `
        <div style="margin:0;padding:24px 14px;background:#050810;font-family:Arial,sans-serif;color:#f8fafc;">
          <div style="max-width:720px;margin:0 auto;border:1px solid rgba(164,207,95,0.16);border-radius:24px;overflow:hidden;background:linear-gradient(180deg,#121923 0%,#090e16 100%);box-shadow:0 18px 42px rgba(0,0,0,0.28);">
            <div style="padding:18px 22px;border-bottom:1px solid rgba(255,255,255,0.08);background:linear-gradient(90deg,rgba(164,207,95,0.14),rgba(251,174,123,0.12));">
              <img src="${LOGO_URL}" alt="Pixel Pulse Play" style="display:block;width:170px;max-width:100%;height:auto;margin:0 0 14px;" />
              <div style="font-size:12px;letter-spacing:0.22em;text-transform:uppercase;font-weight:800;color:#fbae7b;">Pixel Pulse Play</div>
              <div style="margin-top:10px;font-size:34px;line-height:1;color:#ffffff;font-weight:800;">Thanks for reaching out</div>
              <p style="margin:12px 0 0;font-size:16px;line-height:1.7;color:#d6dee9;">
                We received your message and our team will follow up as soon as possible.
              </p>
            </div>

            <div style="padding:22px;">
              <p style="margin:0 0 14px;font-size:17px;line-height:1.7;color:#f8fafc;">
                Hi ${safeName},
              </p>
              <p style="margin:0 0 14px;font-size:16px;line-height:1.8;color:#cbd5e1;">
                Thank you for contacting <strong style="color:#ffffff;">Pixel Pulse Play</strong>. We have received your inquiry about
                <strong style="color:#ffffff;"> ${safeEvent}</strong> and will get back to you soon.
              </p>

              <div style="margin:18px 0;padding:16px 18px;border-radius:18px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);">
                <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#a4cf5f;font-weight:800;">What happens next</div>
                <ul style="margin:12px 0 0;padding-left:18px;color:#e2e8f0;line-height:1.9;">
                  <li>We review your message and details</li>
                  <li>We follow up with the right information or booking guidance</li>
                  <li>We help you plan the best next step for your visit</li>
                </ul>
              </div>

              <div style="margin-top:14px;padding:14px 16px;border-radius:18px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);">
                <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#a4cf5f;font-weight:800;">Explore the experience</div>
                <div style="margin-top:8px;">
                  <a href="${ATTRACTIONS_URL}" style="color:#fbae7b;text-decoration:none;font-size:15px;font-weight:700;">View Attractions</a>
                </div>
              </div>

              ${primaryCtaHref ? `
                <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:18px;">
                  <a href="${primaryCtaHref}" style="display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 18px;border-radius:999px;background:linear-gradient(135deg,#fbae7b,#ffbf96);color:#111827;text-decoration:none;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;font-size:12px;">${primaryCtaLabel}</a>
                </div>
              ` : ""}

              <p style="margin:22px 0 0;font-size:15px;line-height:1.8;color:#cbd5e1;">
                If your request is time-sensitive, you can reply directly to this email and our team will pick it up.
              </p>
            </div>

            <div style="padding:16px 22px;border-top:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);font-size:14px;line-height:1.7;color:#94a3b8;">
              Pixel Pulse Play<br />
              <a href="mailto:${CONTACT_EMAIL}" style="color:#fbae7b;text-decoration:none;">${CONTACT_EMAIL}</a>
            </div>
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: `"Pixel Pulse Play" <${gmailUser}>`,
        to: email,
        replyTo: CONTACT_EMAIL,
        subject: autoReplySubject,
        text: autoReplyText,
        html: autoReplyHtml,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact email send failed:", error);
    return NextResponse.json(
      { error: "Failed to send inquiry email." },
      { status: 500 },
    );
  }
}
