import { NextResponse } from "next/server";

const PUBLIC_FILES = ["/favicon.ico", "/robots.txt"];

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
  const token = request.cookies.get("admin_token")?.value;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  const next = () =>
    NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

  // 🚫 Skip Next internals & public files
  if (isAssetPath(pathname)) {
    return next();
  }

  if (hostname === "www.pixelpulseplay.ca") {
    const url = request.nextUrl.clone();
    url.hostname = "pixelpulseplay.ca";
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
