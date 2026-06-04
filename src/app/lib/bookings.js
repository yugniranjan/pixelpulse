import crypto from "node:crypto";
import { getPostgresPool, query } from "@/lib/postgres";

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
    customerName: row.customer_name || raw.customerName || "",
    phone: row.phone || raw.phone || "",
    email: row.email || raw.email || "",
    childName: row.child_name || raw.childName || "",
    childAge: row.child_age || raw.childAge || "",
    package: row.package || raw.package || "",
    partyId: row.party_id || raw.partyId || "",
    partySize: row.party_size ?? raw.partySize ?? null,
    date: row.booking_date || raw.date || "",
    startTime: row.start_time || raw.startTime || "",
    endTime: row.end_time || raw.endTime || "",
    startMinutes: row.start_minutes ?? null,
    endMinutes: row.end_minutes ?? null,
    durationMinutes: row.duration_minutes ?? raw.durationMinutes ?? null,
    status: row.status || raw.status || "confirmed",
    notes: row.notes || raw.notes || "",
    createdBy: row.created_by || raw.createdBy || "",
    createdAt: iso(row.created_at || raw.createdAt),
    updatedAt: iso(row.updated_at || raw.updatedAt),
  };
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

  await ensureTable();
  const value = built.value;
  const id = crypto.randomUUID();
  const now = new Date();
  const raw = { ...value, createdBy: input.createdBy || "" };

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
  await ensureTable();

  const existing = await getBookingById(id);
  if (!existing) return { notFound: true };

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
  await ensureTable();
  const result = await query("delete from party_bookings where id = $1 returning id", [id]);
  return result.rows.length > 0;
}
