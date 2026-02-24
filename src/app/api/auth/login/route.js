import { NextResponse } from "next/server";
import { db } from "@/lib/firestore";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";


export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    // Fetch admin from Firestore
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

    // Validate password
    const match = await bcrypt.compare(password, admin.passwordHash);
    if (!match) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Generate JWT token
    const token = jwt.sign(
      { email, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Return response with cookie
    const res = NextResponse.json(
      { success: true, message: "Logged in successfully" },
      { status: 200 }
    );

    res.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: true,      
      sameSite: "lax",
      path: "/",
    });

    return res;

  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

