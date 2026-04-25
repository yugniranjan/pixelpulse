"use client";

import { usePathname } from "next/navigation";

const STANDALONE_PATHS = new Set(["/birthday-party-landing", "/waiver"]);

function normalizePath(path = "/") {
  if (!path) return "/";
  return path !== "/" && path.endsWith("/") ? path.slice(0, -1) : path;
}

export default function ChromeVisibility({ children }) {
  const pathname = normalizePath(usePathname() || "/");

  if (STANDALONE_PATHS.has(pathname) || pathname.startsWith("/invite")) {
    return null;
  }

  return children;
}
