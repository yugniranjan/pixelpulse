import { NextResponse } from "next/server";

const PUBLIC_FILES = ["/favicon.ico"];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("admin_token")?.value;

  // 🚫 Skip Next.js internals & public files
  if (
    pathname.startsWith("/_next") ||
    PUBLIC_FILES.includes(pathname)
  ) {
    return NextResponse.next();
  }

  // 🔁 Logged-in user should not see login page
  if (pathname === "/admin/login") {
    return token
      ? NextResponse.redirect(new URL("/admin/blogs", request.url))
      : NextResponse.next();
  }

  // 🔐 Protect all admin routes
  if (pathname.startsWith("/admin") && !token) {
    return NextResponse.redirect(
      new URL("/admin/login", request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
