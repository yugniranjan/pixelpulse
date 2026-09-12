import { NextResponse } from "next/server";
import { db } from "@/lib/firestore";
import {
  createPostgresWaiver,
  getPostgresWaiverByEmail,
  getPostgresWaiverById,
  hasPostgres,
  listPostgresWaiversByEmail,
  listPostgresWaiversByPhone,
  updatePostgresWaiver,
} from "@/lib/postgresData";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const REQUIRED_CHECKS = [
  "risk",
  "liability",
  "rules",
  "medical",
  "guardian",
  "privacy",
  "final",
];
const DUPLICATE_WAIVER_MESSAGE =
  "You have already completed a waiver with this email address. To update it, load your existing waiver with the same email or phone number, then sign again.";

function cleanText(value = "") {
  return String(value || "").trim();
}

function cleanEmail(value = "") {
  return cleanText(value).toLowerCase();
}

function normalizePartyId(value = "") {
  return cleanText(value).toLowerCase();
}

function normalizePhone(value = "") {
  return cleanText(value).replace(/\D/g, "");
}

function todayInToronto() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function dateNumber(value = "") {
  const [year, month, day] = String(value || "").split("-").map(Number);
  if (!year || !month || !day) return 0;
  return year * 10000 + month * 100 + day;
}

function isPastDate(value = "") {
  return Boolean(value && dateNumber(value) < dateNumber(todayInToronto()));
}

function fullLegalName(person = {}) {
  return [person.firstName, person.lastName].filter(Boolean).join(" ");
}

function cleanParticipant(participant = {}) {
  const cleaned = {
    type: participant.type === "minor" ? "minor" : participant.type === "adult" ? "adult" : "primary",
    firstName: cleanText(participant.firstName),
    lastName: cleanText(participant.lastName),
    dob: cleanText(participant.dob),
    gender: cleanText(participant.gender),
    email: cleanEmail(participant.email),
    phone: cleanText(participant.phone),
    city: cleanText(participant.city),
    healthCondition: cleanText(participant.healthCondition) || "Not Applicable",
    medicalNotes: cleanText(participant.medicalNotes),
  };
  return {
    ...cleaned,
    fullLegalName: fullLegalName(cleaned),
  };
}

function cleanFamilyMember(member = {}) {
  const cleaned = cleanParticipant(member);
  cleaned.type = member.type === "minor" ? "minor" : "adult";
  return cleaned;
}

function cleanVisit(visit = {}) {
  return {
    partyId: cleanText(visit.partyId),
    partyName: cleanText(visit.partyName),
    passType: cleanText(visit.passType),
    visitDate: cleanText(visit.visitDate),
    visitTime: cleanText(visit.visitTime),
    emergencyName: cleanText(visit.emergencyName),
    emergencyRelation: cleanText(visit.emergencyRelation),
    emergencyPhone: cleanText(visit.emergencyPhone),
    printName: cleanText(visit.printName),
    signDate: cleanText(visit.signDate),
  };
}

function hasRequiredParticipantFields(participant) {
  return Boolean(participant.firstName && participant.lastName && participant.dob);
}

function samePhone(left = "", right = "") {
  const normalizedLeft = normalizePhone(left);
  const normalizedRight = normalizePhone(right);
  return Boolean(normalizedLeft && normalizedRight && normalizedLeft === normalizedRight);
}

function addClientIdsToFamilyMembers(familyMembers = []) {
  return familyMembers.map((member, index) => ({
    id: member.id || `${member.type || "member"}-${index}`,
    type: member.type === "minor" ? "minor" : "adult",
    firstName: cleanText(member.firstName),
    lastName: cleanText(member.lastName),
    dob: cleanText(member.dob),
    gender: cleanText(member.gender),
    email: cleanEmail(member.email),
    healthCondition: cleanText(member.healthCondition) || "Not Applicable",
    medicalNotes: cleanText(member.medicalNotes),
  }));
}

