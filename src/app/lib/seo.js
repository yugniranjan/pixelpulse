import { LOCATION_NAME } from "@/lib/constant";

const DEFAULT_SITE_URL = "https://pixelpulseplay.ca";
export const DEFAULT_SEO_IMAGE =
  "https://storage.googleapis.com/pixel-pulse-play/web/h-Logo.png";

export function getCanonicalSiteUrl() {
  const configured =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.SITE_URL ||
    DEFAULT_SITE_URL;

  try {
    const url = new URL(configured);
    if (url.hostname === "www.pixelpulseplay.ca") {
      url.hostname = "pixelpulseplay.ca";
    }
    url.pathname = "";
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export function canonicalPath(...segments) {
  const defaultLocation = String(LOCATION_NAME || "vaughan").toLowerCase();
  const parts = segments
    .flatMap((segment) => String(segment || "").split("/"))
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (parts[0]?.toLowerCase() === defaultLocation) {
    parts.shift();
  }

  if (parts.length === 1 && parts[0].toLowerCase() === "contact-us") {
    parts[0] = "contactus";
  }

  return parts.length ? `/${parts.join("/")}` : "";
}

export function canonicalUrl(...segments) {
  return `${getCanonicalSiteUrl()}${canonicalPath(...segments)}`;
}

export function looksLikeImageUrl(url = "") {
  if (!url) return false;
  if (url.startsWith("/")) return true;

  const normalized = url.split("?")[0].toLowerCase();
  return [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".svg"].some((ext) =>
    normalized.endsWith(ext),
  );
}

export function isLegacyBrokenStorageUrl(url = "") {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === "storage.googleapis.com" &&
      parsed.pathname.startsWith("/PixelPulsePlay/")
    );
  } catch {
    return false;
  }
}

export function safeImageUrl(url = "", fallback = "/assets/images/logo.png") {
  const value = String(url || "").trim();
  if (!value || isLegacyBrokenStorageUrl(value) || !looksLikeImageUrl(value)) {
    return fallback;
  }

  return value;
}
