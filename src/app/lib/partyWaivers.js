export function partyWaiverDocId(partyId = "") {
  return encodeURIComponent(String(partyId || "").trim().toLowerCase());
}

export function splitParticipantName(fullName = "") {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);

  if (parts.length <= 1) {
    return {
      firstName: parts[0] || "",
      lastName: "",
    };
  }

  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts[parts.length - 1],
  };
}