function publicWaiverPayload(waiver = {}) {
  return {
    id: waiver.id || "",
    primary: {
      firstName: cleanText(waiver.primary?.firstName),
      lastName: cleanText(waiver.primary?.lastName),
      dob: cleanText(waiver.primary?.dob),
      gender: cleanText(waiver.primary?.gender),
      email: cleanEmail(waiver.primary?.email),
      phone: cleanText(waiver.primary?.phone),
      city: cleanText(waiver.primary?.city),
      healthCondition: cleanText(waiver.primary?.healthCondition) || "Not Applicable",
      medicalNotes: cleanText(waiver.primary?.medicalNotes),
    },
    familyMembers: addClientIdsToFamilyMembers(waiver.familyMembers),
    visit: {
      partyId: cleanText(waiver.visit?.partyId),
      partyName: cleanText(waiver.visit?.partyName),
      passType: cleanText(waiver.visit?.passType),
      visitDate: cleanText(waiver.visit?.visitDate),
      visitTime: cleanText(waiver.visit?.visitTime),
      emergencyName: cleanText(waiver.visit?.emergencyName),
      emergencyRelation: cleanText(waiver.visit?.emergencyRelation),
      emergencyPhone: cleanText(waiver.visit?.emergencyPhone),
      printName: cleanText(waiver.visit?.printName),
      signDate: todayInToronto(),
    },
    checks: {
      risk: waiver.checks?.risk === true,
      liability: waiver.checks?.liability === true,
      rules: waiver.checks?.rules === true,
      medical: waiver.checks?.medical === true,
      guardian: waiver.checks?.guardian === true,
      photo: waiver.checks?.photo === true,
      privacy: waiver.checks?.privacy === true,
      final: waiver.checks?.final === true,
    },
  };
}

async function getExistingWaiversByEmail(email, originalEmail = email) {
  const normalizedEmail = cleanEmail(email);
  const cleanOriginalEmail = cleanText(originalEmail);
  if (!normalizedEmail) return [];

  if (hasPostgres()) {
    if (typeof listPostgresWaiversByEmail === "function") {
      return listPostgresWaiversByEmail(normalizedEmail);
    }

    const waiver = await getPostgresWaiverByEmail(normalizedEmail);
    return waiver ? [waiver] : [];
  }

  if (!db) return [];

  const matches = new Map();
  const addSnapshot = (snapshot) => {
    snapshot.docs.forEach((doc) => {
      matches.set(doc.id, { id: doc.id, ...(doc.data() || {}) });
    });
  };

  const normalizedSnapshot = await db
    .collection("waivers")
    .where("primary.emailNormalized", "==", normalizedEmail)
    .limit(50)
    .get();
  addSnapshot(normalizedSnapshot);

  const exactSnapshot = await db
    .collection("waivers")
    .where("primary.email", "==", normalizedEmail)
    .limit(50)
    .get();
  addSnapshot(exactSnapshot);

  if (cleanOriginalEmail && cleanOriginalEmail !== normalizedEmail) {
    const originalSnapshot = await db
      .collection("waivers")
      .where("primary.email", "==", cleanOriginalEmail)
      .limit(50)
      .get();
    addSnapshot(originalSnapshot);
  }

  return [...matches.values()];
}

async function getExistingWaiversByPhone(phone) {
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) return [];

  if (hasPostgres()) {
    return listPostgresWaiversByPhone(normalizedPhone);
  }

  if (!db) return [];

  const matches = new Map();
  const addSnapshot = (snapshot) => {
    snapshot.docs.forEach((doc) => {
      const waiver = { id: doc.id, ...(doc.data() || {}) };
      if (samePhone(waiver?.primary?.phone, phone)) {
        matches.set(doc.id, waiver);
      }
    });
  };

  const exactSnapshot = await db
    .collection("waivers")
    .where("primary.phone", "==", cleanText(phone))
    .limit(50)
    .get();
  addSnapshot(exactSnapshot);

  return [...matches.values()];
}

