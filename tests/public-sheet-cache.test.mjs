import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

test('homepage tabs and location data share one workbook request, including empty optional tabs', async () => {
  let requests = 0;
  const workbook = { SheetNames: ['locations', 'config', 'hero'], Sheets: {
    locations: [{ location: 'vaughan' }],
    config: [{ location: '', key: 'test', value: 'shared' }, { location: 'vaughan', key: 'local', value: 'venue' }],
    hero: [{ field: 'headline', value: 'Ready to play?' }],
  } };
  const context = vm.createContext({ console, Buffer, fetch: async () => { requests++; return { ok: true, arrayBuffer: async () => new ArrayBuffer(0) }; } });
  const mocks = {
    xlsx: { read: () => workbook, utils: { sheet_to_json: (rows) => rows } },
    './birthdayPolicy.mjs': { normalizeBirthdayDepositText: (value) => value },
    '@/lib/ctaContent': { getConfigValue: () => '' },
    '@/lib/seo': { DEFAULT_SEO_IMAGE: '', canonicalUrl: () => '', getCanonicalSiteUrl: () => '', safeImageUrl: (value) => value },
    '@/utils/customFunctions': { isMenuItemActive: () => true },
  };
  const source = await readFile(new URL('../src/app/lib/sheets.js', import.meta.url), 'utf8');
  const module = new vm.SourceTextModule(source, { context });
  await module.link((name) => { const values = mocks[name]; assert.ok(values, name); return new vm.SyntheticModule(Object.keys(values), function () { for (const [key, value] of Object.entries(values)) this.setExport(key, value); }, { context }); });
  await module.evaluate();
  const fetchRows = module.namespace.fetchsheetdata;
  const [config, hero] = await Promise.all([fetchRows('config', 'vaughan'), fetchRows('hero', 'all')]);
  assert.equal(config.length, 2);
  assert.equal(hero[0].value, 'Ready to play?');
  assert.equal(requests, 1);
  await fetchRows('hero', 'all');
  assert.equal(requests, 1, 'unfiltered tabs must stay cached');
  await fetchRows('optional-missing', 'all');
  const afterMissing = requests;
  await fetchRows('optional-missing', 'all');
  assert.equal(requests, afterMissing, 'a missing optional tab must not repeatedly reload the workbook');
});
