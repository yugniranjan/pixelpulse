"use client";

import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/AdminShell";
import "../../styles/admin-waivers.css";
import "../../styles/admin-daily-checklist.css";

const FALLBACK_TEMPLATE = [
  {
    id: "opening",
    title: "Opening Setup",
    items: [
      { id: "lights-sound", label: "Turn on arena lights, sound, TVs, and lobby screens." },
      { id: "front-desk", label: "Open POS, booking calendar, waiver dashboard, and rewards dashboard." },
      { id: "floors-clean", label: "Walk lobby, washrooms, party room, and arena floor for cleanliness." },
      { id: "staff-huddle", label: "Review today's parties, staffing, promos, and assigned roles." },
    ],
  },
  {
    id: "safety",
    title: "Safety And Game Rooms",
    items: [
      { id: "room-check", label: "Inspect all challenge rooms for hazards, loose props, sensors, and clear exits." },
      { id: "wristbands", label: "Test wristbands, readers, check-in flow, and score tracking." },
      { id: "games-online", label: "Confirm active games launch, score, and reset correctly." },
      { id: "incident-kit", label: "Confirm first-aid kit, incident log, and cleaning supplies are ready." },
    ],
  },
  {
    id: "bookings",
    title: "Bookings And Waivers",
    items: [
      { id: "todays-parties", label: "Review today's bookings, party IDs, guest counts, package, and timing." },
      { id: "waiver-check", label: "Check incomplete waivers and send reminders where needed." },
      { id: "party-room", label: "Prepare party room timing, tables, signage, and host notes." },
      { id: "call-ahead", label: "Call or message any booking needing confirmation or missing details." },
    ],
  },
  {
    id: "guest-experience",
    title: "Guest Experience",
    items: [
      { id: "rewards", label: "Check rewards, gift cards, prize wheel, and promo workflows." },
      { id: "food-drink", label: "Restock drinks, snacks, cups, napkins, and front-counter essentials." },
      { id: "signage", label: "Confirm pricing, event, waiver, and promo signage are visible." },
      { id: "photo-moments", label: "Identify any party or group moments worth capturing with permission." },
    ],
  },
  {
    id: "closeout",
    title: "Close-Out",
    items: [
      { id: "lost-found", label: "Check lost and found, party room, washrooms, and arena for belongings." },
      { id: "sanitize", label: "Clean high-touch surfaces, counters, rooms, and shared equipment." },
      { id: "cash-pos", label: "Reconcile POS, gift cards, refunds, and daily notes." },
      { id: "handoff", label: "Log incidents, maintenance issues, follow-ups, and tomorrow's priorities." },
    ],
  },
];

function todayToronto() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function flattenTemplate(template = []) {
  return template.flatMap((section) =>
    section.items.map((item) => ({
      id: item.id,
      sectionId: section.id,
      label: item.label,
      done: false,
      note: "",
      completedAt: "",
    })),
  );
}

function emptyChecklist(date, template = FALLBACK_TEMPLATE) {
  return {
    date,
    items: flattenTemplate(template),
    notes: "",
    completedBy: "",
  };
}

function mergeChecklist(checklist, template) {
  const saved = new Map((checklist?.items || []).map((item) => [item.id, item]));
  return {
    date: checklist?.date || todayToronto(),
    notes: checklist?.notes || "",
    completedBy: checklist?.completedBy || "",
    updatedAt: checklist?.updatedAt || "",
    items: flattenTemplate(template).map((item) => ({
      ...item,
      done: saved.get(item.id)?.done === true,
      note: saved.get(item.id)?.note || "",
      completedAt: saved.get(item.id)?.completedAt || "",
    })),
  };
}

