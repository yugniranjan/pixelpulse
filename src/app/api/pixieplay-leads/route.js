import { createHash } from 'node:crypto';
import { validatePixieLead, PixieLeadError } from '@/lib/pixiePlayLeads.mjs';
import { savePixieLead } from '@/lib/pixieLeadSheet.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const buckets = new Map();
const headers = { 'Cache-Control': 'no-store, private', 'X-Robots-Tag': 'noindex, nofollow' };
function result(body, status = 200) { return Response.json(body, { status, headers }); }
function limit(request) {
  const now = Date.now();
  for (const [key, bucket] of buckets) if (bucket.every((at) => now - at > 600000)) buckets.delete(key);
  const ip = process.env.GAE_ENV ? request.headers.get('x-appengine-user-ip') || 'unknown' : request.headers.get('x-forwarded-for')?.split(',')[0] || 'local';
  const key = createHash('sha256').update(ip).digest('hex');
  const recent = (buckets.get(key) || []).filter((at) => now - at < 600000);
  if (recent.length >= 8 || buckets.size > 10000) throw new PixieLeadError('Please wait a few minutes before trying again.', 429, 'save_failed');
  buckets.set(key, [...recent, now]);
}
async function bodyFrom(request) {
  const reader = request.body?.getReader();
  if (!reader) throw new PixieLeadError('Please complete the form.');
  const chunks = []; let length = 0;
  while (true) {
    const { value, done } = await reader.read(); if (done) break;
    length += value.byteLength;
    if (length > 4096) { await reader.cancel(); throw new PixieLeadError('Form is too large.', 413); }
    chunks.push(Buffer.from(value));
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new PixieLeadError('Invalid form submission.'); }
}
async function verifyTurnstile(token, request) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) throw new PixieLeadError('The form is temporarily unavailable. Please contact our team.', 503, 'verification');
  if (typeof token !== 'string' || !token || token.length > 2048) throw new PixieLeadError('Please complete the security check.', 400, 'verification');
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }), signal: AbortSignal.timeout(10000),
    });
    const verification = await response.json();
    const expected = new URL(request.headers.get('origin')).hostname;
    if (!response.ok || !verification.success || verification.hostname !== expected) throw new Error('Invalid verification');
  } catch { throw new PixieLeadError('The security check expired or failed. Please try again.', 400, 'verification'); }
}
export async function POST(request) {
  try {
    const origin = request.headers.get('origin');
    const allowed = new Set(['https://pixelpulseplay.ca', 'https://www.pixelpulseplay.ca', 'https://birthdays.pixelpulseplay.ca']);
    if (!origin || (origin !== new URL(request.url).origin && !allowed.has(origin))) throw new PixieLeadError('Invalid request source.', 403);
    // Even a forged Host/URL cannot turn this public API into a cross-site collector.
    if (!allowed.has(origin) && !(process.env.NODE_ENV !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin))) throw new PixieLeadError('Invalid request source.', 403);
    limit(request);
    const body = await bodyFrom(request);
    const lead = validatePixieLead(body);
    if (body.website) throw new PixieLeadError('Unable to submit this form.');
    await verifyTurnstile(body.turnstileToken, request);
    await savePixieLead(lead);
    return result({ saved: true });
  } catch (error) {
    if (!(error instanceof PixieLeadError)) console.error('PixiePlay lead save failed.');
    return result({ error: error instanceof PixieLeadError ? error.message : 'Unable to save your details. Please try again.', code: error instanceof PixieLeadError ? error.code : 'save_failed' }, error instanceof PixieLeadError ? error.status : 503);
  }
}
