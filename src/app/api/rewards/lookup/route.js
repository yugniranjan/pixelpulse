import { NextResponse } from "next/server";
import { lookupRewardPlayers } from "@/lib/rewardLookup";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));

  try {
    const players = await lookupRewardPlayers(body?.identifier);
    return NextResponse.json({ players });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unable to find rewards." },
      { status: error.status || 500 },
    );
  }
}
