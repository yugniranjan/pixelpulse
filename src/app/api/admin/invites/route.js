import { NextResponse } from "next/server";
import { db } from "@/lib/firestore";
import { getConfigValue } from "@/lib/ctaContent";
import { normalizeInviteSlug } from "@/lib/invites";
import { partyWaiverDocId } from "@/lib/partyWaivers";
import {
  getPostgresPartyWaiver,
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

function generatePartyId() {
  return `pp${Math.floor(10000 + Math.random() * 90000)}`;
}

async function partyIdExists(partyId) {
  if (hasPostgres()) {
    return Boolean(await getPostgresPartyWaiver(partyId));
  }

  return (await db.collection("partyWaivers").doc(partyWaiverDocId(partyId)).get()).exists;
}

async function getAvailablePartyId(requestedPartyId) {
  const normalizedPartyId = cleanText(requestedPartyId);
  if (normalizedPartyId && !(await partyIdExists(normalizedPartyId))) {
    return normalizedPartyId;
  }

  let partyId = normalizedPartyId || generatePartyId();

  while (await partyIdExists(partyId)) {
    partyId = generatePartyId();
  }

  return partyId;
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
  const date = cleanText(body.date);
  const time = cleanText(body.time);

  if (!childName || !date || !time) {
    return NextResponse.json(
      { error: "Child name, date, and time are required." },
      { status: 400 },
    );
  }

  const requestedSlug = normalizeInviteSlug(body.slug);
  const baseSlug = requestedSlug || normalizeInviteSlug(`${childName}-${date}`);
  const slug = await getAvailableSlug(baseSlug);
  const origin = getOrigin(req);
  const partyId = await getAvailablePartyId(body.partyId);
  const inviteUrl = `${origin}/invite/${slug}`;
  const waiverLink = `${origin}/waiver?partyId=${encodeURIComponent(partyId)}`;
  const title = cleanText(body.title) || "Birthday Party";
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
    titleSuffix: cleanText(body.titleSuffix) || "Birthday Party",
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
    rsvpText: cleanText(body.rsvpText),
    phone: cleanText(body.phone),
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
    await upsertPostgresPartyWaiver({
      partyId,
      primaryParticipant: childName,
      visitDate: date,
      visitTime: time,
      passType: "Birthday Party Package",
      createdAt: now,
      updatedAt: now,
    });
  } else {
    await db.collection("invites").doc(slug).set(inviteRecord);
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
