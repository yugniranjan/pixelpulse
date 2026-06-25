import { getPostgresPool, query } from "@/lib/postgres";

const DEFAULT_AVERAGE_VISIT_POINTS = Number(process.env.REWARD_AVG_VISIT_POINTS || 1000);

const DEFAULT_LEVELS = [
  [1, 3, "Pixel Pulse starter reward", "starter"],
  [2, 5, "Merchandise item", "merch"],
  [3, 8, "60-minute visit pass", "play_pass"],
  [4, 12, "Pixel Pulse water bottle", "merch"],
  [5, 18, "Store credit reward", "store_credit"],
  [6, 25, "80-minute visit pass", "play_pass"],
  [7, 35, "Premium merchandise", "merch"],
  [8, 50, "VIP rewards bundle", "vip_bundle"],
  [9, 75, "Birthday party reward", "birthday_party"],
].map(([levelNumber, multiplier, rewardName, rewardType]) => ({
  levelNumber,
  thresholdPoints: Math.round(DEFAULT_AVERAGE_VISIT_POINTS * multiplier),
  rewardName,
  rewardType,
}));

let tablesReady = false;

export function hasPostgres() {
  return Boolean(getPostgresPool());
}

function iso(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

export async function ensureRewardsTables() {
  if (tablesReady) return;

  await query(`
    create table if not exists reward_levels (
      level_number integer primary key,
      threshold_points integer not null,
      reward_name text not null,
      reward_type text not null,
      active boolean not null default true,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `);
  await query(`
    create table if not exists reward_point_ledger (
      id uuid primary key default gen_random_uuid(),
      player_id bigint not null,
      source_score_id text,
      source_type text not null default 'scoreboard',
      points_delta integer not null,
      reason text,
      location_id integer,
      earned_at timestamptz not null default now(),
      created_at timestamptz not null default now(),
      raw jsonb not null default '{}'::jsonb
    )
  `);
  await query(`
    create unique index if not exists reward_point_ledger_source_score_idx
      on reward_point_ledger (source_score_id)
      where source_score_id is not null
  `);
  await query(`
    create index if not exists reward_point_ledger_player_idx
      on reward_point_ledger (player_id, earned_at desc)
  `);
  await query(`
    create index if not exists reward_point_ledger_earned_idx
      on reward_point_ledger (earned_at desc)
  `);
  await query(`
    create table if not exists reward_redemptions (
      id uuid primary key default gen_random_uuid(),
      player_id bigint not null,
      level_number integer not null references reward_levels(level_number),
      reward_name text not null,
      status text not null default 'available',
      unlocked_at timestamptz not null default now(),
      redeemed_at timestamptz,
      redeemed_by text,
      expires_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique (player_id, level_number)
    )
  `);
  await query(`
    create index if not exists reward_redemptions_player_idx
      on reward_redemptions (player_id, status, unlocked_at desc)
  `);

  for (const level of DEFAULT_LEVELS) {
    await query(
      `
        insert into reward_levels (level_number, threshold_points, reward_name, reward_type)
        values ($1, $2, $3, $4)
        on conflict (level_number) do nothing
      `,
      [level.levelNumber, level.thresholdPoints, level.rewardName, level.rewardType],
    );
  }

  tablesReady = true;
}

function normalizeLevel(row = {}) {
  if (!row?.level_number) return null;
  return {
    levelNumber: Number(row.level_number),
    thresholdPoints: Number(row.threshold_points || 0),
    rewardName: row.reward_name || "",
    rewardType: row.reward_type || "",
  };
}

function normalizeRedemption(row = {}) {
  return {
    id: row.id,
    playerId: Number(row.player_id),
    levelNumber: Number(row.level_number),
    rewardName: row.reward_name || "",
    status: row.status || "available",
    unlockedAt: iso(row.unlocked_at),
    redeemedAt: iso(row.redeemed_at),
    redeemedBy: row.redeemed_by || "",
    expiresAt: iso(row.expires_at),
  };
}

function normalizeLedger(row = {}) {
  return {
    id: row.id,
    playerId: Number(row.player_id),
    sourceScoreId: row.source_score_id || "",
    sourceType: row.source_type || "",
    pointsDelta: Number(row.points_delta || 0),
    reason: row.reason || "",
    locationId: row.location_id,
    earnedAt: iso(row.earned_at),
    createdAt: iso(row.created_at),
  };
}

function normalizeRewardPlayer(row = {}) {
  return {
    playerId: Number(row.player_id),
    firstName: row.first_name || "",
    lastName: row.last_name || "",
    fullName: row.full_name || `Player ${row.player_id}`,
    email: row.email || "",
    locationId: row.location_id,
    lifetimePoints: Number(row.lifetime_points || 0),
    currentLevel: row.current_level ? normalizeLevel({
      level_number: row.current_level,
      threshold_points: row.current_threshold,
      reward_name: row.current_reward_name,
      reward_type: row.current_reward_type,
    }) : null,
    nextLevel: row.next_level ? normalizeLevel({
      level_number: row.next_level,
      threshold_points: row.next_threshold,
      reward_name: row.next_reward_name,
      reward_type: row.next_reward_type,
    }) : null,
    availableRewards: Number(row.available_rewards || 0),
    redeemedRewards: Number(row.redeemed_rewards || 0),
    lastEarnedAt: iso(row.last_earned_at),
  };
}

export async function unlockRewardsForPlayer(playerId) {
  if (!hasPostgres() || !playerId) return;

  await ensureRewardsTables();

  await query(
    `
      insert into reward_redemptions (
        player_id,
        level_number,
        reward_name,
        expires_at
      )
      select
        $1::bigint,
        rl.level_number,
        rl.reward_name,
        now() + interval '90 days'
      from reward_levels rl
      where rl.active = true
        and rl.threshold_points <= (
          select
            coalesce((
              select sum(coalesce(ps."Points", 0))
              from public."PlayerScores" ps
              where ps."PlayerID" = $1::integer
            ), 0)
            +
            coalesce((
              select sum(rpl.points_delta)
              from reward_point_ledger rpl
              where rpl.player_id = $1::bigint
                and coalesce(rpl.source_type, '') <> 'scoreboard'
            ), 0)
        )
      on conflict (player_id, level_number) do nothing
    `,
    [playerId],
  );
}

export async function listRewardPlayers({ search = "", limit = 100 } = {}) {
  if (!hasPostgres()) return [];

  await ensureRewardsTables();

  const q = `%${String(search || "").trim().toLowerCase()}%`;
  const result = await query(
    `
      with scoreboard as (
        select
          ps."PlayerID" as player_id,
          coalesce(sum(coalesce(ps."Points", 0)), 0)::integer as scoreboard_points,
          max(coalesce(ps."EndTime", ps."StartTime", ps."createdAt")) as last_earned_at
        from public."PlayerScores" ps
        group by ps."PlayerID"
      ),
      manual_adjustments as (
        select
          rpl.player_id,
          coalesce(sum(rpl.points_delta), 0)::integer as adjustment_points,
          max(rpl.earned_at) as last_adjustment_at
        from reward_point_ledger rpl
        where coalesce(rpl.source_type, '') <> 'scoreboard'
        group by rpl.player_id
      ),
      point_totals as (
        select
          coalesce(scoreboard.player_id, manual_adjustments.player_id) as player_id,
          coalesce(scoreboard.scoreboard_points, 0) + coalesce(manual_adjustments.adjustment_points, 0) as lifetime_points,
          nullif(
            greatest(
              coalesce(scoreboard.last_earned_at, 'epoch'::timestamptz),
              coalesce(manual_adjustments.last_adjustment_at, 'epoch'::timestamptz)
            ),
            'epoch'::timestamptz
          ) as last_earned_at
        from scoreboard
        full outer join manual_adjustments
          on manual_adjustments.player_id = scoreboard.player_id
      )
      select
        pt.player_id,
        pt.lifetime_points,
        pt.last_earned_at,
        p."FirstName" as first_name,
        p."LastName" as last_name,
        trim(concat(coalesce(p."FirstName", ''), ' ', coalesce(p."LastName", ''))) as full_name,
        p.email,
        p."LocationID" as location_id,
        current_level.level_number as current_level,
        current_level.threshold_points as current_threshold,
        current_level.reward_name as current_reward_name,
        current_level.reward_type as current_reward_type,
        next_level.level_number as next_level,
        next_level.threshold_points as next_threshold,
        next_level.reward_name as next_reward_name,
        next_level.reward_type as next_reward_type,
        coalesce(reward_counts.available_rewards, 0)::integer as available_rewards,
        coalesce(reward_counts.redeemed_rewards, 0)::integer as redeemed_rewards
      from point_totals pt
      left join public."Players" p on p."PlayerID" = pt.player_id
      left join lateral (
        select *
        from reward_levels rl
        where rl.active = true and rl.threshold_points <= pt.lifetime_points
        order by rl.threshold_points desc
        limit 1
      ) current_level on true
      left join lateral (
        select *
        from reward_levels rl
        where rl.active = true and rl.threshold_points > pt.lifetime_points
        order by rl.threshold_points asc
        limit 1
      ) next_level on true
      left join lateral (
        select
          count(*) filter (where status = 'available') as available_rewards,
          count(*) filter (where status = 'redeemed') as redeemed_rewards
        from reward_redemptions rr
        where rr.player_id = pt.player_id
      ) reward_counts on true
      where $2 = ''
        or lower(coalesce(p."FirstName", '')) like $3
        or lower(coalesce(p."LastName", '')) like $3
        or lower(coalesce(p.email, '')) like $3
        or pt.player_id::text = $2
      order by pt.lifetime_points desc, pt.last_earned_at desc nulls last
      limit $1
    `,
    [Math.min(Number(limit) || 100, 500), String(search || "").trim().toLowerCase(), q],
  );

  return result.rows.map(normalizeRewardPlayer);
}

export async function getRewardPlayer(playerId) {
  if (!hasPostgres() || !playerId) return null;

  await ensureRewardsTables();
  await unlockRewardsForPlayer(playerId);

  const players = await listRewardPlayers({ search: String(playerId), limit: 1 });
  const player = players.find((item) => item.playerId === Number(playerId)) || {
    playerId: Number(playerId),
    fullName: `Player ${playerId}`,
    lifetimePoints: 0,
  };

  const [ledger, redemptions, levels] = await Promise.all([
    query(
      `
        select *
        from reward_point_ledger
        where player_id = $1
        order by earned_at desc
        limit 50
      `,
      [playerId],
    ),
    query(
      `
        select *
        from reward_redemptions
        where player_id = $1
        order by level_number asc
      `,
      [playerId],
    ),
    query(
      `
        select *
        from reward_levels
        where active = true
        order by level_number asc
      `,
    ),
  ]);

  return {
    ...player,
    ledger: ledger.rows.map(normalizeLedger),
    redemptions: redemptions.rows.map(normalizeRedemption),
    levels: levels.rows.map(normalizeLevel),
  };
}

export async function addRewardLedgerEntry({
  playerId,
  pointsDelta,
  reason = "",
  sourceType = "manual_adjustment",
  sourceScoreId = null,
  locationId = null,
  earnedAt = new Date(),
  raw = {},
}) {
  if (!hasPostgres() || !playerId || !Number.isFinite(Number(pointsDelta))) {
    return null;
  }

  await ensureRewardsTables();

  const result = await query(
    `
      insert into reward_point_ledger (
        player_id,
        source_score_id,
        source_type,
        points_delta,
        reason,
        location_id,
        earned_at,
        raw
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
      on conflict (source_score_id) where source_score_id is not null do nothing
      returning *
    `,
    [
      playerId,
      sourceScoreId || null,
      sourceType || "manual_adjustment",
      Math.trunc(Number(pointsDelta)),
      reason || null,
      locationId || null,
      earnedAt ? new Date(earnedAt) : new Date(),
      JSON.stringify(raw || {}),
    ],
  );

  await unlockRewardsForPlayer(playerId);
  return result.rows[0] ? normalizeLedger(result.rows[0]) : null;
}

export async function setRewardRedemptionStatus({ id, status, redeemedBy = "" }) {
  if (!hasPostgres() || !id || !["available", "redeemed", "void"].includes(status)) {
    return null;
  }

  await ensureRewardsTables();

  const result = await query(
    `
      update reward_redemptions
      set status = $2,
          redeemed_at = case when $2 = 'redeemed' then now() else null end,
          redeemed_by = case when $2 = 'redeemed' then $3 else null end,
          updated_at = now()
      where id = $1
      returning *
    `,
    [id, status, redeemedBy || null],
  );

  return result.rows[0] ? normalizeRedemption(result.rows[0]) : null;
}

export async function getRewardStats() {
  if (!hasPostgres()) {
    return { players: 0, lifetimePoints: 0, availableRewards: 0, redeemedRewards: 0 };
  }

  await ensureRewardsTables();

  const result = await query(`
    select
      (
        select count(distinct source.player_id)
        from (
          select ps."PlayerID" as player_id
          from public."PlayerScores" ps
          union
          select rpl.player_id
          from reward_point_ledger rpl
          where coalesce(rpl.source_type, '') <> 'scoreboard'
        ) source
      )::integer as players,
      (
        coalesce((select sum(coalesce(ps."Points", 0)) from public."PlayerScores" ps), 0)
        +
        coalesce((
          select sum(rpl.points_delta)
          from reward_point_ledger rpl
          where coalesce(rpl.source_type, '') <> 'scoreboard'
        ), 0)
      )::integer as lifetime_points,
      (select count(*) from reward_redemptions where status = 'available')::integer as available_rewards,
      (select count(*) from reward_redemptions where status = 'redeemed')::integer as redeemed_rewards
  `);

  const row = result.rows[0] || {};
  return {
    players: Number(row.players || 0),
    lifetimePoints: Number(row.lifetime_points || 0),
    availableRewards: Number(row.available_rewards || 0),
    redeemedRewards: Number(row.redeemed_rewards || 0),
  };
}
