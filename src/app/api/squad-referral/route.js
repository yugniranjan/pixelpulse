import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

const BUSINESS_NAME = "Pixel Pulse Play Zone";
const CONTACT_EMAIL = "connect@pixelpulseplay.ca";
const LOGO_URL = "https://storage.googleapis.com/pixel-pulse-play/web/h-Logo.png";
const SQUAD_URL = "https://www.pixelpulseplay.ca/squad";
const PROMO_CODE = "PP10";

function getRequiredEnv(name) {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function cleanText(value, fallback = "") {
  const cleaned = String(value || "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || fallback;
}

function cleanEmail(value) {
  const cleaned = cleanText(value, "").toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned) ? cleaned : "";
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(request) {
  try {
    const body = await request.json();
    const referrerName = cleanText(body?.referrerName, "A friend");
    const referrerEmail = cleanEmail(body?.referrerEmail);
    const friendEmails = Array.isArray(body?.friendEmails)
      ? [...new Set(body.friendEmails.map(cleanEmail).filter(Boolean))]
      : [];

    if (!referrerEmail) {
      return NextResponse.json(
        { error: "Please enter your email address." },
        { status: 400 },
      );
    }

    if (!friendEmails.length) {
      return NextResponse.json(
        { error: "Please enter at least one friend email." },
        { status: 400 },
      );
    }

    const gmailUser = getRequiredEnv("GMAIL_USER");
    const gmailAppPassword = getRequiredEnv("GMAIL_APP_PASSWORD");

    if (!gmailUser || !gmailAppPassword) {
      return NextResponse.json(
        { error: "Gmail is not configured for referral sending." },
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

    const safeReferrerName = escapeHtml(referrerName);
    const subject = `${referrerName} sent you 10% off Pixel Pulse Play`;
    const text = [
      `Hi there,`,
      "",
      `${referrerName} invited you to Pixel Pulse Play Zone.`,
      "",
      `Use promo code ${PROMO_CODE} for 10% off your visit.`,
      `Book or learn more: ${SQUAD_URL}`,
      "",
      "Pixel Pulse Play Zone",
      CONTACT_EMAIL,
    ].join("\n");

    const html = `
      <div style="margin:0;padding:24px 14px;background:#050810;font-family:Arial,sans-serif;color:#f8fafc;">
        <div style="max-width:680px;margin:0 auto;border:1px solid rgba(95,234,255,0.2);border-radius:20px;overflow:hidden;background:linear-gradient(180deg,#101322 0%,#070914 100%);">
          <div style="padding:20px 22px;border-bottom:1px solid rgba(255,255,255,0.08);background:linear-gradient(90deg,rgba(255,40,232,0.16),rgba(95,234,255,0.12));">
            <img src="${LOGO_URL}" alt="Pixel Pulse Play" style="display:block;width:170px;max-width:100%;height:auto;margin:0 0 14px;" />
            <div style="font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#b7ff22;font-weight:800;">Friend referral</div>
            <h1 style="margin:8px 0 0;color:#ffffff;font-size:28px;line-height:1.15;">You got 10% off</h1>
          </div>
          <div style="padding:22px;">
            <p style="margin:0 0 14px;font-size:16px;line-height:1.7;color:#dbeafe;">
              ${safeReferrerName} invited you to visit <strong style="color:#ffffff;">Pixel Pulse Play Zone</strong>.
            </p>
            <div style="margin:18px 0;padding:18px;border-radius:16px;background:rgba(183,255,34,0.1);border:1px solid rgba(183,255,34,0.35);text-align:center;">
              <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#b7ff22;font-weight:900;">Promo code</div>
              <div style="margin-top:6px;color:#ffffff;font-size:34px;font-weight:900;letter-spacing:0.08em;">${PROMO_CODE}</div>
              <div style="margin-top:6px;color:#cbd5e1;font-size:14px;">Use this code for 10% off.</div>
            </div>
            <a href="${SQUAD_URL}" style="display:inline-block;padding:13px 18px;border-radius:10px;background:#b7ff22;color:#070610;text-decoration:none;font-weight:900;">Book your visit</a>
          </div>
          <div style="padding:15px 22px;border-top:1px solid rgba(255,255,255,0.08);color:#94a3b8;font-size:13px;line-height:1.6;">
            Pixel Pulse Play Zone | ${CONTACT_EMAIL}
          </div>
        </div>
      </div>
    `;

    await Promise.all(
      friendEmails.map((friendEmail) =>
        transporter.sendMail({
          from: {
            name: BUSINESS_NAME,
            address: authenticatedSender,
          },
          to: friendEmail,
          replyTo: {
            name: referrerName,
            address: referrerEmail,
          },
          subject,
          text,
          html,
        }),
      ),
    );

    await transporter.sendMail({
      from: {
        name: BUSINESS_NAME,
        address: authenticatedSender,
      },
      to: CONTACT_EMAIL,
      replyTo: {
        name: referrerName,
        address: referrerEmail,
      },
      subject: `Squad referral sent by ${referrerName}`,
      text: [
        `Referrer: ${referrerName}`,
        `Referrer Email: ${referrerEmail}`,
        `Friends: ${friendEmails.join(", ")}`,
        `Promo Code: ${PROMO_CODE}`,
      ].join("\n"),
    });

    return NextResponse.json({ success: true, sent: friendEmails.length });
  } catch (error) {
    console.error("Squad referral send failed:", error);
    return NextResponse.json(
      { error: "Failed to send referral email." },
      { status: 500 },
    );
  }
}
