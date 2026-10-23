"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getPixiePartyPlan, PIXIE_PARTY_OPTIONS } from "@/lib/pixiePlay.mjs";
import { getPixieFlowReply } from "@/lib/pixiePlayFlow.mjs";
import "../styles/pixieplay.css";
import PixieLeadForm from "./PixieLeadForm";
import { trackPixiePlay, pixieLinkDestination } from "@/lib/pixiePlayAnalytics.mjs";

function PixieFace() {
  return <svg viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M18 3h4v5h-4zM8 10h24v4h4v18h-4v4H8v-4H4V14h4z" fill="currentColor" /><path d="M10 16h20v14H10z" fill="#0b111b" /><path d="M13 19h4v5h-4zm10 0h4v5h-4z" fill="#b9eb73" /><path d="M17 27h6v2h-6z" fill="#b9eb73" /><path d="M30 3h3V0h2v3h3v2h-3v3h-2V5h-3z" fill="#fbae7b" /></svg>;
}

const greeting = { role: "assistant", text: "Hi, I’m PixiePlay! 👋 What would you like to know about Pixel Pulse?", links: [] };
const LEAD_SESSION_KEY = "pppPixieLeadAcceptedUntil";
const INVITATION_KEY = "pppPixieInvitationShown";
const EMPTY_PARTY_PLAN = { step: 0, guests: '', age: '', date: '', privacy: 'Standard birthday package' };

