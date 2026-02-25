// /app/api/admin/login/route.js
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { db } from "@/lib/firestore";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createPostHandler } from "@/lib/postHandler";


// Actual POST logic
async function loginLogic(req) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const snap = await db
    .collection("admins")
    .where("email", "==", email)
    .where("active", "==", true)
    .limit(1)
    .get();

  if (snap.empty) {
    return NextResponse.json({ error: "Invalid email credentials" }, { status: 401 });
  }

  const admin = snap.docs[0].data();
  const match = await bcrypt.compare(password, admin.passwordHash);

  if (!match) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = jwt.sign({ email, role: admin.role }, process.env.JWT_SECRET, { expiresIn: "1d" });

  const res = NextResponse.json({ success: true, message: "Logged in successfully" }, { status: 200 });

  res.cookies.set("admin_token", token, {
    httpOnly: true,
    secure: true, // production: true
    sameSite: "lax",
    path: "/",
  });

  return res;
}

// Wrap loginLogic with reusable POST handler
export const POST = createPostHandler(loginLogic);