function formatUpdated(value = "") {
  if (!value) return "Not saved yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Saved";
  return date.toLocaleString("en-CA", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatChecklistDate(value = "") {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value || "Saved day";
  return date.toLocaleDateString("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function checklistStats(items = []) {
  const total = items.length;
  const complete = items.filter((item) => item.done).length;
  return {
    total,
    complete,
    percent: total ? Math.round((complete / total) * 100) : 0,
  };
}

export default function DailyChecklistPage() {
  const [date, setDate] = useState(todayToronto);
  const [template, setTemplate] = useState(FALLBACK_TEMPLATE);
  const [checklist, setChecklist] = useState(() => emptyChecklist(todayToronto(), FALLBACK_TEMPLATE));
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setError("");
      setNotice("");
      try {
        const response = await fetch(`/api/admin/daily-checklist?date=${date}`, { cache: "no-store" });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load daily checklist.");
        }

        if (ignore) return;
        const nextTemplate = Array.isArray(data.template) && data.template.length ? data.template : FALLBACK_TEMPLATE;
        setTemplate(nextTemplate);
        setChecklist(mergeChecklist(data.checklist, nextTemplate));
        setRecent(Array.isArray(data.recent) ? data.recent : []);
      } catch (loadError) {
        if (ignore) return;
        setChecklist(emptyChecklist(date, FALLBACK_TEMPLATE));
        setError(loadError?.message || "Unable to load daily checklist template.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [date]);

  const stats = useMemo(() => {
    const total = checklist.items.length;
    const complete = checklist.items.filter((item) => item.done).length;
    return {
      total,
      complete,
      percent: total ? Math.round((complete / total) * 100) : 0,
    };
  }, [checklist.items]);

  const itemsBySection = useMemo(() => {
    const map = new Map();
    checklist.items.forEach((item) => {
      map.set(item.sectionId, [...(map.get(item.sectionId) || []), item]);
    });
    return map;
  }, [checklist.items]);

  function updateItem(id, updates) {
    setChecklist((current) => ({
      ...current,
      items: current.items.map((item) => {
        if (item.id !== id) return item;
        const done = updates.done ?? item.done;
        return {
          ...item,
          ...updates,
          done,
          completedAt: done ? item.completedAt || new Date().toISOString() : "",
        };
      }),
    }));
  }

  function setAll(done) {
    const now = new Date().toISOString();
    setChecklist((current) => ({
      ...current,
      items: current.items.map((item) => ({
        ...item,
        done,
        completedAt: done ? item.completedAt || now : "",
      })),
    }));
  }

  function resetDay() {
    setChecklist(emptyChecklist(date, template));
    setNotice("");
  }

  async function saveChecklist() {
    setSaving(true);
    setError("");
    setNotice("");
    const payload = {
      ...checklist,
      date,
    };

    try {
      const response = await fetch("/api/admin/daily-checklist", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to save daily checklist.");
      }

      const nextTemplate = Array.isArray(data.template) && data.template.length ? data.template : template;
      setTemplate(nextTemplate);
      setChecklist(mergeChecklist(data.checklist, nextTemplate));
      setRecent(Array.isArray(data.recent) ? data.recent : []);
      setNotice("Daily checklist saved.");
    } catch (saveError) {
      setError(saveError?.message || "Unable to save daily checklist.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell>
      <div className="waiver-admin-header waiver-admin-header--dashboard daily-header">
        <div>
          <span className="waiver-admin-kicker">Daily operations</span>
          <h1>Daily Checklist</h1>
          <p>Open, run, and close the arena with one shared staff checklist.</p>
        </div>
        <div className="daily-header__controls">
          <label>
            <span>Date</span>
            <input type="date" value={date} onChange={(event) => setDate(event.target.value || todayToronto())} />
          </label>
          <button type="button" onClick={saveChecklist} disabled={saving}>
            {saving ? "Saving..." : "Save checklist"}
          </button>
        </div>
      </div>

      {loading ? <p className="daily-state">Loading checklist...</p> : null}
      {error ? <div className="waiver-admin-error"><p>{error}</p></div> : null}
      {notice ? <div className="daily-notice">{notice}</div> : null}

      <section className="daily-progress">
        <div>
          <strong>{stats.percent}%</strong>
          <span>{stats.complete} of {stats.total} tasks complete</span>
        </div>
        <div className="daily-progress__bar" aria-label={`${stats.percent}% complete`}>
          <i style={{ width: `${stats.percent}%` }} />
        </div>
        <div className="daily-progress__actions">
          <button type="button" onClick={() => setAll(true)}>Mark all done</button>
          <button type="button" onClick={resetDay}>Reset day</button>
        </div>
      </section>

      <div className="daily-grid">
        {template.map((section) => {
          const sectionItems = itemsBySection.get(section.id) || [];
          const complete = sectionItems.filter((item) => item.done).length;
          return (
            <section className="daily-section" key={section.id}>
              <div className="daily-section__head">
                <h2>{section.title}</h2>
                <span>{complete}/{sectionItems.length}</span>
              </div>
              <div className="daily-tasks">
                {sectionItems.map((item) => (
                  <article className={item.done ? "daily-task is-done" : "daily-task"} key={item.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={(event) => updateItem(item.id, { done: event.target.checked })}
                      />
                      <span>{item.label}</span>
                    </label>
                    <input
                      value={item.note}
                      onChange={(event) => updateItem(item.id, { note: event.target.value })}
                      placeholder="Optional note"
                    />
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <section className="daily-closeout">
        <label>
          <span>Daily notes</span>
          <textarea
            value={checklist.notes}
            onChange={(event) => setChecklist((current) => ({ ...current, notes: event.target.value }))}
            placeholder="Incidents, maintenance, follow-ups, staffing notes..."
          />
        </label>
        <label>
          <span>Completed by</span>
          <input
            value={checklist.completedBy}
            onChange={(event) => setChecklist((current) => ({ ...current, completedBy: event.target.value }))}
            placeholder="Staff name"
          />
        </label>
        <p>Last saved: {formatUpdated(checklist.updatedAt)}</p>
      </section>

      <section className="daily-history">
        <div className="daily-history__head">
          <div>
            <span className="waiver-admin-kicker">Recent records</span>
            <h2>Last 10 Saved Checklists</h2>
          </div>
          <p>Records older than 15 days are deleted automatically.</p>
        </div>

        {recent.length ? (
          <div className="daily-history__list">
            {recent.map((record) => {
              const recordStats = checklistStats(record.items);
              const sections = template.map((section) => {
                const sectionItems = record.items.filter((item) => item.sectionId === section.id);
                return {
                  ...section,
                  complete: sectionItems.filter((item) => item.done).length,
                  total: sectionItems.length,
                };
              });

              return (
                <details className="daily-history__item" key={record.date} open={record.date === date}>
                  <summary>
                    <span>
                      <strong>{formatChecklistDate(record.date)}</strong>
                      <small>{record.date}</small>
                    </span>
                    <span>{recordStats.complete}/{recordStats.total} done</span>
                    <i>{recordStats.percent}%</i>
                  </summary>

                  <div className="daily-history__body">
                    <div className="daily-history__bar" aria-label={`${recordStats.percent}% complete`}>
                      <i style={{ width: `${recordStats.percent}%` }} />
                    </div>

                    <div className="daily-history__sections">
                      {sections.map((section) => (
                        <span key={section.id}>{section.title}: {section.complete}/{section.total}</span>
                      ))}
                    </div>

                    {record.notes ? <p>{record.notes}</p> : <p>No daily notes saved.</p>}

                    <div className="daily-history__meta">
                      <span>Completed by: {record.completedBy || "Not entered"}</span>
                      <span>Saved: {formatUpdated(record.updatedAt)}</span>
                    </div>

                    <button type="button" onClick={() => setDate(record.date)}>
                      Open this day
                    </button>
                  </div>
                </details>
              );
            })}
          </div>
        ) : (
          <p className="daily-state">No saved checklist records yet.</p>
        )}
      </section>
    </AdminShell>
  );
}
