import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { waiverParticipants } from '../src/app/lib/waiverParticipants.mjs';
const mixed = { party_id: 'DEMO', signer_first_name: 'Sarah', participant_count: 4,
  primary_participant: { firstName: 'Sarah', lastName: 'Wilson' },
  family_members: [
    { firstName: 'James', type: 'adult' },
    { firstName: 'Alex', type: 'minor' },
    { firstName: 'Emma', type: 'minor' },
  ] };
const source = fs.readFileSync(new URL('../src/app/api/party-dashboard/route.js', import.meta.url), 'utf8')
  .replace('import { NextResponse } from "next/server";', 'const NextResponse = { json: (body, options) => ({ body, status: options?.status || 200 }) };')
  .replace('import { hasPostgres } from "@/lib/postgresData";', 'const hasPostgres = () => true;')
  .replace('import { query } from "@/lib/postgres";', 'const query = (...args) => globalThis.partyDashboardQuery(...args);')
  .replace('"@/lib/waiverParticipants.mjs"', JSON.stringify(new URL('../src/app/lib/waiverParticipants.mjs', import.meta.url).href));
const route = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));

test('all names and adult/minor labels remain available without play selections', () => {
  const people = waiverParticipants(mixed);
  assert.deepEqual(people.map(({name,type}) => ({name,type})), [
    {name:'Sarah Wilson',type:'adult'}, {name:'James',type:'adult'},
    {name:'Alex',type:'minor'}, {name:'Emma',type:'minor'},
  ]);
  assert.ok(people.every((person) => !('willPlay' in person)));
  assert.equal(route.POST, undefined);
});
test('covered totals count only minors, including zero for adult-only and older waivers', async () => {
  const rows = [mixed,
    { ...mixed, participant_count: 1, family_members: [], signer_first_name: 'Adult' },
    { party_id:'DEMO', signer_first_name:'Legacy', participant_count:5 },
    { ...mixed, party_id:'OTHER' },
  ];
  globalThis.partyDashboardQuery = async (sql) => {
    assert.match(sql.trim(), /^select/i);
    return {rows:sql.includes('from party_bookings') ? [{party_id:'DEMO',party_size:5}] : rows};
  };
  const response = await route.GET(new Request('https://example.com/api/party-dashboard?partyId=DEMO'));
  const party = response.body.parties[0];
  assert.equal(party.participantsCovered, 2);
  assert.equal(party.waiverFormsCompleted, 3);
  assert.deepEqual(party.signedWaivers.map((waiver) => waiver.participantsCovered), [2,0,0]);
  assert.equal(party.signedWaivers[0].participants.length, 4);
});
