import { NextResponse } from "next/server";

const CANONICAL_HOST = "pixelpulseplay.ca";
const DEFAULT_LOCATION_SLUG = "vaughan";
const PUBLIC_FILES = ["/favicon.ico", "/robots.txt"];
const SUMMER_PLAY_PASS_HOSTS = new Set([
  "summer.pixelpulseplay.ca",
  "www.summer.pixelpulseplay.ca",
]);
const SQUAD_HOSTS = new Set([
  "squad.pixelpulseplay.ca",
  "www.squad.pixelpulseplay.ca",
]);
const REWARDS_HOSTS = new Set([
  "rewards.pixelpulseplay.ca",
  "www.rewards.pixelpulseplay.ca",
]);
const BIRTHDAY_HOSTS = new Set([
  "birthdays.pixelpulseplay.ca",
]);
const LEGACY_PARTIES_HOSTS = new Set([
  "parties.pixelpulseplay.ca",
  "www.parties.pixelpulseplay.ca",
]);
const LOCATION_PREFIXES = new Set([
  "vaughan",
  "st-catharines",
  "st-catherines",
  "mississauga",
  "oakville",
  "london",
  "windsor",
]);
const LEGACY_LOCATION_PREFIXES = new Set([
  "london",
  "st-catharines",
  "windsor",
]);
const LEGACY_SLUG_REDIRECTS = new Map([
  ["/attractions/sea-shells", "/attractions/seashells"],
  ["/attractions/pizza-dash", "/attractions/pizza-delivery"],
  ["/attractions/shooting-challenge", "/attractions/shoot-it-out"],
  ["/attractions/t-rex-course", "/attractions/trex-heist"],
  ["/groups-events/facility-rental", "/private-party"],
  ["/group-events/facility-rental", "/private-party"],
]);

function isAssetPath(pathname) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/assets") ||
    PUBLIC_FILES.includes(pathname)
  );
}

function buildRedirectUrl(request, pathname, { clearSearch = false } = {}) {
  const url = request.nextUrl.clone();
  url.pathname = pathname || "/";
  if (clearSearch) {
    url.search = "";
  }
  return url;
}

