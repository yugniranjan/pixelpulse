// Shared config + slot math for the public birthday party booking flow.
//
// One party room, one party at a time: a booking holds the room for its
// package's "Total Party Duration". Available start times are the operating-hour
// slots whose [start, start+duration) window doesn't overlap an existing booking.
//
// Pure module (no DB / no server-only imports) so it can be used on the client,
// the API routes, and in tests.

// Operating hours (minutes from midnight). A party must FINISH by close.
export const OPEN_MINUTES = 11 * 60; // 11:00 AM
export const CLOSE_MINUTES = 20 * 60; // 8:00 PM
export const SLOT_STEP = 30; // bookable start times every 30 minutes

// Canonical packages — mirrors the birthday-party-bookings-vaughan page.
// durationMinutes = the room-occupancy time used for overlap checks.
export const BIRTHDAY_PACKAGES = [
  {
    name: "Pixel Punch",
    price: "$399",
    capacity: 8,
    gameTime: "1 hour",
    totalDuration: "1 hour 45 minutes",
    durationMinutes: 105,
    refreshments: "2 Large Pizza + Juice/Water per participant",
  },
  {
    name: "Pixel Ultra",
    price: "$499",
    capacity: 12,
    gameTime: "1 hour",
    totalDuration: "2 hours",
    durationMinutes: 120,
    refreshments: "3 Large Pizza + Juice/Water per participant",
  },
  {
    name: "Pixel Jumbo",
    price: "$799",
    capacity: 20,
    gameTime: "1.5 hours",
    totalDuration: "2.5 hours",
    durationMinutes: 150,
    refreshments: "4 Large Pizza + Juice/Water per participant",
  },
  {
    name: "Pulse Max",
    price: "$1199",
    capacity: 25,
    gameTime: "2 hours",
    totalDuration: "3 hours",
    durationMinutes: 180,
    refreshments: "6 Large Pizza + Juice/Water per participant",
  },
];

export function getPackage(name) {
  const needle = String(name || "").trim().toLowerCase();
  return BIRTHDAY_PACKAGES.find((p) => p.name.toLowerCase() === needle) || null;
}

export function pad2(n) {
  return String(n).padStart(2, "0");
}

export function minutesToTime(total) {
  const v = ((Math.round(total) % 1440) + 1440) % 1440;
  return `${pad2(Math.floor(v / 60))}:${pad2(v % 60)}`;
}

export function timeToMinutes(value = "") {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(value).trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

// "13:30" -> "1:30 PM"
export function formatTimeLabel(value) {
  const mins = typeof value === "number" ? value : timeToMinutes(value);
  if (mins == null) return String(value || "");
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${pad2(m)} ${period}`;
}

function overlaps(start, end, windows) {
  return windows.some((w) => start < w.end && end > w.start);
}

/**
 * All bookable start-time slots for a package of the given duration, marking
 * which are free vs already taken by an existing booking.
 * @param {number} durationMinutes
 * @param {Array<{start:number,end:number}>} bookedWindows  non-cancelled bookings
 * @returns {Array<{start:number,end:number,time:string,label:string,available:boolean}>}
 */
export function computeSlots(durationMinutes, bookedWindows = []) {
  const duration = Math.round(Number(durationMinutes) || 0);
  if (duration <= 0) return [];
  const slots = [];
  const lastStart = CLOSE_MINUTES - duration;
  for (let t = OPEN_MINUTES; t <= lastStart; t += SLOT_STEP) {
    const end = t + duration;
    slots.push({
      start: t,
      end,
      time: minutesToTime(t),
      label: formatTimeLabel(t),
      available: !overlaps(t, end, bookedWindows),
    });
  }
  return slots;
}

// True if a specific start time is bookable for the duration (in hours + free).
export function isSlotAvailable(startMinutes, durationMinutes, bookedWindows = []) {
  const end = startMinutes + durationMinutes;
  if (startMinutes < OPEN_MINUTES || end > CLOSE_MINUTES) return false;
  return !overlaps(startMinutes, end, bookedWindows);
}
