import { getPostgresPool, query } from "@/lib/postgres";
import { ensureRewardsTables, unlockRewardsForPlayers } from "@/lib/rewards";

const LOOKUP_CACHE_TTL_MS = Number(process.env.REWARD_LOOKUP_CACHE_TTL_MS || 60_000);
const lookupCache = new Map();

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

function normalizeMemberPlayer(row = {}) {
  const memberId = Number(row.id || 0);
  const fullName = row.full_name || `Rewards Member ${memberId}`;

  return {
    playerId: -memberId,
    memberId,
    fullName,
    lifetimePoints: 0,
    repeatVisits: 0,
    scoreEvents: 0,
    lastScoreAt: "",
    currentLevel: null,
    nextLevel: {
      levelNumber: Number(row.next_level || 1),
      thresholdPoints: Number(row.next_threshold || 5000),
      rewardName: row.next_reward_name || "10 Arcade Credits",
      rewardType: row.next_reward_type || "arcade_credits",
    },
    availableRewards: [],
    emailVerified: Boolean(row.email_verified),
    isRewardsMember: true,
  };
}

function getCacheKey(identifier = "") {
  return String(identifier || "").trim().toLowerCase();
}

function getCachedLookup(cacheKey) {
  if (!LOOKUP_CACHE_TTL_MS || !cacheKey) return null;

  const cached = lookupCache.get(cacheKey);
  if (!cached) return null;

  if (Date.now() - cached.createdAt > LOOKUP_CACHE_TTL_MS) {
    lookupCache.delete(cacheKey);
    return null;
  }

  return cached.players;
}

function setCachedLookup(cacheKey, players) {
  if (!LOOKUP_CACHE_TTL_MS || !cacheKey) return;

  lookupCache.set(cacheKey, {
    createdAt: Date.now(),
    players,
  });

  if (lookupCache.size > 250) {
    const oldestKey = lookupCache.keys().next().value;
    if (oldestKey) lookupCache.delete(oldestKey);
  }
}

