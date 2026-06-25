import { NextResponse } from "next/server";
import { getPostgresPool, query } from "@/lib/postgres";
import { ensureRewardsTables, unlockRewardsForPlayer } from "@/lib/rewards";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function normalizePhone(value = "") {
  return String(value || "").replace(/\D/g, "");
}

function normalizeEmail(value = "") {
  return String(value || "").trim().toLowerCase();
}

function iso(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function normalizeLevel(row = {}, prefix = "current") {
  const levelNumber = row[`${prefix}_level`];
  if (!levelNumber) return null;

  return {
    levelNumber: Number(levelNumber),
    thresholdPoints: Number(row[`${prefix}_threshold`] || 0),
    rewardName: row[`${prefix}_reward_name`] || "",
    rewardType: row[`${prefix}_reward_type`] || "",
  };
}

function normalizeReward(row = {}) {
  return {
    id: row.id,
    levelNumber: Number(row.level_number || 0),
    rewardName: row.reward_name || "",
    status: row.status || "available",
    expiresAt: iso(row.expires_at),
  };
}

export async function POST(request) {
  if (!getPostgresPool()) {
    return NextResponse.json(
      { error: "Rewards lookup is not available right now." },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const identifier = String(body?.identifier || "").trim();
  const email = normalizeEmail(identifier);
  const phone = normalizePhone(identifier);

  if (!identifier || (identifier.includes("@") && !email.includes("@")) || (!email.includes("@") && phone.length < 7)) {
    return NextResponse.json(
      { error: "Enter the email or phone number used for your player profile." },
      { status: 400 },
    );
  }

  await ensureRewardsTables();

  const matchedPlayers = await query(
    `
      with matched_emails as (
        select lower(p."email") as email
        from public."Players" p
        where lower(coalesce(p."email", '')) = $1

        union

        select lower(w.primary_participant->>'email') as email
        from waivers w
        where (
          lower(coalesce(w.primary_participant->>'email', '')) = $1
          or regexp_replace(coalesce(w.primary_participant->>'phone', ''), '\\D', '', 'g') = $2
        )
        and coalesce(w.primary_participant->>'email', '') <> ''
      )
      select distinct
        p."PlayerID" as player_id,
        p."FirstName" as first_name,
        p."LastName" as last_name,
        p."email" as email,
        coalesce(scorecard.lifetime_points, 0)::integer as lifetime_points,
        coalesce(scorecard.repeat_visits, 0)::integer as repeat_visits,
        current_level.level_number as current_level,
        current_level.threshold_points as current_threshold,
        current_level.reward_name as current_reward_name,
        current_level.reward_type as current_reward_type,
        next_level.level_number as next_level,
        next_level.threshold_points as next_threshold,
        next_level.reward_name as next_reward_name,
        next_level.reward_type as next_reward_type
      from public."Players" p
      left join lateral (
        select
          coalesce(scoreboard.scoreboard_points, 0) + coalesce(adjustments.adjustment_points, 0) as lifetime_points,
          coalesce(scoreboard.repeat_visits, 0) as repeat_visits
        from (
          select
            coalesce(sum(coalesce(ps."Points", 0)), 0) as scoreboard_points,
            count(distinct coalesce(ps."StartTime", ps."createdAt")::date) as repeat_visits
          from public."PlayerScores" ps
          where ps."PlayerID" = p."PlayerID"
        ) scoreboard
        cross join (
          select coalesce(sum(rpl.points_delta), 0) as adjustment_points
          from reward_point_ledger rpl
          where rpl.player_id = p."PlayerID"
            and coalesce(rpl.source_type, '') <> 'scoreboard'
        ) adjustments
      ) scorecard on true
      left join lateral (
        select *
        from reward_levels rl
        where rl.active = true
          and rl.threshold_points <= coalesce(scorecard.lifetime_points, 0)
        order by rl.threshold_points desc
        limit 1
      ) current_level on true
      left join lateral (
        select *
        from reward_levels rl
        where rl.active = true
          and rl.threshold_points > coalesce(scorecard.lifetime_points, 0)
        order by rl.threshold_points asc
        limit 1
      ) next_level on true
      where lower(coalesce(p."email", '')) = $1
        or lower(coalesce(p."email", '')) in (select email from matched_emails where email is not null)
      order by lifetime_points desc, p."PlayerID" desc
      limit 10
    `,
    [email.includes("@") ? email : "", phone],
  );

  await Promise.all(matchedPlayers.rows.map((player) => unlockRewardsForPlayer(player.player_id)));

  const playerIds = matchedPlayers.rows.map((player) => Number(player.player_id));
  const rewardsByPlayer = new Map();

  if (playerIds.length) {
    const rewards = await query(
      `
        select *
        from reward_redemptions
        where player_id = any($1::bigint[])
          and status = 'available'
        order by level_number asc
      `,
      [playerIds],
    );

    rewards.rows.forEach((reward) => {
      const key = Number(reward.player_id);
      const list = rewardsByPlayer.get(key) || [];
      list.push(normalizeReward(reward));
      rewardsByPlayer.set(key, list);
    });
  }

  const players = matchedPlayers.rows.map((player) => {
    const playerId = Number(player.player_id);
    const fullName = [player.first_name, player.last_name].filter(Boolean).join(" ").trim();

    return {
      playerId,
      fullName: fullName || `Player ${playerId}`,
      lifetimePoints: Number(player.lifetime_points || 0),
      repeatVisits: Number(player.repeat_visits || 0),
      currentLevel: normalizeLevel(player, "current"),
      nextLevel: normalizeLevel(player, "next"),
      availableRewards: rewardsByPlayer.get(playerId) || [],
    };
  });

  return NextResponse.json({ players });
}
