import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { SourceTextModule, SyntheticModule, createContext } from 'node:vm';
import * as leads from '../src/app/lib/pixiePlayLeads.mjs';
import { pixieAnalyticsPayload, trackPixiePlay, pixieLinkDestination } from '../src/app/lib/pixiePlayAnalytics.mjs';

const valid = { submissionId: randomUUID(), name: 'Demo Parent', email: 'DEMO@example.com', consent: true, page: '/', variant: 'default' };
async function load(path, dependencies, extra = {}) {
  const context = createContext({ console, Response, URL, URLSearchParams, Buffer, Date, process: { env: {} }, AbortSignal, ...extra });
  const module = new SourceTextModule(await readFile(new URL(path, import.meta.url), 'utf8'), { context });
  await module.link((name) => {
    const values = dependencies[name]; assert.ok(values, name);
    return new SyntheticModule(Object.keys(values), function () { for (const [key, value] of Object.entries(values)) this.setExport(key, value); }, { context });
  });
  await module.evaluate(); return module.namespace;
}

test('leads require name/email and consent without collecting a phone number', () => {
  const result = leads.validatePixieLead(valid);
  assert.equal(result.email, 'demo@example.com'); assert.equal(result.phone, undefined);
  assert.equal(leads.validatePixieLead({ ...valid, phone: '+1 613 799 1972' }).phone, undefined);
  for (const changes of [{ name: '' }, { name: 'x'.repeat(101) }, { email: 'not-an-email' }, { email: 'a@b.com\nBCC:other@example.com' }, { consent: false }, { consent: 'yes' }, { submissionId: 'guessed' }]) {
    assert.throws(() => leads.validatePixieLead({ ...valid, ...changes }), leads.PixieLeadError);
  }
  assert.throws(() => leads.validatePixieLead(null), leads.PixieLeadError);
  const safe = leads.validatePixieLead({ ...valid, page: '/?email=private@example.com', variant: 'private@email.com', extra: 'ignore' });
  assert.equal(safe.page, '/'); assert.equal(safe.variant, 'default'); assert.equal(safe.extra, undefined);
  const row = leads.pixieLeadRow(result, new Date('2026-10-23T16:00:00Z'));
  assert.equal(row.length, 9); assert.equal(row[1], '2026-10-23, 11:00:00 EST'); assert.equal(row[4], ''); assert.equal(row[8], '2026-10-23T16:00:00.000Z');
});

test('analytics allowlists categories and discards all personal data and free text', () => {
  const injected = { variant: 'birthday', topic: 'birthday', destination: 'birthday_booking', answered: true, name: 'Private Name', email: 'private@example.com', phone: '6137991972', question: 'My private question', url: 'https://example.com?email=private@example.com', submissionId: valid.submissionId };
  const payload = pixieAnalyticsPayload('generate_lead', injected);
  assert.deepEqual(Object.keys(payload).sort(), ['event','lead_source','chatbot_variant','chatbot_topic','chatbot_destination','answer_found'].sort());
  assert.doesNotMatch(JSON.stringify(payload), /Private Name|private@example|613799|My private|https:|submissionId/);
  const bad = pixieAnalyticsPayload('pixieplay_question', { variant: 'private@example.com', topic: 'private@example.com', destination: 'private@example.com', error: 'private@example.com' });
  assert.equal(bad.chatbot_variant, 'default'); assert.equal(bad.chatbot_topic, undefined);
  assert.equal(pixieAnalyticsPayload('private@example.com', injected), null);
  assert.equal(pixieLinkDestination('https://birthdays.pixelpulseplay.ca/?email=private@example.com'), 'birthday_booking');
  assert.equal(pixieLinkDestination('/booking?type=ticket'), 'play_booking');
  assert.equal(pixieLinkDestination('mailto:connect@pixelpulseplay.ca'), 'contact');
});

test('analytics uses one delivery path and failure never interrupts the chatbot', () => {
  const previous = globalThis.window;
  try {
    const calls = []; globalThis.window = { dataLayer: [], gtag: (...args) => calls.push(args) };
    trackPixiePlay('generate_lead', { email: 'private@example.com' });
    assert.equal(calls.length, 1); assert.equal(window.dataLayer.length, 0); assert.equal(calls[0][0], 'event'); assert.equal(calls[0][2].send_to, 'G-C6K82QG464');
    delete window.gtag; trackPixiePlay('pixieplay_open'); assert.equal(window.dataLayer.length, 1); assert.equal(window.dataLayer[0][0], 'event'); assert.equal(window.dataLayer[0][1], 'pixieplay_open');
    window.gtag = () => { throw new Error('Analytics blocked'); };
    assert.doesNotThrow(() => trackPixiePlay('pixieplay_open'));
  } finally { if (previous === undefined) delete globalThis.window; else globalThis.window = previous; }
});

async function harness({ secret = 'test-only', verify = true, hostname = 'pixelpulseplay.ca', failSave = false } = {}) {
  const saved = []; let checks = 0;
  const route = await load('../src/app/api/pixieplay-leads/route.js', {
    'node:crypto': await import('node:crypto'), '@/lib/pixiePlayLeads.mjs': leads,
    '@/lib/pixieLeadSheet.mjs': { savePixieLead: async (lead) => { if (failSave) throw new leads.PixieLeadError('Save failed', 503, 'save_failed'); saved.push(lead); } },
  }, { process: { env: { TURNSTILE_SECRET_KEY: secret, NODE_ENV: 'test' } }, fetch: async () => { checks++; return Response.json({ success: verify, hostname }); } });
  let counter = 0;
  const request = (body = valid, origin = 'https://pixelpulseplay.ca') => new Request('https://pixelpulseplay.ca/api/pixieplay-leads', { method: 'POST', headers: { origin, 'content-type': 'application/json', 'x-forwarded-for': `test-${counter++}` }, body: JSON.stringify({ ...body, turnstileToken: 'test-turnstile' }) });
  return { route, saved, request, checks: () => checks };
}

