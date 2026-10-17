export function waiverParticipants(waiver = {}) {
  const family = Array.isArray(waiver.family_members) ? waiver.family_members : [];
  return [waiver.primary_participant, ...family].map((person, index) => {
    const firstName = String(person?.firstName || "").trim();
    const lastName = String(person?.lastName || "").trim();
    const type = index > 0 && person?.type === "minor" ? "minor" : "adult";
    return {
      name: [firstName, lastName].filter(Boolean).join(" ") || "Name not provided",
      type,
      isSigner: index === 0,
    };
  });
}
