import { NextResponse } from "next/server";
import { listFeedbackEmailStatuses } from "@/lib/feedback";
import { getPostgresPool, query } from "@/lib/postgres";
import { listPostgresWaiverThankYouEmailStatuses } from "@/lib/postgresData";
import { ensureRewardsTables } from "@/lib/rewards";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

let rewardsTablesReadyPromise;

function ensureRewardsTablesOnce() {
  if (!rewardsTablesReadyPromise) {
    rewardsTablesReadyPromise = ensureRewardsTables().catch((error) => {
      rewardsTablesReadyPromise = null;
      throw error;
    });
  }

  return rewardsTablesReadyPromise;
}

function serializePlayer(row) {
  return {
    id: row.PlayerID,
    playerId: row.PlayerID,
    firstName: row.FirstName || "",
    lastName: row.LastName || "",
    fullName: [row.FirstName, row.LastName].filter(Boolean).join(" ").trim() || "Unnamed",
    dateOfBirth: row.DateOfBirth ? row.DateOfBirth.toISOString() : "",
    email: row.email || "",
    partyId: row.party_id || "",
    partyDate: row.party_date || "",
    wristbandCode: row.wristband_code || "",
    wristbandTranDate: row.wristband_tran_date ? row.wristband_tran_date.toISOString() : "",
    playerStartTime: row.player_start_time ? row.player_start_time.toISOString() : "",
    playerEndTime: row.player_end_time ? row.player_end_time.toISOString() : "",
    wristbandStatusFlag: row.wristband_status_flag || "",
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
  const followUpMode = searchParams.get("mode") === "followup";

  if (!followUpMode) {
    await ensureRewardsTablesOnce();
  }

  const result = await query(
    followUpMode
      ? `
      WITH recent_players AS (
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
          p."updatedAt"
        FROM public."Players" p
        WHERE p."LocationID" = $2
        ORDER BY p."createdAt" DESC NULLS LAST, p."PlayerID" DESC
        LIMIT $1
      ),
      waiver_party_people AS (
        SELECT
          lower(nullif(trim(coalesce(w.primary_participant->>'email', '')), '')) AS email,
          coalesce(w.visit->>'partyId', '') AS party_id,
          coalesce(w.visit->>'partyDate', w.visit->>'visitDate', '') AS party_date,
          CASE
            WHEN coalesce(w.visit->>'partyDate', w.visit->>'visitDate', '') ~ '^\\d{4}-\\d{2}-\\d{2}$'
              THEN coalesce(w.visit->>'partyDate', w.visit->>'visitDate', '')::date
            ELSE NULL
          END AS party_visit_date,
          w.submitted_at
        FROM waivers w
        WHERE coalesce(w.visit->>'partyId', '') <> ''
          AND lower(nullif(trim(coalesce(w.primary_participant->>'email', '')), '')) IS NOT NULL
      ),
      latest_wristband AS (
        SELECT DISTINCT ON (wt."PlayerID")
          wt."PlayerID" AS player_id,
          wt."wristbandCode" AS wristband_code,
          wt."WristbandTranDate" AS wristband_tran_date,
          wt."playerStartTime" AS player_start_time,
          wt."playerEndTime" AS player_end_time,
          wt."wristbandStatusFlag" AS wristband_status_flag
        FROM public."WristbandTrans" wt
        INNER JOIN recent_players rp ON rp."PlayerID" = wt."PlayerID"
        WHERE wt."LocationID" = $2
        ORDER BY wt."PlayerID", coalesce(wt."updatedAt", wt."createdAt", wt."WristbandTranDate") DESC NULLS LAST, wt."WristbandTranID" DESC
      )
      SELECT
        p."PlayerID",
        p."FirstName",
        p."LastName",
        p."DateOfBirth",
        p.email,
        waiver_party_details.party_id,
        waiver_party_details.party_date,
        latest_wristband.wristband_code,
        latest_wristband.wristband_tran_date,
        latest_wristband.player_start_time,
        latest_wristband.player_end_time,
        latest_wristband.wristband_status_flag,
        p."DateSigned",
        p."SigneeID",
        p."LocationID",
        p."createdAt",
        p."updatedAt",
        l."Name" AS "locationName",
        0::integer AS lifetime_points,
        0::integer AS repeat_visits,
        0::integer AS score_events,
        null::timestamptz AS last_score_at,
        null::integer AS current_level,
        0::integer AS current_threshold,
        ''::text AS current_reward_name,
        ''::text AS current_reward_type,
        null::integer AS next_level,
        0::integer AS next_threshold,
        ''::text AS next_reward_name,
        ''::text AS next_reward_type,
        0::integer AS available_rewards,
        0::integer AS redeemed_rewards
      FROM recent_players p
      LEFT JOIN public."Locations" l ON l."LocationID" = p."LocationID"
      LEFT JOIN latest_wristband ON latest_wristband.player_id = p."PlayerID"
      LEFT JOIN LATERAL (
        SELECT
          wpp.party_id,
          wpp.party_date
        FROM waiver_party_people wpp
        WHERE wpp.email = lower(coalesce(p.email, ''))
          AND (
            wpp.party_visit_date IS NULL
            OR wpp.party_visit_date = (
              coalesce(
                latest_wristband.player_end_time,
                latest_wristband.player_start_time,
                latest_wristband.wristband_tran_date,
                p."createdAt"
              ) AT TIME ZONE 'America/Toronto'
            )::date
          )
        ORDER BY
          CASE WHEN wpp.party_visit_date IS NULL THEN 1 ELSE 0 END,
          wpp.submitted_at DESC NULLS LAST
        LIMIT 1
      ) waiver_party_details ON true
      ORDER BY coalesce(latest_wristband.player_end_time, latest_wristband.player_start_time, latest_wristband.wristband_tran_date, p."createdAt") DESC NULLS LAST, p."PlayerID" DESC
    `
      : `
      WITH recent_players AS (
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
          p."updatedAt"
        FROM public."Players" p
        WHERE p."LocationID" = $2
        ORDER BY p."createdAt" DESC NULLS LAST, p."PlayerID" DESC
        LIMIT $1
      ),
      scoreboard AS (
        SELECT
          ps."PlayerID" AS player_id,
          coalesce(sum(coalesce(ps."Points", 0)), 0) AS scoreboard_points,
          count(*) AS score_events,
          count(distinct coalesce(ps."StartTime", ps."createdAt")::date) AS repeat_visits,
          max(coalesce(ps."EndTime", ps."StartTime", ps."createdAt")) AS last_score_at
        FROM public."PlayerScores" ps
        INNER JOIN recent_players rp ON rp."PlayerID" = ps."PlayerID"
        WHERE ps."LocationID" = $2
        GROUP BY ps."PlayerID"
      ),
      manual_adjustments AS (
        SELECT
          rpl.player_id,
          coalesce(sum(rpl.points_delta), 0) AS adjustment_points
        FROM reward_point_ledger rpl
        INNER JOIN recent_players rp ON rp."PlayerID" = rpl.player_id
        WHERE coalesce(rpl.source_type, '') <> 'scoreboard'
        GROUP BY rpl.player_id
      ),
      scorecards AS (
        SELECT
          coalesce(scoreboard.player_id, manual_adjustments.player_id) AS player_id,
          coalesce(scoreboard.scoreboard_points, 0) + coalesce(manual_adjustments.adjustment_points, 0) AS lifetime_points,
          coalesce(scoreboard.repeat_visits, 0) AS repeat_visits,
          coalesce(scoreboard.score_events, 0) AS score_events,
          scoreboard.last_score_at
        FROM scoreboard
        FULL OUTER JOIN manual_adjustments
          ON manual_adjustments.player_id = scoreboard.player_id
      ),
      waiver_party_people AS (
        SELECT
          lower(nullif(trim(coalesce(w.primary_participant->>'email', '')), '')) AS email,
          coalesce(w.visit->>'partyId', '') AS party_id,
          coalesce(w.visit->>'partyDate', w.visit->>'visitDate', '') AS party_date,
          CASE
            WHEN coalesce(w.visit->>'partyDate', w.visit->>'visitDate', '') ~ '^\\d{4}-\\d{2}-\\d{2}$'
              THEN coalesce(w.visit->>'partyDate', w.visit->>'visitDate', '')::date
            ELSE NULL
          END AS party_visit_date,
          w.submitted_at
        FROM waivers w
        WHERE coalesce(w.visit->>'partyId', '') <> ''
          AND lower(nullif(trim(coalesce(w.primary_participant->>'email', '')), '')) IS NOT NULL
      ),
      latest_wristband AS (
        SELECT DISTINCT ON (wt."PlayerID")
          wt."PlayerID" AS player_id,
          wt."wristbandCode" AS wristband_code,
          wt."WristbandTranDate" AS wristband_tran_date,
          wt."playerStartTime" AS player_start_time,
          wt."playerEndTime" AS player_end_time,
          wt."wristbandStatusFlag" AS wristband_status_flag
        FROM public."WristbandTrans" wt
        INNER JOIN recent_players rp ON rp."PlayerID" = wt."PlayerID"
        WHERE wt."LocationID" = $2
        ORDER BY wt."PlayerID", coalesce(wt."updatedAt", wt."createdAt", wt."WristbandTranDate") DESC NULLS LAST, wt."WristbandTranID" DESC
      )
      SELECT
        p."PlayerID",
        p."FirstName",
        p."LastName",
        p."DateOfBirth",
        p.email,
        waiver_party_details.party_id,
        waiver_party_details.party_date,
        latest_wristband.wristband_code,
        latest_wristband.wristband_tran_date,
        latest_wristband.player_start_time,
        latest_wristband.player_end_time,
        latest_wristband.wristband_status_flag,
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
      FROM recent_players p
      LEFT JOIN public."Locations" l ON l."LocationID" = p."LocationID"
      LEFT JOIN latest_wristband ON latest_wristband.player_id = p."PlayerID"
      LEFT JOIN LATERAL (
        SELECT
          wpp.party_id,
          wpp.party_date
        FROM waiver_party_people wpp
        WHERE wpp.email = lower(coalesce(p.email, ''))
          AND (
            wpp.party_visit_date IS NULL
            OR wpp.party_visit_date = (
              coalesce(
                latest_wristband.player_end_time,
                latest_wristband.player_start_time,
                latest_wristband.wristband_tran_date,
                p."createdAt"
              ) AT TIME ZONE 'America/Toronto'
            )::date
          )
        ORDER BY
          CASE WHEN wpp.party_visit_date IS NULL THEN 1 ELSE 0 END,
          wpp.submitted_at DESC NULLS LAST
        LIMIT 1
      ) waiver_party_details ON true
      LEFT JOIN scorecards scorecard ON scorecard.player_id = p."PlayerID"
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
      ORDER BY p."createdAt" DESC NULLS LAST, p."PlayerID" DESC
    `,
    [limit, locationId],
  );

  const players = result.rows.map(serializePlayer);
  const emails = players.map((player) => player.email);
  const [feedbackStatuses, thankYouStatuses] = await Promise.all([
    listFeedbackEmailStatuses(emails),
    listPostgresWaiverThankYouEmailStatuses(emails),
  ]);

  return NextResponse.json({
    players: players.map((player) => {
      const email = String(player.email || "").trim().toLowerCase();
      return {
        ...player,
        feedbackStatus: feedbackStatuses[email] || null,
        thankYouEmail: thankYouStatuses[email] || null,
      };
    }),
  });
}
