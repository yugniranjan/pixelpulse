import { NextResponse } from "next/server";
import {
  createGiftCard,
  hasPostgres,
  listGiftCards,
  redeemGiftCard,
} from "@/lib/giftCards";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function dbUnavailable() {
  return NextResponse.json(
    { error: "Gift card database is not configured." },
    { status: 503 },
  );
}

export async function GET(req) {
  if (!hasPostgres()) return dbUnavailable();

  const { searchParams } = new URL(req.url);
  try {
    const giftCards = await listGiftCards({
      q: searchParams.get("q") || "",
      status: searchParams.get("status") || "",
      limit: Number(searchParams.get("limit") || 200),
    });
    return NextResponse.json({ giftCards });
  } catch (error) {
    console.error("list gift cards failed:", error);
    return NextResponse.json({ error: "Unable to load gift cards." }, { status: 500 });
  }
}

export async function POST(req) {
  if (!hasPostgres()) return dbUnavailable();

  const body = await req.json().catch(() => ({}));
  try {
    const result = await createGiftCard({
      code: body.code,
      durationMinutes: body.durationMinutes,
      price: body.price,
      recipientName: body.recipientName,
      senderName: body.senderName,
      createdBy: body.createdBy || "admin",
    });

    if (result.duplicate) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ giftCard: result.giftCard }, { status: 201 });
  } catch (error) {
    console.error("create gift card failed:", error);
    return NextResponse.json({ error: "Unable to create gift card." }, { status: 500 });
  }
}

export async function PATCH(req) {
  if (!hasPostgres()) return dbUnavailable();

  const body = await req.json().catch(() => ({}));
  if (body.action !== "redeem") {
    return NextResponse.json({ error: "Unsupported gift card action." }, { status: 400 });
  }

  try {
    const result = await redeemGiftCard({
      code: body.code,
      redeemedBy: body.redeemedBy || "admin",
    });

    if (result.notFound) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }
    if (result.alreadyRedeemed) {
      return NextResponse.json(
        { error: result.error, giftCard: result.giftCard },
        { status: 409 },
      );
    }
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ giftCard: result.giftCard });
  } catch (error) {
    console.error("redeem gift card failed:", error);
    return NextResponse.json({ error: "Unable to redeem gift card." }, { status: 500 });
  }
}
