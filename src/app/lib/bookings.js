import crypto from "node:crypto";
import { getPostgresPool, query } from "@/lib/postgres";
import { db } from "@/lib/firestore";

/**
 * Birthday party bookings data layer.
 *
 * Concurrency model: ONE party at a time. A new booking is rejected when its
 * [start, end) interval overlaps an existing (non-cancelled) booking on the
 * same date. The create path runs inside a transaction guarded by a per-date
 * advisory lock, so two simultaneous requests for the same day can't both pass
 * the overlap check.
 */

const CREATE_TABLE_SQL = `
  create table if not exists party_bookings (
    id text primary key,
    customer_name text not null default '',
    phone text,
    email text,
    child_name text,
    child_age text,
    package text,
    party_id text,
    party_size integer,
    booking_date text not null,
    start_time text not null,
    end_time text not null,
    start_minutes integer not null,
    end_minutes integer not null,
    duration_minutes integer not null,
    status text not null default 'confirmed',
    notes text,
    created_by text,
    created_at timestamptz,
    updated_at timestamptz,
    raw jsonb not null default '{}'::jsonb
  );
  alter table party_bookings add column if not exists party_id text;
  create index if not exists party_bookings_date_idx on party_bookings (booking_date);
  create index if not exists party_bookings_status_idx on party_bookings (status);
  create index if not exists party_bookings_party_id_idx on party_bookings (party_id);
`;

let tableReady;

export function hasPostgres() {
  return Boolean(getPostgresPool());
}

export function hasBookingStore() {
  return hasPostgres() || Boolean(db);
}

async function ensureTable() {
  if (!tableReady) {
    tableReady = query(CREATE_TABLE_SQL).catch((error) => {
      tableReady = undefined; // allow a retry on the next call
      throw error;
    });
  }
  return tableReady;
}

