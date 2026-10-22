import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createContext, SourceTextModule, SyntheticModule } from 'node:vm';
import crypto from 'node:crypto';
import * as phone from '../src/app/lib/phone.mjs';

async function library(name) {
  const calls = [];
  const dependencies = {
    './phone.mjs': phone,
    'node:crypto': { default: crypto },
    '@/lib/postgres': { getPostgresPool: () => ({}), query: async (sql, params) => { calls.push({ sql, params: params ? JSON.parse(JSON.stringify(params)) : [] }); return { rows: [] }; } },
    '@/lib/firestore': { db: null },
    '@/lib/giftCards': { createGiftCard: () => { throw new Error('No gift cards should be created'); } },
    '@/lib/rewards': { ensureRewardsTables: async () => {}, unlockRewardsForPlayers: async () => {} },
  };
  const context = createContext({ console, process: { env: {} }, URL });
  const module = new SourceTextModule(await readFile(new URL(`../src/app/lib/${name}.js`, import.meta.url), 'utf8'), { context });
  await module.link((specifier) => {
    const exports = dependencies[specifier];
    assert.ok(exports, `Unexpected dependency ${specifier}`);
    return new SyntheticModule(Object.keys(exports), function () {
      for (const [name, value] of Object.entries(exports)) this.setExport(name, value);
    }, { context });
  });
  await module.evaluate();
  return { api: module.namespace, calls };
}

test('waiver and reward lookups match country-code variants without changing stored records', async () => {
  const waivers = await library('postgresData');
  await waivers.api.listPostgresWaiversByPhone('(613)-799-1972');
  assert.deepEqual(waivers.calls[0].params, [['6137991972', '16137991972'], 50]);
  assert.match(waivers.calls[0].sql, /= any\(\$1::text\[\]\)/);
  const rewards = await library('rewardLookup');
  await rewards.api.lookupRewardPlayers('(613)-799-1972');
  assert.deepEqual(rewards.calls[0].params[1], ['6137991972', '16137991972']);
  assert.match(rewards.calls[0].sql, /any\(\$2::text\[\]\)/);
  assert.ok([...waivers.calls, ...rewards.calls].every(({ sql }) => !/\b(update|insert|delete)\b/i.test(sql)));
});

test('booking and feedback searches parameterize formatted phone digits alongside the original search', async () => {
  for (const name of ['bookings', 'feedback']) {
    const { api, calls } = await library(name);
    await (name === 'bookings' ? api.listBookings : api.listFeedbackSubmissions)({ q: '(613)-799-1972' });
    const search = calls.find(({ sql }) => /^select\b/i.test(sql.trim()));
    assert.ok(search, name);
    assert.ok(search.params.includes('%(613)-799-1972%'));
    assert.ok(search.params.includes('%6137991972%'));
    assert.match(search.sql, /regexp_replace/);
    assert.doesNotMatch(search.sql, /6137991972|\(613\)/);
  }
});
