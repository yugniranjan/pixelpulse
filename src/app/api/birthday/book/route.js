import { NextResponse } from "next/server";
import { hasPostgres, createPublicBooking, getBookedWindows } from "@/lib/bookings";
import { getPackage, computeSlots } from "@/lib/birthdayBooking";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// POST /api/birthday/book
// Body: { package, date, startTime, customerName, email, phone, childName, childAge, partySize, notes }
// Creates an auto-confirmed booking. If the slot was just taken, returns 409 with
// the remaining available start times for that date so the customer can re-pick.
export async function POST(req) {
  if (!hasPostgres()) {
    return NextResponse.json({ error: "Booking is not available right now." }, { status: 503 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const result = await createPublicBooking(body).catch((error) => {
    console.error("public booking failed:", error);
    return { error: "Something went wrong creating your booking. Please try again." };
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  if (result.conflict) {
    // Slot taken between availability check and submit — offer the open slots.
    const pkg = getPackage(body.package);
    let suggestions = [];
    if (pkg) {
      const windows = await getBookedWindows(String(body.date || "")).catch(() => []);
      suggestions = computeSlots(pkg.durationMinutes, windows)
        .filter((s) => s.available)
        .map((s) => ({ time: s.time, label: s.label }));
    }
    return NextResponse.json(
      {
        error: "Sorry — that time was just booked. Please choose another time.",
        conflict: true,
        suggestions,
      },
      { status: 409 },
    );
  }

  const b = result.booking;
  return NextResponse.json({
    success: true,
    booking: {
      package: b.package,
      date: b.date,
      startTime: b.startTime,
      endTime: b.endTime,
      partySize: b.partySize,
      customerName: b.customerName,
      childName: b.childName,
    },
  });
}
