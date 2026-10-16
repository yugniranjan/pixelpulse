import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL, fileURLToPath } from 'node:url';
import test from 'node:test';
import { summarizeVisit, getPlayerStandings } from '../src/app/lib/visitRecapSummary.mjs';
const importSource = (source) => import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const base=fileURLToPath(new URL('../src/app/lib/', import.meta.url));
test('leaderboard crowns the highest scored players and handles ties and missing scores', () => {
  const players = [
    { name: 'Sam', points: 250, challenges: 2 },
    { name: 'No score', points: 0, challenges: 0 },
    { name: 'Alex', points: 500, challenges: 3 },
    { name: 'Taylor', points: 500, challenges: 4 },
  ];
  const standings = getPlayerStandings(players);
  assert.deepEqual(standings.map(p => p.name), ['Alex', 'Taylor', 'Sam', 'No score']);
  assert.deepEqual(standings.map(p => p.rank), [1, 1, 3, null]);
  assert.deepEqual(standings.filter(p => p.isWinner).map(p => p.winnerLabel), ['Joint winner', 'Joint winner']);
  assert.equal(getPlayerStandings(players.slice(0, 2))[0].winnerLabel, 'Winner');
  assert.equal(getPlayerStandings([{points: 0, challenges: 0}])[0].isWinner, false);
  assert.equal(getPlayerStandings([{points: 0, challenges: 1}])[0].isWinner, true);
  assert.equal(getPlayerStandings([{points: 0, challenges: 0}, {points: -10, challenges: 1}])[0].isWinner, true);
  assert.deepEqual(getPlayerStandings(), []);
  assert.equal(players[0].name, 'Sam');
});
test('visit recaps aggregate session scores and protect recipient links', async () => {
const rows=[
 {player_id:1,first_name:'Alex',visit_date:'2026-10-15',score_id:10,game_id:1,game_name:'Floor Challenge',points:120},
 {player_id:1,first_name:'Alex',visit_date:'2026-10-15',score_id:11,game_id:1,game_name:'Floor Challenge',points:200},
 {player_id:2,first_name:'Sam',visit_date:'2026-10-15',score_id:12,game_id:2,game_name:'Shoot It Out',points:90},
 {player_id:3,first_name:'Taylor',visit_date:'2026-10-15',score_id:null},
];
const summary=summarizeVisit(rows);
assert.equal(summary.totalPoints,410);
assert.equal(summary.challengesPlayed,3);
assert.equal(summary.gamesExplored,2);
assert.deepEqual(summary.bestScore,{points:200,game:'Floor Challenge',player:'Alex'});
assert.equal(summary.players.length,3);
assert.equal(summary.games[0].plays,2);
assert.equal(summary.players[2].challenges,0);
assert.equal(summarizeVisit([]).bestScore,null);
assert.equal(summarizeVisit([{player_id:1,score_id:1,game_id:1,points:0}]).challengesPlayed,1);
assert.equal(summarizeVisit([{player_id:1,score_id:1,game_id:1,points:-5}]).bestScore.points,-5);
let calls=[];
globalThis.recapDb={getPostgresPool:()=>({}),query:async(sql,values)=>{calls.push({sql,values});if(sql.includes('completed_sessions'))return {rows};if(sql.startsWith('select summary'))return {rows:[{summary}]};return {rows:[]}}};
const src=(await readFile(base+'visitRecaps.js','utf8')).replace('import { getPostgresPool, query } from "@/lib/postgres";', 'const { getPostgresPool, query } = globalThis.recapDb;').replace('"./visitRecapSummary.mjs"',JSON.stringify(pathToFileURL(base+'visitRecapSummary.mjs').href));
const db=await importSource(src);
const recap=await db.createVisitRecap(' ALEX@EXAMPLE.COM ');
assert.equal(calls[0].values[0],'alex@example.com');
assert.match(calls[0].sql,/ps\."WristbandTranID" = cs\.session_id/);
const token=new URL(recap.url).pathname.split('/').pop();
assert.match(token,/^[a-f0-9]{64}$/);
assert.equal(calls.find(x=>x.sql.startsWith('insert')).values[0].length,64);
assert.notEqual(calls.find(x=>x.sql.startsWith('insert')).values[0],token);
assert.deepEqual(await db.getVisitRecap(token),summary);
const before=calls.length;
assert.equal(await db.getVisitRecap('123'),null);
assert.equal(calls.length,before);
assert.match(calls.at(-1).sql,/expires_at > now\(\)/);
const email=await importSource(await readFile(base+'visitRecapEmail.js','utf8'));
const html=email.renderVisitRecapEmail(recap);
assert.ok(html.includes('See Your Scores &amp; Stats'));
assert.ok(html.includes(recap.url.replaceAll('&','&amp;')));
assert.ok(email.visitRecapEmailText(recap).includes('Total points: 410'));
const empty={url:recap.url,summary:summarizeVisit([])};
assert.ok(email.renderVisitRecapEmail(empty).includes('View Your Visit Recap'));
assert.ok(!email.renderVisitRecapEmail(empty).includes('Total points'));
assert.equal(email.renderVisitRecapEmail(null),'');
assert.ok(email.renderVisitRecapEmail(recap, '<Alex>').includes('Hey &lt;Alex&gt;'));
delete globalThis.recapDb;
});