function normalizeLegacyPath(pathname) {
  if (pathname === "/$") {
    return "/";
  }

  let normalizedPathname = pathname.toLowerCase().replace(/\/+$/, "") || "/";
  const directRedirect = LEGACY_SLUG_REDIRECTS.get(normalizedPathname);
  if (directRedirect) {
    return directRedirect;
  }

  const segments = normalizedPathname.split("/").filter(Boolean);
  if (!segments.length) {
    return null;
  }

  if (segments[0] === DEFAULT_LOCATION_SLUG) {
    const rest = segments.slice(1);
    return normalizeLegacyPath(rest.length ? `/${rest.join("/")}` : "/") || "/";
  }

  const blogIndex = segments.indexOf("blogs");
  if (blogIndex > 0 || (blogIndex === 0 && segments[1] === "blogs")) {
    const slugParts = segments.slice(blogIndex + 1).filter((segment) => segment !== "blogs");
    return slugParts.length ? `/blogs/${slugParts.join("/")}` : "/blogs";
  }

  if (segments[0] === "groups-events") {
    const groupPath = `/group-events${segments.length > 1 ? `/${segments.slice(1).join("/")}` : ""}`;
    return normalizeLegacyPath(groupPath) || groupPath;
  }

  if (segments[0] === "group-events" && segments[1] === "private-party") {
    return "/private-party";
  }

  if (segments[0] === "vaughan" && LEGACY_LOCATION_PREFIXES.has(segments[1])) {
    const rest = segments.slice(2);
    return rest.length ? `/${rest.join("/")}` : "/";
  }

  if (LEGACY_LOCATION_PREFIXES.has(segments[0])) {
    const rest = segments.slice(1);
    return rest.length ? `/${rest.join("/")}` : "/";
  }

  if (normalizedPathname !== pathname) {
    return normalizedPathname;
  }

  return null;
}

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const { hostname } = request.nextUrl;
  const requestHostname = (
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    hostname ||
    ""
  )
    .split(":")[0]
    .toLowerCase();
  const forwardedProto = (
    request.headers.get("x-forwarded-proto") ||
    request.nextUrl.protocol.replace(":", "") ||
    ""
  ).toLowerCase();
  const token = request.cookies.get("admin_token")?.value;
  const isInternalAppPath = pathname.startsWith("/admin") || pathname.startsWith("/api");

  if (
    requestHostname === "www.pixelpulseplay.ca" ||
    (requestHostname === CANONICAL_HOST && forwardedProto === "http")
  ) {
    const url = request.nextUrl.clone();
    url.protocol = "https";
    url.hostname = CANONICAL_HOST;
    url.port = "";
    return NextResponse.redirect(url, 308);
  }

  const pathParts = pathname.split("/").filter(Boolean);
  let canonicalPathname = pathname;

  if (pathParts[0] === "undefined") {
    canonicalPathname = `/${pathParts.slice(1).join("/")}`;
  } else if (pathParts[0] === "blogs" && pathParts[1] === "blogs") {
    canonicalPathname = `/blogs/${pathParts.slice(2).join("/")}`;
  } else if (LOCATION_PREFIXES.has(pathParts[0]) && pathParts[1] === "blogs") {
    canonicalPathname = `/blogs/${pathParts.slice(2).join("/")}`;
  } else if (pathname === "/contact-us") {
    canonicalPathname = "/contactus";
  }

  if (!isInternalAppPath && (canonicalPathname !== pathname || request.nextUrl.searchParams.has("uid"))) {
    const url = request.nextUrl.clone();
    url.protocol = "https";
    url.hostname = "pixelpulseplay.ca";
    url.port = "";
    url.pathname = canonicalPathname || "/";
    url.searchParams.delete("uid");
    return NextResponse.redirect(url, 308);
  }

  // 🚫 Skip Next internals & public files
  if (isAssetPath(pathname)) {
    return NextResponse.next();
  }

  if (SUMMER_PLAY_PASS_HOSTS.has(requestHostname)) {
    if (requestHostname === "www.summer.pixelpulseplay.ca") {
      const url = request.nextUrl.clone();
      url.protocol = "https";
      url.hostname = "summer.pixelpulseplay.ca";
      url.port = "";
      return NextResponse.redirect(url, 308);
    }

    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/summer-play-pass";
      return NextResponse.rewrite(url);
    }
  }

  if (SQUAD_HOSTS.has(requestHostname)) {
    if (requestHostname === "www.squad.pixelpulseplay.ca") {
      const url = request.nextUrl.clone();
      url.protocol = "https";
      url.hostname = "squad.pixelpulseplay.ca";
      url.port = "";
      return NextResponse.redirect(url, 308);
    }

    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/squad";
      return NextResponse.rewrite(url);
    }
  }

  if (REWARDS_HOSTS.has(requestHostname)) {
    if (
      requestHostname === "www.rewards.pixelpulseplay.ca" ||
      forwardedProto === "http"
    ) {
      const url = new URL(
        `${request.nextUrl.pathname}${request.nextUrl.search}`,
        "https://rewards.pixelpulseplay.ca",
      );
      return NextResponse.redirect(url, 307);
    }

    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/level-up-rewards";
      return NextResponse.rewrite(url);
    }
  }

  if (LEGACY_PARTIES_HOSTS.has(requestHostname)) {
    const url = request.nextUrl.clone();
    url.protocol = "https";
    url.hostname = "birthdays.pixelpulseplay.ca";
    url.port = "";
    return NextResponse.redirect(url, 308);
  }

  if (BIRTHDAY_HOSTS.has(requestHostname)) {
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/birthday-party-bookings-vaughan";
      return NextResponse.rewrite(url);
    }
  }

  const normalizedPath = isInternalAppPath ? null : normalizeLegacyPath(pathname);
  if (normalizedPath && normalizedPath !== pathname) {
    return NextResponse.redirect(
      buildRedirectUrl(request, normalizedPath, {
        clearSearch: normalizedPath.startsWith("/blogs") || pathname === "/$",
      }),
      308,
    );
  }

  if (pathname.startsWith("/blogs/") && request.nextUrl.searchParams.has("uid")) {
    return NextResponse.redirect(
      buildRedirectUrl(request, pathname, { clearSearch: true }),
      308,
    );
  }

  // ✅ Allow auth APIs
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // 🔁 Logged-in admin should not see login page
  if (pathname === "/admin/login") {
    return token
      ? NextResponse.redirect(new URL("/admin/waivers", request.url))
      : NextResponse.next();
  }

  // 🔐 Protect admin pages
  if (pathname.startsWith("/admin") && !token) {
    return NextResponse.redirect(
      new URL("/admin/login", request.url)
    );
  }

  // 🔐 Protect admin APIs only
  if (pathname.startsWith("/api/admin") && !token) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
