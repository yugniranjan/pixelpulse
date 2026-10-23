"use client";

import { useEffect, useRef, useState } from 'react';
import { useTurnstileSiteKey } from '@/lib/useTurnstileSiteKey';
import TurnstileWidget from './smallComponents/TurnstileWidget';
import { PIXIE_LEAD_CONSENT, validatePixieLead } from '@/lib/pixiePlayLeads.mjs';
import { trackPixiePlay } from '@/lib/pixiePlayAnalytics.mjs';

export default function PixieLeadForm({ variant, onSaved }) {
  const [form, setForm] = useState({ name: '', email: '', consent: false, website: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const [widgetKey, setWidgetKey] = useState(0);
  const pending = useRef(null);
  const busyRef = useRef(false);
  const formRef = useRef(null);
  const { siteKey, turnstileLoading } = useTurnstileSiteKey();
  useEffect(() => { trackPixiePlay('pixieplay_lead_form_view', { variant }); }, [variant]);
  useEffect(() => {
    const feed = formRef.current?.parentElement;
    if (feed) feed.scrollTop = feed.scrollHeight;
  }, [error]);
  function update(event) {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  }
  async function submit(event) {
    event.preventDefault();
    if (busyRef.current) return;
    setError('');
    try {
      if (!token) { setError('Please complete the security check.'); return; }
      if (!pending.current) {
        const page = window.location.pathname;
        pending.current = validatePixieLead({ ...form, submissionId: crypto.randomUUID(), variant, page });
      }
      busyRef.current = true; setBusy(true);
      const response = await fetch('/api/pixieplay-leads', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...pending.current, website: form.website, turnstileToken: token }),
        signal: AbortSignal.timeout(45000),
      });
      const result = await response.json();
      if (!response.ok || result.saved !== true) {
        trackPixiePlay('pixieplay_lead_error', { variant, error: result.code || 'save_failed' });
        if (result.code === 'validation') pending.current = null;
        throw new Error(result.error || 'We couldn’t save your details. Please try again.');
      }
      trackPixiePlay('generate_lead', { variant });
      onSaved();
    } catch (failure) {
      setError(failure.name === 'TimeoutError' ? 'Saving took too long. Please retry—we’ll check your previous submission first.' : failure.message);
      setToken(''); setWidgetKey((value) => value + 1);
    } finally { busyRef.current = false; setBusy(false); }
  }
  const locked = busy || Boolean(pending.current);
  return <form ref={formRef} method="post" action="/api/pixieplay-leads" className="pixieplay__lead-form" onSubmit={submit} aria-label="Your details for PixiePlay" data-private="true" data-clarity-mask="true">
    <p className="pixieplay__lead-eyebrow">LET&apos;S GET YOU STARTED</p>
    <h3>Hey there! Ready to Play? 🎮</h3>
    <p>Have questions about our games, birthday parties, group events, or bookings? We&apos;re here to help!</p>
    <p>Tell us a little about yourself, and let&apos;s get started.</p>
    <label htmlFor="pixie-lead-name">Full Name<input id="pixie-lead-name" name="name" autoComplete="name" maxLength={100} minLength={2} value={form.name} onChange={update} required disabled={locked} /></label>
    <label htmlFor="pixie-lead-email">Email<input id="pixie-lead-email" name="email" type="email" autoComplete="email" maxLength={254} value={form.email} onChange={update} required disabled={locked} /></label>
    <label className="pixieplay__lead-consent"><input type="checkbox" name="consent" checked={form.consent} onChange={update} required disabled={locked} /><span>{PIXIE_LEAD_CONSENT}</span></label>
    <label className="pixieplay__lead-honeypot" aria-hidden="true">Leave this empty<input name="website" value={form.website} onChange={update} tabIndex={-1} autoComplete="off" /></label>
    {siteKey && <TurnstileWidget key={widgetKey} siteKey={siteKey} onVerify={setToken} onExpire={() => setToken('')} onError={() => { setToken(''); setError('Security check could not load. Please retry or contact our team.'); }} />}
    {!turnstileLoading && !siteKey && <p role="status">Chat registration is temporarily unavailable. Please use our contact page.</p>}
    {error && <p className="pixieplay__lead-error" role="alert">{error}</p>}
    <button type="submit" disabled={busy || turnstileLoading || !siteKey || !token}>{busy ? 'Saving your details…' : pending.current ? 'Retry & start chatting →' : 'Start chatting →'}</button>
    <p className="pixieplay__lead-note">For enquiry follow-up only—this doesn’t sign you up for promotions. Prefer to contact us directly? <a href="/contactus" onClick={() => trackPixiePlay('pixieplay_link_click', { variant, destination: 'contact' })}>Contact our team ↗</a></p>
  </form>;
}
