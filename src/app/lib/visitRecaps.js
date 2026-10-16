import crypto from "node:crypto";
import { getPostgresPool, query } from "@/lib/postgres";
import { summarizeVisit } from "./visitRecapSummary.mjs";

let tableReady;
function ensureTable() {
  if (!tableReady) {
    tableReady = query(`
      create table if not exists visit_recaps (
        token_hash text primary key,
        summary jsonb not null,
        created_at timestamptz not null default now(),
        expires_at timestamptz not null default (now() + interval '90 days')
      )
    `).catch((error) => { tableReady = null; throw error; });
  }
  return tableReady;
}

const hash = (token) => crypto.createHash("sha256").update(token).digest("hex");

// Freeze the completed visit at send time: a later visit cannot change an old email's results.
export async function createVisitRecap(email) {
  if (!getPostgresPool()) return null;
  const { rows } = await query(`
    with completed_sessions as (
      select wt."WristbandTranID" as session_id, wt."PlayerID" as player_id,
        p."FirstName" as first_name,
        (coalesce(wt."playerStartTime", wt."WristbandTranDate") at time zone 'America/Toronto')::date as visit_date
      from public."WristbandTrans" wt
      join public."Players" p on p."PlayerID" = wt."PlayerID"
      where lower(trim(coalesce(p.email, ''))) = $1
        and wt."playerEndTime" <= now()
    ), latest_visit as (
      select max(visit_date) as visit_date from completed_sessions
    )
    select cs.player_id, cs.first_name, cs.visit_date::text,
      ps."ScoreID" as score_id, ps."GameID" as game_id,
      ps."Points" as points, g."gameName" as game_name
    from completed_sessions cs
    join latest_visit lv on lv.visit_date = cs.visit_date
    left join public."PlayerScores" ps on ps."WristbandTranID" = cs.session_id
      and ps."PlayerID" = cs.player_id
    left join public."Games" g on g."GameID" = ps."GameID"
    order by cs.player_id, ps."ScoreID"
  `, [String(email).trim().toLowerCase()]);
  const summary = summarizeVisit(rows);
  await ensureTable();
  const token = crypto.randomBytes(32).toString("hex");
  await query("insert into visit_recaps (token_hash, summary) values ($1, $2::jsonb)", [hash(token), JSON.stringify(summary)]);
  return { summary, url: `https://pixelpulseplay.ca/visit/${token}?utm_source=post_visit&utm_medium=email&utm_campaign=thank_you#scores` };
}

export async function getVisitRecap(token) {
  if (!/^[a-f0-9]{64}$/.test(token || "") || !getPostgresPool()) return null;
  await ensureTable();
  const { rows } = await query("select summary from visit_recaps where token_hash = $1 and expires_at > now()", [hash(token)]);
  return rows[0]?.summary || null;
}
