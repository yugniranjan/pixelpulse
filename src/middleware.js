import { NextResponse } from "next/server";

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

function isAssetPath(pathname) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/assets") ||
    PUBLIC_FILES.includes(pathname)
  );
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
  const token = request.cookies.get("admin_token")?.value;

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
    const forwardedProto = (
      request.headers.get("x-forwarded-proto") ||
      request.nextUrl.protocol.replace(":", "") ||
      ""
    ).toLowerCase();

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

  if (requestHostname === "www.pixelpulseplay.ca") {
    const url = request.nextUrl.clone();
    url.protocol = "https";
    url.hostname = "pixelpulseplay.ca";
    url.port = "";
    return NextResponse.redirect(url, 308);
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
