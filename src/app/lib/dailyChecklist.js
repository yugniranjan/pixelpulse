import { db } from "@/lib/firestore";
import { getPostgresPool, query } from "@/lib/postgres";

let tableReady;

export const DAILY_CHECKLIST_RETENTION_DAYS = 15;

export const DAILY_CHECKLIST_TEMPLATE = [
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

function hasPostgres() {
  return Boolean(getPostgresPool());
}

export function hasDailyChecklistStore() {
  return hasPostgres() || Boolean(db);
}

async function ensureTable() {
  if (!tableReady) {
    tableReady = query(`
      create table if not exists daily_checklists (
        check_date text primary key,
        items jsonb not null default '[]'::jsonb,
        notes text not null default '',
        completed_by text not null default '',
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        raw jsonb not null default '{}'::jsonb
      );
      create index if not exists daily_checklists_updated_at_idx on daily_checklists (updated_at desc);
    `).catch((error) => {
      tableReady = undefined;
      throw error;
    });
  }

  return tableReady;
}

function cleanText(value = "") {
  return String(value || "").trim();
}

function todayInToronto() {
  return formatTorontoDate(new Date());
}

function formatTorontoDate(date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function retentionCutoffDate(days = DAILY_CHECKLIST_RETENTION_DAYS) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return formatTorontoDate(date);
}

function validDate(value = "") {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
}

export function normalizeChecklistDate(value = "") {
  const nextValue = cleanText(value);
  return validDate(nextValue) ? nextValue : todayInToronto();
}

function iso(value) {
  if (!value) return "";
  if (typeof value.toDate === "function") return value.toDate().toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function flatTemplateItems() {
  return DAILY_CHECKLIST_TEMPLATE.flatMap((section) =>
    section.items.map((item) => ({ ...item, sectionId: section.id })),
  );
}

function normalizeSavedItems(items = []) {
  const map = new Map();
  if (!Array.isArray(items)) return map;

  items.forEach((item) => {
    const id = cleanText(item?.id);
    if (!id) return;
    map.set(id, {
      id,
      done: item.done === true,
      note: cleanText(item.note),
      completedAt: cleanText(item.completedAt),
    });
  });
  return map;
}

function mergeItems(savedItems = []) {
  const saved = normalizeSavedItems(savedItems);
  return flatTemplateItems().map((item) => ({
    id: item.id,
    label: item.label,
    sectionId: item.sectionId,
    done: saved.get(item.id)?.done === true,
    note: saved.get(item.id)?.note || "",
    completedAt: saved.get(item.id)?.completedAt || "",
  }));
}

function normalizeRow(row = {}) {
  const raw = row.raw || {};
  const items = row.items || raw.items || [];
  return {
    date: row.check_date || row.date || raw.date || todayInToronto(),
    items: mergeItems(items),
    notes: row.notes || raw.notes || "",
    completedBy: row.completed_by || row.completedBy || raw.completedBy || "",
    staffName: row.staff_name || row.staffName || raw.staffName || raw.completedBy || row.completed_by || "",
    shiftStart: row.shift_start || row.shiftStart || raw.shiftStart || "",
    shiftEnd: row.shift_end || row.shiftEnd || raw.shiftEnd || "",
    createdAt: iso(row.created_at || row.createdAt || raw.createdAt),
    updatedAt: iso(row.updated_at || row.updatedAt || raw.updatedAt),
  };
}

function templateChecklist(date) {
  return normalizeRow({
    check_date: normalizeChecklistDate(date),
    items: [],
    notes: "",
    completed_by: "",
  });
}

export async function getDailyChecklist(date = "") {
  const checkDate = normalizeChecklistDate(date);

  if (!hasDailyChecklistStore()) {
    return templateChecklist(checkDate);
  }

  if (!hasPostgres()) {
    const snapshot = await db.collection("dailyChecklists").doc(checkDate).get();
    return snapshot.exists
      ? normalizeRow({ date: checkDate, ...(snapshot.data() || {}) })
      : templateChecklist(checkDate);
  }

  await ensureTable();
  const result = await query("select * from daily_checklists where check_date = $1", [checkDate]);
  return result.rows[0] ? normalizeRow(result.rows[0]) : templateChecklist(checkDate);
}

export async function listDailyChecklists(options = {}) {
  const limit = Math.max(1, Math.min(Number(options.limit) || 10, 30));

  if (!hasDailyChecklistStore()) {
    return [];
  }

  if (!hasPostgres()) {
    const snapshot = await db.collection("dailyChecklists").get();
    return snapshot.docs
      .map((doc) => normalizeRow({ date: doc.id, ...(doc.data() || {}) }))
      .filter((item) => validDate(item.date))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, limit);
  }

  await ensureTable();
  const result = await query(
    "select * from daily_checklists order by check_date desc limit $1",
    [limit],
  );
  return result.rows.map((row) => normalizeRow(row));
}

export async function cleanupOldDailyChecklists(options = {}) {
  const retentionDays = Number.isFinite(Number(options.retentionDays))
    ? Number(options.retentionDays)
    : DAILY_CHECKLIST_RETENTION_DAYS;
  const cutoffDate = retentionCutoffDate(retentionDays);

  if (!hasDailyChecklistStore()) {
    return { cutoffDate, deleted: 0 };
  }

  if (!hasPostgres()) {
    const snapshot = await db.collection("dailyChecklists").get();
    let batch = db.batch();
    let pending = 0;
    let deleted = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data() || {};
      const recordDate = cleanText(data.date || doc.id);

      if (!validDate(recordDate) || recordDate >= cutoffDate) continue;

      batch.delete(doc.ref);
      pending += 1;
      deleted += 1;

      if (pending >= 450) {
        await batch.commit();
        batch = db.batch();
        pending = 0;
      }
    }

    if (pending > 0) {
      await batch.commit();
    }

    return { cutoffDate, deleted };
  }

  await ensureTable();
  const result = await query(
    "delete from daily_checklists where check_date < $1",
    [cutoffDate],
  );
  return { cutoffDate, deleted: result.rowCount || 0 };
}

