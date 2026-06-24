"use client";

import { usePathname } from "next/navigation";

const TRACKING_EXCLUDED_PATHS = new Set([
  "/concessions-tv",
  "/waiver",
  "/waiver-data",
  "/admin",
]);

function normalizePath(path = "/") {
  if (!path) return "/";
  return path !== "/" && path.endsWith("/") ? path.slice(0, -1) : path;
}

export default function TrackingVisibility({ children }) {
  const pathname = normalizePath(usePathname() || "/");

  if (
    TRACKING_EXCLUDED_PATHS.has(pathname) ||
    pathname.startsWith("/waiver/") ||
    pathname.startsWith("/invite") ||
    pathname.startsWith("/admin/")
  ) {
    return null;
  }

  return children;
}
