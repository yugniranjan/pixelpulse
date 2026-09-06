import { NextResponse } from "next/server";
import { clearRewardLookupCache, lookupRewardPlayers } from "@/lib/rewardLookup";
import { requestRewardRedemption } from "@/lib/rewards";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const identifier = String(body?.identifier || "").trim();
  const playerId = Number(body?.playerId);
  const rewardId = String(body?.rewardId || "").trim();

  if (!identifier || !Number.isInteger(playerId) || playerId < 1 || !rewardId) {
    return NextResponse.json(
      { error: "Player and reward details are required." },
      { status: 400 },
    );
  }

  try {
    const players = await lookupRewardPlayers(identifier);
    const player = players.find((item) => item.playerId === playerId);
    const reward = player?.availableRewards?.find((item) => item.id === rewardId);

    if (!player || !reward) {
      return NextResponse.json(
        { error: "This reward is not available for that player." },
        { status: 403 },
      );
    }

    if (reward.status === "requested") {
      return NextResponse.json({ reward, player });
    }

    const requestedReward = await requestRewardRedemption({ id: rewardId, playerId });
    if (!requestedReward) {
      return NextResponse.json(
        { error: "This reward is no longer available." },
        { status: 409 },
      );
    }

    clearRewardLookupCache();
    const refreshedPlayers = await lookupRewardPlayers(identifier);
    const refreshedPlayer = refreshedPlayers.find((item) => item.playerId === playerId) || null;

    return NextResponse.json({ reward: requestedReward, player: refreshedPlayer });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unable to request this redemption." },
      { status: error.status || 500 },
    );
  }
}