test('API rejects bad origins, incomplete details, honeypot and oversized requests without saving', async () => {
  const { route, saved, request } = await harness();
  for (const [body, status] of [[{ ...valid, email: 'bad' }, 400], [{ ...valid, consent: false }, 400], [{ ...valid, website: 'spam' }, 400], [{ ...valid, name: 'x'.repeat(5000) }, 413]]) {
    assert.equal((await route.POST(request(body))).status, status);
  }
  assert.equal((await route.POST(request(valid, 'https://attacker.example'))).status, 403);
  assert.equal(saved.length, 0);
});

test('API fails closed for absent/failed/mismatched Turnstile and sheet failures', async () => {
  for (const settings of [{ secret: '', status: 503 }, { verify: false, status: 400 }, { hostname: 'attacker.example', status: 400 }, { failSave: true, status: 503 }]) {
    const { route, saved, request } = await harness(settings);
    const response = await route.POST(request()); assert.equal(response.status, settings.status); assert.equal(saved.length, 0);
    assert.notEqual((await response.json()).saved, true);
  }
});

test('API unlocks chat only after verified lead storage and returns no contact details', async () => {
  const { route, saved, request } = await harness();
  const response = await route.POST(request());
  assert.equal(response.status, 200); assert.deepEqual(await response.json(), { saved: true });
  assert.equal(saved.length, 1); assert.equal(saved[0].email, 'demo@example.com');
  assert.match(response.headers.get('cache-control'), /no-store/);
});

async function sheetHarness({ permissions = [{ type: 'user' }], exists = false, failAppend = false } = {}) {
  const calls = []; const queries = []; let releases = 0;
  const connection = { query: async (...args) => queries.push(args), release: () => { releases++; } };
  const module = await load('../src/app/lib/pixieLeadSheet.mjs', {
    './pixiePlayLeads.mjs': leads,
    './postgres.js': { getPostgresPool: () => ({ connect: async () => connection }) },
    'google-auth-library': { GoogleAuth: class { async getClient() { return { request: async (options) => {
      calls.push(options);
      if (options.url.includes('drive/v3')) return { data: { permissions } };
      if (options.method === 'POST') { if (failAppend) throw new Error('Google error with credentials/contact data'); return { data: { updates: { updatedRows: 1 } } }; }
      const decoded = decodeURIComponent(options.url);
      if (decoded.includes('A1:I1')) return { data: { values: [leads.PIXIE_LEAD_HEADERS] } };
      return { data: { values: exists ? [[valid.submissionId]] : [] } };
    } }; } } },
  });
  return { module, calls, queries, released: () => releases };
}

test('sheet writes use RAW text, prevent duplicate retries, and release cross-instance locks', async () => {
  const lead = leads.validatePixieLead({ ...valid, name: '=IMPORTXML("malicious")' });
  const { module, calls, queries, released } = await sheetHarness();
  assert.equal((await module.savePixieLead(lead)).saved, true);
  const append = calls.find((call) => call.method === 'POST');
  assert.match(append.url, /valueInputOption=RAW/); assert.match(append.url, /insertDataOption=OVERWRITE/); assert.equal(append.data.values[0][2], lead.name);
  assert.equal(queries[0][0], 'BEGIN'); assert.match(queries[1][0], /pg_advisory_xact_lock/); assert.equal(queries.at(-1)[0], 'COMMIT'); assert.equal(released(), 1);
  const duplicate = await sheetHarness({ exists: true });
  assert.equal((await duplicate.module.savePixieLead(lead)).duplicate, true);
  assert.equal(duplicate.calls.filter((call) => call.method === 'POST').length, 0);
});

test('public or domain-wide sheet access blocks lead writes; Google errors are sanitized', async () => {
  for (const type of ['anyone', 'domain']) {
    const { module, calls, queries, released } = await sheetHarness({ permissions: [{ type }] });
    await assert.rejects(module.savePixieLead(valid), { status: 503, code: 'save_failed' });
    assert.equal(calls.filter((call) => call.method === 'POST').length, 0); assert.equal(queries.at(-1)[0], 'ROLLBACK'); assert.equal(released(), 1);
  }
  const failed = await sheetHarness({ failAppend: true });
  await assert.rejects(failed.module.savePixieLead(valid), (error) => error.status === 503 && !error.message.includes('credentials'));
  assert.equal(failed.queries.at(-1)[0], 'ROLLBACK'); assert.equal(failed.released(), 1);
});


test('EST timestamps remain UTC minus five in summer and winter, including date rollover', () => {
  assert.equal(leads.formatPixieLeadEST(new Date('2026-07-23T16:00:00Z')), '2026-07-23, 11:00:00 EST');
  assert.equal(leads.formatPixieLeadEST(new Date('2026-12-23T16:00:00Z')), '2026-12-23, 11:00:00 EST');
  assert.equal(leads.formatPixieLeadEST(new Date('2026-10-23T03:30:00Z')), '2026-10-22, 22:30:00 EST');
});

test('sheet header migration supports both time labels without accepting unrelated changes', () => {
  assert.equal(leads.matchesPixieLeadHeaders(leads.PIXIE_LEAD_HEADERS), true);
  const legacy = [...leads.PIXIE_LEAD_HEADERS]; legacy[1] = 'Submitted (Toronto)';
  assert.equal(leads.matchesPixieLeadHeaders(legacy), true);
  legacy[3] = 'Wrong field'; assert.equal(leads.matchesPixieLeadHeaders(legacy), false);
  assert.equal(leads.matchesPixieLeadHeaders([]), false);
});
