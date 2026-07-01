import { NextResponse } from "next/server";
import { db } from "@/lib/firestore";
import { getConfigValue } from "@/lib/ctaContent";
import { normalizeInviteSlug } from "@/lib/invites";
import { partyWaiverDocId } from "@/lib/partyWaivers";
import {
  deletePostgresInvite,
  getPostgresInviteByPartyId,
  getPostgresInviteBySlug,
  hasPostgres,
  listPostgresInvites,
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

function serializeFirestoreInvite(snapshot) {
  if (!snapshot.exists) return null;
  const data = snapshot.data() || {};
  const toIso = (value) => {
    if (!value) return "";
    if (typeof value.toDate === "function") return value.toDate().toISOString();
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString();
  };

  return {
    id: snapshot.id,
    ...data,
    slug: data.slug || snapshot.id,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
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

async function listInvites() {
  if (hasPostgres()) {
    return listPostgresInvites(2000);
  }

  if (!db) return [];
  const snapshot = await db.collection("invites").limit(2000).get();
  return snapshot.docs
    .map(serializeFirestoreInvite)
    .filter(Boolean)
    .sort((first, second) => {
      const firstTime = new Date(first.updatedAt || first.createdAt || 0).getTime();
      const secondTime = new Date(second.updatedAt || second.createdAt || 0).getTime();
      return secondTime - firstTime;
    });
}

function buildSmsText(invite = {}, inviteUrl = "", waiverLink = "") {
  return [
    invite.intro,
    `${invite.dateLabel || "Date"}: ${invite.date}`,
    `${invite.timeLabel || "Time"}: ${invite.time}`,
    `${invite.addressLabel || "Address"}: ${invite.address}`,
    `Invite: ${inviteUrl}`,
    `Waiver: ${waiverLink}`,
  ].filter(Boolean).join("\n");
}

function buildConfirmationEmailText(invite = {}) {
  const hostName = invite.rsvpName || "Party Host";
  const childName = invite.childName || "the birthday child";
  const partyPackage = invite.titleSuffix || invite.title || "Birthday Party Package";
  const venue = invite.venue || "Pixel Pulse PlayZone";
  const address = invite.address || DEFAULT_ADDRESS;
  const website = invite.websiteLink || "https://www.pixelpulseplay.ca";
  const phone = invite.businessPhone || "+1 (905) 760-2922";

  return [
    `Dear ${hostName},`,
    `Thank you for choosing Pixel Pulse Play to celebrate ${childName}'s special day! We can't wait to make it an unforgettable experience.`,
    "",
    "Your Party Details",
    "Booking Details",
    `Party ID: ${invite.partyId || "As confirmed"}`,
    `Party Date: ${invite.date || "As confirmed"}`,
    `Party Start Time: ${invite.time || "As confirmed"}`,
    `Party Package: ${partyPackage}`,
    `Play Duration: ${invite.playDuration || "As confirmed in your booking"}`,
    `Number of Children Included: ${invite.childrenIncluded || "As confirmed in your booking"}`,
    `Party Room Access: ${invite.partyRoomAccess || "As confirmed in your booking"}`,
    `Food & Add-ons: ${invite.foodAddOns || "As confirmed in your booking"}`,
    `Additional Extras: ${invite.additionalExtras || "As confirmed in your booking"}`,
    `Special Notes: ${invite.specialNotes || "As confirmed in your booking"}`,
    "",
    "Important Information - Please Read Carefully",
    "1. This is a Scheduled Party Package",
    "Your booking is for a party package during our regular operating hours and is not a private facility rental. There may be other guests and walk-in visitors in the facility during your party. If you are looking for a private party experience, please contact us regarding pricing and availability.",
    "Our team carefully manages all activities to ensure a fun and safe experience for everyone.",
    "",
    "2. Challenge Rooms Operate One Group at a Time",
    "For safety and the best experience:",
    "- Children play only with their own group.",
    "- Different stranger groups do not mix inside challenge rooms.",
    "- If a room is occupied, your group may need to wait briefly until it is their turn.",
    "Our staff members will guide the rotation throughout your visit.",
    "",
    "3. Safety is Our Top Priority",
    "The entire facility is:",
    "- Fully supervised by trained team members.",
    "- Monitored through CCTV cameras.",
    "- Designed with child safety and controlled access in mind.",
    "Parents can relax knowing that our team continuously monitors activities and assists children throughout their experience.",
    "",
    "4. Respect for Equipment & Property",
    "Our games and equipment are specially designed and maintained for everyone's enjoyment.",
    "We kindly ask all children to:",
    "- Follow staff instructions.",
    "- Use equipment appropriately.",
    "- Avoid intentional misuse, rough handling, or vandalism.",
    "Any deliberate damage or breakage caused by guests may result in repair or replacement charges being billed to the party host.",
    "",
    "5. Supervision & Behaviour",
    "For everyone's enjoyment and safety:",
    "- Running in hallways or climbing on furniture is not permitted.",
    "- Food and drinks should remain in designated areas.",
    "- Children should follow staff instructions at all times.",
    "- Children displaying unsafe or disruptive behaviour may be temporarily removed from an activity.",
    "",
    "6. Waivers & Arrival",
    "- Please ensure all participants have a signed waiver before arrival.",
    "- We recommend arriving 15 minutes before your party start time for smooth check-in.",
    "- Late arrivals may reduce play time as parties run on a scheduled basis.",
    "",
    "7. Shoes & Comfortable Clothing",
    "Children should wear comfortable clothing suitable for active play and closed-toe shoes where required.",
    "",
    "8. Questions?",
    "Please visit our FAQ page for additional information:",
    "FAQs: https://www.pixelpulseplay.ca/faqs",
    `Website: ${website}`,
    `Phone: ${phone}`,
    venue,
    address,
    "",
    "Thank you again for celebrating with us.",
    `We look forward to welcoming ${childName} and all of your guests for an exciting day of challenges, games, and unforgettable memories!`,
    "Warm regards,",
    "The Pixel Pulse Team",
    '"Leave the Screen. Enter the Challenge."',
  ].filter(Boolean).join("\n");
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("list") === "1") {
    return NextResponse.json({ invites: await listInvites() });
  }

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

  if (!childName || !partyId || !date || !time || !rsvpName || !phone) {
    return NextResponse.json(
      { error: "Child name, Party ID, date, time, RSVP name, and RSVP phone are required." },
      { status: 400 },
    );
  }

  const requestedSlug = normalizeInviteSlug(body.slug);
  const baseSlug = requestedSlug || normalizeInviteSlug(childName);
  const existingPartySlug = await getInviteSlugByPartyId(partyId);
  const slug = requestedSlug
    ? requestedSlug === existingPartySlug
      ? existingPartySlug
      : await getAvailableSlug(requestedSlug)
    : existingPartySlug || await getAvailableSlug(baseSlug);
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
    playDuration: cleanText(body.playDuration),
    childrenIncluded: cleanText(body.childrenIncluded),
    partyRoomAccess: cleanText(body.partyRoomAccess),
    foodAddOns: cleanText(body.foodAddOns),
    additionalExtras: cleanText(body.additionalExtras),
    specialNotes: cleanText(body.specialNotes),
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

  const smsText = buildSmsText(invite, inviteUrl, waiverLink);
  const confirmationEmailText = buildConfirmationEmailText(invite);

  const inviteRecord = {
    ...invite,
    inviteUrl,
    smsText,
    confirmationEmailText,
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
    confirmationEmailText,
    qrCodeUrl: `https://quickchart.io/qr?text=${encodeURIComponent(inviteUrl)}&size=220`,
  });
}

export async function PUT(req) {
  if (!db && !hasPostgres()) {
    return NextResponse.json(
      { error: "Firestore is not configured locally" },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(req.url);
  const slug = normalizeInviteSlug(searchParams.get("slug"));
  if (!slug) return NextResponse.json({ error: "Invite slug is required." }, { status: 400 });

  const body = await req.json();
  const existing = hasPostgres()
    ? await getPostgresInviteBySlug(slug)
    : serializeFirestoreInvite(await db.collection("invites").doc(slug).get());
  if (!existing) return NextResponse.json({ error: "Invite not found." }, { status: 404 });

  const origin = getOrigin(req);
  const inviteUrl = existing.inviteUrl || `${origin}/invite/${slug}`;
  const partyId = cleanText(body.partyId) || existing.partyId || "";
  const waiverLink = partyId
    ? `${origin}/waiver?partyId=${encodeURIComponent(partyId)}`
    : existing.waiverLink || `${origin}/waiver`;
  const updatedAt = new Date();
  const invite = {
    ...existing,
    slug,
    partyId,
    active: cleanText(body.active) || existing.active || "1",
    childName: cleanText(body.childName) || existing.childName || "",
    title: titleWithoutChildName(cleanText(body.title) || existing.title || "Birthday Party", cleanText(body.childName) || existing.childName || "") || "Birthday Party",
    titleSuffix: cleanText(body.titleSuffix) || existing.titleSuffix || cleanText(body.title) || existing.title || "Birthday Party",
    playDuration: cleanText(body.playDuration) || existing.playDuration || "",
    childrenIncluded: cleanText(body.childrenIncluded) || existing.childrenIncluded || "",
    partyRoomAccess: cleanText(body.partyRoomAccess) || existing.partyRoomAccess || "",
    foodAddOns: cleanText(body.foodAddOns) || existing.foodAddOns || "",
    additionalExtras: cleanText(body.additionalExtras) || existing.additionalExtras || "",
    specialNotes: cleanText(body.specialNotes) || existing.specialNotes || "",
    greeting: cleanText(body.greeting) || existing.greeting || DEFAULT_GREETING,
    guestName: cleanText(body.guestName) || existing.guestName || DEFAULT_GUEST_LINE,
    intro: cleanText(body.intro) || existing.intro || DEFAULT_PARTY_INTRO,
    dateLabel: existing.dateLabel || "Date",
    date: cleanText(body.date) || existing.date || "",
    timeLabel: existing.timeLabel || "Time",
    time: cleanText(body.time) || existing.time || "",
    venueLabel: existing.venueLabel || "Place",
    venue: cleanText(body.venue) || existing.venue || "",
    addressLabel: existing.addressLabel || "Address",
    address: cleanText(body.address) || existing.address || DEFAULT_ADDRESS,
    waiverLabel: existing.waiverLabel || "Waiver",
    waiverText: cleanText(body.waiverText) || existing.waiverText || "",
    waiverButton: cleanText(body.waiverButton) || existing.waiverButton || "Complete waiver",
    waiverLink,
    rsvpLabel: existing.rsvpLabel || "RSVP",
    rsvpName: cleanText(body.rsvpName) || existing.rsvpName || "",
    rsvpText: cleanText(body.rsvpText) || existing.rsvpText || "",
    phone: cleanText(body.phone) || existing.phone || "",
    businessPhoneLabel: existing.businessPhoneLabel || "Pixel Pulse Phone",
    businessPhone: cleanText(body.businessPhone) || existing.businessPhone || "",
    directionsLabel: existing.directionsLabel || "Directions",
    directionsText: existing.directionsText || "Open map",
    directionsLink: cleanText(body.directionsLink) || existing.directionsLink || DEFAULT_DIRECTIONS_LINK,
    contactLinksLabel: existing.contactLinksLabel || "Pixel Pulse contact links",
    footer: cleanText(body.footer) || existing.footer || "",
    websiteText: cleanText(body.websiteText) || existing.websiteText || "",
    websiteLink: cleanText(body.websiteLink) || existing.websiteLink || "",
    logoAlt: existing.logoAlt || "Pixel Pulse Play logo",
    metaTitle: existing.metaTitle || `${cleanText(body.title) || existing.title || "Birthday Party"} Invite`,
    inviteUrl,
    updatedAt,
  };
  invite.smsText = buildSmsText(invite, inviteUrl, waiverLink);
  invite.confirmationEmailText = buildConfirmationEmailText(invite);

  if (hasPostgres()) {
    await upsertPostgresInvite(invite);
  } else {
    await db.collection("invites").doc(slug).set(invite, { merge: true });
  }

  return NextResponse.json({ success: true, invite });
}

export async function DELETE(req) {
  if (!db && !hasPostgres()) {
    return NextResponse.json(
      { error: "Firestore is not configured locally" },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(req.url);
  const slug = normalizeInviteSlug(searchParams.get("slug"));
  if (!slug) return NextResponse.json({ error: "Invite slug is required." }, { status: 400 });

  if (hasPostgres()) {
    const deleted = await deletePostgresInvite(slug);
    if (!deleted) return NextResponse.json({ error: "Invite not found." }, { status: 404 });
  } else {
    await db.collection("invites").doc(slug).delete();
  }

  return NextResponse.json({ success: true });
}
