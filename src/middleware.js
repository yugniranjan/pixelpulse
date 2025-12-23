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
  if (pathname === "/api/auth/login") {
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


  // 🔐 Protect APIs
  if (pathname.startsWith("/api") && !token) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