function PixiePartyPlanner({ plan, setPlan, onComplete, onCancel }) {
  const { step, guests, age, date, privacy } = plan;
  const update = (values) => setPlan((current) => ({ ...current, ...values }));
  const card = useRef(null);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

  useEffect(() => {
    const feed = card.current?.parentElement;
    if (feed) feed.scrollTop = feed.scrollHeight;
    card.current?.focus({ preventScroll: true });
  }, [step]);

  return <form ref={card} className="pixieplay__planner" tabIndex={-1} aria-label="Your birthday planner" onSubmit={(event) => {
    event.preventDefault();
    if (step === 1) update({ step: 2 });
    else if (step === 2) onComplete({ guests, age, date, privacy });
  }}>
    <p className="pixieplay__planner-step">YOUR BIRTHDAY PLAN · {step + 1} OF 3</p>
    <div className="pixieplay__progress" aria-hidden="true">{[0, 1, 2].map((value) => <span className={value <= step ? 'is-complete' : ''} key={value} />)}</div>
    {step === 0 ? <fieldset><legend>How many children are expected?</legend>
      <div className="pixieplay__prompts">{PIXIE_PARTY_OPTIONS.guests.map((value) => <button type="button" key={value} onClick={() => update({ guests: value, step: 1 })}>{value === '20+' ? 'More than 20' : `${value} children`}<span aria-hidden="true">→</span></button>)}</div>
    </fieldset> : step === 1 ? <>
      <label>How old are the children?<select required value={age} onChange={(event) => update({ age: event.target.value })}><option value="" disabled>Choose an age group</option>{PIXIE_PARTY_OPTIONS.ages.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label>Preferred party date <span className="pixieplay__optional">(optional)</span><input type="date" min={today} value={date} onChange={(event) => update({ date: event.target.value })} /></label>
      <p className="pixieplay__planner-hint">Still deciding? You can choose a date later.</p>
      <button className="pixieplay__planner-next" type="submit">Continue →</button>
    </> : <>
      <label>Which type of party?<select value={privacy} onChange={(event) => update({ privacy: event.target.value })}>{PIXIE_PARTY_OPTIONS.privacy.map((value) => <option key={value}>{value}</option>)}</select></label>
      <p className="pixieplay__planner-hint">Standard packages include your own party room. A private booking reserves the venue.</p>
      <p>{guests} children · Ages {age}<br />{date || 'Date to be decided'}</p>
      <button className="pixieplay__planner-next" type="submit">Show next steps →</button>
    </>}
    <div className="pixieplay__planner-actions">{step > 0 && <button type="button" onClick={() => update({ step: step - 1 })}>← Back</button>}<button type="button" onClick={onCancel}>Back to questions</button></div>
    <p className="pixieplay__planner-note">Planning only. Our team confirms pricing and availability.</p>
  </form>;
}

export default function PixiePlay({ knowledge = {}, variant = "default" }) {
  const isBirthday = variant === "birthday";
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [activated, setActivated] = useState(false);
  const [leadAccepted, setLeadAccepted] = useState(false);
  const queuedPlan = useRef(false);
  const [messages, setMessages] = useState([greeting]);
  const [draft, setDraft] = useState("");
  const [topic, setTopic] = useState("");
  const [planning, setPlanning] = useState(false);
  const [partyPlan, setPartyPlan] = useState(EMPTY_PARTY_PLAN);
  const [invitation, setInvitation] = useState(false);
  const invitationHandled = useRef(false);
  const panel = useRef(null);
  const input = useRef(null);
  const launcher = useRef(null);
  const feed = useRef(null);
  const latestAnswer = [...messages].reverse().find((message) => message.role === "assistant");
  const relatedQuestions = (latestAnswer?.questions || [])
    .filter((prompt) => !messages.some((message) => message.role === "user" && message.text.toLowerCase() === prompt.toLowerCase()))
    .slice(0, 2);

  useEffect(() => {
    try { setLeadAccepted(Number(sessionStorage.getItem(LEAD_SESSION_KEY)) > Date.now()); } catch { /* In-memory lead acceptance still works. */ }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready || open || invitationHandled.current) return;
    try { if (window.sessionStorage.getItem(INVITATION_KEY)) return; } catch { /* Invitation still works when storage is unavailable. */ }
    let timer;
    const inviteWhenClear = () => {
      const busy = document.hidden || document.querySelector('.modal-overlay, .vr-teaser-overlay, [aria-modal="true"]') || document.activeElement?.matches('input, textarea, select, [contenteditable="true"]');
      if (busy) { timer = window.setTimeout(inviteWhenClear, 2500); return; }
      invitationHandled.current = true;
      try { window.sessionStorage.setItem(INVITATION_KEY, 'true'); } catch { /* Keep this visit in memory. */ }
      setInvitation(true);
    };
    timer = window.setTimeout(inviteWhenClear, 8000);
    return () => window.clearTimeout(timer);
  }, [ready, open]);
  useEffect(() => {
    if (!invitation) return;
    const hideWhileTyping = (event) => {
      if (!event.target.closest('.pixieplay') && event.target.matches('input, textarea, select, [contenteditable="true"]')) setInvitation(false);
    };
    document.addEventListener('focusin', hideWhileTyping);
    return () => document.removeEventListener('focusin', hideWhileTyping);
  }, [invitation]);
  useEffect(() => {
    if (!open) return;
    panel.current?.focus({ preventScroll: true });
  }, [open]);
  useEffect(() => {
    const element = feed.current;
    if (!element) return;
    if (messages.length === 1) { element.scrollTop = 0; return; }
    if (planning) { element.scrollTop = element.scrollHeight; return; }
    const latest = [...element.querySelectorAll('.pixieplay__message')].at(-1);
    if (latest) element.scrollTop += latest.getBoundingClientRect().top - element.getBoundingClientRect().top - 16;
  }, [messages, open, planning, leadAccepted]);

  function close() {
    trackPixiePlay("pixieplay_close", { variant });
    setOpen(false);
    launcher.current?.focus();
  }

  function dismissInvitation() {
    setInvitation(false);
    launcher.current?.focus({ preventScroll: true });
  }

  function openChat(startPlanning = false) {
    invitationHandled.current = true;
    setInvitation(false);
    try { window.sessionStorage.setItem(INVITATION_KEY, 'true'); } catch { /* Keep the dismissal in memory. */ }
    setActivated(true);
    setOpen(true);
    trackPixiePlay('pixieplay_open', { variant });
    if (startPlanning) {
      if (leadAccepted) ask('Plan a birthday');
      else queuedPlan.current = true;
    }
  }

  function reset() {
    trackPixiePlay("pixieplay_reset", { variant });
    setPlanning(false);
    setPartyPlan(EMPTY_PARTY_PLAN);
    setMessages([greeting]);
    setTopic("");
    setDraft("");
    panel.current?.focus({ preventScroll: true });
  }

  function acceptLead() {
    setLeadAccepted(true);
    try { sessionStorage.setItem(LEAD_SESSION_KEY, String(Date.now() + 8 * 60 * 60 * 1000)); } catch { /* Keep acceptance in memory. */ }
    if (queuedPlan.current) {
      queuedPlan.current = false;
      setMessages([greeting, { role: 'assistant', text: 'Let’s plan your birthday. Start with the number of children who will play.', links: [] }]);
      setPlanning(true);
      trackPixiePlay('pixieplay_planner_start', { variant });
    }
    feed.current?.focus({ preventScroll: true });
  }

  function ask(value, keepTyping = false) {
    if (!leadAccepted) return;
    const text = value.trim();
    if (!text || text.length > 600) return;
    const answer = getPixieFlowReply(text, knowledge, topic);
    setMessages((current) => [...current, { role: "user", text }, { role: "assistant", ...answer }].slice(-41));
    trackPixiePlay("pixieplay_question", { variant, topic: answer.topic, answered: Boolean(answer.topic) });
    setTopic(answer.topic);
    const startPlanning = answer.startPlanning;
    if (startPlanning) { setPartyPlan(EMPTY_PARTY_PLAN); trackPixiePlay("pixieplay_planner_start", { variant }); }
    setPlanning(startPlanning);
    setDraft("");
    if (keepTyping) input.current?.focus();
    else feed.current?.focus({ preventScroll: true });
  }

  function finishPlan(plan) {
    const answer = getPixiePartyPlan(plan);
    if (!answer || !leadAccepted) return;
    trackPixiePlay("pixieplay_planner_complete", { variant });
    setMessages((current) => [...current, { role: "assistant", ...answer, links: answer.links.slice(0, 1), questions: [] }].slice(-41));
    setPlanning(false);
    setTopic("birthday");
    feed.current?.focus({ preventScroll: true });
  }

  if (!ready) return null;
  return createPortal(
    <div className={`pixieplay${invitation ? ' pixieplay--inviting' : ''}`}>
      {!open && invitation && <aside className="pixieplay__invite" aria-label="An invitation from PixiePlay" onKeyDown={(event) => { if (event.key === 'Escape') dismissInvitation(); }}>
        <button className="pixieplay__invite-dismiss" type="button" aria-label="Dismiss PixiePlay invitation" onClick={dismissInvitation}>×</button>
        <p className="pixieplay__invite-eyebrow">A LITTLE HELP FROM PIXIEPLAY</p>
        <h3>{isBirthday ? 'Big birthday plans? 🎉' : 'Ready for some real-life fun? ✨'}</h3>
        <p>{isBirthday ? 'Let’s turn “where do I start?” into a party plan.' : 'Find your next adventure or plan a party your crew will love.'}</p>
        <button className="pixieplay__invite-cta" type="button" onClick={() => openChat(isBirthday)}>{isBirthday ? 'Help me plan a birthday' : 'Ask PixiePlay'}<span aria-hidden="true">→</span></button>
        <span className="pixieplay__invite-note">A few details. Then let’s play.</span>
      </aside>}
      {activated && <section hidden={!open} ref={panel} tabIndex={-1} className={`pixieplay__panel${!leadAccepted ? ' pixieplay__panel--lead' : messages.length === 1 ? ' pixieplay__panel--welcome' : ''}`} role="dialog" aria-labelledby="pixieplay-title" onKeyDown={(event) => { if (event.key === "Escape") close(); }}>
        <div className="pixieplay__header">
          <span className="pixieplay__avatar"><PixieFace /></span>
          <div><h2 id="pixieplay-title">PixiePlay</h2><p>{isBirthday ? 'Your party planning sidekick' : 'A little help. A lot more play.'}</p></div>
          <button type="button" className="pixieplay__icon-button" aria-label="Start a new conversation" title="Start over" onClick={reset} disabled={!leadAccepted}>↺</button>
          <button type="button" className="pixieplay__icon-button" aria-label="Close PixiePlay" onClick={close}>×</button>
        </div>
        <div className="pixieplay__feed" ref={feed} tabIndex={-1} role="log" aria-live="polite" aria-relevant="additions" aria-label="Conversation with PixiePlay">
          {!leadAccepted && <PixieLeadForm variant={variant} onSaved={acceptLead} />}
          {leadAccepted && messages.map((message, index) => <div className={`pixieplay__message pixieplay__message--${message.role}${messages.length === 1 ? ' pixieplay__message--welcome' : ''}`} key={index}>
            <span className="pixieplay__sender">{message.role === "user" ? "You" : "PixiePlay"}</span>
            <p>{message.text}</p>
            {message.links?.length > 0 && <div className="pixieplay__links">
              <a href={message.links[0].href} onClick={() => trackPixiePlay("pixieplay_link_click", { variant, destination: pixieLinkDestination(message.links[0].href) })}>{message.links[0].label}<span aria-hidden="true">↗</span></a>
            </div>}
          </div>)}
          {leadAccepted && planning && <PixiePartyPlanner plan={partyPlan} setPlan={setPartyPlan} onComplete={finishPlan} onCancel={() => setPlanning(false)} />}
          {leadAccepted && !planning && messages.length > 1 && relatedQuestions.length > 0 && <details className="pixieplay__related" key={messages.length}>
            <summary>More questions</summary>
            <div className="pixieplay__prompts" aria-label="Related questions">{relatedQuestions.map((prompt) => <button type="button" key={prompt} onClick={() => ask(prompt)}>{prompt}<span aria-hidden="true">↗</span></button>)}</div>
          </details>}
        </div>
        {leadAccepted && <form className="pixieplay__form" onSubmit={(event) => { event.preventDefault(); ask(draft, true); }}>
          <label htmlFor="pixieplay-question" className="pixieplay__sr-only">Ask PixiePlay a question</label>
          <input ref={input} id="pixieplay-question" value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={600} autoComplete="off" placeholder="Type your question…" />
          <button type="submit" disabled={!draft.trim()} aria-label="Send message"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m5 12 7-7 7 7M12 5v15" /></svg></button>
        </form>}
        <p className="pixieplay__footer">FAQ guide from Pixel Pulse · <a href="/contactus" onClick={() => trackPixiePlay("pixieplay_link_click", { variant, destination: "contact" })}>Talk to our team</a></p>
      </section>}
      <button ref={launcher} type="button" className="pixieplay__launcher" aria-expanded={open} aria-haspopup="dialog" aria-label={open ? "Close PixiePlay chat" : "Open PixiePlay chat"} onClick={() => open ? close() : openChat()}>
        <span className="pixieplay__launcher-face"><PixieFace /></span><span>{open ? 'Back to the page' : messages.length > 1 ? 'Back to PixiePlay' : isBirthday ? 'Plan a birthday' : 'Let’s plan some fun'}<small>{open ? 'Your chat stays right here' : isBirthday ? '3 quick steps with PixiePlay' : 'Quick answers with PixiePlay'}</small></span><span className="pixieplay__launcher-arrow" aria-hidden="true">{open ? '⌄' : '↗'}</span>
      </button>
    </div>, document.body,
  );
}
