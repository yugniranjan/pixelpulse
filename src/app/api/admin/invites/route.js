import { NextResponse } from "next/server";
import { db } from "@/lib/firestore";
import { normalizeInviteSlug } from "@/lib/invites";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function cleanText(value = "") {
  return String(value || "").trim();
}

async function getAvailableSlug(baseSlug) {
  let slug = baseSlug;
  let index = 2;

  while ((await db.collection("invites").doc(slug).get()).exists) {
    slug = `${baseSlug}-${index}`;
    index += 1;
  }

  return slug;
}

function getOrigin(req) {
  const configured = process.env.SITE_URL || process.env.NEXT_PUBLIC_BASE_URL;
  if (configured) return configured.replace(/\/$/, "");
  return new URL(req.url).origin;
}

export async function POST(req) {
  if (!db) {
    return NextResponse.json(
      { error: "Firestore is not configured locally" },
      { status: 503 },
    );
  }

  const body = await req.json();
  const childName = cleanText(body.childName);
  const date = cleanText(body.date);
  const time = cleanText(body.time);
  const waiverLink = cleanText(body.waiverLink);

  if (!childName || !date || !time || !waiverLink) {
    return NextResponse.json(
      { error: "Child name, date, time, and waiver URL are required." },
      { status: 400 },
    );
  }

  const requestedSlug = normalizeInviteSlug(body.slug);
  const baseSlug = requestedSlug || normalizeInviteSlug(`${childName}-${date}`);
  const slug = await getAvailableSlug(baseSlug);
  const origin = getOrigin(req);
  const inviteUrl = `${origin}/invite/${slug}`;
  const title = cleanText(body.title) || `${childName}'s Birthday Party`;
  const directionsLink = cleanText(body.directionsLink) || cleanText(body.address);
  const websiteLink = cleanText(body.websiteLink);
  const websiteText = cleanText(body.websiteText) || websiteLink.replace(/^https?:\/\//, "");

  const invite = {
    active: "1",
    slug,
    eyebrow: cleanText(body.eyebrow) || "Birthday Invite",
    greeting: cleanText(body.greeting),
    guestName: cleanText(body.guestName),
    childName,
    title,
    titleSuffix: cleanText(body.titleSuffix) || "Birthday Party",
    intro: cleanText(body.intro),
    dateLabel: cleanText(body.dateLabel) || "Date",
    date,
    timeLabel: cleanText(body.timeLabel) || "Time",
    time,
    venueLabel: cleanText(body.venueLabel) || "Place",
    venue: cleanText(body.venue),
    addressLabel: cleanText(body.addressLabel) || "Address",
    address: cleanText(body.address),
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
    directionsLink,
    contactLinksLabel: cleanText(body.contactLinksLabel) || "Pixel Pulse contact links",
    footer: cleanText(body.footer),
    websiteText,
    websiteLink,
    logoAlt: cleanText(body.logoAlt) || "Pixel Pulse Play logo",
    metaTitle: cleanText(body.metaTitle) || `${title} Invite`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const smsText = [
    invite.greeting,
    invite.guestName || `You're invited to ${title}!`,
    `${invite.dateLabel}: ${date}`,
    `${invite.timeLabel}: ${time}`,
    invite.address ? `${invite.addressLabel}: ${invite.address}` : "",
    `Invite: ${inviteUrl}`,
    `Waiver: ${waiverLink}`,
  ].filter(Boolean).join("\n");

  await db.collection("invites").doc(slug).set({
    ...invite,
    inviteUrl,
    smsText,
  });

  return NextResponse.json({
    success: true,
    slug,
    inviteUrl,
    waiverUrl: waiverLink,
    smsText,
    qrCodeUrl: `https://quickchart.io/qr?text=${encodeURIComponent(inviteUrl)}&size=220`,
  });
}

