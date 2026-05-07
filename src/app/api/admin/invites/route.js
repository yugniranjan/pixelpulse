import { NextResponse } from "next/server";
import { db } from "@/lib/firestore";
import { getConfigValue } from "@/lib/ctaContent";
import { normalizeInviteSlug } from "@/lib/invites";
import { partyWaiverDocId } from "@/lib/partyWaivers";
import {
  getPostgresInviteByPartyId,
  hasPostgres,
  postgresInviteSlugExists,
  upsertPostgresInvite,
  upsertPostgresPartyWaiver,
} from "@/lib/postgresData";
import { fetchsheetdata } from "@/lib/sheets";
import { LOCATION_NAME } from "@/lib/constant";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DEFAULT_ADDRESS = "960 Edgeley Blvd #2, Vaughan, ON L4K 4V4";
const DEFAULT_DIRECTIONS_LINK =
  "https://www.google.com/maps/search/?api=1&query=960%20Edgeley%20Blvd%20%232%2C%20Vaughan%2C%20ON%20L4K%204V4";
const DEFAULT_GREETING = "Hi,";
const DEFAULT_GUEST_LINE = "You are invited!";
const DEFAULT_PARTY_INTRO =
  "🎉 Get ready for an epic birthday adventure filled with games, laughs, challenges, and nonstop fun! We’re celebrating at Pixel Pulse Playzone and you’re invited to join the action! 🎮⚡";

function cleanText(value = "") {
  return String(value || "").trim();
}

