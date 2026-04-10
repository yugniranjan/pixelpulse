export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { db } from "@/lib/firestore";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import handlePost from "@/lib/postHandler";

async function loginLogic(req) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password required" },
      { status: 400 }
    );
  }

  const snap = await db
    .collection("admins")
    .where("email", "==", email)
    .where("active", "==", true)
    .limit(1)
    .get();

  if (snap.empty) {
    return NextResponse.json(
      { error: "Invalid email credentials" },
      { status: 401 }
    );
  }

  const adminDoc = snap.docs[0];
  const admin = adminDoc.data();

  const match = await bcrypt.compare(password, admin.passwordHash);

  if (!match) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }

  const token = jwt.sign(
    { uid: adminDoc.id, email, role: admin.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  const res = NextResponse.json(
    { success: true, message: "Logged in successfully" },
    { status: 200 }
  );

  res.cookies.set("admin_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  return res;
}

// ✅ POST handler
export const POST = handlePost(loginLogic);
