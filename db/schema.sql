create extension if not exists pgcrypto;

create table if not exists blogs (
  id text primary key,
  title text not null default '',
  content jsonb,
  featured_image text,
  status text not null default 'published',
  meta_description text,
  created_at timestamptz,
  updated_at timestamptz,
  raw jsonb not null default '{}'::jsonb
);

create index if not exists blogs_created_at_idx on blogs (created_at desc);
create index if not exists blogs_status_idx on blogs (status);

create table if not exists waivers (
  id text primary key,
  primary_participant jsonb not null default '{}'::jsonb,
  family_members jsonb not null default '[]'::jsonb,
  visit jsonb not null default '{}'::jsonb,
  checks jsonb not null default '{}'::jsonb,
  attractions jsonb not null default '[]'::jsonb,
  signature_data_url text,
  participant_count integer not null default 1,
  primary_name text,
  source text,
  user_agent text,
  submitted_at timestamptz,
  updated_at timestamptz,
  raw jsonb not null default '{}'::jsonb
);

create index if not exists waivers_submitted_at_idx on waivers (submitted_at desc);
create index if not exists waivers_visit_date_idx on waivers ((visit->>'visitDate'));
create index if not exists waivers_party_id_idx on waivers ((visit->>'partyId'));

create table if not exists admins (
  id text primary key,
  email text not null unique,
  password_hash text not null,
  role text not null default 'admin',
  active boolean not null default true,
  created_at timestamptz,
  updated_at timestamptz,
  raw jsonb not null default '{}'::jsonb
);

create table if not exists invites (
  slug text primary key,
  active boolean not null default true,
  child_name text,
  title text,
  date text,
  time text,
  waiver_link text,
  invite_url text,
  sms_text text,
  created_at timestamptz,
  updated_at timestamptz,
  raw jsonb not null default '{}'::jsonb
);

create index if not exists invites_active_idx on invites (active);

create table if not exists party_waivers (
  party_id text primary key,
  primary_participant text,
  visit_date text,
  visit_time text,
  pass_type text,
  created_at timestamptz,
  updated_at timestamptz,
  raw jsonb not null default '{}'::jsonb
);

-- Children per customer, imported from the LilYPad "Customer Emails By Sales"
-- report (scripts/sales-children-import). Used as a last-resort fallback for a
-- party host's child on the Party Hosts roster.
create table if not exists customer_children (
  email text primary key,
  child_names text not null default '',
  child_ages text not null default '',
  source text not null default '',
  updated_at timestamptz
);

create table if not exists party_bookings (
  id text primary key,
  customer_name text not null default '',
  phone text,
  email text,
  child_name text,
  child_age text,
  package text,
  party_id text,
  party_size integer,
  booking_date text not null,
  start_time text not null,
  end_time text not null,
  start_minutes integer not null,
  end_minutes integer not null,
  duration_minutes integer not null,
  status text not null default 'confirmed',
  notes text,
  created_by text,
  created_at timestamptz,
  updated_at timestamptz,
  raw jsonb not null default '{}'::jsonb
);

create index if not exists party_bookings_date_idx on party_bookings (booking_date);
create index if not exists party_bookings_status_idx on party_bookings (status);
create index if not exists party_bookings_party_id_idx on party_bookings (party_id);

-- Squad friend referrals. One row per invited friend (keyed by referrer +
-- friend email). A referral starts 'pending' and is marked 'confirmed' in admin
-- once the friend actually visits/redeems their unique promo code. Award tiers
-- (5/10/20) are computed from the count of confirmed referrals per referrer.
create table if not exists squad_referrals (
  id text primary key,
  referrer_name text,
  referrer_email text not null,
  friend_name text,
  friend_email text not null,
  promo_code text not null,
  status text not null default 'pending',
  source text,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  raw jsonb not null default '{}'::jsonb,
  unique (referrer_email, friend_email)
);

create index if not exists squad_referrals_referrer_idx on squad_referrals (referrer_email);
create index if not exists squad_referrals_status_idx on squad_referrals (status);
create unique index if not exists squad_referrals_promo_code_idx on squad_referrals (promo_code);

-- Level Up Rewards. Scoreboard/game events should be copied into the ledger
-- once, keyed by source_score_id where available. Levels are calculated from
-- lifetime ledger points; redeeming a reward does not subtract level status.
create table if not exists reward_levels (
  level_number integer primary key,
  threshold_points integer not null,
  reward_name text not null,
  reward_type text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
);

create unique index if not exists reward_point_ledger_source_score_idx
  on reward_point_ledger (source_score_id)
  where source_score_id is not null;
create index if not exists reward_point_ledger_player_idx
  on reward_point_ledger (player_id, earned_at desc);
create index if not exists reward_point_ledger_earned_idx
  on reward_point_ledger (earned_at desc);

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
);

create index if not exists reward_redemptions_player_idx
  on reward_redemptions (player_id, status, unlocked_at desc);
