"use client";

import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/AdminShell";
import "../../styles/admin-waivers.css";
import "../../styles/admin-daily-checklist.css";

const FALLBACK_TEMPLATE = [
  {
    id: "opening-shift",
    title: "Opening - Shift Setup",
    items: [
      { id: "lights-sound", label: "Turn on arena lights, sound, TVs, and lobby screens." },
      { id: "front-desk", label: "Open POS, booking calendar, waiver dashboard, and rewards dashboard." },
      { id: "staff-huddle", label: "Review today's parties, staffing, promos, and assigned roles." },
      { id: "birthdays-prep", label: "Prepare birthday bookings, party room setup, signage, tableware, and host notes." },
    ],
  },
  {
    id: "opening-rooms",
    title: "Opening - Rooms And Safety",
    items: [
      { id: "room-check", label: "Inspect all challenge rooms for hazards, loose props, sensors, and clear exits." },
      { id: "sensor-cleaning", label: "Clean and test room sensors, reader areas, buttons, and touch points." },
      { id: "laser-room-glass", label: "Clean laser room glass so guests, staff, and cameras have a clear view." },
      { id: "wristbands", label: "Test wristbands, readers, check-in flow, and score tracking." },
    ],
  },
  {
    id: "opening-cleaning",
    title: "Opening - Guest Areas",
    items: [
      { id: "washrooms-opening", label: "Inspect, clean, and restock washrooms, including soap, paper products, bins, odours, and floors." },
      { id: "room-fresheners", label: "Check room fresheners or deodorizing, and make sure lobby, party room, and game rooms smell fresh." },
      { id: "lobby-glass", label: "Clean front glass, doors, counters, screens, and visible guest-facing surfaces." },
      { id: "floors-clean", label: "Walk lobby, party room, and arena floor for cleanliness." },
      { id: "food-drink", label: "Restock drinks, snacks, cups, napkins, and front-counter essentials." },
    ],
  },
  {
    id: "opening-bookings",
    title: "Opening - Bookings",
    items: [
      { id: "todays-parties", label: "Review today's bookings, party IDs, guest counts, package, and timing." },
      { id: "birthday-party-supplies", label: "Prepare birthday party supplies: table cloths, cake knife, lighter, napkins, cutlery, plates, cups, and serving essentials." },
      { id: "waiver-check", label: "Check incomplete waivers and send reminders where needed." },
      { id: "call-ahead", label: "Call or message any booking needing confirmation or missing details." },
      { id: "incident-kit", label: "Confirm first-aid kit, incident log, and cleaning supplies are ready." },
    ],
  },
  {
    id: "closing-rooms",
    title: "Closing - Rooms And Equipment",
    items: [
      { id: "games-reset", label: "Reset all games and confirm rooms are powered down or ready for tomorrow." },
      { id: "wristbands-returned", label: "Collect, count, clean, and charge wristbands and shared equipment." },
      { id: "sensor-close", label: "Wipe sensors, buttons, props, and high-touch game surfaces." },
      { id: "maintenance-log", label: "Log broken props, room issues, sensor faults, or maintenance follow-ups." },
    ],
  },
  {
    id: "closing-cleaning",
    title: "Closing - Cleaning",
    items: [
      { id: "washrooms-closing", label: "Clean and restock washrooms before closing the building." },
      { id: "laser-room-glass-close", label: "Final glass clean for the laser room and guest viewing areas." },
      { id: "party-room-close", label: "Clear, sanitize, and reset party room tables, chairs, bins, and floors." },
      { id: "lost-found", label: "Check lost and found, party room, washrooms, and arena for belongings." },
    ],
  },
  {
    id: "closing-admin",
    title: "Closing - Admin",
    items: [
      { id: "cash-pos", label: "Reconcile POS, gift cards, refunds, and daily notes." },
      { id: "bookings-tomorrow", label: "Review tomorrow's bookings, staffing needs, birthdays, and special notes." },
      { id: "doors-alarm", label: "Lock doors, set alarms, turn off screens, and secure staff areas." },
      { id: "handoff", label: "Log incidents, guest feedback, maintenance issues, and tomorrow's priorities." },
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
    staffName: "",
    openingStaff: "",
    closingStaff: "",
    shiftStart: "",
    shiftEnd: "",
  };
}

function mergeChecklist(checklist, template) {
  const saved = new Map((checklist?.items || []).map((item) => [item.id, item]));
  return {
    date: checklist?.date || todayToronto(),
    notes: checklist?.notes || "",
    completedBy: checklist?.completedBy || "",
    staffName: checklist?.staffName || checklist?.completedBy || "",
    openingStaff: checklist?.openingStaff || checklist?.staffName || checklist?.completedBy || "",
    closingStaff: checklist?.closingStaff || "",
    shiftStart: checklist?.shiftStart || "",
    shiftEnd: checklist?.shiftEnd || "",
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

function sectionMode(sectionId = "") {
  return sectionId.startsWith("closing") ? "closing" : "opening";
}

export default function DailyChecklistPage() {
  const [date, setDate] = useState(todayToronto);
  const [activeTab, setActiveTab] = useState("opening");
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

  const groupedSections = useMemo(() => ({
    opening: template.filter((section) => sectionMode(section.id) === "opening"),
    closing: template.filter((section) => sectionMode(section.id) === "closing"),
  }), [template]);

  const shiftStats = useMemo(() => {
    const openingItems = checklist.items.filter((item) => sectionMode(item.sectionId) === "opening");
    const closingItems = checklist.items.filter((item) => sectionMode(item.sectionId) === "closing");
    return {
      opening: checklistStats(openingItems),
      closing: checklistStats(closingItems),
    };
  }, [checklist.items]);

  const activeGroup = useMemo(() => (
    activeTab === "closing"
      ? { id: "closing", title: "Closing Checklist", desc: "Complete after the final session, before lock-up and handoff." }
      : { id: "opening", title: "Opening Checklist", desc: "Complete before doors open and before the first guests arrive." }
  ), [activeTab]);

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

  function setAll(done, mode = "") {
    const now = new Date().toISOString();
    setChecklist((current) => ({
      ...current,
      items: current.items.map((item) => {
        if (mode && sectionMode(item.sectionId) !== mode) return item;
        return {
          ...item,
          done,
          completedAt: done ? item.completedAt || now : "",
        };
      }),
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
          <p>Opening and closing checks for the arena, guest areas, equipment, and shift handoff.</p>
        </div>
      </div>

      {loading ? <p className="daily-state">Loading checklist...</p> : null}
      {error ? <div className="waiver-admin-error"><p>{error}</p></div> : null}
      {notice ? <div className="daily-notice">{notice}</div> : null}

      <section className="daily-shift-card">
        <div className="daily-shift-card__head">
          <div>
            <span className="waiver-admin-kicker">Checklist date</span>
            <h2>{formatChecklistDate(date)}</h2>
          </div>
        </div>
        <div className="daily-date-field">
          <label>
            <span>Date</span>
            <input type="date" value={date} onChange={(event) => setDate(event.target.value || todayToronto())} />
          </label>
        </div>
      </section>

      <section className="daily-progress">
        <div>
          <strong>{stats.percent}%</strong>
          <span>{stats.complete} of {stats.total} tasks complete</span>
        </div>
        <div className="daily-progress__bar" aria-label={`${stats.percent}% complete`}>
          <i style={{ width: `${stats.percent}%` }} />
        </div>
        <div className="daily-progress__split">
          <span>Opening {shiftStats.opening.percent}%</span>
          <span>Closing {shiftStats.closing.percent}%</span>
        </div>
        <div className="daily-progress__actions">
          <button type="button" onClick={() => setAll(true, activeTab)}>Mark {activeTab} done</button>
          <button type="button" onClick={resetDay}>Reset day</button>
        </div>
      </section>

      <div className="daily-tabs" role="tablist" aria-label="Checklist type">
        {["opening", "closing"].map((tab) => (
          <button
            aria-selected={activeTab === tab}
            className={activeTab === tab ? "is-active" : ""}
            key={tab}
            onClick={() => setActiveTab(tab)}
            role="tab"
            type="button"
          >
            <span>{tab === "opening" ? "Opening" : "Closing"}</span>
            <strong>{shiftStats[tab].complete}/{shiftStats[tab].total}</strong>
          </button>
        ))}
      </div>

      <section className={`daily-checklist-group daily-checklist-group--${activeGroup.id}`}>
        <div className="daily-checklist-group__head">
          <div>
            <span className="waiver-admin-kicker">{activeGroup.id === "opening" ? "Start of shift" : "End of shift"}</span>
            <h2>{activeGroup.title}</h2>
            <p>{activeGroup.desc}</p>
          </div>
          <strong>{shiftStats[activeGroup.id].complete}/{shiftStats[activeGroup.id].total}</strong>
        </div>
        <div className="daily-tab-shift">
          {activeGroup.id === "opening" ? (
            <>
              <label>
                <span>Opening staff</span>
                <input
                  value={checklist.openingStaff}
                  onChange={(event) => setChecklist((current) => ({ ...current, openingStaff: event.target.value }))}
                  placeholder="Opening staff name"
                />
              </label>
              <label>
                <span>Opening time</span>
                <input
                  type="time"
                  value={checklist.shiftStart}
                  onChange={(event) => setChecklist((current) => ({ ...current, shiftStart: event.target.value }))}
                />
              </label>
            </>
          ) : (
            <>
              <label>
                <span>Closing staff</span>
                <input
                  value={checklist.closingStaff}
                  onChange={(event) => setChecklist((current) => ({ ...current, closingStaff: event.target.value }))}
                  placeholder="Closing staff name"
                />
              </label>
              <label>
                <span>Closing time</span>
                <input
                  type="time"
                  value={checklist.shiftEnd}
                  onChange={(event) => setChecklist((current) => ({ ...current, shiftEnd: event.target.value }))}
                />
              </label>
            </>
          )}
        </div>
        <div className="daily-grid">
          {groupedSections[activeGroup.id].map((section) => {
            const sectionItems = itemsBySection.get(section.id) || [];
            const complete = sectionItems.filter((item) => item.done).length;
            return (
              <section className="daily-section" key={section.id}>
                <div className="daily-section__head">
                  <h3>{section.title.replace(/^Opening - |^Closing - /, "")}</h3>
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
                        placeholder="Notes or action required"
                      />
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </section>

      <section className="daily-closeout">
        <label>
          <span>Critical issues / handover notes</span>
          <textarea
            value={checklist.notes}
            onChange={(event) => setChecklist((current) => ({ ...current, notes: event.target.value }))}
            placeholder="Incidents, maintenance, follow-ups, staffing notes..."
          />
        </label>
        <div className="daily-save-row">
          <p>Last saved: {formatUpdated(checklist.updatedAt)}</p>
          <button type="button" onClick={saveChecklist} disabled={saving}>
            {saving ? "Saving..." : "Save checklist"}
          </button>
        </div>
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
                      <span>Opening: {record.openingStaff || record.staffName || record.completedBy || "Not entered"}</span>
                      <span>Closing: {record.closingStaff || "Not entered"}</span>
                      <span>Shift: {record.shiftStart || "--:--"} - {record.shiftEnd || "--:--"}</span>
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
