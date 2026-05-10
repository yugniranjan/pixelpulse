import { NextResponse } from "next/server";
import { db } from "@/lib/firestore";
import {
  createPostgresWaiver,
  getPostgresWaiverByEmail,
  hasPostgres,
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
  "You have already completed a waiver with this email address. Need to update something? Email connect@pixelpulseplay.ca and our team will help you.";

function cleanText(value = "") {
  return String(value || "").trim();
}

function cleanEmail(value = "") {
  return cleanText(value).toLowerCase();
}

function todayInToronto() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function isPastDate(value = "") {
  return Boolean(value && value < todayInToronto());
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

async function getExistingWaiverByEmail(email, originalEmail = email) {
  const normalizedEmail = cleanEmail(email);
  const cleanOriginalEmail = cleanText(originalEmail);
  if (!normalizedEmail) return null;

  if (hasPostgres()) {
    return getPostgresWaiverByEmail(normalizedEmail);
  }

  if (!db) return null;

  const normalizedSnapshot = await db
    .collection("waivers")
    .where("primary.emailNormalized", "==", normalizedEmail)
    .limit(1)
    .get();

  if (!normalizedSnapshot.empty) {
    return { id: normalizedSnapshot.docs[0].id };
  }

  const exactSnapshot = await db
    .collection("waivers")
    .where("primary.email", "==", normalizedEmail)
    .limit(1)
    .get();

  if (!exactSnapshot.empty) {
    return { id: exactSnapshot.docs[0].id };
  }

  if (cleanOriginalEmail && cleanOriginalEmail !== normalizedEmail) {
    const originalSnapshot = await db
      .collection("waivers")
      .where("primary.email", "==", cleanOriginalEmail)
      .limit(1)
      .get();

    if (!originalSnapshot.empty) {
      return { id: originalSnapshot.docs[0].id };
    }
  }

  return null;
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

  if (!hasRequiredParticipantFields(primary) || !primary.email || !primary.phone || !primary.city) {
    return NextResponse.json(
      { error: "Primary participant name, date of birth, email, phone, and city are required." },
      { status: 400 },
    );
  }

  const existingWaiver = await getExistingWaiverByEmail(primary.email, body?.primary?.email);
  if (existingWaiver) {
    return NextResponse.json(
      {
        error: DUPLICATE_WAIVER_MESSAGE,
        code: "WAIVER_ALREADY_EXISTS",
        waiverId: existingWaiver.id || "",
      },
      { status: 409 },
    );
  }

  if (familyMembers.some((member) => !hasRequiredParticipantFields(member))) {
    return NextResponse.json(
      { error: "Every added family member needs a first name, last name, and date of birth." },
      { status: 400 },
    );
  }

  if (!visit.visitDate || !visit.printName || !visit.signDate) {
    return NextResponse.json(
      { error: "Visit date, printed name, and signed date are required." },
      { status: 400 },
    );
  }

  if (isPastDate(visit.visitDate)) {
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

  const waiverId = hasPostgres()
    ? await createPostgresWaiver(doc)
    : (await db.collection("waivers").add(doc)).id;

  return NextResponse.json({
    success: true,
    waiverId,
  });
}
