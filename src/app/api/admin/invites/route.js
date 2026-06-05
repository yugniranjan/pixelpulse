import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";
import { db } from "@/lib/firestore";
import { listBookings } from "@/lib/bookings";
import { getConfigValue } from "@/lib/ctaContent";
import { normalizeInviteSlug } from "@/lib/invites";
import { partyWaiverDocId } from "@/lib/partyWaivers";
import {
  getPostgresInviteByPartyId,
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
const CUSTOMER_REPORT_PATH = path.join(process.cwd(), "src/app/data/report-export-customers.csv");
let customerReportCache = null;

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

function normalizePhone(value = "") {
  return String(value || "").replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
}

function normalizeLookupValue(value = "") {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function reportValue(row = {}, key = "") {
  if (typeof row[key] === "number" && /birth|birthday/i.test(key)) {
    return XLSX.SSF.format("dd-mmm-yyyy", row[key]);
  }
  return cleanText(row[key]).replace(/^"+|"+$/g, "");
}

function childNameFromReport(row = {}, index) {
  return [reportValue(row, `C${index} First Name`), reportValue(row, `C${index} Last Name`)]
    .filter(Boolean)
    .join(" ")
    .trim();
}

function normalizeCustomerReportRow(row = {}) {
  const children = [1, 2, 3]
    .map((index) => ({
      name: childNameFromReport(row, index),
      birthday: reportValue(row, `C${index} Birthday`),
    }))
    .filter((child) => child.name || child.birthday);

  return {
    email: reportValue(row, "Email"),
    phone: reportValue(row, "Primary Phone") || reportValue(row, "Secondary Phone"),
    parentName: [reportValue(row, "First Name"), reportValue(row, "Last Name")].filter(Boolean).join(" ").trim(),
    children,
  };
}

function loadCustomerReport() {
  if (customerReportCache) return customerReportCache;
  if (!fs.existsSync(CUSTOMER_REPORT_PATH)) {
    customerReportCache = [];
    return customerReportCache;
  }

  const workbook = XLSX.readFile(CUSTOMER_REPORT_PATH);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  customerReportCache = XLSX.utils
    .sheet_to_json(worksheet, { defval: "" })
    .map(normalizeCustomerReportRow)
    .filter((customer) => customer.email || customer.phone || customer.parentName || customer.children.length);
  return customerReportCache;
}

function customerReportLookups() {
  const byEmail = new Map();
  const byPhone = new Map();
  const byParentName = new Map();

  loadCustomerReport().forEach((customer) => {
    const email = normalizeLookupValue(customer.email);
    const phone = normalizePhone(customer.phone);
    const parentName = normalizeLookupValue(customer.parentName);
    if (email && !byEmail.has(email)) byEmail.set(email, customer);
    if (phone && !byPhone.has(phone)) byPhone.set(phone, customer);
    if (parentName && !byParentName.has(parentName)) byParentName.set(parentName, customer);
  });

  return { byEmail, byPhone, byParentName };
}

function matchingCustomerForInvite(invite = {}, lookups) {
  const email = normalizeLookupValue(invite.email);
  const phone = normalizePhone(invite.phone);
  const name = normalizeLookupValue(invite.rsvpName);

  return (
    (email && lookups.byEmail.get(email)) ||
    (phone && lookups.byPhone.get(phone)) ||
    (name && lookups.byParentName.get(name)) ||
    null
  );
}

function matchingChild(customer, invite = {}) {
  if (!customer?.children?.length) return null;
  const childName = normalizeLookupValue(invite.childName);
  if (childName) {
    const exact = customer.children.find((child) => normalizeLookupValue(child.name) === childName);
    if (exact) return exact;
    const partial = customer.children.find((child) => {
      const reportChildName = normalizeLookupValue(child.name);
      return reportChildName && (reportChildName.includes(childName) || childName.includes(reportChildName));
    });
    if (partial) return partial;
  }
  return customer.children[0];
}

function enrichInviteFromCustomerReport(invite = {}, lookups) {
  const customer = matchingCustomerForInvite(invite, lookups);
  if (!customer) return invite;
  const child = matchingChild(customer, invite);

  return {
    ...invite,
    email: invite.email || customer.email || "",
    emailSource: invite.emailSource || (customer.email ? "customer sheet" : ""),
    rsvpName: invite.rsvpName || customer.parentName || "",
    phone: invite.phone || customer.phone || "",
    childName: invite.childName || child?.name || "",
    birthday: invite.birthday || child?.birthday || "",
    customerReportMatch: true,
  };
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
  let invites = [];

  if (hasPostgres()) {
    invites = await listPostgresInvites(2000);
  } else if (db) {
    const snapshot = await db.collection("invites").limit(2000).get();
    invites = snapshot.docs
      .map(serializeFirestoreInvite)
      .filter(Boolean)
      .sort((first, second) => {
        const firstTime = new Date(first.updatedAt || first.createdAt || 0).getTime();
        const secondTime = new Date(second.updatedAt || second.createdAt || 0).getTime();
        return secondTime - firstTime;
      });
  }

  if (!hasPostgres()) {
    return invites;
  }

  let bookings = [];
  try {
    bookings = await listBookings({});
  } catch (error) {
    console.warn("Invite booking enrichment failed:", error?.message);
  }

  if (!bookings.length) {
    return invites;
  }

  const bookingsByPartyId = new Map(
    bookings
      .filter((booking) => booking.partyId)
      .map((booking) => [booking.partyId.toLowerCase(), booking]),
  );
  const invitePartyIds = new Set(
    invites
      .map((invite) => String(invite.partyId || "").trim().toLowerCase())
      .filter(Boolean),
  );

  const enrichedInvites = invites.map((invite) => {
    const booking = invite.partyId
      ? bookingsByPartyId.get(String(invite.partyId).toLowerCase())
      : null;
    if (!booking) return invite;

    return {
      ...invite,
      email: invite.email || booking.email || "",
      emailSource: invite.email ? "invite" : booking.email ? "booking" : "",
      rsvpName: invite.rsvpName || booking.customerName || "",
      phone: invite.phone || booking.phone || "",
      childName: invite.childName || booking.childName || "",
      birthday: invite.birthday || "",
      bookingId: booking.id || "",
    };
  });

  const bookingOnlyRows = bookings
    .filter((booking) => booking.partyId)
    .filter((booking) => !invitePartyIds.has(String(booking.partyId).toLowerCase()))
    .map((booking) => ({
      id: `booking-${booking.id}`,
      slug: "",
      active: "1",
      partyId: booking.partyId || "",
      childName: booking.childName || "",
      title: booking.package || "Birthday Party",
      date: booking.date || "",
      time: booking.startTime || "",
      waiverLink: "",
      inviteUrl: "",
      smsText: "",
      email: booking.email || "",
      emailSource: booking.email ? "booking" : "",
      rsvpName: booking.customerName || "",
      phone: booking.phone || "",
      bookingId: booking.id || "",
      birthday: "",
      rowSource: "booking",
      createdAt: booking.createdAt || "",
      updatedAt: booking.updatedAt || "",
    }));

  let enrichedRows = [...enrichedInvites, ...bookingOnlyRows];
  try {
    const customerLookups = customerReportLookups();
    enrichedRows = enrichedRows.map((invite) => enrichInviteFromCustomerReport(invite, customerLookups));
  } catch (error) {
    console.warn("Invite customer report enrichment failed:", error?.message);
  }

  return enrichedRows.sort((first, second) => {
    const firstTime = new Date(first.updatedAt || first.createdAt || first.date || 0).getTime();
    const secondTime = new Date(second.updatedAt || second.createdAt || second.date || 0).getTime();
    return secondTime - firstTime;
  });
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("list") === "1") {
    try {
      return NextResponse.json({
        invites: await listInvites(),
      });
    } catch (error) {
      console.error("list invites failed:", error);
      return NextResponse.json({ error: "Unable to load invites." }, { status: 500 });
    }
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
  const email = cleanText(body.email || body.rsvpEmail);

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
    email,
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
