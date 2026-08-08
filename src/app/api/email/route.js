import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

const CONTACT_EMAIL = "connect@pixelpulseplay.ca";
const BUSINESS_NAME = "Pixel Pulse Play Zone";
const LOGO_URL = "https://storage.googleapis.com/pixel-pulse-play/web/h-Logo.png";
const ATTRACTIONS_URL = "https://www.pixelpulseplay.ca/attractions";
const PRIVATE_PARTY_EMAIL = CONTACT_EMAIL;
const PRIVATE_PARTY_PHONE = "+1 (905) 760-2922";
const PRIVATE_PARTY_PHONE_DISPLAY = "(905) 760-2922";
const HOW_TO_PLAY_URL = "https://www.pixelpulseplay.ca/how-to-play";
const BIRTHDAY_PACKAGE_REPLY_LINES = [
  "Here’s a quick overview of how our birthday parties work:",
  "",
  "Your Party Package Includes",
  "- Access to all 13 immersive challenge rooms for the duration specified in your chosen package.",
  "- Arcade cards can be purchased separately at a 10% discount.",
  "- Pizza and beverages as included in your selected package.",
  "- Reserved party room with tablecloth, plates, cups, and cutlery.",
  "- Dedicated party host throughout the celebration.",
  "- You can order coffee, slushies, extra drinks, water or snacks over the counter.",
  "",
  "How the Children Play",
  "Children play the challenge rooms in their own groups and can try multiple games during their scheduled playtime. Each room accommodates one group of up to 5 at a time. Our team helps guide the children and manage room rotation. If a room is occupied, the group can wait or move to another available challenge room.",
  `How to Play: ${HOW_TO_PLAY_URL}`,
  "",
  "Important to Know",
  "- Birthday packages take place during regular operating hours and are not private facility rentals. If you are looking for a private party, ask for a custom package as per your requirement.",
  "- Other parties and walk-in guests may be present, but unrelated groups are not mixed inside the challenge rooms.",
  "- Outside cake, dry snacks, and non-alcoholic beverages are welcome.",
  "- Please arrive 15 minutes early for check-in and ensure all participants complete the waiver.",
  "- Comfortable clothing and closed-toe shoes are recommended.",
  "",
  "We would love to celebrate with you!",
];
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const rateLimitBuckets = new Map();

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const ALLOWED_HOSTS = new Set([
  "pixelpulseplay.ca",
  "www.pixelpulseplay.ca",
  "birthdays.pixelpulseplay.ca",
  "summer.pixelpulseplay.ca",
  "parties.pixelpulseplay.ca",
  "squad.pixelpulseplay.ca",
  "rewards.pixelpulseplay.ca",
]);

function getRequiredEnv(name) {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getAuthenticatedSender(gmailUser) {
  return getRequiredEnv("GMAIL_FROM_EMAIL") || gmailUser;
}

function cleanHeaderValue(value, fallback) {
  const cleaned = String(value || "")
    ?.replace(/[\r\n]+/g, " ")
    ?.replace(/\s+/g, " ")
    .trim();

  return cleaned || fallback;
}

function cleanEmailAddress(value, fallback) {
  const cleaned = cleanHeaderValue(value, "");
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned) ? cleaned : fallback;
}

function escapeHtml(value) {
  return String(value || "")
    ?.replace(/&/g, "&amp;")
    ?.replace(/</g, "&lt;")
    ?.replace(/>/g, "&gt;");
}

function includesText(value, needle) {
  return String(value || "").toLowerCase().includes(needle);
}

function getRequestHost(value) {
  try {
    return new URL(value).host.toLowerCase();
  } catch {
    return "";
  }
}

function isAllowedRequestSource(request) {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = getRequestHost(origin || referer);
  const hostname = host.split(":")[0];

  return Boolean(
    host &&
      (ALLOWED_HOSTS.has(host) ||
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname.endsWith(".vercel.app")),
  );
}

function getClientIp(request) {
  const forwardedFor = request.headers.get("x-forwarded-for") || "";
  return (
    forwardedFor.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    ""
  );
}

