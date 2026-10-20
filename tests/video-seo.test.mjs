import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import Module from 'node:module';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SITE_VIDEOS, videoStructuredData, videoSitemapTag } from '../src/app/lib/videoSeo.mjs';

const base = 'https://pixelpulseplay.ca';
const root = fileURLToPath(new URL('..', import.meta.url));

test('video schema uses existing video frames, accurate duration, and direct media URLs', () => {
  for (const video of Object.values(SITE_VIDEOS)) {
    const schema = videoStructuredData(video, base + '/');
    assert.equal(schema.contentUrl, base + video.contentPath);
    assert.equal(schema.url, base + video.watchPath);
    assert.equal(schema.embedUrl, undefined, 'A regular page must not be advertised as an embeddable player');
    assert.ok(fs.existsSync(path.join(root, 'public', video.thumbnailPath)));
    assert.ok(!schema.thumbnailUrl[0].includes('Logo'));
    const info = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'json', path.join(root, 'public', video.contentPath)]));
    assert.ok(Math.abs(Number(info.format.duration) - video.durationSeconds) < 0.5);
    assert.ok(new Date(schema.uploadDate).getTime() <= Date.now());
  }
});

test('video sitemap supplies playable content, escapes metadata, and omits invalid player URLs', () => {
  const xml = videoSitemapTag({ ...SITE_VIDEOS.partyRoom, name: 'Cake & play <tour>' }, base);
  assert.match(xml, /Cake &amp; play &lt;tour&gt;/);
  assert.ok(xml.includes(`<video:content_loc>${base}${SITE_VIDEOS.partyRoom.contentPath}</video:content_loc>`));
  assert.ok(!xml.includes('player_loc'));
  assert.equal(videoSitemapTag(undefined, base), '');
});

test('watch pages remain in the video sitemap if the content sheet is unavailable', async () => {
  let source = fs.readFileSync(path.join(root, 'src/app/sitemap.xml/route.js'), 'utf8')
    .replace("import { format } from 'date-fns';", 'const format = () => "2026-10-20";')
    .replace('import { fetchsheetdataNoCache } from "@/lib/sheets";', 'const fetchsheetdataNoCache = async () => {throw new Error("offline")};')
    .replace('import { fetchBlogs } from "@/lib/blogs";', 'const fetchBlogs = async () => [];')
    .replace('import { LOCATION_NAME } from "@/lib/constant";', 'const LOCATION_NAME = "vaughan";')
    .replace('import { canonicalUrl } from "@/lib/seo";', `const canonicalUrl = (value = "") => "${base}" + value;`)
    .replace('"@/lib/videoSeo.mjs"', JSON.stringify(new URL('../src/app/lib/videoSeo.mjs', import.meta.url).href))
    .replace('import { slugify } from "@/utils/slugify";', 'const slugify = (value) => value;');
  const { GET } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
  const original = console.error; console.error = () => {};
  let response;
  try { response = await GET(); } finally { console.error = original; }
  const xml = await response.text();
  assert.equal(response.status, 200);
  assert.equal((xml.match(/<video:video>/g) || []).length, 2);
  for (const video of Object.values(SITE_VIDEOS)) assert.ok(xml.includes(`<loc>${base}${video.watchPath}</loc>`));
  assert.ok(!xml.includes('player_loc'));
});

test('homepage hero exposes its video source in initial HTML without eager playback', async () => {
  const { transform } = await import('next/dist/build/swc/index.js');
  const source = fs.readFileSync(path.join(root, 'src/app/components/MotionImage.jsx'), 'utf8')
    .replace('import BookingButton from "./smallComponents/BookingButton";', 'const BookingButton = () => null;');
  const result = await transform(source, { filename: 'MotionImage.jsx', jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } });
  const filename = path.join(root, 'src/app/components/__video_seo_test__.cjs');
  const compiled = new Module(filename);
  compiled.filename = filename;
  compiled.paths = Module._nodeModulePaths(path.dirname(filename));
  compiled._compile(result.code, filename);
  const html = renderToStaticMarkup(React.createElement(compiled.exports.default, { pageData: { video: '/hero.mp4', videoThumbnail: '/poster.jpg' }, heroData: { headline: 'Play together' } }));
  assert.ok(html.includes('<source src="/hero.mp4"'));
  assert.ok(html.includes('preload="none"'));
  assert.ok(!html.includes('autoPlay') && !html.includes('autoplay'));
  assert.ok(html.includes('Play together'));
});