async function getExistingWaiversByContact({ email = "", phone = "" } = {}) {
  const matches = new Map();
  const addWaivers = (waivers = []) => {
    waivers.forEach((waiver) => {
      if (waiver?.id) matches.set(waiver.id, waiver);
    });
  };

  addWaivers(await getExistingWaiversByEmail(email));
  addWaivers(await getExistingWaiversByPhone(phone));
  return [...matches.values()];
}

async function getWaiverById(id) {
  const waiverId = cleanText(id);
  if (!waiverId) return null;

  if (hasPostgres()) {
    return getPostgresWaiverById(waiverId);
  }

  if (!db) return null;
  const snapshot = await db.collection("waivers").doc(waiverId).get();
  return snapshot.exists ? { id: snapshot.id, ...(snapshot.data() || {}) } : null;
}

async function updateWaiverRecord(id, doc) {
  const waiverId = cleanText(id);
  if (!waiverId) return false;

  if (hasPostgres()) {
    return Boolean(await updatePostgresWaiver(waiverId, doc));
  }

  if (!db) return false;
  await db.collection("waivers").doc(waiverId).set(doc, { merge: true });
  return true;
}

export async function GET(req) {
  if (!db && !hasPostgres()) {
    return NextResponse.json(
      { error: "Database is not configured." },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(req.url);
  const email = cleanEmail(searchParams.get("email"));
  const phone = cleanText(searchParams.get("phone"));
  const partyId = normalizePartyId(searchParams.get("partyId"));

  if (!email && !phone) {
    return NextResponse.json(
      { error: "Enter an email or phone number to load an existing waiver." },
      { status: 400 },
    );
  }

  const waivers = await getExistingWaiversByContact({ email, phone });
  let lookupVerification = null;
  const matchingWaiver = waivers.find((waiver) => {
    const matchingParty = !partyId || normalizePartyId(waiver?.visit?.partyId) === partyId;
    const matchingEmail = Boolean(email && cleanEmail(waiver?.primary?.email) === email);
    const matchingPhone = Boolean(phone && samePhone(waiver?.primary?.phone, phone));
    if (matchingParty && (matchingEmail || matchingPhone)) {
      lookupVerification = {
        email: matchingEmail ? email : "",
        phone: matchingPhone ? phone : "",
      };
    }
    return matchingParty && (matchingEmail || matchingPhone);
  });

  if (!matchingWaiver) {
    return NextResponse.json(
      { error: "We could not find a waiver matching that email or phone number." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    success: true,
    waiver: {
      ...publicWaiverPayload(matchingWaiver),
      updateVerification: lookupVerification,
    },
  });
}

export async function POST(req) {
  if (!db && !hasPostgres()) {
    return NextResponse.json(
      { error: "Database is not configured." },
      { status: 503 },
    );
  }

  const body = await req.json();
  const primary = cleanParticipant(body.primary);
  const familyMembers = Array.isArray(body.familyMembers)
    ? body.familyMembers.map(cleanFamilyMember)
    : [];
  const visit = cleanVisit(body.visit);
  const checks = body.checks || {};
  const attractions = Array.isArray(body.attractions)
    ? body.attractions.map(cleanText).filter(Boolean)
    : [];
  const signatureDataUrl = cleanText(body.signatureDataUrl);
  const updateWaiverId = cleanText(body.updateWaiverId);
  const updateVerification = body.updateVerification || {};
  const updateVerificationEmail = cleanEmail(updateVerification.email || primary.email);
  const updateVerificationPhone = cleanText(updateVerification.phone || primary.phone);

  if (!hasRequiredParticipantFields(primary) || !primary.email || !primary.phone) {
    return NextResponse.json(
      { error: "Primary participant name, date of birth, email, and phone are required." },
      { status: 400 },
    );
  }

  if (familyMembers.some((member) => !hasRequiredParticipantFields(member))) {
    return NextResponse.json(
      { error: "Every added family member needs a first name, last name, and date of birth." },
      { status: 400 },
    );
  }

  if (!visit.printName || !visit.signDate) {
    return NextResponse.json(
      { error: "Printed name and signed date are required." },
      { status: 400 },
    );
  }

  if (!updateWaiverId && visit.visitDate && isPastDate(visit.visitDate)) {
    return NextResponse.json(
      { error: "Visit date cannot be in the past." },
      { status: 400 },
    );
  }

  if (REQUIRED_CHECKS.some((key) => checks[key] !== true)) {
    return NextResponse.json(
      { error: "All required acknowledgement boxes must be checked." },
      { status: 400 },
    );
  }

  if (!signatureDataUrl.startsWith("data:image/png;base64,")) {
    return NextResponse.json(
      { error: "Signature is required." },
      { status: 400 },
    );
  }

  const now = new Date();
  const doc = {
    primary: {
      ...primary,
      emailNormalized: primary.email,
    },
    familyMembers,
    visit,
    checks: {
      risk: checks.risk === true,
      liability: checks.liability === true,
      rules: checks.rules === true,
      medical: checks.medical === true,
      guardian: checks.guardian === true,
      photo: checks.photo === true,
      privacy: checks.privacy === true,
      final: checks.final === true,
    },
    attractions,
    signatureDataUrl,
    participantCount: 1 + familyMembers.length,
    primaryName: primary.fullLegalName,
    primaryEmail: primary.email,
    submittedAt: now,
    updatedAt: now,
    source: "pixelpulse-web-waiver",
    userAgent: cleanText(req.headers.get("user-agent")),
  };

  if (updateWaiverId) {
    const existingWaiver = await getWaiverById(updateWaiverId);
    if (
      !existingWaiver ||
      (
        updateVerificationEmail &&
        cleanEmail(existingWaiver?.primary?.email) !== updateVerificationEmail
      ) ||
      (
        updateVerificationPhone &&
        !samePhone(existingWaiver?.primary?.phone, updateVerificationPhone)
      ) ||
      (!updateVerificationEmail && !updateVerificationPhone)
    ) {
      return NextResponse.json(
        { error: "We could not verify this waiver for updates. Please load it with the original email or phone number." },
        { status: 403 },
      );
    }

    const updated = await updateWaiverRecord(updateWaiverId, {
      ...doc,
      submittedAt: existingWaiver.submittedAt || existingWaiver.raw?.submittedAt || now,
    });
    if (!updated) {
      return NextResponse.json(
        { error: "Unable to update waiver. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      updated: true,
      waiverId: updateWaiverId,
    });
  }

  const existingWaivers = await getExistingWaiversByEmail(primary.email, body?.primary?.email);
  const incomingPartyId = normalizePartyId(visit.partyId);
  const duplicateWaiver = existingWaivers.find((waiver) => {
    const existingPartyId = normalizePartyId(waiver?.visit?.partyId);
    return !incomingPartyId || existingPartyId === incomingPartyId;
  });

  if (duplicateWaiver) {
    if (samePhone(duplicateWaiver?.primary?.phone, primary.phone)) {
      const updated = await updateWaiverRecord(duplicateWaiver.id, {
        ...doc,
        submittedAt: duplicateWaiver.submittedAt || duplicateWaiver.raw?.submittedAt || now,
      });

      if (updated) {
        return NextResponse.json({
          success: true,
          updated: true,
          waiverId: duplicateWaiver.id,
        });
      }
    }

    return NextResponse.json(
      {
        error: DUPLICATE_WAIVER_MESSAGE,
        code: "WAIVER_ALREADY_EXISTS",
        waiverId: duplicateWaiver.id || "",
      },
      { status: 409 },
    );
  }

  const waiverId = hasPostgres()
    ? await createPostgresWaiver(doc)
    : (await db.collection("waivers").add(doc)).id;

  return NextResponse.json({
    success: true,
    waiverId,
  });
}