export async function lookupRewardPlayers(identifierValue = "") {
  if (!getPostgresPool()) {
    const error = new Error("Rewards lookup is not available right now.");
    error.status = 503;
    throw error;
  }

  const identifier = String(identifierValue || "").trim();
  const cacheKey = getCacheKey(identifier);
  const cachedPlayers = getCachedLookup(cacheKey);

  if (cachedPlayers) {
    return cachedPlayers;
  }

  const email = normalizeEmail(identifier);
  const phone = normalizePhone(identifier);
  const playerId = /^\d{1,8}$/.test(identifier) ? identifier : "";
  const nameSearch =
    !identifier.includes("@") && !playerId && /[a-zA-Z]/.test(identifier)
      ? identifier.toLowerCase().replace(/\s+/g, " ").trim()
      : "";

  if (
    !identifier ||
    (identifier.includes("@") && !email.includes("@")) ||
    (!email.includes("@") && !playerId && !nameSearch && phone.length < 7)
  ) {
    const error = new Error("Enter your name, email, phone number, or Player ID.");
    error.status = 400;
    throw error;
  }

  await ensureRewardsTables();

  const matchedPlayers = await query(
    `
      with matched_waivers as (
        select w.*
        from waivers w
        where ($1 <> '' and lower(coalesce(w.primary_participant->>'email', '')) = $1)
          or ($2 <> '' and regexp_replace(coalesce(w.primary_participant->>'phone', ''), '\\D', '', 'g') = $2)
          or (
            ($1 <> '' or $2 <> '')
            and exists (
              select 1
              from jsonb_array_elements(
                case
                  when jsonb_typeof(w.family_members) = 'array' then w.family_members
                  else '[]'::jsonb
                end
              ) member
              where ($1 <> '' and lower(coalesce(member->>'email', '')) = $1)
                or ($2 <> '' and regexp_replace(coalesce(member->>'phone', ''), '\\D', '', 'g') = $2)
            )
          )
      ),
      waiver_people as (
        select
          lower(coalesce(w.primary_participant->>'email', '')) as email,
          regexp_replace(coalesce(w.primary_participant->>'phone', ''), '\\D', '', 'g') as phone,
          lower(coalesce(
            w.primary_participant->>'firstName',
            w.primary_participant->>'first_name',
            split_part(coalesce(w.primary_participant->>'name', ''), ' ', 1),
            ''
          )) as first_name,
          lower(coalesce(
            w.primary_participant->>'lastName',
            w.primary_participant->>'last_name',
            nullif(regexp_replace(coalesce(w.primary_participant->>'name', ''), '^\\S+\\s*', ''), ''),
            ''
          )) as last_name
        from matched_waivers w

        union all

        select
          lower(coalesce(member->>'email', w.primary_participant->>'email', '')) as email,
          regexp_replace(coalesce(member->>'phone', w.primary_participant->>'phone', ''), '\\D', '', 'g') as phone,
          lower(coalesce(
            member->>'firstName',
            member->>'first_name',
            split_part(coalesce(member->>'name', ''), ' ', 1),
            ''
          )) as first_name,
          lower(coalesce(
            member->>'lastName',
            member->>'last_name',
            nullif(regexp_replace(coalesce(member->>'name', ''), '^\\S+\\s*', ''), ''),
            ''
          )) as last_name
        from matched_waivers w
        cross join lateral jsonb_array_elements(
          case
            when jsonb_typeof(w.family_members) = 'array' then w.family_members
            else '[]'::jsonb
          end
        ) member
      ),
      matched_people as (
        select distinct *
        from waiver_people
        where ($1 <> '' and email = $1)
          or ($2 <> '' and phone = $2)
      ),
      candidate_players as (
        select distinct p."PlayerID" as player_id
        from public."Players" p
        where ($1 <> '' and lower(coalesce(p."email", '')) = $1)
          or ($3 <> '' and p."PlayerID"::text = $3)
          or (
            $4 <> ''
            and (
              lower(trim(concat(coalesce(p."FirstName", ''), ' ', coalesce(p."LastName", '')))) like $5
              or lower(coalesce(p."FirstName", '')) like $5
              or lower(coalesce(p."LastName", '')) like $5
            )
          )
          or lower(coalesce(p."email", '')) in (
            select email from matched_people where email <> ''
          )
          or exists (
            select 1
            from matched_people mp
            where mp.first_name <> ''
              and lower(coalesce(p."FirstName", '')) = mp.first_name
              and (
                mp.last_name = ''
                or lower(trim(coalesce(p."LastName", ''))) = mp.last_name
              )
          )
      )
      select distinct
        p."PlayerID" as player_id,
        p."FirstName" as first_name,
        p."LastName" as last_name,
        p."email" as email,
        coalesce(scorecard.lifetime_points, 0)::integer as lifetime_points,
        coalesce(scorecard.repeat_visits, 0)::integer as repeat_visits,
        coalesce(scorecard.score_events, 0)::integer as score_events,
        scorecard.last_score_at,
        current_level.level_number as current_level,
        current_level.threshold_points as current_threshold,
        current_level.reward_name as current_reward_name,
        current_level.reward_type as current_reward_type,
        next_level.level_number as next_level,
        next_level.threshold_points as next_threshold,
        next_level.reward_name as next_reward_name,
        next_level.reward_type as next_reward_type
      from candidate_players cp
      join public."Players" p on p."PlayerID" = cp.player_id
      left join lateral (
        select
          coalesce(scoreboard.scoreboard_points, 0) + coalesce(adjustments.adjustment_points, 0) as lifetime_points,
          coalesce(scoreboard.repeat_visits, 0) as repeat_visits,
          coalesce(scoreboard.score_events, 0) as score_events,
          scoreboard.last_score_at
        from (
          select
            coalesce(sum(coalesce(ps."Points", 0)), 0) as scoreboard_points,
            count(distinct coalesce(ps."StartTime", ps."createdAt")::date) as repeat_visits,
            count(*) as score_events,
            max(coalesce(ps."EndTime", ps."StartTime", ps."createdAt")) as last_score_at
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
      order by lifetime_points desc, p."PlayerID" desc
      limit 10
    `,
    [email.includes("@") ? email : "", phone, playerId, nameSearch, `%${nameSearch}%`],
  );

  const playerIds = matchedPlayers.rows.map((player) => Number(player.player_id));
  const rewardsByPlayer = new Map();

  if (playerIds.length) {
    await unlockRewardsForPlayers(playerIds);

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
      scoreEvents: Number(player.score_events || 0),
      lastScoreAt: iso(player.last_score_at),
      currentLevel: normalizeLevel(player, "current"),
      nextLevel: normalizeLevel(player, "next"),
      availableRewards: rewardsByPlayer.get(playerId) || [],
    };
  });

  const memberResult = await query(
    `
      select
        rm.*,
        next_level.level_number as next_level,
        next_level.threshold_points as next_threshold,
        next_level.reward_name as next_reward_name,
        next_level.reward_type as next_reward_type
      from reward_members rm
      left join lateral (
        select *
        from reward_levels rl
        where rl.active = true
        order by rl.threshold_points asc
        limit 1
      ) next_level on true
      where ($1 <> '' and lower(rm.email) = $1)
        or ($2 <> '' and regexp_replace(coalesce(rm.phone, ''), '\\D', '', 'g') = $2)
      order by rm.updated_at desc nulls last
      limit 10
    `,
    [email.includes("@") ? email : "", phone],
  );

  const existingNames = new Set(players.map((player) => player.fullName.toLowerCase()));
  const existingEmails = new Set(matchedPlayers.rows.map((player) => normalizeEmail(player.email)).filter(Boolean));

  for (const member of memberResult.rows) {
    const memberEmail = normalizeEmail(member.email);
    const memberName = String(member.full_name || "").toLowerCase();
    if ((memberEmail && existingEmails.has(memberEmail)) || (memberName && existingNames.has(memberName))) {
      continue;
    }
    players.push(normalizeMemberPlayer(member));
  }

  setCachedLookup(cacheKey, players);
  return players;
}
