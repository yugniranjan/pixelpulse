const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const torontoDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Toronto",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function isWaiverDate(value) {
  if (!datePattern.test(value || "")) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function signedWaiverDate(value) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const parts = Object.fromEntries(torontoDate.formatToParts(parsed).map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function waiverFilterDate(waiver = {}, dateType = "signed") {
  if (dateType === "visit" && isWaiverDate(waiver.visit?.visitDate)) return waiver.visit.visitDate;
  return signedWaiverDate(waiver.submittedAt);
}

export function waiverMatchesDateRange(waiver, { from = "", to = "", dateType = "signed" } = {}) {
  if (!from && !to) return true;
  const date = waiverFilterDate(waiver, dateType);
  return Boolean(date) && (!from || date >= from) && (!to || date <= to);
}
