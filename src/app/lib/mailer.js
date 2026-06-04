import nodemailer from "nodemailer";

/**
 * Shared outbound mailer (Gmail via nodemailer), used by admin tools to send
 * branded emails to customers/parents. Mirrors the transport used by
 * /api/email so configuration stays in one place.
 */

const BUSINESS_NAME = "Pixel Pulse Play Zone";
const CONTACT_EMAIL = "connect@pixelpulseplay.ca";
const LOGO_URL = "https://storage.googleapis.com/pixel-pulse-play/web/h-Logo.png";
const SITE_URL = "https://www.pixelpulseplay.ca/";

function env(name) {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function mailerConfigured() {
  return Boolean(env("GMAIL_USER") && env("GMAIL_APP_PASSWORD"));
}

export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

let transporter;
function getTransporter() {
  if (!mailerConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: env("GMAIL_USER"), pass: env("GMAIL_APP_PASSWORD") },
    });
  }
  return transporter;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function brandedHtml(message) {
  const body = escapeHtml(message).replace(/\n/g, "<br/>");
  return `
    <div style="margin:0;padding:24px 14px;background:#050810;font-family:Arial,sans-serif;color:#f8fafc;">
      <div style="max-width:720px;margin:0 auto;border:1px solid rgba(164,207,95,0.16);border-radius:24px;overflow:hidden;background:linear-gradient(180deg,#121923 0%,#090e16 100%);box-shadow:0 18px 42px rgba(0,0,0,0.28);">
        <div style="padding:18px 22px;border-bottom:1px solid rgba(255,255,255,0.08);background:linear-gradient(90deg,rgba(164,207,95,0.14),rgba(251,174,123,0.12));">
          <img src="${LOGO_URL}" alt="Pixel Pulse Play" style="display:block;width:170px;max-width:100%;height:auto;" />
        </div>
        <div style="padding:22px;font-size:16px;line-height:1.8;color:#e7edf5;">
          ${body}
        </div>
        <div style="padding:16px 22px;border-top:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);font-size:14px;line-height:1.7;color:#94a3b8;">
          <a href="${SITE_URL}" style="color:#fbae7b;text-decoration:none;">www.pixelpulseplay.ca</a>
          &nbsp;·&nbsp;
          <a href="mailto:${CONTACT_EMAIL}" style="color:#fbae7b;text-decoration:none;">${CONTACT_EMAIL}</a>
        </div>
      </div>
    </div>
  `;
}

/**
 * Send one branded email. `subject` and `message` should already have any
 * tokens (e.g. {name}) substituted by the caller.
 */
export async function sendBrandedEmail({ to, subject, message }) {
  const tx = getTransporter();
  if (!tx) throw new Error("Mailer is not configured.");

  const sender = env("GMAIL_FROM_EMAIL") || env("GMAIL_USER");
  await tx.sendMail({
    from: { name: BUSINESS_NAME, address: sender },
    to,
    replyTo: { name: BUSINESS_NAME, address: CONTACT_EMAIL },
    subject,
    text: message,
    html: brandedHtml(message),
  });
}
