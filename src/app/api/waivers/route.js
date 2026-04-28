import { NextResponse } from "next/server";
import { db } from "@/lib/firestore";

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

function cleanText(value = "") {
  return String(value || "").trim();
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
    email: cleanText(participant.email),
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

export async function POST(req) {
  if (!db) {
    return NextResponse.json(
      { error: "Firestore is not configured." },
      { status: 503 },
    );
  }

  const body = await req.json();
  const primary = cleanParticipant(body.primary);
  const familyMembers = Array.isArray(body.familyMembers)
    ? body.familyMembers.map(cleanFamilyMember)
    : [];
  const visit = cleanVisit(body.visit);
  if (visit.partyId && !visit.passType) {
    visit.passType = "Birthday Party Package";
  }
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

  if (familyMembers.some((member) => !hasRequiredParticipantFields(member))) {
    return NextResponse.json(
      { error: "Every added family member needs a first name, last name, and date of birth." },
      { status: 400 },
    );
  }

  if (!visit.passType || !visit.emergencyName || !visit.emergencyRelation || !visit.emergencyPhone || !visit.printName || !visit.signDate) {
    return NextResponse.json(
      { error: "Visit, emergency contact, printed name, and signed date are required." },
      { status: 400 },
    );
  }

  if (visit.visitDate && isPastDate(visit.visitDate)) {
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
    primary,
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
    submittedAt: now,
    updatedAt: now,
    source: "pixelpulse-web-waiver",
    userAgent: cleanText(req.headers.get("user-agent")),
  };

  const ref = await db.collection("waivers").add(doc);

  return NextResponse.json({
    success: true,
    waiverId: ref.id,
  });
}
