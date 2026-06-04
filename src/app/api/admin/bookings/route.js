import { NextResponse } from "next/server";
import {
  hasPostgres,
  listBookings,
  createBooking,
  updateBooking,
  deleteBooking,
} from "@/lib/bookings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function dbUnavailable() {
  return NextResponse.json(
    { error: "Bookings database is not configured." },
    { status: 503 },
  );
}

function conflictResponse(conflict) {
  const first = conflict[0];
  const window = first ? ` ${first.date} ${first.startTime}–${first.endTime}` : "";
  return NextResponse.json(
    {
      error: `That time overlaps an existing booking${window}. Pick a different time.`,
      code: "BOOKING_CONFLICT",
      conflict,
    },
    { status: 409 },
  );
}

function duplicateResponse(result) {
  return NextResponse.json(
    {
      error: result.duplicateMessage || "A matching booking already exists.",
      code: "BOOKING_DUPLICATE",
      duplicate: result.duplicate,
    },
    { status: 409 },
  );
}

export async function GET(req) {
  if (!hasPostgres()) return dbUnavailable();

  const { searchParams } = new URL(req.url);
  try {
    const bookings = await listBookings({
      from: searchParams.get("from") || "",
      to: searchParams.get("to") || "",
      status: searchParams.get("status") || "",
      q: searchParams.get("q") || "",
      date: searchParams.get("date") || "",
    });
    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("list bookings failed:", error);
    return NextResponse.json({ error: "Unable to load bookings." }, { status: 500 });
  }
}

export async function POST(req) {
  if (!hasPostgres()) return dbUnavailable();

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const result = await createBooking(body);
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
    if (result.duplicate) return duplicateResponse(result);
    if (result.conflict) return conflictResponse(result.conflict);
    return NextResponse.json({ booking: result.booking }, { status: 201 });
  } catch (error) {
    console.error("create booking failed:", error);
    return NextResponse.json({ error: "Unable to create booking." }, { status: 500 });
  }
}

export async function PUT(req) {
  if (!hasPostgres()) return dbUnavailable();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Booking id is required." }, { status: 400 });

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const result = await updateBooking(id, body);
    if (result.notFound) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
    if (result.duplicate) return duplicateResponse(result);
    if (result.conflict) return conflictResponse(result.conflict);
    return NextResponse.json({ booking: result.booking });
  } catch (error) {
    console.error("update booking failed:", error);
    return NextResponse.json({ error: "Unable to update booking." }, { status: 500 });
  }
}

export async function DELETE(req) {
  if (!hasPostgres()) return dbUnavailable();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Booking id is required." }, { status: 400 });

  try {
    const removed = await deleteBooking(id);
    if (!removed) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("delete booking failed:", error);
    return NextResponse.json({ error: "Unable to delete booking." }, { status: 500 });
  }
}