function escapeRegExp(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function titleWithoutChildName(title = "", childName = "") {
  const cleanedTitle = cleanText(title);
  const cleanedChildName = cleanText(childName);
  if (!cleanedChildName) return cleanedTitle;

  return cleanedTitle
    .replace(new RegExp(`^${escapeRegExp(cleanedChildName)}\\s*['’]s\\s*`, "i"), "")
    .replace(new RegExp(`^${escapeRegExp(cleanedChildName)}\\s+`, "i"), "")
    .trim();
}

function plainSheetText(value = "") {
  return cleanText(value).replace(/<br\s*\/?>/gi, "\n");
}

async function getInviteDefaults() {
  const configData = await fetchsheetdata("config", LOCATION_NAME || "vaughan");
  const greeting = plainSheetText(
    getConfigValue(configData, ["partyFormGreeting", "inviteGreeting", "greeting"]),
  ) || DEFAULT_GREETING;
  const guestName = plainSheetText(
    getConfigValue(configData, ["partyFormGuestLine", "inviteGuestName", "guestName"]),
  ) || DEFAULT_GUEST_LINE;
  const intro = plainSheetText(
    getConfigValue(configData, [
      "partyFormIntro",
      "inviteSmsIntro",
      "smsIntro",
      "inviteIntro",
      "inviteMessage",
    ]),
  ) || DEFAULT_PARTY_INTRO;

  return { greeting, guestName, intro };
}

async function getAvailableSlug(baseSlug) {
  let slug = baseSlug;
  let index = 2;

  while (
    hasPostgres()
      ? await postgresInviteSlugExists(slug)
      : (await db.collection("invites").doc(slug).get()).exists
  ) {
    slug = `${baseSlug}-${index}`;
    index += 1;
  }

  return slug;
}

async function getInviteSlugByPartyId(partyId) {
  if (!partyId) return "";

  if (hasPostgres()) {
    const invite = await getPostgresInviteByPartyId(partyId);
    return normalizeInviteSlug(invite?.slug);
  }

  const snapshot = await db.collection("invites").where("partyId", "==", partyId).limit(1).get();
  return normalizeInviteSlug(snapshot.docs[0]?.id);
}

function getOrigin(req) {
  const configured = process.env.SITE_URL || process.env.NEXT_PUBLIC_BASE_URL;
  if (configured) return configured?.replace(/\/$/, "");
  return new URL(req.url).origin;
}

export async function GET() {
  return NextResponse.json({
    defaults: await getInviteDefaults(),
  });
}

export async function POST(req) {
  if (!db && !hasPostgres()) {
    return NextResponse.json(
      { error: "Firestore is not configured locally" },
      { status: 503 },
    );
  }

  const body = await req.json();
  const childName = cleanText(body.childName);
  const partyId = cleanText(body.partyId);
  const date = cleanText(body.date);
  const time = cleanText(body.time);
  const rsvpName = cleanText(body.rsvpName);
  const phone = cleanText(body.phone);

  if (!childName || !date || !time || !rsvpName || !phone) {
    return NextResponse.json(
      { error: "Child name, date, time, RSVP name, and RSVP phone are required." },
      { status: 400 },
    );
  }

  const requestedSlug = normalizeInviteSlug(body.slug);
  const baseSlug = requestedSlug || normalizeInviteSlug(`${childName}-${date}`);
  const existingPartySlug = await getInviteSlugByPartyId(partyId);
  const slug = existingPartySlug || await getAvailableSlug(baseSlug);
  const origin = getOrigin(req);
  const inviteUrl = `${origin}/invite/${slug}`;
  const waiverLink = partyId
    ? `${origin}/waiver?partyId=${encodeURIComponent(partyId)}`
    : `${origin}/waiver`;
  const title = titleWithoutChildName(cleanText(body.title) || "Birthday Party", childName) || "Birthday Party";
  const websiteLink = cleanText(body.websiteLink);
  const websiteText = cleanText(body.websiteText) || websiteLink?.replace(/^https?:\/\//, "");
  const inviteDefaults = await getInviteDefaults();
  const greeting = cleanText(body.greeting) || inviteDefaults.greeting;
  const guestName = cleanText(body.guestName) || inviteDefaults.guestName;
  const intro = cleanText(body.intro) || inviteDefaults.intro;
  const now = new Date();

  const invite = {
    active: "1",
    slug,
    partyId,
    eyebrow: cleanText(body.eyebrow) || "Birthday Invite",
    greeting,
    guestName,
    childName,
    title,
    titleSuffix: cleanText(body.titleSuffix) || title,
    intro,
    dateLabel: cleanText(body.dateLabel) || "Date",
    date,
    timeLabel: cleanText(body.timeLabel) || "Time",
    time,
    venueLabel: cleanText(body.venueLabel) || "Place",
    venue: cleanText(body.venue),
    addressLabel: cleanText(body.addressLabel) || "Address",
    address: cleanText(body.address) || DEFAULT_ADDRESS,
    waiverLabel: cleanText(body.waiverLabel) || "Waiver",
    waiverText: cleanText(body.waiverText),
    waiverButton: cleanText(body.waiverButton) || "Complete waiver",
    waiverLink,
    rsvpLabel: cleanText(body.rsvpLabel) || "RSVP",
    rsvpName,
    rsvpText: cleanText(body.rsvpText),
    phone,
    businessPhoneLabel: cleanText(body.businessPhoneLabel) || "Pixel Pulse Phone",
    businessPhone: cleanText(body.businessPhone),
    directionsLabel: cleanText(body.directionsLabel) || "Directions",
    directionsText: cleanText(body.directionsText) || "Open map",
    directionsLink: cleanText(body.directionsLink) || DEFAULT_DIRECTIONS_LINK,
    contactLinksLabel: cleanText(body.contactLinksLabel) || "Pixel Pulse contact links",
    footer: cleanText(body.footer),
    websiteText,
    websiteLink,
    logoAlt: cleanText(body.logoAlt) || "Pixel Pulse Play logo",
    metaTitle: cleanText(body.metaTitle) || `${title} Invite`,
    createdAt: now,
    updatedAt: now,
  };

  const smsText = [
    intro,
    `${invite.dateLabel}: ${date}`,
    `${invite.timeLabel}: ${time}`,
    `${invite.addressLabel}: ${invite.address}`,
    `Invite: ${inviteUrl}`,
    `Waiver: ${waiverLink}`,
  ].filter(Boolean).join("\n");

  const inviteRecord = {
    ...invite,
    inviteUrl,
    smsText,
  };

  if (hasPostgres()) {
    await upsertPostgresInvite(inviteRecord);
    if (partyId) {
      await upsertPostgresPartyWaiver({
        partyId,
        primaryParticipant: childName,
        visitDate: date,
        visitTime: time,
        passType: "Birthday Party Package",
        createdAt: now,
        updatedAt: now,
      });
    }
  } else {
    await db.collection("invites").doc(slug).set(inviteRecord);
    if (partyId) {
      await db.collection("partyWaivers").doc(partyWaiverDocId(partyId)).set(
        {
          partyId,
          primaryParticipant: childName,
          visitDate: date,
          visitTime: time,
          passType: "Birthday Party Package",
          createdAt: now,
          updatedAt: now,
        },
        { merge: true },
      );
    }
  }

  return NextResponse.json({
    success: true,
    slug,
    partyId,
    inviteUrl,
    waiverUrl: waiverLink,
    smsText,
    qrCodeUrl: `https://quickchart.io/qr?text=${encodeURIComponent(inviteUrl)}&size=220`,
  });
}
