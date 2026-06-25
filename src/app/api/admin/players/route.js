import { NextResponse } from "next/server";
import { getPostgresPool, query } from "@/lib/postgres";
import { ensureRewardsTables } from "@/lib/rewards";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function serializePlayer(row) {
  return {
    id: row.PlayerID,
    playerId: row.PlayerID,
    firstName: row.FirstName || "",
    lastName: row.LastName || "",
    fullName: [row.FirstName, row.LastName].filter(Boolean).join(" ").trim() || "Unnamed",
    dateOfBirth: row.DateOfBirth ? row.DateOfBirth.toISOString() : "",
    email: row.email || "",
    dateSigned: row.DateSigned ? row.DateSigned.toISOString() : "",
    signeeId: row.SigneeID,
    locationId: row.LocationID,
    locationName: row.locationName || "",
    createdAt: row.createdAt ? row.createdAt.toISOString() : "",
    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : "",
    lifetimePoints: Number(row.lifetime_points || 0),
    currentLevel: row.current_level
      ? {
          levelNumber: Number(row.current_level),
          thresholdPoints: Number(row.current_threshold || 0),
          rewardName: row.current_reward_name || "",
          rewardType: row.current_reward_type || "",
        }
      : null,
    nextLevel: row.next_level
      ? {
          levelNumber: Number(row.next_level),
          thresholdPoints: Number(row.next_threshold || 0),
          rewardName: row.next_reward_name || "",
          rewardType: row.next_reward_type || "",
        }
      : null,
    availableRewards: Number(row.available_rewards || 0),
    redeemedRewards: Number(row.redeemed_rewards || 0),
    repeatVisits: Number(row.repeat_visits || 0),
    scoreEvents: Number(row.score_events || 0),
    lastScoreAt: row.last_score_at ? row.last_score_at.toISOString() : "",
  };
}

export async function GET(req) {
  if (!getPostgresPool()) {
    return NextResponse.json(
      { error: "Postgres is not configured." },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 500, 1000);
  const locationId = Number(searchParams.get("locationId") || 2);

  await ensureRewardsTables();

  const result = await query(
    `
      SELECT
        p."PlayerID",
        p."FirstName",
        p."LastName",
        p."DateOfBirth",
        p.email,
        p."DateSigned",
        p."SigneeID",
        p."LocationID",
        p."createdAt",
        p."updatedAt",
        l."Name" AS "locationName",
        coalesce(scorecard.lifetime_points, 0)::integer AS lifetime_points,
        coalesce(scorecard.repeat_visits, 0)::integer AS repeat_visits,
        coalesce(scorecard.score_events, 0)::integer AS score_events,
        scorecard.last_score_at,
        current_level.level_number AS current_level,
        current_level.threshold_points AS current_threshold,
        current_level.reward_name AS current_reward_name,
        current_level.reward_type AS current_reward_type,
        next_level.level_number AS next_level,
        next_level.threshold_points AS next_threshold,
        next_level.reward_name AS next_reward_name,
        next_level.reward_type AS next_reward_type,
        coalesce(reward_counts.available_rewards, 0)::integer AS available_rewards,
        coalesce(reward_counts.redeemed_rewards, 0)::integer AS redeemed_rewards
      FROM public."Players" p
      LEFT JOIN public."Locations" l ON l."LocationID" = p."LocationID"
      LEFT JOIN LATERAL (
        SELECT
          coalesce(sum(rpl.points_delta), 0) AS lifetime_points,
          count(*) AS score_events,
          count(distinct rpl.earned_at::date) AS repeat_visits,
          max(rpl.earned_at) AS last_score_at
        FROM reward_point_ledger rpl
        WHERE rpl.player_id = p."PlayerID"
      ) scorecard ON true
      LEFT JOIN LATERAL (
        SELECT *
        FROM reward_levels rl
        WHERE rl.active = true
          AND rl.threshold_points <= coalesce(scorecard.lifetime_points, 0)
        ORDER BY rl.threshold_points DESC
        LIMIT 1
      ) current_level ON true
      LEFT JOIN LATERAL (
        SELECT *
        FROM reward_levels rl
        WHERE rl.active = true
          AND rl.threshold_points > coalesce(scorecard.lifetime_points, 0)
        ORDER BY rl.threshold_points ASC
        LIMIT 1
      ) next_level ON true
      LEFT JOIN LATERAL (
        SELECT
          count(*) filter (where rr.status = 'available') AS available_rewards,
          count(*) filter (where rr.status = 'redeemed') AS redeemed_rewards
        FROM reward_redemptions rr
        WHERE rr.player_id = p."PlayerID"
      ) reward_counts ON true
      WHERE p."LocationID" = $2
      ORDER BY p."createdAt" DESC NULLS LAST, p."PlayerID" DESC
      LIMIT $1
    `,
    [limit, locationId],
  );

  return NextResponse.json({
    players: result.rows.map(serializePlayer),
  });
}
