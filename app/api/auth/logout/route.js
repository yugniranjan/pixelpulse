import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json(
    { message: "Logged out successfully" },
    { status: 200 }
  );

  response.cookies.set("admin_token", "", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 0, 
    path: "/",
  });

  return response;
}
