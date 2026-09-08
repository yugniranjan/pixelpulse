import { NextResponse } from "next/server";
import {
  getRewardPrizeWheelSpin,
  requestRewardPrizeWheelSpin,
} from "@/lib/rewards";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const identifier = String(searchParams.get("identifier") || "").trim();

  if (!identifier) {
    return NextResponse.json({ spin: null });
  }

  try {
    const spin = await getRewardPrizeWheelSpin(identifier);
    return NextResponse.json({ spin });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unable to check prize wheel spin." },
      { status: error.status || 500 },
    );
  }
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));

  try {
    const spin = await requestRewardPrizeWheelSpin({
      identifier: body?.identifier,
    });

    return NextResponse.json({ spin });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unable to spin the prize wheel." },
      { status: error.status || 500 },
    );
  }
}