async function verifyTurnstile(token, remoteIp) {
  const secret = getRequiredEnv("TURNSTILE_SECRET_KEY");

  // If the secret is not configured, skip verification so the form keeps
  // working in environments where Turnstile has not been set up yet.
  if (!secret) {
    return true;
  }

  if (!token) {
    return false;
  }

  try {
    const params = new URLSearchParams();
    params.append("secret", secret);
    params.append("response", token);
    if (remoteIp) {
      params.append("remoteip", remoteIp);
    }

    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });

    const data = await response.json();
    return Boolean(data?.success);
  } catch (error) {
    console.error("Turnstile verification request failed:", error);
    return false;
  }
}

function getClientKey(request, email) {
  const ip = getClientIp(request) || "unknown";
  return `${ip}:${String(email || "").toLowerCase()}`;
}

function isRateLimited(key) {
  const now = Date.now();
  const bucket = rateLimitBuckets.get(key) || [];
  const recent = bucket.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);

  if (recent.length >= RATE_LIMIT_MAX) {
    rateLimitBuckets.set(key, recent);
    return true;
  }

  recent.push(now);
  rateLimitBuckets.set(key, recent);
  return false;
}

export async function POST(request) {
  try {
    if (!isAllowedRequestSource(request)) {
      return NextResponse.json(
        { error: "Invalid request source." },
        { status: 403 },
      );
    }

    const body = await request.json();

    const {
      fullName,
      childName,
      childYear,
      age,
      email,
      phone,
      date,
      time,
      message,
      selectedEvent,
      selectedPackage,
      from,
      contactCompany,
      websiteUrl,
      turnstileToken,
    } = body || {};

    if (contactCompany || websiteUrl) {
      return NextResponse.json({ success: true });
    }

    const passedTurnstile = await verifyTurnstile(
      turnstileToken,
      getClientIp(request),
    );

    if (!passedTurnstile) {
      return NextResponse.json(
        { error: "Verification failed. Please try again." },
        { status: 403 },
      );
    }

    const gmailUser = getRequiredEnv("GMAIL_USER");
    const gmailAppPassword = getRequiredEnv("GMAIL_APP_PASSWORD");

    if (!gmailUser || !gmailAppPassword) {
      return NextResponse.json(
        { error: "Gmail is not configured for contact form sending." },
        { status: 500 },
      );
    }

    const authenticatedSender = getAuthenticatedSender(gmailUser);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });

    const visitorName = cleanHeaderValue(fullName, "Website Inquiry");
    const visitorDisplayName = visitorName.toLowerCase();
    const visitorEmail = cleanEmailAddress(email, "");
    const visitorPhone = cleanHeaderValue(phone, "");
    const childDisplayName = cleanHeaderValue(childName, "");
    const childDisplayYear = cleanHeaderValue(childYear || age, "");

    if (!visitorEmail) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 },
      );
    }

    if (!visitorPhone) {
      return NextResponse.json(
        { error: "Please enter your phone number." },
        { status: 400 },
      );
    }

    if (isRateLimited(getClientKey(request, visitorEmail))) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    const safeSubject = `${visitorDisplayName} - ${BUSINESS_NAME} (Inquiry)`;

    const text = [
      `From Location: ${from || "Pixel Pulse Play"}`,
      `Inquiry Type: ${selectedEvent || "Not provided"}`,
      `Name: ${fullName || "Not provided"}`,
      `Child Name: ${childDisplayName || "Not provided"}`,
      `Year: ${childDisplayYear || "Not provided"}`,
      `Email: ${email || "Not provided"}`,
      `Phone: ${visitorPhone}`,
      `Preferred Date: ${date || "Not provided"}`,
      `Preferred Time: ${time || "Not provided"}`,
      `Party Package: ${selectedPackage || "Not provided"}`,
      "",
      "Message:",
      message || "No message provided",
    ].join("\n");

    const safeName = escapeHtml(fullName || "there");
    const isBirthdayInquiry =
      includesText(selectedEvent, "birthday") ||
      includesText(selectedEvent, "birth") ||
      includesText(from, "birthday");
    const isPrivatePartyInquiry =
      includesText(selectedEvent, "private") ||
      includesText(selectedPackage, "private") ||
      includesText(message, "private party");
    const isBirthdayPackageInquiry = isBirthdayInquiry && !isPrivatePartyInquiry;
    const autoReplyPrivatePartyText = isBirthdayPackageInquiry
      ? ["", ...BIRTHDAY_PACKAGE_REPLY_LINES]
      : [];
    const autoReplyPrivatePartyHtml = isBirthdayPackageInquiry
      ? `
              <div style="margin:18px 0 14px;padding:16px;border-radius:14px;background:#f9fafb;border:1px solid #e5e7eb;">
                <p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#374151;">
                  Here’s a quick overview of how our birthday parties work:
                </p>

                <h2 style="margin:18px 0 8px;font-size:18px;line-height:1.3;color:#111827;">Your Party Package Includes</h2>
                <ul style="margin:0 0 16px 20px;padding:0;color:#374151;font-size:15px;line-height:1.7;">
                  <li>Access to all 13 immersive challenge rooms for the duration specified in your chosen package.</li>
                  <li>Arcade cards can be purchased separately at a 10% discount.</li>
                  <li>Pizza and beverages as included in your selected package.</li>
                  <li>Reserved party room with tablecloth, plates, cups, and cutlery.</li>
                  <li>Dedicated party host throughout the celebration.</li>
                  <li>You can order coffee, slushies, extra drinks, water or snacks over the counter.</li>
                </ul>

                <h2 style="margin:18px 0 8px;font-size:18px;line-height:1.3;color:#111827;">How the Children Play</h2>
                <p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:#374151;">
                  Children play the challenge rooms in their own groups and can try multiple games during their scheduled playtime. Each room accommodates one group of up to 5 at a time. Our team helps guide the children and manage room rotation. If a room is occupied, the group can wait or move to another available challenge room.
                </p>
                <p style="margin:0 0 16px;">
                  <a href="${HOW_TO_PLAY_URL}" style="display:inline-block;border-radius:10px;background:#a4cf5f;color:#111827;padding:12px 16px;text-decoration:none;font-size:15px;font-weight:800;">Watch How to Play</a>
                </p>

                <h2 style="margin:18px 0 8px;font-size:18px;line-height:1.3;color:#111827;">Important to Know</h2>
                <ul style="margin:0 0 16px 20px;padding:0;color:#374151;font-size:15px;line-height:1.7;">
                  <li>Birthday packages take place during regular operating hours and are not private facility rentals. If you are looking for a private party, ask for a custom package as per your requirement.</li>
                  <li>Other parties and walk-in guests may be present, but unrelated groups are not mixed inside the challenge rooms.</li>
                  <li>Outside cake, dry snacks, and non-alcoholic beverages are welcome.</li>
                  <li>Please arrive 15 minutes early for check-in and ensure all participants complete the waiver.</li>
                  <li>Comfortable clothing and closed-toe shoes are recommended.</li>
                </ul>

                <p style="margin:0;font-size:15px;line-height:1.7;color:#374151;">
                  We would love to celebrate with you!
                </p>
              </div>
        `
      : "";

    const html = `
      <div>
        <p><strong>Inquiry Type:</strong> ${escapeHtml(selectedEvent || "Not provided")}</p>
        <p><strong>Name:</strong> ${escapeHtml(fullName || "Not provided")}</p>
        <p><strong>Child Name:</strong> ${escapeHtml(childDisplayName || "Not provided")}</p>
        <p><strong>Year:</strong> ${escapeHtml(childDisplayYear || "Not provided")}</p>
        <p><strong>Email:</strong> ${escapeHtml(email || "Not provided")}</p>
        <p><strong>Phone:</strong> ${escapeHtml(visitorPhone)}</p>
        <p><strong>Preferred Date:</strong> ${escapeHtml(date || "Not provided")}</p>
        <p><strong>Preferred Time:</strong> ${escapeHtml(time || "Not provided")}</p>
        <p><strong>Party Package:</strong> ${escapeHtml(selectedPackage || "Not provided")}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message || "No message provided")}</p>
      </div>
    `;

    await transporter.sendMail({
      from: {
        name: visitorEmail,
        address: authenticatedSender,
      },
      to: CONTACT_EMAIL,
      replyTo: {
        name: visitorDisplayName,
        address: visitorEmail,
      },
      envelope: {
        from: authenticatedSender,
        to: CONTACT_EMAIL,
      },
      subject: safeSubject,
      text,
      html,
    });

    if (email) {
      const autoReplySubject = `We received your Pixel Pulse Play inquiry`;
      const autoReplyText = isBirthdayPackageInquiry
        ? [
            `Hi ${fullName || "there"},`,
            "",
            "Thank you for your inquiry. Our team will get back to you within 24 hours.",
            ...autoReplyPrivatePartyText,
            "",
            "Pixel Pulse Play",
            CONTACT_EMAIL,
          ].join("\n")
        : [
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
            `How to Play: ${HOW_TO_PLAY_URL}`,
            "",
            `Explore attractions: ${ATTRACTIONS_URL}`,
            "",
            "If your request is time-sensitive, you can also reply directly to this email.",
            "",
            "Pixel Pulse Play",
            CONTACT_EMAIL,
          ].join("\n");

      const autoReplyHtml = `
        <div style="margin:0;padding:24px 14px;background:#f3f4f6;font-family:Arial,sans-serif;color:#111827;">
          <div style="max-width:720px;margin:0 auto;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;background:#ffffff;box-shadow:0 18px 42px rgba(15,23,42,0.08);">
            <div style="padding:18px 22px;border-bottom:1px solid #e5e7eb;background:#ffffff;">
              <img src="${LOGO_URL}" alt="Pixel Pulse Play" style="display:block;width:170px;max-width:100%;height:auto;margin:0 0 14px;" />
            </div>

            <div style="padding:22px;">
              <p style="margin:0 0 14px;font-size:17px;line-height:1.7;color:#111827;">
                Hi ${safeName},
              </p>
              ${
                isBirthdayPackageInquiry
                  ? `
                    <p style="margin:0 0 14px;font-size:16px;line-height:1.8;color:#374151;">
                      Thank you for your inquiry. Our team will get back to you within 24 hours.
                    </p>
                  `
                  : `
                    <p style="margin:0 0 14px;font-size:16px;line-height:1.8;color:#374151;">
                      Thank you for contacting <strong style="color:#111827;">Pixel Pulse Play Zone</strong>.
                    </p>
                    <p style="margin:0 0 14px;font-size:16px;line-height:1.8;color:#374151;">
                      We will get back to you within 24 hours.
                    </p>
                  `
              }

              ${autoReplyPrivatePartyHtml}

              ${
                isBirthdayPackageInquiry
                  ? ""
                  : `
                    <div style="margin-top:14px;padding:14px 16px;border-radius:14px;background:#f9fafb;border:1px solid #e5e7eb;">
                      <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#4d7c0f;font-weight:800;">Explore the experience</div>
                      <div style="margin-top:12px;display:block;">
                        <a href="${HOW_TO_PLAY_URL}" style="display:inline-block;margin:0 10px 10px 0;border-radius:10px;background:#a4cf5f;color:#111827;padding:12px 16px;text-decoration:none;font-size:15px;font-weight:800;">Watch How to Play</a>
                        <a href="${ATTRACTIONS_URL}" style="display:inline-block;margin:0 0 10px;border-radius:10px;background:#fbae7b;color:#111827;padding:12px 16px;text-decoration:none;font-size:15px;font-weight:800;">View Attractions</a>
                      </div>
                    </div>
                  `
              }
            </div>

            <div style="padding:16px 22px;border-top:1px solid #e5e7eb;background:#f9fafb;font-size:14px;line-height:1.7;color:#6b7280;">
              <a href="https://www.pixelpulseplay.ca/" style="color:#175cd3;text-decoration:none;">Visit us at: www.pixelpulseplay.ca</a>
            </div>
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: {
          name: BUSINESS_NAME,
          address: authenticatedSender,
        },
        to: email,
        replyTo: {
          name: BUSINESS_NAME,
          address: CONTACT_EMAIL,
        },
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