function iso(value) {
  if (!value) return "";
  if (typeof value.toDate === "function") return value.toDate().toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

/* ---------------------------------------------------------------- helpers */

export function timeToMinutes(value = "") {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value).trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export function minutesToTime(total) {
  const value = ((total % 1440) + 1440) % 1440;
  const hours = String(Math.floor(value / 60)).padStart(2, "0");
  const minutes = String(value % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(value = "") {
  if (!DATE_RE.test(value)) return false;
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime());
}

function normalizeBookingRow(row = {}) {
  const raw = row.raw || {};
  return {
    id: row.id,
    ...raw,
    customerName: row.customer_name || row.customerName || raw.customerName || "",
    phone: row.phone || raw.phone || "",
    email: row.email || raw.email || "",
    childName: row.child_name || row.childName || raw.childName || "",
    childAge: row.child_age || row.childAge || raw.childAge || "",
    package: row.package || raw.package || "",
    partyId: row.party_id || row.partyId || raw.partyId || "",
    partySize: row.party_size ?? row.partySize ?? raw.partySize ?? null,
    date: row.booking_date || row.date || raw.date || "",
    startTime: row.start_time || row.startTime || raw.startTime || "",
    endTime: row.end_time || row.endTime || raw.endTime || "",
    startMinutes: row.start_minutes ?? row.startMinutes ?? raw.startMinutes ?? null,
    endMinutes: row.end_minutes ?? row.endMinutes ?? raw.endMinutes ?? null,
    durationMinutes: row.duration_minutes ?? row.durationMinutes ?? raw.durationMinutes ?? null,
    status: row.status || raw.status || "confirmed",
    notes: row.notes || raw.notes || "",
    createdBy: row.created_by || row.createdBy || raw.createdBy || "",
    createdAt: iso(row.created_at || row.createdAt || raw.createdAt),
    updatedAt: iso(row.updated_at || row.updatedAt || raw.updatedAt),
  };
}

function firestoreBookingData(id, value, extras = {}) {
  return {
    id,
    customerName: value.customerName || "",
    phone: value.phone || "",
    email: value.email || "",
    childName: value.childName || "",
    childAge: value.childAge || "",
    package: value.package || "",
    partyId: value.partyId || "",
    partySize: value.partySize ?? null,
    date: value.date || "",
    startTime: value.startTime || "",
    endTime: value.endTime || "",
    startMinutes: value.startMinutes ?? null,
    endMinutes: value.endMinutes ?? null,
    durationMinutes: value.durationMinutes ?? null,
    status: value.status || "confirmed",
    notes: value.notes || "",
    createdBy: value.createdBy || extras.createdBy || "",
    createdAt: extras.createdAt || value.createdAt || new Date(),
    updatedAt: extras.updatedAt || new Date(),
    raw: { ...value, ...extras.raw },
  };
}

async function firestoreBookingsSnapshot({ from, to, status, q, date } = {}) {
  let snapshot;
  if (isValidDate(date)) {
    snapshot = await db.collection("partyBookings").where("date", "==", date).get();
  } else {
    snapshot = await db.collection("partyBookings").limit(1000).get();
  }

  const needle = String(q || "").trim().toLowerCase();
  return snapshot.docs
    .map((doc) => normalizeBookingRow({ id: doc.id, ...doc.data() }))
    .filter((booking) => {
      if (!isValidDate(date)) {
        if (isValidDate(from) && booking.date < from) return false;
        if (isValidDate(to) && booking.date > to) return false;
      }
      if (status && status !== "all" && booking.status !== status) return false;
      if (!needle) return true;
      return [booking.customerName, booking.childName, booking.phone, booking.email, booking.partyId]
        .some((value) => String(value || "").toLowerCase().includes(needle));
    })
    .sort((a, b) => (a.date === b.date ? (a.startMinutes ?? 0) - (b.startMinutes ?? 0) : a.date < b.date ? 1 : -1));
}

function findDuplicateBookings(bookings, { partyId, email, excludeId } = {}) {
  const duplicates = bookings.filter((booking) => {
    if (excludeId && booking.id === excludeId) return false;
    if (booking.status === "cancelled") return false;
    return (
      (partyId && booking.partyId?.toLowerCase() === partyId.toLowerCase()) ||
      (email && booking.email?.toLowerCase() === email.toLowerCase())
    );
  });
  return duplicates.length ? duplicates : null;
}

function findConflictingBookings(bookings, value, excludeId) {
  const conflicts = bookings.filter((booking) => {
    if (excludeId && booking.id === excludeId) return false;
    if (booking.status === "cancelled") return false;
    return (
      booking.date === value.date &&
      Number(booking.startMinutes) < value.endMinutes &&
      Number(booking.endMinutes) > value.startMinutes
    );
  });
  return conflicts.length ? conflicts.sort((a, b) => (a.startMinutes ?? 0) - (b.startMinutes ?? 0)) : null;
}

async function transactionDuplicateBookings(transaction, { partyId, email, excludeId } = {}) {
  const matches = new Map();
  const queries = [];

  if (partyId) {
    queries.push(db.collection("partyBookings").where("partyId", "==", partyId));
  }
  if (email) {
    queries.push(db.collection("partyBookings").where("email", "==", email));
  }

  const snapshots = [];
  for (const bookingQuery of queries) {
    snapshots.push(await transaction.get(bookingQuery));
  }

  snapshots.forEach((snapshot) => {
    snapshot.docs.forEach((doc) => {
      if (excludeId && doc.id === excludeId) return;
      matches.set(doc.id, normalizeBookingRow({ id: doc.id, ...doc.data() }));
    });
  });

  return findDuplicateBookings([...matches.values()], { partyId, email, excludeId });
}

/**
 * Validate + normalize the booking input. Returns { ok, error } or
 * { ok: true, value } where value carries computed minute boundaries.
 */
export function buildBookingValues(input = {}) {
  const customerName = String(input.customerName || "").trim();
  const date = String(input.date || "").trim();
  const startTime = String(input.startTime || "").trim();
  const durationMinutes = Number(input.durationMinutes);
  const phone = String(input.phone || "").trim();
  const email = String(input.email || "").trim();
  const childName = String(input.childName || "").trim();
  const childAge = String(input.childAge || "").trim();
  const pkg = String(input.package || "").trim();
  const partyId = String(input.partyId || "").trim();
  const notes = String(input.notes || "").trim();
  const partySizeRaw = Number(input.partySize);

  // All fields are required for a party booking.
  if (!customerName) return { ok: false, error: "Customer name is required." };
  if (!phone) return { ok: false, error: "Phone is required." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "A valid email is required." };
  if (!childName) return { ok: false, error: "Child's name is required." };
  if (!childAge) return { ok: false, error: "Child's age is required." };
  if (!pkg) return { ok: false, error: "Package is required." };
  if (!partyId) return { ok: false, error: "Party ID is required." };
  if (!Number.isFinite(partySizeRaw) || partySizeRaw <= 0) {
    return { ok: false, error: "A valid party size is required." };
  }
  if (!notes) return { ok: false, error: "Notes are required." };
  if (!isValidDate(date)) return { ok: false, error: "A valid date (YYYY-MM-DD) is required." };

  const startMinutes = timeToMinutes(startTime);
  if (startMinutes === null) return { ok: false, error: "A valid start time (HH:MM) is required." };

  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    return { ok: false, error: "Duration must be greater than zero." };
  }

  const endMinutes = startMinutes + Math.round(durationMinutes);
  if (endMinutes > 1440) {
    return { ok: false, error: "The booking can't extend past midnight. Shorten the duration or start earlier." };
  }

  return {
    ok: true,
    value: {
      customerName,
      phone,
      email,
      childName,
      childAge,
      package: pkg,
      partyId,
      partySize: Math.round(partySizeRaw),
      date,
      startTime: minutesToTime(startMinutes),
      endTime: minutesToTime(endMinutes),
      startMinutes,
      endMinutes,
      durationMinutes: Math.round(durationMinutes),
      notes,
    },
  };
}

/**
 * Find existing (non-cancelled) bookings that duplicate this one by Party ID
 * or email. Runs on a transaction client so the check + insert are atomic.
 */
async function findDuplicateRows(client, { partyId, email, excludeId }) {
  const conditions = [];
  const params = [];
  if (partyId) {
    params.push(partyId);
    conditions.push(`lower(coalesce(party_id,'')) = lower($${params.length})`);
  }
  if (email) {
    params.push(email);
    conditions.push(`lower(coalesce(email,'')) = lower($${params.length})`);
  }
  if (!conditions.length) return null;

  let sql = `select * from party_bookings where status <> 'cancelled' and (${conditions.join(" or ")})`;
  if (excludeId) {
    params.push(excludeId);
    sql += ` and id <> $${params.length}`;
  }
  const result = await client.query(sql, params);
  return result.rows.length ? result.rows : null;
}

function describeDuplicate(rows, value) {
  const row = rows[0];
  if (value.partyId && row.party_id && row.party_id.toLowerCase() === value.partyId.toLowerCase()) {
    return `A booking with Party ID "${value.partyId}" already exists (${row.customer_name}).`;
  }
  if (value.email && row.email && row.email.toLowerCase() === value.email.toLowerCase()) {
    return `A booking with email "${value.email}" already exists (${row.customer_name}).`;
  }
  return "A matching booking already exists.";
}

/* ----------------------------------------------------------------- reads */

export async function listBookings({ from, to, status, q, date } = {}) {
  if (!hasPostgres()) {
    if (!db) return [];
    return firestoreBookingsSnapshot({ from, to, status, q, date });
  }

  await ensureTable();

  const where = [];
  const params = [];

  if (isValidDate(date)) {
    params.push(date);
    where.push(`booking_date = $${params.length}`);
  } else {
    if (isValidDate(from)) {
      params.push(from);
      where.push(`booking_date >= $${params.length}`);
    }
    if (isValidDate(to)) {
      params.push(to);
      where.push(`booking_date <= $${params.length}`);
    }
  }

  if (status && status !== "all") {
    params.push(status);
    where.push(`status = $${params.length}`);
  }

  if (q && q.trim()) {
    params.push(`%${q.trim().toLowerCase()}%`);
    const idx = `$${params.length}`;
    where.push(
      `(lower(customer_name) like ${idx} or lower(coalesce(child_name,'')) like ${idx} or lower(coalesce(phone,'')) like ${idx} or lower(coalesce(email,'')) like ${idx} or lower(coalesce(party_id,'')) like ${idx})`,
    );
  }

  const clause = where.length ? `where ${where.join(" and ")}` : "";
  const result = await query(
    `select * from party_bookings ${clause} order by booking_date desc, start_minutes asc`,
    params,
  );
  return result.rows.map(normalizeBookingRow);
}

export async function getBookingById(id) {
  if (!hasPostgres()) {
    if (!db) return null;
    const snapshot = await db.collection("partyBookings").doc(id).get();
    return snapshot.exists ? normalizeBookingRow({ id: snapshot.id, ...snapshot.data() }) : null;
  }

  await ensureTable();
  const result = await query("select * from party_bookings where id = $1", [id]);
  return result.rows.length ? normalizeBookingRow(result.rows[0]) : null;
}

/* --------------------------------------------------------------- writes */

/**
 * Create a booking. Returns:
 *   { booking }            on success
 *   { conflict: [...] }    when the slot overlaps an existing booking
 *   { error }              on validation failure
 */
export async function createBooking(input = {}) {
  const built = buildBookingValues(input);
  if (!built.ok) return { error: built.error };

  const value = built.value;
  const id = crypto.randomUUID();
  const now = new Date();
  const raw = { ...value, createdBy: input.createdBy || "" };

  if (!hasPostgres()) {
    if (!db) return { error: "Bookings database is not configured." };
    return db.runTransaction(async (transaction) => {
      const dateQuery = db.collection("partyBookings").where("date", "==", value.date);
      const dateSnapshot = await transaction.get(dateQuery);
      const duplicate = await transactionDuplicateBookings(transaction, { partyId: value.partyId, email: value.email });
      const dateBookings = dateSnapshot.docs.map((doc) => normalizeBookingRow({ id: doc.id, ...doc.data() }));
      if (duplicate) {
        return {
          duplicate,
          duplicateMessage: describeDuplicate(
            duplicate.map((booking) => ({
              party_id: booking.partyId,
              email: booking.email,
              customer_name: booking.customerName,
            })),
            value,
          ),
        };
      }
      const conflict = findConflictingBookings(dateBookings, value);
      if (conflict) return { conflict };

      const data = firestoreBookingData(id, { ...value, status: "confirmed", createdBy: String(input.createdBy || "") }, {
        createdAt: now,
        updatedAt: now,
        raw,
      });
      transaction.set(db.collection("partyBookings").doc(id), data);
      return { booking: normalizeBookingRow(data) };
    });
  }

  await ensureTable();

  const pool = getPostgresPool();
  const client = await pool.connect();
  try {
    await client.query("begin");
    // serialize concurrent inserts for the same date
    await client.query("select pg_advisory_xact_lock(hashtext($1))", [value.date]);

    const duplicate = await findDuplicateRows(client, { partyId: value.partyId, email: value.email });
    if (duplicate) {
      await client.query("rollback");
      return {
        duplicate: duplicate.map(normalizeBookingRow),
        duplicateMessage: describeDuplicate(duplicate, value),
      };
    }

    const conflict = await client.query(
      `select * from party_bookings
       where booking_date = $1 and status <> 'cancelled'
         and start_minutes < $2 and end_minutes > $3
       order by start_minutes asc`,
      [value.date, value.endMinutes, value.startMinutes],
    );

    if (conflict.rows.length) {
      await client.query("rollback");
      return { conflict: conflict.rows.map(normalizeBookingRow) };
    }

    const inserted = await client.query(
      `insert into party_bookings (
        id, customer_name, phone, email, child_name, child_age, package, party_id, party_size,
        booking_date, start_time, end_time, start_minutes, end_minutes, duration_minutes,
        status, notes, created_by, created_at, updated_at, raw
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'confirmed',$16,$17,$18,$19,$20::jsonb
      ) returning *`,
      [
        id,
        value.customerName,
        value.phone,
        value.email,
        value.childName,
        value.childAge,
        value.package,
        value.partyId,
        value.partySize,
        value.date,
        value.startTime,
        value.endTime,
        value.startMinutes,
        value.endMinutes,
        value.durationMinutes,
        value.notes,
        String(input.createdBy || ""),
        now,
        now,
        JSON.stringify(raw),
      ],
    );

    await client.query("commit");
    return { booking: normalizeBookingRow(inserted.rows[0]) };
  } catch (error) {
    await client.query("rollback").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Update a booking. Re-runs the overlap check (excluding itself) when the
 * date/time changes. Status-only changes (e.g. cancel) skip the conflict check.
 */
export async function updateBooking(id, input = {}) {
  const existing = await getBookingById(id);
  if (!existing) return { notFound: true };

  if (!hasPostgres()) {
    if (!db) return { error: "Bookings database is not configured." };

    if (input.status && Object.keys(input).filter((k) => k !== "status" && k !== "createdBy").length === 0) {
      const status = input.status === "cancelled" ? "cancelled" : "confirmed";
      const updatedAt = new Date();
      await db.collection("partyBookings").doc(id).update({ status, updatedAt });
      return { booking: { ...existing, status, updatedAt: updatedAt.toISOString() } };
    }

    const built = buildBookingValues({ ...existing, ...input });
    if (!built.ok) return { error: built.error };
    const value = built.value;
    const status = input.status === "cancelled" ? "cancelled" : existing.status || "confirmed";
    return db.runTransaction(async (transaction) => {
      const dateSnapshot = await transaction.get(db.collection("partyBookings").where("date", "==", value.date));
      const bookings = dateSnapshot.docs.map((doc) => normalizeBookingRow({ id: doc.id, ...doc.data() }));
      if (status !== "cancelled") {
        const duplicate = await transactionDuplicateBookings(transaction, {
          partyId: value.partyId,
          email: value.email,
          excludeId: id,
        });
        if (duplicate) {
          return {
            duplicate,
            duplicateMessage: describeDuplicate(
              duplicate.map((booking) => ({
                party_id: booking.partyId,
                email: booking.email,
                customer_name: booking.customerName,
              })),
              value,
            ),
          };
        }
        const conflict = findConflictingBookings(bookings, value, id);
        if (conflict) return { conflict };
      }
      const now = new Date();
      const data = firestoreBookingData(id, { ...existing, ...value, status }, {
        createdAt: existing.createdAt ? new Date(existing.createdAt) : now,
        updatedAt: now,
      });
      transaction.set(db.collection("partyBookings").doc(id), data, { merge: true });
      return { booking: normalizeBookingRow(data) };
    });
  }

  await ensureTable();

  // Cancel / status-only update.
  if (input.status && Object.keys(input).filter((k) => k !== "status" && k !== "createdBy").length === 0) {
    const status = input.status === "cancelled" ? "cancelled" : "confirmed";
    const result = await query(
      "update party_bookings set status = $2, updated_at = $3 where id = $1 returning *",
      [id, status, new Date()],
    );
    return { booking: normalizeBookingRow(result.rows[0]) };
  }

  const built = buildBookingValues({ ...existing, ...input });
  if (!built.ok) return { error: built.error };
  const value = built.value;
  const status = input.status === "cancelled" ? "cancelled" : existing.status || "confirmed";
  const now = new Date();

  const pool = getPostgresPool();
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("select pg_advisory_xact_lock(hashtext($1))", [value.date]);

    if (status !== "cancelled") {
      const duplicate = await findDuplicateRows(client, {
        partyId: value.partyId,
        email: value.email,
        excludeId: id,
      });
      if (duplicate) {
        await client.query("rollback");
        return {
          duplicate: duplicate.map(normalizeBookingRow),
          duplicateMessage: describeDuplicate(duplicate, value),
        };
      }

      const conflict = await client.query(
        `select * from party_bookings
         where booking_date = $1 and status <> 'cancelled' and id <> $2
           and start_minutes < $3 and end_minutes > $4
         order by start_minutes asc`,
        [value.date, id, value.endMinutes, value.startMinutes],
      );
      if (conflict.rows.length) {
        await client.query("rollback");
        return { conflict: conflict.rows.map(normalizeBookingRow) };
      }
    }

    const raw = { ...existing, ...value, status };
    const updated = await client.query(
      `update party_bookings set
        customer_name = $2, phone = $3, email = $4, child_name = $5, child_age = $6,
        package = $7, party_id = $8, party_size = $9, booking_date = $10, start_time = $11, end_time = $12,
        start_minutes = $13, end_minutes = $14, duration_minutes = $15, status = $16,
        notes = $17, updated_at = $18, raw = $19::jsonb
       where id = $1 returning *`,
      [
        id,
        value.customerName,
        value.phone,
        value.email,
        value.childName,
        value.childAge,
        value.package,
        value.partyId,
        value.partySize,
        value.date,
        value.startTime,
        value.endTime,
        value.startMinutes,
        value.endMinutes,
        value.durationMinutes,
        status,
        value.notes,
        now,
        JSON.stringify(raw),
      ],
    );

    await client.query("commit");
    return { booking: normalizeBookingRow(updated.rows[0]) };
  } catch (error) {
    await client.query("rollback").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteBooking(id) {
  if (!hasPostgres()) {
    if (!db) return false;
    const ref = db.collection("partyBookings").doc(id);
    const snapshot = await ref.get();
    if (!snapshot.exists) return false;
    await ref.delete();
    return true;
  }

  await ensureTable();
  const result = await query("delete from party_bookings where id = $1 returning id", [id]);
  return result.rows.length > 0;
}

export async function existingPartyIds(ids = []) {
  if (!hasPostgres()) {
    if (!db) return new Set();
    const clean = [...new Set(ids.filter(Boolean))];
    if (!clean.length) return new Set();
    const existing = new Set();
    const snapshot = await db.collection("partyBookings").get();
    snapshot.docs.forEach((doc) => {
      const partyId = doc.data()?.partyId;
      if (clean.includes(partyId)) existing.add(partyId);
    });
    return existing;
  }

  await ensureTable();
  const clean = [...new Set(ids.filter(Boolean))];
  if (!clean.length) return new Set();
  const result = await query(
    "select distinct party_id from party_bookings where party_id = any($1)",
    [clean],
  );
  return new Set(result.rows.map((row) => row.party_id));
}

export async function getBookingByPartyId(partyId) {
  if (!hasPostgres()) {
    if (!db) return null;
    const snapshot = await db.collection("partyBookings").where("partyId", "==", partyId).limit(1).get();
    return snapshot.docs[0] ? normalizeBookingRow({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() }) : null;
  }

  await ensureTable();
  const result = await query(
    "select * from party_bookings where party_id = $1 order by created_at asc nulls first limit 1",
    [partyId],
  );
  return result.rows.length ? normalizeBookingRow(result.rows[0]) : null;
}

/**
 * Bulk import/update bookings from a parsed spreadsheet.
 * Each row: { customerName, email, phone, partyId, package, date, time, notes, durationMinutes? }.
 * Upserts by Party ID — updates the sheet-provided fields on an existing row
 * (keeping child name/age, party size, and status), otherwise inserts a new
 * confirmed booking with sensible defaults (child TBD, party size 1).
 * Bypasses the overlap/duplicate checks since this is a trusted batch import.
 */
export async function bulkImportBookings(rows = []) {
  if (!hasPostgres()) {
    if (!db) return { inserted: 0, updated: 0, skipped: rows.length, errors: [], total: rows.length };
    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    const errors = [];
    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index] || {};
      const customerName = String(row.customerName || "").trim();
      const date = String(row.date || "").trim();
      if (!customerName || !isValidDate(date)) {
        skipped += 1;
        continue;
      }
      try {
        const existing = row.partyId ? await getBookingByPartyId(String(row.partyId).trim()) : null;
        const startMinutes = timeToMinutes(String(row.time || "").trim()) ?? 600;
        const durationRaw = Number(row.durationMinutes);
        const duration = Number.isFinite(durationRaw) && durationRaw > 0 ? Math.round(durationRaw) : 120;
        const endMinutes = Math.min(startMinutes + duration, 1440);
        const base = {
          customerName,
          email: String(row.email || "").trim(),
          phone: String(row.phone || "").trim(),
          package: String(row.package || "").trim(),
          notes: String(row.notes || "").trim(),
          partyId: String(row.partyId || "").trim(),
          date,
          startTime: minutesToTime(startMinutes),
          endTime: minutesToTime(endMinutes),
          startMinutes,
          endMinutes,
          durationMinutes: endMinutes - startMinutes,
          childName: existing?.childName || "TBD",
          childAge: existing?.childAge || "TBD",
          partySize: existing?.partySize || 1,
          status: existing?.status || "confirmed",
          createdBy: existing?.createdBy || "import",
        };
        const id = existing?.id || crypto.randomUUID();
        const now = new Date();
        await db.collection("partyBookings").doc(id).set(
          firestoreBookingData(id, base, {
            createdAt: existing?.createdAt ? new Date(existing.createdAt) : now,
            updatedAt: now,
          }),
          { merge: true },
        );
        if (existing) updated += 1;
        else inserted += 1;
      } catch (error) {
        errors.push({ row: index + 1, partyId: row.partyId, error: error.message });
      }
    }
    return { inserted, updated, skipped, errors, total: rows.length };
  }

  await ensureTable();

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  const errors = [];

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index] || {};
    const customerName = String(row.customerName || "").trim();
    const date = String(row.date || "").trim();

    if (!customerName || !isValidDate(date)) {
      skipped += 1;
      continue;
    }

    const startMinutes = timeToMinutes(String(row.time || "").trim()) ?? 600; // default 10:00
    const durationRaw = Number(row.durationMinutes);
    const duration = Number.isFinite(durationRaw) && durationRaw > 0 ? Math.round(durationRaw) : 120;
    let endMinutes = startMinutes + duration;
    if (endMinutes > 1440) endMinutes = 1440;

    const base = {
      customerName,
      email: String(row.email || "").trim(),
      phone: String(row.phone || "").trim(),
      package: String(row.package || "").trim(),
      notes: String(row.notes || "").trim(),
      partyId: String(row.partyId || "").trim(),
      date,
      startTime: minutesToTime(startMinutes),
      endTime: minutesToTime(endMinutes),
      startMinutes,
      endMinutes,
      durationMinutes: endMinutes - startMinutes,
    };

    try {
      const existing = base.partyId ? await getBookingByPartyId(base.partyId) : null;
      const now = new Date();

      if (existing) {
        const raw = { ...existing, ...base };
        await query(
          `update party_bookings set
             customer_name = $2, email = $3, phone = $4, package = $5,
             booking_date = $6, start_time = $7, end_time = $8,
             start_minutes = $9, end_minutes = $10, duration_minutes = $11,
             notes = $12, updated_at = $13, raw = $14::jsonb
           where id = $1`,
          [
            existing.id,
            base.customerName,
            base.email,
            base.phone,
            base.package,
            base.date,
            base.startTime,
            base.endTime,
            base.startMinutes,
            base.endMinutes,
            base.durationMinutes,
            base.notes,
            now,
            JSON.stringify(raw),
          ],
        );
        updated += 1;
      } else {
        const id = crypto.randomUUID();
        const raw = { ...base, childName: "TBD", childAge: "TBD", partySize: 1, status: "confirmed" };
        await query(
          `insert into party_bookings (
            id, customer_name, phone, email, child_name, child_age, package, party_id, party_size,
            booking_date, start_time, end_time, start_minutes, end_minutes, duration_minutes,
            status, notes, created_by, created_at, updated_at, raw
          ) values (
            $1,$2,$3,$4,'TBD','TBD',$5,$6,1,$7,$8,$9,$10,$11,$12,'confirmed',$13,'import',$14,$15,$16::jsonb
          )`,
          [
            id,
            base.customerName,
            base.phone,
            base.email,
            base.package,
            base.partyId,
            base.date,
            base.startTime,
            base.endTime,
            base.startMinutes,
            base.endMinutes,
            base.durationMinutes,
            base.notes,
            now,
            now,
            JSON.stringify(raw),
          ],
        );
        inserted += 1;
      }
    } catch (error) {
      errors.push({ row: index + 1, partyId: base.partyId, error: error.message });
    }
  }

  return { inserted, updated, skipped, errors, total: rows.length };
}
