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
const PARTIES_HOSTS = new Set([
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
  const next = (pathnameForLayout = pathname) => {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", pathnameForLayout);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  };
  const rewrite = (url, pathnameForLayout = url.pathname) => {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", pathnameForLayout);

    return NextResponse.rewrite(url, {
      request: {
        headers: requestHeaders,
      },
    });
  };

  // 🚫 Skip Next internals & public files
  if (isAssetPath(pathname)) {
    return next();
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
      return rewrite(url, "/summer-play-pass");
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
      return rewrite(url, "/squad");
    }
  }

  if (PARTIES_HOSTS.has(requestHostname)) {
    if (requestHostname === "www.parties.pixelpulseplay.ca") {
      const url = request.nextUrl.clone();
      url.protocol = "https";
      url.hostname = "parties.pixelpulseplay.ca";
      url.port = "";
      return NextResponse.redirect(url, 308);
    }

    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/birthday-party-bookings-vaughan";
      return rewrite(url, "/birthday-party-bookings-vaughan");
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
    return next();
  }

  // 🔁 Logged-in admin should not see login page
  if (pathname === "/admin/login") {
    return token
      ? NextResponse.redirect(new URL("/admin/waivers", request.url))
      : next();
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

  return next();
}

export const config = {
  matcher: ["/:path*"],
};
