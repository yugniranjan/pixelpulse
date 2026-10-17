import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { waiverParticipants } from '../src/app/lib/waiverParticipants.mjs';
const waiver = { id: 'waiver-1', party_id: 'DEMO', signer_first_name: 'Sarah', participant_count: 2,
  primary_participant: { firstName: 'Sarah', lastName: 'Wilson' },
  family_members: [{ firstName: 'Alex', lastName: 'Wilson', type: 'minor' }] };
const people = waiverParticipants(waiver);
const source = fs.readFileSync(new URL('../src/app/api/party-dashboard/route.js', import.meta.url), 'utf8')
  .replace('import { NextResponse } from "next/server";', 'const NextResponse = { json: (body, options) => ({ body, status: options?.status || 200 }) };')
  .replace('import { hasPostgres } from "@/lib/postgresData";', 'const hasPostgres = () => true;')
  .replace('import { query } from "@/lib/postgres";', 'const query = (...args) => globalThis.playerEmailQuery(...args);')
  .replace('import nodemailer from "nodemailer";', 'const nodemailer = {createTransport: () => ({sendMail: (...args) => globalThis.playerEmailSend(...args)})};')
  .replace('"@/lib/waiverParticipants.mjs"', JSON.stringify(new URL('../src/app/lib/waiverParticipants.mjs', import.meta.url).href));
const { GET, POST } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const request = (body, origin = 'https://example.com') => new Request('https://example.com/api/party-dashboard', {
  method: 'POST', headers: { 'Content-Type': 'application/json', origin }, body: JSON.stringify(body),
});
const payload = { partyId: 'DE MO', players: [{ waiverId: waiver.id, participantKey: people[1].key }] };
process.env.GMAIL_USER = 'test@example.com';
process.env.GMAIL_APP_PASSWORD = 'mock-password';

test('participants retain adult/minor labels and always start unchecked', () => {
  assert.deepEqual(people.map(({ type, isSigner, willPlay }) => ({ type, isSigner, willPlay })), [
    { type: 'adult', isSigner: true, willPlay: false }, { type: 'minor', isSigner: false, willPlay: false },
  ]);
});
test('email contains only selected players, type and party ID; database reads only', async () => {
  let sent;
  globalThis.playerEmailQuery = async (sql, params) => {
    assert.match(sql.trim(), /^select/i);
    assert.deepEqual(params, ['demo', [waiver.id]]);
    return { rows: [waiver] };
  };
  globalThis.playerEmailSend = async (mail) => { sent = mail; };
  const response = await POST(request({ ...payload, players: [...payload.players, ...payload.players] }));
  assert.equal(response.status, 200);
  assert.equal(sent.to, 'connect@pixelpulseplay.ca');
  assert.match(sent.text, /Party ID: DEMO/);
  assert.match(sent.text, /Total players: 1/);
  assert.match(sent.text, /Adults: 0\nMinors: 1/);
  assert.match(sent.text, /Alex Wilson \(Minor\)/);
  assert.doesNotMatch(sent.text, /Sarah/);
});
test('reject foreign origins, empty selections and players outside the party', async () => {
  globalThis.playerEmailSend = () => assert.fail('Must not send');
  assert.equal((await POST(request(payload, 'https://unrelated.example'))).status, 403);
  assert.equal((await POST(request({ ...payload, players: [] }))).status, 400);
  globalThis.playerEmailQuery = async () => ({ rows: [] });
  assert.equal((await POST(request(payload))).status, 400);
});
test('reopening dashboard returns unchecked selections and unchanged covered count with no database writes', async () => {
  globalThis.playerEmailQuery = async (sql) => {
    assert.match(sql.trim(), /^select/i);
    return { rows: sql.includes('from party_bookings') ? [{ party_id: 'DEMO', party_size: 2 }] : [waiver] };
  };
  const response = await GET(new Request('https://example.com/api/party-dashboard?partyId=DEMO'));
  assert.equal(response.body.parties[0].participantsCovered, 2);
  assert.deepEqual(response.body.parties[0].signedWaivers[0].participants.map((person) => person.willPlay), [false, false]);
});
test('email failure returns an error rather than success', async () => {
  globalThis.playerEmailQuery = async () => ({ rows: [waiver] });
  globalThis.playerEmailSend = async () => { throw new Error('SMTP unavailable'); };
  const old = console.error; console.error = () => {};
  try { assert.equal((await POST(request(payload))).status, 500); } finally { console.error = old; }
});
