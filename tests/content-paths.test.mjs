import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import * as contentPaths from '../src/app/lib/contentPaths.mjs';
import * as tracking from '../src/app/lib/trackingScope.js';
const require = createRequire(import.meta.url);
const { NextRequest, NextResponse } = require('next/server');
const arena = '/blogs/level-up-vaughan-with-gtas-first-interactive-arena';
const cases = [
  ['https://www.pixelpulseplay.ca/groups-events'+arena+'?uid=8bESv41YpI29LbAdoy6S', arena],
  ['https://www.pixelpulseplay.ca/undefined/blogs/4-Fun-Corporate-Team-Building-Activities-Everyone-Will-Enjoy', '/blogs/best-team-building-activities-in-vaughan-for-corporate-groups'],
  ['https://www.pixelpulseplay.ca/undefined/blogs/benefits-of-indoor-playgrounds-pixelpulseplay', '/blogs/why-active-play-is-more-important-than-ever-for-kids-in-2026'],
  ['https://www.pixelpulseplay.ca/st-catharines'+arena+'?uid=8bESv41YpI29LbAdoy6S', arena],
  ['https://www.pixelpulseplay.ca/blogs/blogs/best-teen-birthday-party-venue-in-vaughan--2026-guide?uid=EymEerlEVc5SicSp9oau', '/blogs/best-teen-birthday-party-venue-in-vaughan--2026-guide'],
];

async function middlewareModule() {
  const context = vm.createContext({ Headers, URL });
  const module = new vm.SourceTextModule(await readFile(new URL('../src/middleware.js', import.meta.url), 'utf8'), { context });
  const mocks = { 'next/server': { NextResponse }, './app/lib/trackingScope': tracking, './app/lib/contentPaths.mjs': contentPaths };
  await module.link((name) => { const values = mocks[name]; assert.ok(values, name); return new vm.SyntheticModule(Object.keys(values), function () { for (const [key, value] of Object.entries(values)) this.setExport(key, value); }, { context }); });
  await module.evaluate(); return module.namespace.middleware;
}

function request(url) {
  const parsed = new URL(url);
  return new NextRequest(url, { headers: { host: parsed.host, 'x-forwarded-proto': parsed.protocol.slice(0, -1) } });
}

test('all five reported blog URLs reach their canonical article in one permanent redirect', async () => {
  const middleware = await middlewareModule();
  for (const [url, path] of cases) {
    const response = middleware(request(url));
    assert.equal(response.status, 308, url);
    assert.equal(response.headers.get('location'), 'https://pixelpulseplay.ca'+path);
    const final = middleware(request(response.headers.get('location')));
    assert.equal(final.headers.get('location'), null, 'canonical URL must not redirect again');
  }
  const campaign = middleware(request('http://www.pixelpulseplay.ca/undefined'+arena+'?uid=old&utm_source=email'));
  assert.equal(campaign.headers.get('location'), 'https://pixelpulseplay.ca'+arena+'?utm_source=email');
});

test('menu links ignore missing location context and deduplicate blog parents', () => {
  assert.equal(contentPaths.menuItemPath({ parentid: 'blogs', path: 'blogs' }), '/blogs');
  assert.equal(contentPaths.menuItemPath({ parentid: 'blogs', path: 'blogs/Some-Article' }), '/blogs/some-article');
  assert.equal(contentPaths.menuItemPath({ parentid: 'undefined', path: 'Some-Article' }, 'blogs'), '/blogs/some-article');
  assert.equal(contentPaths.menuItemPath({ path: 'Some-Article' }, 'blogs'), '/blogs/some-article');
  assert.equal(contentPaths.menuItemPath({ parentid: 'attractions', path: 'laser-maze' }), '/attractions/laser-maze');
});

test('blog normalization preserves private paths and obsolete font filenames', async () => {
  const middleware = await middlewareModule();
  for (const path of ['/admin/blogs', '/api/blogs', '/visit/blogs', '/invite/blogs', '/_next/static/media/636a5ac981f94f8b-s.p.woff2']) assert.equal(contentPaths.canonicalBlogPath(path), null);
  for (const path of ['/assets/fonts/dm-sans-latin.woff2', '/_next/static/media/636a5ac981f94f8b-s.p.woff2']) assert.equal(middleware(request('https://pixelpulseplay.ca'+path)).headers.get('location'), null);
  const privateResponse = middleware(request('https://pixelpulseplay.ca/visit/blogs'));
  assert.equal(privateResponse.headers.get('cache-control'), 'private, no-store, max-age=0');
});
