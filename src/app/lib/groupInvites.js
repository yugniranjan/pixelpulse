export const GROUP_INVITE_DEFAULTS = {
  greeting: "Hi,",
  guestName: "You're invited to join the group.",
  intro: "Bring your team, friends, or colleagues together for active games, friendly competition, and a great time at Pixel Pulse Play.",
  title: "Group Event",
  eyebrow: "Group invitation",
  footer: "We look forward to welcoming your group!",
  waiverText: "Every participant needs a signed waiver before arrival. Complete yours ahead of time for a smooth group check-in.",
};

export function inviteKind(invite = {}) {
  if (invite.inviteType) return invite.inviteType === "group" ? "group" : "birthday";
  const legacyGroup = invite.groupId || ["corporate", "adult"].includes(invite.eventType) || /^group event$/i.test(String(invite.title || "").trim());
  return legacyGroup ? "group" : "birthday";
}

export function buildGroupConfirmationText(invite = {}) {
  return [
    `Dear ${invite.rsvpName || "Group Organizer"},`,
    `Your group event at Pixel Pulse Play is confirmed. We look forward to welcoming ${invite.childName || "your group"} for games and friendly competition.`,
    "",
    "Your Group Details",
    `Event: ${invite.childName || "Group Event"}`,
    `Event Type: ${invite.eventType === "adult" ? "Adult group" : "Corporate / team event"}`,
    `Group ID: ${invite.groupId || invite.partyId}`,
    `Event Date: ${invite.date}`,
    `Event Time: ${invite.time}`,
    `Package: ${invite.partyPackage || "As confirmed in your booking"}`,
    `Play Duration: ${invite.playDuration || "As confirmed in your booking"}`,
    `Participants Included: ${invite.childrenIncluded || "As confirmed in your booking"}`,
    `Room Access: ${invite.partyRoomAccess || "As confirmed in your booking"}`,
    `Food & Add-ons: ${invite.foodAddOns || "As confirmed in your booking"}`,
    `Additional Extras: ${invite.additionalExtras || "None specified"}`,
    `Special Notes: ${invite.specialNotes || "None specified"}`,
    `Venue: ${invite.venue || "Pixel Pulse Play"}`,
    `Address: ${invite.address}`,
    `Invite: ${invite.inviteUrl || ""}`,
    `Waiver: ${invite.waiverLink || ""}`,
    "",
    "Important Information - Please Read Carefully",
    "1. Waivers & Arrival",
    "- Every participant must complete a waiver before arrival. Incomplete waivers may delay your group's start.",
    "- Please arrive 15 minutes before your scheduled start time for check-in.",
    "- Late arrivals may reduce play time.",
    "",
    "2. Games & Safety",
    "- Wear comfortable clothing suitable for active play and closed-toe shoes.",
    "- Follow staff instructions and use equipment appropriately.",
    "- Challenge rooms are played one group at a time. Our team will guide your group's rotation.",
    "- Food and drinks should remain in designated areas.",
    "",
    "3. Your Booking",
    "- Package inclusions and room access are as agreed in your booking.",
    "- Exclusive facility access applies only if explicitly confirmed in your booking.",
    "",
    "How to Play",
    "https://www.pixelpulseplay.ca/how-to-play",
    `Website: ${invite.websiteLink || "https://www.pixelpulseplay.ca"}`,
    `Phone: ${invite.businessPhone || "+1 (905) 760-2922"}`,
    "",
    "Warm regards,",
    "The Pixel Pulse Team",
  ].join("\n");
}
