import { NextResponse } from "next/server";
import {
  addRewardLedgerEntry,
  getRewardPlayer,
  getRewardStats,
  hasPostgres,
  listRewardPlayers,
  setRewardRedemptionStatus,
} from "@/lib/rewards";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function unavailable() {
  return NextResponse.json(
    { error: "Postgres is not configured." },
    { status: 503 },
  );
}

export async function GET(request) {
  if (!hasPostgres()) return unavailable();

  const { searchParams } = new URL(request.url);
  const playerId = searchParams.get("playerId");

  if (playerId) {
    const player = await getRewardPlayer(Number(playerId));
    return NextResponse.json({ player });
  }

  const [players, stats] = await Promise.all([
    listRewardPlayers({
      search: searchParams.get("search") || "",
      limit: Number(searchParams.get("limit") || 100),
    }),
    getRewardStats(),
  ]);

  return NextResponse.json({ players, stats });
}

export async function POST(request) {
  if (!hasPostgres()) return unavailable();

  const body = await request.json().catch(() => ({}));
  const playerId = Number(body?.playerId);
  const pointsDelta = Number(body?.pointsDelta);

  if (!playerId || !Number.isFinite(pointsDelta) || pointsDelta === 0) {
    return NextResponse.json(
      { error: "playerId and non-zero pointsDelta are required." },
      { status: 400 },
    );
  }

  const ledger = await addRewardLedgerEntry({
    playerId,
    pointsDelta,
    reason: body?.reason || "",
    sourceType: body?.sourceType || "manual_adjustment",
    sourceScoreId: body?.sourceScoreId || null,
    locationId: body?.locationId || null,
    earnedAt: body?.earnedAt || new Date(),
    raw: body?.raw || {},
  });

  const player = await getRewardPlayer(playerId);
  return NextResponse.json({ ledger, player });
}

export async function PATCH(request) {
  if (!hasPostgres()) return unavailable();

  const body = await request.json().catch(() => ({}));
  const id = String(body?.id || "").trim();
  const status = String(body?.status || "").trim();

  if (!id || !status) {
    return NextResponse.json(
      { error: "Redemption id and status are required." },
      { status: 400 },
    );
  }

  const redemption = await setRewardRedemptionStatus({
    id,
    status,
    redeemedBy: body?.redeemedBy || "admin",
  });

  if (!redemption) {
    return NextResponse.json(
      { error: "Redemption not found or invalid status." },
      { status: 404 },
    );
  }

  const player = await getRewardPlayer(redemption.playerId);
  return NextResponse.json({ redemption, player });
}
