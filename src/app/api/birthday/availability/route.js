import { NextResponse } from "next/server";
import { hasPostgres, getBookedWindows } from "@/lib/bookings";
import { getPackage, computeSlots } from "@/lib/birthdayBooking";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// GET /api/birthday/availability?date=YYYY-MM-DD&package=Pixel%20Ultra
// Returns the bookable start-time slots for that package on that date, marking
// which are free vs already taken (one room, one party at a time).
export async function GET(req) {
  if (!hasPostgres()) {
    return NextResponse.json({ error: "Booking is not available right now." }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || "";
  const pkg = getPackage(searchParams.get("package"));

  if (!DATE_RE.test(date)) {
    return NextResponse.json({ error: "A valid date (YYYY-MM-DD) is required." }, { status: 400 });
  }
  if (!pkg) {
    return NextResponse.json({ error: "A valid package is required." }, { status: 400 });
  }

  try {
    const windows = await getBookedWindows(date);
    const slots = computeSlots(pkg.durationMinutes, windows);
    return NextResponse.json({
      date,
      package: pkg.name,
      durationMinutes: pkg.durationMinutes,
      slots: slots.map((s) => ({ time: s.time, label: s.label, available: s.available })),
      anyAvailable: slots.some((s) => s.available),
    });
  } catch (error) {
    console.error("availability failed:", error);
    return NextResponse.json({ error: "Could not load availability." }, { status: 500 });
  }
}
