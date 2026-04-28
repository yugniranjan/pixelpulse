import { NextResponse } from "next/server";

const PUBLIC_FILES = ["/favicon.ico", "/robots.txt"];
const VERCEL_PUBLIC_PATHS = ["/waiver"];
const VERCEL_ADMIN_PATHS = ["/admin/login", "/admin/waivers"];
const VERCEL_API_PATHS = ["/api/waivers", "/api/auth/login", "/api/auth/logout", "/api/admin/waivers", "/api/admin/party-waivers"];

function isAssetPath(pathname) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/assets") ||
    PUBLIC_FILES.includes(pathname)
  );
}

function isVercelWaiverHost() {
  return process.env.VERCEL === "1" || process.env.VERCEL === "true";
}

function isAllowedVercelPath(pathname) {
  return (
    VERCEL_PUBLIC_PATHS.includes(pathname) ||
    VERCEL_ADMIN_PATHS.includes(pathname) ||
    VERCEL_API_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
  );
}

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("admin_token")?.value;

  // 🚫 Skip Next internals & public files
  if (isAssetPath(pathname)) {
    return NextResponse.next();
  }

  if (isVercelWaiverHost()) {
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/waiver", request.url));
    }

    if (pathname === "/admin") {
      return NextResponse.redirect(
        new URL(token ? "/admin/waivers" : "/admin/login", request.url)
      );
    }

    if (!isAllowedVercelPath(pathname)) {
      return pathname.startsWith("/api")
        ? NextResponse.json({ error: "Not found" }, { status: 404 })
        : NextResponse.redirect(new URL("/waiver", request.url));
    }
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
