import { createHash } from "node:crypto";

export function waiverParticipants(waiver = {}) {
  const family = Array.isArray(waiver.family_members) ? waiver.family_members : [];
  return [waiver.primary_participant, ...family].map((person, index) => {
    const firstName = String(person?.firstName || "").trim();
    const lastName = String(person?.lastName || "").trim();
    const type = index > 0 && person?.type === "minor" ? "minor" : "adult";
    const key = createHash("sha256").update(JSON.stringify([index, firstName, lastName, type, person?.dob || ""])).digest("hex");
    return {
      key,
      name: [firstName, lastName].filter(Boolean).join(" ") || "Name not provided",
      type,
      isSigner: index === 0,
      willPlay: false,
    };
  });
}
