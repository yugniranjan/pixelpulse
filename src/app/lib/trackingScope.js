export const TRACKING_PATH_HEADER = "x-pixelpulse-tracking-path";

export function isPublicTrackingPath(value) {
  if (!value) return false;
  let path;
  try {
    path = decodeURIComponent(value).toLowerCase().replace(/\/+$/, "") || "/";
  } catch {
    return false;
  }
  return !["/admin", "/api", "/waiver", "/waiver-data", "/invite", "/concessions-tv", "/consession-tv"]
    .some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}
