import { NextResponse } from "next/server";
import { readFileSync } from "node:fs";
import path from "node:path";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

const BUSINESS_NAME = "Pixel Pulse Play Zone";
const CONTACT_EMAIL = "connect@pixelpulseplay.ca";
const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024;
const SOCIAL_REDIRECT_FALLBACKS = {
  facebook: "https://www.facebook.com/pixelpulseplay",
  instagram: "https://www.instagram.com/pixelpulseplay",
  tiktok: "https://www.tiktok.com/@pixelpulseplay",
};

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

function readSocialRedirectLinks() {
  const links = { ...SOCIAL_REDIRECT_FALLBACKS };

  try {
    const csv = readFileSync(path.join(process.cwd(), "social_redirects.csv"), "utf8");
    csv
      .split(/\r?\n/)
      .slice(1)
      .forEach((line) => {
        const [source, destination] = line.split(",");
        const key = cleanText(source).replace(/^\//, "");
        const url = cleanText(destination);

        if (key in links && url) {
          links[key] = url;
        }
      });
  } catch (error) {
    console.warn("Social redirect sheet unavailable for thank you email:", error);
  }

  return links;
}

function renderSocialIconLink({ href, label, iconUrl }) {
  return `
    <a href="${escapeHtml(href)}" aria-label="${escapeHtml(label)}" style="display:inline-block;margin:0 5px;text-decoration:none;">
      <img src="${escapeHtml(iconUrl)}" alt="${escapeHtml(label)}" width="34" height="34" style="display:block;border:0;width:34px;height:34px;border-radius:50%;" />
    </a>
  `;
}

async function parseEmailRequest(request) {
  const contentType = request.headers.get("content-type") || "";

  if (!contentType.includes("multipart/form-data")) {
    return { body: await request.json(), attachments: [] };
  }

  const formData = await request.formData();
  const body = {};
  const files = formData.getAll("attachments").filter((value) => value && typeof value === "object" && "arrayBuffer" in value);
  let totalAttachmentBytes = 0;

  formData.forEach((value, key) => {
    if (key === "attachments") return;
    body[key] = typeof value === "string" ? value : "";
  });

  const attachments = await Promise.all(
    files.map(async (file) => {
      totalAttachmentBytes += file.size || 0;
      return {
        filename: cleanText(file.name) || "attachment",
        content: Buffer.from(await file.arrayBuffer()),
        contentType: file.type || undefined,
      };
    }),
  );

  if (totalAttachmentBytes > MAX_ATTACHMENT_BYTES) {
    const error = new Error("Attachments must be 15 MB or less in total.");
    error.status = 400;
    throw error;
  }

  return { body, attachments };
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

function renderThankYouHtml({ firstName, feedbackUrl, bookingLink, websiteLink, socialLinks, partyId }) {
  const greeting = firstName ? `Hi ${escapeHtml(firstName)},` : "Hi,";
  const iconBaseUrl = websiteLink.replace(/\/+$/, "");
  const socialIconLinks = [
    {
      href: socialLinks.instagram,
      label: "Instagram",
      iconUrl: `${iconBaseUrl}/assets/images/social_icon/instagram.png`,
    },
    {
      href: socialLinks.facebook,
      label: "Facebook",
      iconUrl: `${iconBaseUrl}/assets/images/social_icon/facebook.png`,
    },
    {
      href: socialLinks.tiktok,
      label: "TikTok",
      iconUrl: `${iconBaseUrl}/assets/images/social_icon/tiktok.png`,
    },
  ];

  return `
    <div style="margin:0;padding:0;background:#f3f4f6;">
      <div style="max-width:680px;margin:0 auto;padding:24px;font-family:Arial,sans-serif;color:#111827;">
        <div style="background:#111827;color:#ffffff;border-radius:14px 14px 0 0;padding:24px;">
          <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#a4cf5f;">Pixel Pulse Play</p>
          <h1 style="margin:0;font-size:28px;line-height:1.15;">Thanks for Playing at Pixel Pulse!</h1>
          ${partyId ? `<p style="margin:10px 0 0;color:#e5e7eb;">Party ID: <strong>${escapeHtml(partyId)}</strong></p>` : ""}
        </div>
        <div style="background:#ffffff;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 14px 14px;padding:24px;font-size:15px;line-height:1.7;color:#374151;">
          <p style="margin:0 0 14px;">${greeting}</p>
          <p style="margin:0 0 12px;">We loved having you at Pixel Pulse and hope you had an incredible time taking on our immersive challenges, competing with your team, and making unforgettable memories.</p>
          <p style="margin:0 0 18px;">Whether you came with family, friends, or colleagues, thank you for choosing us to be part of your day. We can't wait to welcome you back for another round!</p>

          <h2 style="margin:24px 0 8px;font-size:20px;line-height:1.25;color:#111827;">Help Us Level Up</h2>
          <p style="margin:0 0 14px;">We're always looking for ways to make every visit even more exciting. We'd love to hear about your experience and any ideas you have for us.</p>
          <p style="margin:18px 0;">
            <a href="${escapeHtml(feedbackUrl)}" style="display:inline-block;border-radius:8px;background:#111827;color:#ffffff;padding:13px 18px;font-weight:700;text-decoration:none;">Share Your Feedback</a>
          </p>

          <div style="margin:24px 0;padding:18px;border-radius:12px;background:#f7fbea;border:1px solid #d8e6b8;">
            <h2 style="margin:0 0 10px;font-size:20px;line-height:1.25;color:#111827;">Your Next Challenge Awaits!</h2>
            <p style="margin:0 0 12px;">As a thank you for visiting, here's an exclusive reward just for you.</p>
            <p style="margin:0 0 8px;"><strong style="color:#111827;">Choose ONE reward on your next visit:</strong></p>
            <ul style="margin:0 0 12px 20px;padding:0;color:#374151;">
              <li style="margin:4px 0;"><strong>10% OFF</strong> your next play session, or</li>
              <li style="margin:4px 0;"><strong>FREE 15 Extra Minutes</strong> with any regular play session.</li>
            </ul>
            <p style="margin:0 0 12px;"><strong style="color:#111827;">Offer valid for 14 days from your visit.</strong></p>
            <p style="margin:0;">Simply show this email when you arrive to redeem your reward.</p>
          </div>

          <p style="margin:0 0 18px;">Challenge your friends, beat your best score, and experience even more action on your next visit!</p>
          <p style="margin:18px 0;">
            <a href="${escapeHtml(bookingLink)}" style="display:inline-block;border-radius:8px;background:#a4cf5f;color:#111827;padding:13px 18px;font-weight:800;text-decoration:none;">Book Your Next Visit</a>
          </p>

          <p style="margin:22px 0 8px;">Thank you for being part of the Pixel Pulse community.</p>
          <p style="margin:0 0 18px;"><strong style="color:#111827;">Skip the Screen. Enter the Challenge.</strong></p>
          <p style="margin:0 0 18px;">We can't wait to welcome you back for your next adventure!</p>
          <p style="margin:0 0 18px;">See you soon,<br /><strong style="color:#111827;">The Pixel Pulse Team</strong></p>
          <p style="margin:0;color:#6b7280;">
            Vaughan, Ontario<br />
            <a href="${escapeHtml(websiteLink)}" style="color:#175cd3;text-decoration:none;">${escapeHtml(websiteLink)}</a>
          </p>
          <p style="margin:18px 0 0;">
            ${socialIconLinks.map(renderSocialIconLink).join("")}
          </p>
        </div>
      </div>
    </div>
  `;
}

export async function POST(request) {
  try {
    const { body, attachments } = await parseEmailRequest(request);
    const to = cleanEmail(body?.email);
    const smsText = cleanText(body?.smsText);
    const confirmationEmailText = cleanText(body?.confirmationEmailText);
    const feedbackUrl = cleanText(body?.feedbackUrl);
    const firstName = cleanText(body?.firstName);
    const bookingLink = cleanText(body?.bookingLink) || "https://www.pixelpulseplay.ca/booking?type=ticket";
    const websiteLink = cleanText(body?.websiteLink) || "https://www.pixelpulseplay.ca";
    const socialLinks = readSocialRedirectLinks();
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
          firstName ? `Hi ${firstName},` : "Hi,",
          "",
          partyId ? `Party ID: ${partyId}` : "",
          "Thanks for Playing at Pixel Pulse!",
          "",
          "We loved having you at Pixel Pulse and hope you had an incredible time taking on our immersive challenges, competing with your team, and making unforgettable memories.",
          "",
          "Whether you came with family, friends, or colleagues, thank you for choosing us to be part of your day. We can't wait to welcome you back for another round!",
          "",
          "Help Us Level Up",
          "We're always looking for ways to make every visit even more exciting. We'd love to hear about your experience and any ideas you have for us.",
          "",
          `Feedback form: ${feedbackUrl}`,
          "",
          "Your Next Challenge Awaits!",
          "As a thank you for visiting, here's an exclusive reward just for you.",
          "",
          "Choose ONE reward on your next visit:",
          "- 10% OFF your next play session, or",
          "- FREE 15 Extra Minutes with any regular play session.",
          "",
          "Offer valid for 14 days from your visit.",
          "Simply show this email when you arrive to redeem your reward.",
          "",
          `Book Your Next Visit: ${bookingLink}`,
          "",
          "Thank you for being part of the Pixel Pulse community.",
          "Skip the Screen. Enter the Challenge.",
          "",
          "See you soon,",
          "The Pixel Pulse Team",
          "Vaughan, Ontario",
          websiteLink,
          `Instagram: ${socialLinks.instagram}`,
          `Facebook: ${socialLinks.facebook}`,
          `TikTok: ${socialLinks.tiktok}`,
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
      ? renderThankYouHtml({ firstName, feedbackUrl, bookingLink, websiteLink, socialLinks, partyId })
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
        ? "Thanks for Playing at Pixel Pulse!"
        : confirmationEmailText
        ? "Your Pixel Pulse Birthday Party is Confirmed"
        : "Your Party Invite at Pixel Pulse Playzone! 🎉",
      text,
      html,
      attachments,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Invite SMS email send failed:", error);
    return NextResponse.json(
      { error: error?.status === 400 ? error.message : "Failed to send invite SMS email." },
      { status: error?.status || 500 },
    );
  }
}
