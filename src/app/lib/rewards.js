import { getPostgresPool, query } from "@/lib/postgres";
import crypto from "crypto";

const DEFAULT_LEVELS = [
  [1, 5_000, "10 Arcade Credits", "arcade_credits"],
  [2, 12_000, "20 Arcade Credits", "arcade_credits"],
  [3, 20_000, "Free Slushie or Snack", "snack"],
  [4, 35_000, "30 Bonus Minutes (Weekday Only)", "bonus_minutes"],
  [5, 50_000, "FREE VR Game 30 mins", "vr_game"],
  [6, 70_000, "Friend Pass (Bring a Friend for 30 mins)", "friend_pass"],
  [7, 90_000, "Free Upgrade to 90-Min Pass", "upgrade"],
  [8, 120_000, "FREE 60-Minute Pass", "play_pass"],
  [9, 160_000, "FREE 90-Minute Pass", "play_pass"],
  [10, 250_000, "Pixel Pulse VIP Member", "vip_status"],
].map(([levelNumber, thresholdPoints, rewardName, rewardType]) => ({
  levelNumber,
  thresholdPoints,
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
  await query(`
    create index if not exists player_scores_player_idx
      on public."PlayerScores" ("PlayerID")
  `);
  await query(`
    create index if not exists players_email_lower_idx
      on public."Players" (lower(coalesce("email", '')))
  `);
  await query(`
    create index if not exists players_first_name_lower_idx
      on public."Players" (lower(coalesce("FirstName", '')))
  `);
  await query(`
    create index if not exists players_last_name_lower_idx
      on public."Players" (lower(coalesce("LastName", '')))
  `);
  await query(`
    create table if not exists reward_members (
      id bigserial primary key,
      full_name text not null,
      email text not null,
      phone text,
      age integer,
      email_verified boolean not null default false,
      email_verified_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      raw jsonb not null default '{}'::jsonb
    )
  `);
  await query(`
    create unique index if not exists reward_members_email_lower_idx
      on reward_members (lower(email))
  `);
  await query(`
    create index if not exists reward_members_phone_idx
      on reward_members (phone)
  `);
  await query(`
    create table if not exists reward_email_verifications (
      id uuid primary key default gen_random_uuid(),
      member_id bigint not null references reward_members(id) on delete cascade,
      email text not null,
      code_hash text not null,
      expires_at timestamptz not null,
      consumed_at timestamptz,
      created_at timestamptz not null default now()
    )
  `);
  await query(`
    create index if not exists reward_email_verifications_member_idx
      on reward_email_verifications (member_id, created_at desc)
  `);

  for (const level of DEFAULT_LEVELS) {
    await query(
      `
        insert into reward_levels (level_number, threshold_points, reward_name, reward_type)
        values ($1, $2, $3, $4)
        on conflict (level_number) do update set
          threshold_points = excluded.threshold_points,
          reward_name = excluded.reward_name,
          reward_type = excluded.reward_type,
          active = true,
          updated_at = now()
      `,
      [level.levelNumber, level.thresholdPoints, level.rewardName, level.rewardType],
    );
  }

  tablesReady = true;
}

function normalizePhone(value = "") {
  return String(value || "").replace(/\D/g, "");
}

function normalizeEmail(value = "") {
  return String(value || "").trim().toLowerCase();
}

function hashVerificationCode(code = "") {
  return crypto.createHash("sha256").update(String(code)).digest("hex");
}

function normalizeRewardMember(row = {}) {
  return {
    id: Number(row.id || 0),
    fullName: row.full_name || "",
    email: row.email || "",
    phone: row.phone || "",
    age: row.age === null || row.age === undefined ? null : Number(row.age),
    emailVerified: Boolean(row.email_verified),
    emailVerifiedAt: iso(row.email_verified_at),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

export async function registerRewardMember({ fullName = "", email = "", phone = "", age = null } = {}) {
  if (!hasPostgres()) {
    const error = new Error("Rewards registration is not available right now.");
    error.status = 503;
    throw error;
  }

  await ensureRewardsTables();

  const cleanName = String(fullName || "").replace(/\s+/g, " ").trim();
  const cleanEmail = normalizeEmail(email);
  const cleanPhone = String(phone || "").trim();
  const cleanAge = Number(age);

  if (!cleanName || cleanName.length < 2) {
    const error = new Error("Please enter your name.");
    error.status = 400;
    throw error;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    const error = new Error("Please enter a valid email address.");
    error.status = 400;
    throw error;
  }

  if (!Number.isInteger(cleanAge) || cleanAge < 1 || cleanAge > 120) {
    const error = new Error("Please enter a valid age.");
    error.status = 400;
    throw error;
  }

  if (cleanPhone && normalizePhone(cleanPhone).length < 7) {
    const error = new Error("Please enter a valid phone number or leave it blank.");
    error.status = 400;
    throw error;
  }

  const result = await query(
    `
      insert into reward_members (full_name, email, phone, age, raw)
      values ($1, $2, $3, $4, $5::jsonb)
      on conflict (lower(email)) do update set
        full_name = excluded.full_name,
        phone = coalesce(nullif(excluded.phone, ''), reward_members.phone),
        age = excluded.age,
        updated_at = now(),
        raw = reward_members.raw || excluded.raw
      returning *
    `,
    [
      cleanName,
      cleanEmail,
      cleanPhone || null,
      cleanAge,
      JSON.stringify({ source: "level-up-rewards", registeredAt: new Date().toISOString() }),
    ],
  );

  return normalizeRewardMember(result.rows[0]);
}

export async function createRewardEmailVerification(memberId, email) {
  if (!hasPostgres() || !memberId || !email) return null;

  await ensureRewardsTables();

  const code = String(crypto.randomInt(100000, 1000000));
  const result = await query(
    `
      insert into reward_email_verifications (member_id, email, code_hash, expires_at)
      values ($1, $2, $3, now() + interval '30 minutes')
      returning id, expires_at
    `,
    [memberId, normalizeEmail(email), hashVerificationCode(code)],
  );

  return {
    id: result.rows[0]?.id || "",
    code,
    expiresAt: iso(result.rows[0]?.expires_at),
  };
}

export async function verifyRewardMemberEmail({ email = "", code = "" } = {}) {
  if (!hasPostgres()) {
    const error = new Error("Rewards verification is not available right now.");
    error.status = 503;
    throw error;
  }

  await ensureRewardsTables();

  const cleanEmail = normalizeEmail(email);
  const cleanCode = String(code || "").trim();

  if (!cleanEmail || !cleanCode) {
    const error = new Error("Enter the email and verification code.");
    error.status = 400;
    throw error;
  }

  const result = await query(
    `
      with latest as (
        select *
        from reward_email_verifications
        where lower(email) = $1
          and consumed_at is null
          and expires_at > now()
        order by created_at desc
        limit 1
      ),
      consumed as (
        update reward_email_verifications rev
        set consumed_at = now()
        from latest
        where rev.id = latest.id
          and latest.code_hash = $2
        returning rev.member_id
      )
      update reward_members rm
      set email_verified = true,
          email_verified_at = now(),
          updated_at = now()
      from consumed
      where rm.id = consumed.member_id
      returning rm.*
    `,
    [cleanEmail, hashVerificationCode(cleanCode)],
  );

  if (!result.rows[0]) {
    const error = new Error("That verification code is invalid or expired.");
    error.status = 400;
    throw error;
  }

  return normalizeRewardMember(result.rows[0]);
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
  await unlockRewardsForPlayers([playerId]);
}

export async function unlockRewardsForPlayers(playerIds = []) {
  const cleanPlayerIds = [...new Set(
    (Array.isArray(playerIds) ? playerIds : [playerIds])
      .map((playerId) => Number(playerId))
      .filter((playerId) => Number.isInteger(playerId) && playerId > 0),
  )];

  if (!hasPostgres() || !cleanPlayerIds.length) return;

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
        player_points.player_id::bigint,
        rl.level_number,
        rl.reward_name,
        now() + interval '90 days'
      from (
        select
          player_id,
          coalesce(scoreboard_points, 0) + coalesce(adjustment_points, 0) as lifetime_points
        from (
          select
            ids.player_id,
            (
              select coalesce(sum(coalesce(ps."Points", 0)), 0)
              from public."PlayerScores" ps
              where ps."PlayerID" = ids.player_id::integer
            ) as scoreboard_points,
            (
              select coalesce(sum(rpl.points_delta), 0)
              from reward_point_ledger rpl
              where rpl.player_id = ids.player_id::bigint
                and coalesce(rpl.source_type, '') <> 'scoreboard'
            ) as adjustment_points
          from unnest($1::bigint[]) as ids(player_id)
        ) totals
      ) player_points
      join reward_levels rl on rl.active = true
        and rl.threshold_points <= player_points.lifetime_points
      on conflict (player_id, level_number) do nothing
    `,
    [cleanPlayerIds],
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
