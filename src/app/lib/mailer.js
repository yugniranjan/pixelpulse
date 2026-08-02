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
const PHONE_DISPLAY = "+1 (905) 760-2922";
const PHONE_TEL = "+19057602922";
const ADDRESS = "960 Edgeley Blvd #2, Vaughan, ON L4K 4V4";

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
    <div style="margin:0;padding:24px 14px;background:#f4f6fb;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
        <div style="height:4px;background:linear-gradient(90deg,#a4cf5f,#fbae7b,#f59e0b);"></div>
        <div style="padding:20px 24px;border-bottom:1px solid #eef0f4;background:#ffffff;">
          <img src="${LOGO_URL}" alt="Pixel Pulse Play Zone" style="display:block;width:180px;max-width:60%;height:auto;" />
        </div>
        <div style="padding:24px;font-size:16px;line-height:1.7;color:#1f2937;">
          ${body}
        </div>
        <div style="padding:18px 24px;border-top:1px solid #eef0f4;background:#fafbfc;font-size:13px;line-height:1.7;color:#6b7280;">
          <strong style="color:#111827;">${BUSINESS_NAME}</strong><br/>
          ${ADDRESS}<br/>
          Phone: <a href="tel:${PHONE_TEL}" style="color:#2563eb;text-decoration:none;">${PHONE_DISPLAY}</a>
          &nbsp;·&nbsp;
          <a href="mailto:${CONTACT_EMAIL}" style="color:#2563eb;text-decoration:none;">${CONTACT_EMAIL}</a><br/>
          <a href="${SITE_URL}" style="color:#2563eb;text-decoration:none;">www.pixelpulseplay.ca</a>
        </div>
      </div>
    </div>
  `;
}

/**
 * Send one branded email. `subject` and `message` should already have any
 * tokens (e.g. {name}) substituted by the caller.
 */
export async function sendBrandedEmail({ to, subject, message, replyTo, attachments = [] }) {
  const tx = getTransporter();
  if (!tx) throw new Error("Mailer is not configured.");

  const sender = env("GMAIL_FROM_EMAIL") || env("GMAIL_USER");
  const replyAddress = replyTo && isEmail(replyTo) ? replyTo : CONTACT_EMAIL;
  await tx.sendMail({
    from: { name: BUSINESS_NAME, address: sender },
    to,
    replyTo: replyAddress,
    subject,
    text: message,
    html: brandedHtml(message),
    attachments,
  });
}
