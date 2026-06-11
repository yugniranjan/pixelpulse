import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { recordSquadReferrals } from "@/lib/squadReferrals";

export const runtime = "nodejs";

const BUSINESS_NAME = "Pixel Pulse Play Zone";
const CONTACT_EMAIL = "connect@pixelpulseplay.ca";
const LOGO_URL = "https://storage.googleapis.com/pixel-pulse-play/web/h-Logo.png";
const BACKGROUND_URL = "https://storage.googleapis.com/pixel-pulse-play/web/birthdaylandinghero.webp";
const SQUAD_URL = "https://www.pixelpulseplay.ca/squad";
const STORE_MAP_URL = "https://www.google.com/maps/search/?api=1&query=Pixel%20Pulse%20Playzone%20960%20Edgeley%20Blvd%20Vaughan%20ON";
const DISCOUNT_PERCENT = 10;
const STORE_VISIT_TEXT = "Visit Pixel Pulse Playzone in-store to redeem your code.";

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

function getInitials(name = "") {
  const initials = String(name || "")
    .trim()
    .split(/\s+/)
    .map((part) => part.replace(/[^a-z0-9]/gi, "").charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return initials || "PP";
}

function createPromoCode(referrerName = "") {
  const initials = getInitials(referrerName);
  const uniqueSuffix = Math.random().toString(36).slice(2, 4).toUpperCase();
  return `${initials}${DISCOUNT_PERCENT}${uniqueSuffix}`;
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

    // One unique promo code per friend so an in-store redemption can be traced
    // back to the exact referral (and counted toward the referrer's award tier).
    const referrals = friendEmails.map((friendEmail) => ({
      email: friendEmail,
      promoCode: createPromoCode(referrerName),
    }));

    function buildFriendText(promoCode) {
      return [
        `Hi there,`,
        "",
        `${referrerName} invited you to experience Pixel Pulse Playzone — Vaughan's all-new interactive challenge arena for teens, friends & families.`,
        "",
        "Think real-life games with immersive challenge rooms, glowing arenas, team missions, arcade action, and nonstop fun — perfect for birthdays, hangouts, and weekend adventures.",
        "",
        `Use promo code ${promoCode} for ${DISCOUNT_PERCENT}% off your visit.`,
        STORE_VISIT_TEXT,
        `Location: ${STORE_MAP_URL}`,
        "",
        "Want to invite your friends too?",
        `Join the Squad and send your own invite: ${SQUAD_URL}`,
        "",
        "Pixel Pulse Play Zone",
        CONTACT_EMAIL,
      ].join("\n");
    }

    function buildFriendHtml(promoCode) {
      return `
      <div style="margin:0;padding:24px 14px;background:#050810 url('${BACKGROUND_URL}') center/cover no-repeat;font-family:Arial,sans-serif;color:#f8fafc;">
        <div style="max-width:680px;margin:0 auto;border:1px solid rgba(95,234,255,0.2);border-radius:20px;overflow:hidden;background:linear-gradient(180deg,rgba(16,19,34,0.94) 0%,rgba(7,9,20,0.96) 100%);box-shadow:0 24px 70px rgba(0,0,0,0.46);">
          <div style="padding:20px 22px;border-bottom:1px solid rgba(255,255,255,0.08);background:linear-gradient(90deg,rgba(255,40,232,0.16),rgba(95,234,255,0.12));">
            <img src="${LOGO_URL}" alt="Pixel Pulse Play" style="display:block;width:170px;max-width:100%;height:auto;margin:0 0 14px;" />
            <div style="font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#b7ff22;font-weight:800;">Friend referral</div>
            <h1 style="margin:8px 0 0;color:#ffffff;font-size:28px;line-height:1.15;">You got 10% off</h1>
          </div>
          <div style="padding:22px;">
            <p style="margin:0 0 14px;font-size:16px;line-height:1.7;color:#dbeafe;">
              ${safeReferrerName} invited you to experience <strong style="color:#ffffff;">Pixel Pulse Playzone</strong> — Vaughan&apos;s all-new interactive challenge arena for teens, friends &amp; families.
            </p>
            <p style="margin:0 0 14px;font-size:16px;line-height:1.7;color:#dbeafe;">
              Think real-life games with immersive challenge rooms, glowing arenas, team missions, arcade action, and nonstop fun — perfect for birthdays, hangouts, and weekend adventures.
            </p>
            <div style="margin:18px 0;padding:18px;border-radius:16px;background:rgba(183,255,34,0.1);border:1px solid rgba(183,255,34,0.35);text-align:center;">
              <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#b7ff22;font-weight:900;">Promo code</div>
              <div style="margin-top:6px;color:#ffffff;font-size:34px;font-weight:900;letter-spacing:0.08em;">${promoCode}</div>
              <div style="margin-top:6px;color:#cbd5e1;font-size:14px;">Use this unique code for ${DISCOUNT_PERCENT}% off.</div>
            </div>
            <p style="margin:0 0 18px;padding:14px 16px;border-radius:14px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:#f8fafc;font-size:15px;line-height:1.6;font-weight:800;">
              <a href="${STORE_MAP_URL}" style="color:#b7ff22;text-decoration:none;font-weight:900;">
              ${STORE_VISIT_TEXT}
              </a>
            </p>
            <div style="margin-top:18px;padding:16px;border-radius:16px;background:rgba(95,234,255,0.08);border:1px solid rgba(95,234,255,0.24);">
              <p style="margin:0 0 12px;color:#e0f2fe;font-size:15px;line-height:1.6;">
                Want to invite your friends too?
              </p>
              <a href="${SQUAD_URL}" style="display:inline-block;padding:11px 15px;border-radius:10px;background:#5feaff;color:#070610;text-decoration:none;font-weight:900;">Join the Squad</a>
            </div>
          </div>
          <div style="padding:15px 22px;border-top:1px solid rgba(255,255,255,0.08);color:#94a3b8;font-size:13px;line-height:1.6;">
            Pixel Pulse Play Zone | ${CONTACT_EMAIL}
          </div>
        </div>
      </div>
    `;
    }

    await Promise.all(
      referrals.map((referral) =>
        transporter.sendMail({
          from: {
            name: BUSINESS_NAME,
            address: authenticatedSender,
          },
          to: referral.email,
          replyTo: {
            name: referrerName,
            address: referrerEmail,
          },
          subject,
          text: buildFriendText(referral.promoCode),
          html: buildFriendHtml(referral.promoCode),
        }),
      ),
    );

    // Persist the referrals for award tracking. Best-effort: a DB hiccup must not
    // break the customer-facing referral emails that already went out.
    try {
      await recordSquadReferrals({
        referrerName,
        referrerEmail,
        source: "squad-referral-card",
        friends: referrals,
      });
    } catch (dbError) {
      console.error("Failed to persist squad referrals:", dbError);
    }

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
        "",
        "Friends and their unique promo codes:",
        ...referrals.map((r) => `- ${r.email}: ${r.promoCode}`),
        "",
        `Discount: ${DISCOUNT_PERCENT}%`,
      ].join("\n"),
    });

    return NextResponse.json({ success: true, sent: referrals.length });
  } catch (error) {
    console.error("Squad referral send failed:", error);
    return NextResponse.json(
      { error: "Failed to send referral email." },
      { status: 500 },
    );
  }
}