export async function saveDailyChecklist(input = {}) {
  const checkDate = normalizeChecklistDate(input.date);
  const now = new Date();
  const existing = await getDailyChecklist(checkDate);
  const existingItems = normalizeSavedItems(existing.items);
  const incomingItems = normalizeSavedItems(input.items);
  const items = flatTemplateItems().map((templateItem) => {
    const previous = existingItems.get(templateItem.id) || {};
    const incoming = incomingItems.get(templateItem.id) || {};
    const done = incoming.done === true;
    return {
      id: templateItem.id,
      done,
      note: incoming.note || "",
      completedAt: done
        ? incoming.completedAt || previous.completedAt || now.toISOString()
        : "",
    };
  });
  const doc = {
    date: checkDate,
    items,
    notes: cleanText(input.notes),
    completedBy: cleanText(input.staffName || input.completedBy),
    staffName: cleanText(input.staffName || input.completedBy),
    shiftStart: cleanText(input.shiftStart),
    shiftEnd: cleanText(input.shiftEnd),
    updatedAt: now.toISOString(),
  };

  if (!hasDailyChecklistStore()) {
    return normalizeRow(doc);
  }

  if (!hasPostgres()) {
    const ref = db.collection("dailyChecklists").doc(checkDate);
    const snapshot = await ref.get();
    await ref.set(
      {
        ...doc,
        createdAt: snapshot.exists ? snapshot.data()?.createdAt || now.toISOString() : now.toISOString(),
      },
      { merge: true },
    );
    return getDailyChecklist(checkDate);
  }

  await ensureTable();
  await query(
    `
      insert into daily_checklists (check_date, items, notes, completed_by, created_at, updated_at, raw)
      values ($1, $2::jsonb, $3, $4, $5, $5, $6::jsonb)
      on conflict (check_date) do update set
        items = excluded.items,
        notes = excluded.notes,
        completed_by = excluded.completed_by,
        updated_at = excluded.updated_at,
        raw = excluded.raw
    `,
    [
      checkDate,
      JSON.stringify(items),
      doc.notes,
      doc.completedBy,
      now,
      JSON.stringify(doc),
    ],
  );
  return getDailyChecklist(checkDate);
}

export function checklistTemplate() {
  return DAILY_CHECKLIST_TEMPLATE;
}
