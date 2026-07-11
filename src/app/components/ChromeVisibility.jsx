"use client";

import { usePathname } from "next/navigation";

const STANDALONE_PATHS = new Set([
  "/birthday-party-landing",
  "/birthday-party-bookings-vaughan",
  "/concessions-tv",
  "/feedback",
  "/level-up-rewards",
  "/private-party",
  "/squad",
  "/summer-play-pass",
  "/waiver",
]);

const STANDALONE_HOSTS = new Set([
  "birthdays.pixelpulseplay.ca",
  "www.birthdays.pixelpulseplay.ca",
  "rewards.pixelpulseplay.ca",
  "www.rewards.pixelpulseplay.ca",
]);

function normalizePath(path = "/") {
  if (!path) return "/";
  return path !== "/" && path.endsWith("/") ? path.slice(0, -1) : path;
}

export default function ChromeVisibility({ children }) {
  const pathname = normalizePath(usePathname() || "/");
  const hostname =
    typeof window === "undefined" ? "" : window.location.hostname.toLowerCase();

  if (
    STANDALONE_HOSTS.has(hostname) ||
    STANDALONE_PATHS.has(pathname) ||
    pathname.startsWith("/invite") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/")
  ) {
    return null;
  }

  return children;
}
