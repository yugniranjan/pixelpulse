"use client";

import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/AdminShell";
import EmailComposeModal from "@/components/admin/EmailComposeModal";
import "../../styles/admin-waivers.css";
import "../../styles/admin-bookings.css";

const PACKAGE_OPTIONS = ["Pixel Punch", "Pixel Ultra", "Pixel Jumbo", "Pulse Max"];
const HOW_TO_PLAY_VIDEO_URL = "https://youtu.be/YpmeCPEJYiI";
const HOW_TO_PLAY_LINES = [
  "",
  "— HOW TO PLAY —",
  "Before your visit, watch this quick video with your players so everyone knows what to expect:",
  `Watch: ${HOW_TO_PLAY_VIDEO_URL}`,
  "When you arrive, our team will welcome your group, complete check-in, and explain the game rules.",
  "Players choose their challenge rooms, then rotate through active games like Run, Jump, React, and Challenge.",
  "Each room is played one group at a time, and our staff guides the flow so the party stays safe, organized, and fun.",
];

const DURATION_OPTIONS = [
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 105, label: "1 hr 45 min" },
  { value: 120, label: "2 hours" },
  { value: 150, label: "2.5 hours" },
  { value: 180, label: "3 hours" },
];

const EMPTY_FORM = {
  customerName: "",
  phone: "",
  email: "",
  childName: "",
  childAge: "",
  package: "",
  partyId: "",
  partySize: "",
  date: "",
  startTime: "",
  durationMinutes: 120,
  notes: "",
};

const PAGE_SIZE = 10;

function timeToMinutes(value = "") {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value).trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 23 || m > 59) return null;
  return h * 60 + m;
}

function minutesToTime(total) {
  const v = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(v / 60)).padStart(2, "0")}:${String(v % 60).padStart(2, "0")}`;
}

function formatTimeLabel(value = "") {
  const mins = timeToMinutes(value);
  if (mins === null) return value || "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

function downloadCsv(filename, rows) {
  const escape = (cell) => {
    const s = String(cell ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = rows.map((row) => row.map(escape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function InviteModal({ data, onClose }) {
  const [copied, setCopied] = useState("");

  function copy(key, text) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(
        () => {
          setCopied(key);
          setTimeout(() => setCopied(""), 1500);
        },
        () => {},
      );
    }
  }

  return (
    <div className="booking-invite-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="booking-invite-modal" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="booking-invite-modal__close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h2>Party link ready</h2>
        <p className="booking-invite-sub">Party ID {data.partyId} · /invite/{data.slug}</p>

        <label className="booking-invite-field">
          <span>Invite link</span>
          <div className="booking-invite-row">
            <input readOnly value={data.inviteUrl} onFocus={(event) => event.target.select()} />
            <button type="button" onClick={() => copy("invite", data.inviteUrl)}>
              {copied === "invite" ? "Copied" : "Copy"}
            </button>
          </div>
        </label>

        <label className="booking-invite-field">
          <span>Waiver link</span>
          <div className="booking-invite-row">
            <input readOnly value={data.waiverUrl} onFocus={(event) => event.target.select()} />
            <button type="button" onClick={() => copy("waiver", data.waiverUrl)}>
              {copied === "waiver" ? "Copied" : "Copy"}
            </button>
          </div>
        </label>

        <label className="booking-invite-field">
          <span>SMS text</span>
          <textarea readOnly rows={6} value={data.smsText} />
        </label>

        <div className="booking-invite-actions">
          <button type="button" onClick={() => copy("sms", data.smsText)}>
            {copied === "sms" ? "Copied" : "Copy SMS"}
          </button>
          <a href={data.inviteUrl} target="_blank" rel="noreferrer">Open invite</a>
        </div>

        {data.qrCodeUrl ? (
          <img className="booking-invite-qr" src={data.qrCodeUrl} alt="Invite QR code" width={180} height={180} />
        ) : null}
      </div>
    </div>
  );
}

function buildPartyLinkMessage(source, data) {
  const time = source.startTime ? formatTimeLabel(source.startTime) : "";
  return [
    "Hi {name},",
    "",
    `Your party links for ${source.childName}'s birthday at Pixel Pulse Play Zone are ready.`,
    "",
    `Party ID: ${data.partyId}`,
    `Date: ${source.date}`,
    time ? `Time: ${time}` : "",
    "",
    `Invite URL: ${data.inviteUrl}`,
    `Waiver URL: ${data.waiverUrl}`,
    data.qrCodeUrl ? `QR Code: ${data.qrCodeUrl}` : "",
    "",
    "You can share the invite link with guests and ask each participant to complete the waiver before arriving.",
    "",
    "SMS copy:",
    data.smsText,
    "",
    "Pixel Pulse Play Zone",
  ].filter(Boolean).join("\n");
}

function ImportPreviewModal({ preview, importing, onConfirm, onCancel }) {
  const { counts = {}, total = 0, rows = [] } = preview || {};
  const willWrite = (counts.insert || 0) + (counts.update || 0);

  return (
    <div className="email-compose-overlay" role="dialog" aria-modal="true" onClick={onCancel}>
      <div className="email-compose-modal import-preview-modal" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="email-compose__close" onClick={onCancel} aria-label="Close">
          ×
        </button>
        <h2>Review import</h2>
        <p className="email-compose__to">
          {total} rows · <strong>{counts.insert || 0} new</strong>, {counts.update || 0} to update,{" "}
          {counts.skip || 0} skipped
        </p>

        <div className="report-records__scroll import-preview-scroll">
          <table className="report-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Date</th>
                <th>Time</th>
                <th>Customer</th>
                <th>Party ID</th>
                <th>Package</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, index) => (
                <tr key={index}>
                  <td><span className={`import-action import-action--${r.action}`}>{r.action}</span></td>
                  <td>{r.date || "—"}</td>
                  <td>{r.time || "—"}</td>
                  <td>{r.customerName || "—"}</td>
                  <td>{r.partyId || "—"}</td>
                  <td>{r.package || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {total > rows.length ? (
          <p className="report-records__note">Showing first {rows.length} of {total} rows.</p>
        ) : null}

        <div className="email-compose__actions">
          <button type="button" className="email-compose__btn--ghost" onClick={onCancel} disabled={importing}>
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={importing || willWrite === 0}>
            {importing ? "Importing…" : `Confirm import (${willWrite})`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState("");
  const [formError, setFormError] = useState("");
  const [conflict, setConflict] = useState(null);
  const [saving, setSaving] = useState(false);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const [view, setView] = useState("list");
  const [calMonth, setCalMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [inviteData, setInviteData] = useState(null);
  const [invitingKey, setInvitingKey] = useState("");
  const [emailTarget, setEmailTarget] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState(null);

  // Step 1: parse + classify (dry run) and show a preview before writing.
  async function handlePickFile(event) {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow re-picking the same file
    if (!file) return;

    setImporting(true);
    setImportMsg("");
    setImportPreview(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("dryRun", "1");
      const response = await fetch("/api/admin/bookings/import", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) {
        setImportMsg(data.error || "Could not read that file.");
        return;
      }
      setImportFile(file);
      setImportPreview(data);
    } catch {
      setImportMsg("Could not read that file.");
    } finally {
      setImporting(false);
    }
  }

  function cancelImport() {
    setImportPreview(null);
    setImportFile(null);
  }

  // Step 2: commit the import for real.
  async function confirmImport() {
    if (!importFile) return;
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", importFile);
      const response = await fetch("/api/admin/bookings/import", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) {
        setImportMsg(data.error || "Import failed.");
        return;
      }
      const parts = [`${data.inserted} new`, `${data.updated} updated`];
      if (data.skipped) parts.push(`${data.skipped} skipped`);
      if (data.errors?.length) parts.push(`${data.errors.length} errors`);
      setImportMsg(`Imported from ${data.total} rows: ${parts.join(", ")}.`);
      cancelImport();
      await loadBookings();
    } catch {
      setImportMsg("Import failed.");
    } finally {
      setImporting(false);
    }
  }

  function downloadTemplate() {
    downloadCsv("party-bookings-template.csv", [
      ["Name", "Email", "Phone", "Address", "SaleID", "PartyDate", "Products"],
      ["Jane Doe", "jane@example.com", "9051234567", "", "1001", "2026-12-20 14:00", "Pixel Ultra"],
    ]);
  }

  function openBookingEmail(booking) {
    if (isPast(booking)) return;
    if (!booking.email) {
      if (typeof window !== "undefined") {
        window.alert("This booking has no email address. Add one via Edit first.");
      }
      return;
    }
    const when = `${booking.date} ${formatTimeLabel(booking.startTime)}–${formatTimeLabel(booking.endTime)}`;
    const lines = [
      "Hi {name},",
      "",
      "Great news — your party at Pixel Pulse Play Zone is confirmed! We can't wait to host you. Here are your booking details:",
      "",
      "— YOUR BOOKING —",
    ];
    if (booking.partyId) lines.push(`Party ID: ${booking.partyId}`);
    lines.push(`Date & time: ${when}`);
    if (booking.package) lines.push(`Package: ${booking.package}`);
    if (booking.childName) {
      lines.push(`Birthday star: ${booking.childName}${booking.childAge ? ` (turning ${booking.childAge})` : ""}`);
    }
    if (booking.partySize) lines.push(`Party size: ${booking.partySize} guests`);
    lines.push(
      "",
      "— GOOD TO KNOW —",
      "• Please arrive 15 minutes before your start time to check in and get settled.",
      "• Every participant must have a signed waiver before play. You can complete it online ahead of time or at the front desk on arrival.",
      "• Grippy/non-slip socks are required on the play areas (available for purchase if you forget).",
      "• Your package time includes setup and cleanup, so play begins promptly at the start time.",
      "",
      "— PACKAGE INCLUSIONS —",
      "• Pizza is provided as per your selected package.",
      "• Table cloth is included.",
      "• Cutlery is included.",
      "• Water, juice, or soda is included as per your package.",
      "• Only dry snacks and non-alcoholic drinks are allowed from outside.",
      ...HOW_TO_PLAY_LINES,
      "",
      "— LOCATION & CONTACT —",
      "Pixel Pulse Play Zone",
      "960 Edgeley Blvd #2, Vaughan, ON L4K 4V4",
      "Phone: +1 (905) 760-2922",
      "Email: connect@pixelpulseplay.ca",
      "",
      "— TERMS & CONDITIONS —",
      "• Deposit & payment: Your deposit secures the date and time and is non-refundable. The remaining balance is due on or before the party date.",
      "• Rescheduling: Changes are subject to availability and must be requested at least 7 days in advance. Requests within 7 days cannot be guaranteed.",
      "• Cancellation: Cancellations made within 7 days of the party may forfeit the deposit.",
      "• Final guest count: Please confirm your final headcount at least 48 hours before the party. Charges are based on the confirmed package and guest count.",
      "• Additional participants: Each participant beyond your package is charged $14.99, payable at the venue.",
      "• Waivers & supervision: All guests must have a signed waiver. Children must be supervised by a parent or guardian at all times.",
      "• Outside food: Outside food and beverages may be restricted — please check with us before bringing any.",
      "• Liability: Play involves inherent risks. Pixel Pulse Play Zone is not responsible for personal injury, loss, or damage to personal property.",
      "• Photography: We may capture photos/video during events for promotional use; let us know in advance if you'd prefer to opt out.",
      "",
      "If anything above looks incorrect, or you have any questions, just reply to this email and we'll be happy to help.",
      "",
      "See you soon!",
      "The Pixel Pulse Play Zone Team",
    );
    setEmailTarget({
      title: "Email booking contact",
      recipients: [{ email: booking.email, name: booking.customerName }],
      defaultSubject: `Your Pixel Pulse Play party is confirmed 🎉${booking.partyId ? ` (Party ID ${booking.partyId})` : ""}`,
      defaultMessage: lines.join("\n"),
    });
  }

  // Create a party invite link straight from a booking (or the current form),
  // reusing the existing /api/admin/invites endpoint. No navigation needed.
  async function createInvite(source) {
    if (source?.id && isPast(source)) return;
    const missing = [];
    if (!source.childName) missing.push("child's name");
    if (!source.partyId) missing.push("Party ID");
    if (!source.customerName) missing.push("customer name");
    if (!source.phone) missing.push("phone");
    if (!source.date) missing.push("date");
    if (!source.startTime) missing.push("start time");
    if (missing.length) {
      if (typeof window !== "undefined") {
        window.alert(`To create a party link, add: ${missing.join(", ")}.`);
      }
      return;
    }

    const key = source.id || "form";
    setInvitingKey(key);
    try {
      const response = await fetch("/api/admin/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childName: source.childName,
          // Force the invite slug to be derived from the child's name.
          slug: source.childName,
          partyId: source.partyId,
          date: source.date,
          time: source.startTime,
          rsvpName: source.customerName,
          phone: source.phone,
          title: `${source.childName}'s Birthday`,
          venue: "Pixel Pulse Playzone",
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (typeof window !== "undefined") window.alert(data.error || "Unable to create party link.");
        return;
      }
      if (source.email) {
        setEmailTarget({
          title: "Email party invite links",
          recipients: [{ email: source.email, name: source.customerName }],
          defaultSubject: `${source.childName}'s Pixel Pulse party links`,
          defaultMessage: buildPartyLinkMessage(source, data),
        });
      } else {
        setInviteData(data);
      }
    } catch {
      if (typeof window !== "undefined") window.alert("Unable to create party link.");
    } finally {
      setInvitingKey("");
    }
  }

  async function loadBookings() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/bookings", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Unable to load bookings.");
        return;
      }
      setBookings(data.bookings || []);
    } catch {
      setError("Unable to load bookings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBookings();
  }, []);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setConflict(null);
    setFormError("");
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId("");
    setFormError("");
    setConflict(null);
  }

  const previewEnd = useMemo(() => {
    const start = timeToMinutes(form.startTime);
    const duration = Number(form.durationMinutes);
    if (start === null || !Number.isFinite(duration) || duration <= 0) return "";
    const end = start + duration;
    return end > 1440 ? "" : minutesToTime(end);
  }, [form.startTime, form.durationMinutes]);

  // Busy (non-cancelled) windows for the date currently in the form.
  const dayBookings = useMemo(() => {
    if (!form.date) return [];
    return bookings
      .filter((b) => b.date === form.date && b.status !== "cancelled" && b.id !== editingId)
      .sort((a, b) => (a.startMinutes ?? 0) - (b.startMinutes ?? 0));
  }, [bookings, form.date, editingId]);

  // Live overlap warning against the loaded list (server is the source of truth).
  const localOverlap = useMemo(() => {
    const start = timeToMinutes(form.startTime);
    const duration = Number(form.durationMinutes);
    if (start === null || !Number.isFinite(duration) || duration <= 0) return null;
    const end = start + duration;
    return dayBookings.find((b) => start < (b.endMinutes ?? 0) && (b.startMinutes ?? 0) < end) || null;
  }, [dayBookings, form.startTime, form.durationMinutes]);

  async function submitForm(event) {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    setConflict(null);

    const payload = { ...form, partySize: form.partySize, durationMinutes: Number(form.durationMinutes) };
    const url = editingId
      ? `/api/admin/bookings?id=${encodeURIComponent(editingId)}`
      : "/api/admin/bookings";
    const method = editingId ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (response.status === 409) {
        // Time overlap returns `conflict`; duplicate Party ID/email returns just a message.
        setConflict(data.conflict || null);
        setFormError(data.error || "That booking conflicts with an existing one.");
        return;
      }
      if (!response.ok) {
        setFormError(data.error || "Unable to save booking.");
        return;
      }

      await loadBookings();
      resetForm();
    } catch {
      setFormError("Unable to save booking.");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(booking) {
    if (isPast(booking)) return;
    setEditingId(booking.id);
    setForm({
      customerName: booking.customerName || "",
      phone: booking.phone || "",
      email: booking.email || "",
      childName: booking.childName || "",
      childAge: booking.childAge || "",
      package: booking.package || "",
      partyId: booking.partyId || "",
      partySize: booking.partySize ? String(booking.partySize) : "",
      date: booking.date || "",
      startTime: booking.startTime || "",
      durationMinutes: booking.durationMinutes || 120,
      notes: booking.notes || "",
    });
    setFormError("");
    setConflict(null);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function setStatus(booking, status) {
    if (isPast(booking)) return;
    try {
      const response = await fetch(`/api/admin/bookings?id=${encodeURIComponent(booking.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (response.ok) await loadBookings();
    } catch {
      /* no-op */
    }
  }

  async function removeBooking(booking) {
    if (isPast(booking)) return;
    if (typeof window !== "undefined" && !window.confirm(`Delete the booking for ${booking.customerName}?`)) {
      return;
    }
    try {
      const response = await fetch(`/api/admin/bookings?id=${encodeURIComponent(booking.id)}`, {
        method: "DELETE",
      });
      if (response.ok) {
        if (editingId === booking.id) resetForm();
        await loadBookings();
      }
    } catch {
      /* no-op */
    }
  }

  // Search + status apply to both views; the date-range only narrows the list.
  const searchStatusFiltered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return bookings.filter((b) => {
      const matchesSearch =
        !needle ||
        [b.customerName, b.childName, b.phone, b.email, b.package]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(needle));
      const matchesStatus = statusFilter === "all" || b.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [bookings, query, statusFilter]);

  const filtered = useMemo(() => {
    return searchStatusFiltered.filter((b) => {
      const matchesFrom = !dateFrom || (b.date && b.date >= dateFrom);
      const matchesTo = !dateTo || (b.date && b.date <= dateTo);
      return matchesFrom && matchesTo;
    });
  }, [searchStatusFiltered, dateFrom, dateTo]);

  // date string -> bookings, for the calendar view
  const bookingsByDate = useMemo(() => {
    const map = {};
    for (const b of searchStatusFiltered) {
      if (!b.date) continue;
      (map[b.date] ||= []).push(b);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => (a.startMinutes ?? 0) - (b.startMinutes ?? 0));
    }
    return map;
  }, [searchStatusFiltered]);

  const calendarCells = useMemo(() => {
    const year = calMonth.getFullYear();
    const month = calMonth.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstWeekday; i += 1) cells.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      cells.push({ day, dateStr, items: bookingsByDate[dateStr] || [] });
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [calMonth, bookingsByDate]);

  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }, []);

  // Past parties are historical records: no edit / party link / email / cancel / delete.
  const isPast = (booking) => Boolean(booking?.date) && booking.date < todayStr;

  function shiftMonth(delta) {
    setCalMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  }

  function pickDate(dateStr) {
    setForm((current) => ({ ...current, date: dateStr }));
    setConflict(null);
    setFormError("");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, dateFrom, dateTo]);

  function exportCsv() {
    const header = [
      "Date",
      "Start",
      "End",
      "Status",
      "Customer",
      "Phone",
      "Email",
      "Child",
      "Age",
      "Package",
      "Party ID",
      "Party size",
      "Notes",
    ];
    const rows = filtered.map((b) => [
      b.date,
      b.startTime,
      b.endTime,
      b.status,
      b.customerName,
      b.phone,
      b.email,
      b.childName,
      b.childAge,
      b.package,
      b.partyId || "",
      b.partySize || "",
      b.notes,
    ]);
    downloadCsv(`party-bookings-${new Date().toISOString().slice(0, 10)}.csv`, [header, ...rows]);
  }

  return (
    <AdminShell>
      <header className="booking-admin-header">
        <div>
          <h1>Birthday Party Bookings</h1>
          <p>Create and manage party bookings. Overlapping time slots on the same date are blocked automatically.</p>
        </div>
        <div className="booking-admin-import">
          <label className={`booking-admin-import__btn${importing ? " is-busy" : ""}`}>
            {importing ? "Reading…" : "⬆ Import Excel / CSV"}
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              hidden
              disabled={importing}
              onChange={handlePickFile}
            />
          </label>
          <button type="button" className="booking-admin-import__template" onClick={downloadTemplate}>
            Download template
          </button>
          {importMsg ? <p className="booking-admin-import__msg">{importMsg}</p> : null}
        </div>
      </header>

      {error ? <p className="waiver-admin-error">{error}</p> : null}

      <div className="booking-admin-layout">
        <form className="booking-admin-form" onSubmit={submitForm}>
          <h2>{editingId ? "Edit booking" : "New booking"}</h2>

          <div className="booking-admin-grid">
            <label className="booking-admin-field--wide">
              <span>Customer name *</span>
              <input name="customerName" value={form.customerName} onChange={updateField} required />
            </label>

            <label>
              <span>Phone *</span>
              <input name="phone" value={form.phone} onChange={updateField} inputMode="tel" required />
            </label>

            <label>
              <span>Email *</span>
              <input name="email" type="email" value={form.email} onChange={updateField} inputMode="email" required />
            </label>

            <label>
              <span>Child&apos;s name *</span>
              <input name="childName" value={form.childName} onChange={updateField} required />
            </label>

            <label>
              <span>Child&apos;s age *</span>
              <input name="childAge" value={form.childAge} onChange={updateField} inputMode="numeric" required />
            </label>

            <label>
              <span>Package *</span>
              <input name="package" value={form.package} onChange={updateField} list="booking-packages" required />
              <datalist id="booking-packages">
                {PACKAGE_OPTIONS.map((name) => (
                  <option value={name} key={name} />
                ))}
              </datalist>
            </label>

            <label>
              <span>Party ID *</span>
              <input name="partyId" value={form.partyId} onChange={updateField} placeholder="Link to waiver party ID" required />
            </label>

            <label>
              <span>Party size *</span>
              <input name="partySize" value={form.partySize} onChange={updateField} inputMode="numeric" required />
            </label>

            <label>
              <span>Date *</span>
              <input name="date" type="date" value={form.date} onChange={updateField} min={editingId ? undefined : todayStr} required />
            </label>

            <label>
              <span>Start time *</span>
              <input name="startTime" type="time" value={form.startTime} onChange={updateField} required />
            </label>

            <label>
              <span>Duration *</span>
              <select name="durationMinutes" value={form.durationMinutes} onChange={updateField}>
                {DURATION_OPTIONS.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="booking-admin-end">
              <span>Ends at</span>
              <strong>{previewEnd ? formatTimeLabel(previewEnd) : "—"}</strong>
            </div>

            <label className="booking-admin-field--wide">
              <span>Notes *</span>
              <textarea name="notes" value={form.notes} onChange={updateField} rows={2} required />
            </label>
          </div>

          {localOverlap ? (
            <p className="booking-admin-warning">
              Heads up: this overlaps {localOverlap.customerName} ({formatTimeLabel(localOverlap.startTime)}–
              {formatTimeLabel(localOverlap.endTime)}). The server will reject it.
            </p>
          ) : null}

          {formError ? <p className="waiver-admin-error">{formError}</p> : null}

          {conflict && conflict.length ? (
            <div className="booking-admin-conflict">
              <strong>Slot already booked:</strong>
              <ul>
                {conflict.map((c) => (
                  <li key={c.id}>
                    {formatTimeLabel(c.startTime)}–{formatTimeLabel(c.endTime)} — {c.customerName}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="booking-admin-actions">
            <button type="submit" disabled={saving}>
              {saving ? "Saving…" : editingId ? "Save changes" : "Create booking"}
            </button>
            {editingId ? (
              <button type="button" className="booking-admin-btn--ghost" onClick={resetForm}>
                Cancel edit
              </button>
            ) : null}
            <button
              type="button"
              className="booking-admin-btn--ghost"
              onClick={() => createInvite(form)}
              disabled={invitingKey === "form"}
              title="Generate a party invite link from these details"
            >
              {invitingKey === "form" ? "Creating…" : "Create party link"}
            </button>
          </div>
        </form>

        <aside className="booking-admin-day">
          <h2>{form.date ? `Booked on ${form.date}` : "Availability"}</h2>
          {!form.date ? (
            <p className="booking-admin-day__hint">
              Pick a <strong>Date</strong> in the form (or click a day in the Calendar view) to see the
              bookings already on that day and avoid double-booking.
            </p>
          ) : null}
          {form.date && dayBookings.length === 0 ? (
            <p className="booking-admin-day__empty">No bookings yet — the day is wide open.</p>
          ) : null}
          <ul className="booking-admin-day__list">
            {dayBookings.map((b) => (
              <li key={b.id}>
                <strong>{formatTimeLabel(b.startTime)} – {formatTimeLabel(b.endTime)}</strong>
                <span>{b.customerName}{b.package ? ` · ${b.package}` : ""}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <div className="waiver-data-toolbar">
        <div className="booking-admin-toolbar-head">
          <div>
            <h2>All bookings</h2>
            <p>{filtered.length} {filtered.length === 1 ? "booking" : "bookings"}</p>
          </div>
          <div className="booking-view-toggle" role="tablist" aria-label="Bookings view">
            <button
              type="button"
              role="tab"
              aria-selected={view === "list"}
              className={view === "list" ? "is-active" : ""}
              onClick={() => setView("list")}
            >
              List
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === "calendar"}
              className={view === "calendar" ? "is-active" : ""}
              onClick={() => setView("calendar")}
            >
              Calendar
            </button>
          </div>
        </div>
        <div className="booking-admin-filters">
          <label>
            <span>Search</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, child, phone…" />
          </label>
          <label>
            <span>Status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
          <label>
            <span>From</span>
            <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          </label>
          <label>
            <span>To</span>
            <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          </label>
          <button type="button" className="booking-admin-btn--ghost" onClick={() => { setQuery(""); setStatusFilter("all"); setDateFrom(""); setDateTo(""); }}>
            Clear
          </button>
          <button type="button" onClick={exportCsv} disabled={!filtered.length}>
            Export CSV
          </button>
        </div>
      </div>

      {loading ? <p>Loading bookings…</p> : null}

      {!loading && view === "calendar" ? (
        <div className="booking-cal">
          <div className="booking-cal__head">
            <button type="button" className="booking-admin-btn--ghost" onClick={() => shiftMonth(-1)} aria-label="Previous month">‹</button>
            <strong>{calMonth.toLocaleString("en-US", { month: "long", year: "numeric" })}</strong>
            <button type="button" className="booking-admin-btn--ghost" onClick={() => shiftMonth(1)} aria-label="Next month">›</button>
            <button
              type="button"
              className="booking-admin-btn--ghost booking-cal__today"
              onClick={() => setCalMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
            >
              Today
            </button>
          </div>
          <div className="booking-cal__weekdays">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="booking-cal__grid">
            {calendarCells.map((cell, index) =>
              cell === null ? (
                <div className="booking-cal__cell is-empty" key={`pad-${index}`} />
              ) : (
                <div
                  className={`booking-cal__cell${cell.dateStr === todayStr ? " is-today" : ""}${cell.dateStr === form.date ? " is-selected" : ""}`}
                  key={cell.dateStr}
                  role="button"
                  tabIndex={0}
                  onClick={() => pickDate(cell.dateStr)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      pickDate(cell.dateStr);
                    }
                  }}
                >
                  <span className="booking-cal__date">{cell.day}</span>
                  <div className="booking-cal__events">
                    {cell.items.slice(0, 3).map((b) =>
                      isPast(b) ? (
                        <span
                          key={b.id}
                          className={`booking-cal__event booking-cal__event--${b.status} is-past`}
                          title={`${formatTimeLabel(b.startTime)}–${formatTimeLabel(b.endTime)} · ${b.customerName} (past)`}
                        >
                          <em>{formatTimeLabel(b.startTime)}</em> {b.customerName}
                        </span>
                      ) : (
                        <button
                          type="button"
                          key={b.id}
                          className={`booking-cal__event booking-cal__event--${b.status}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            startEdit(b);
                          }}
                          title={`${formatTimeLabel(b.startTime)}–${formatTimeLabel(b.endTime)} · ${b.customerName}`}
                        >
                          <em>{formatTimeLabel(b.startTime)}</em> {b.customerName}
                        </button>
                      ),
                    )}
                    {cell.items.length > 3 ? (
                      <span className="booking-cal__more">+{cell.items.length - 3} more</span>
                    ) : null}
                  </div>
                </div>
              ),
            )}
          </div>
          <p className="booking-cal__hint">Click a day to start a booking for it · click an event to edit.</p>
        </div>
      ) : null}

      {!loading && view === "list" && filtered.length === 0 ? (
        <p className="booking-admin-empty">No bookings match these filters.</p>
      ) : null}

      <div className="booking-admin-list" hidden={view !== "list"}>
        {visible.map((booking) => (
          <article
            className={`booking-admin-card${booking.status === "cancelled" ? " is-cancelled" : ""}`}
            key={booking.id}
          >
            <div className="booking-admin-card__when">
              <strong>{booking.date}</strong>
              <span>{formatTimeLabel(booking.startTime)} – {formatTimeLabel(booking.endTime)}</span>
              <em className={`booking-admin-status booking-admin-status--${booking.status}`}>{booking.status}</em>
            </div>
            <div className="booking-admin-card__who">
              <strong>{booking.customerName}</strong>
              <span>
                {[booking.childName && `Child: ${booking.childName}`, booking.childAge && `Age ${booking.childAge}`, booking.package, booking.partySize && `${booking.partySize} guests`, booking.partyId && `Party ID: ${booking.partyId}`]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
              <span className="booking-admin-card__contact">
                {[booking.phone, booking.email].filter(Boolean).join(" · ")}
              </span>
              {booking.notes ? <span className="booking-admin-card__notes">{booking.notes}</span> : null}
            </div>
            <div className="booking-admin-card__actions">
              {isPast(booking) ? (
                <span className="booking-admin-card__past">Past party · read-only</span>
              ) : (
                <>
                  <button type="button" onClick={() => startEdit(booking)}>Edit</button>
                  <button
                    type="button"
                    onClick={() => createInvite(booking)}
                    disabled={invitingKey === booking.id}
                    title="Create a party invite link from this booking"
                  >
                    {invitingKey === booking.id ? "…" : "Party link"}
                  </button>
                  <button
                    type="button"
                    onClick={() => openBookingEmail(booking)}
                    disabled={!booking.email}
                    title={booking.email ? "Email this contact" : "No email on this booking"}
                  >
                    Booking email
                  </button>
                  {booking.status === "cancelled" ? (
                    <button type="button" onClick={() => setStatus(booking, "confirmed")}>Restore</button>
                  ) : (
                    <button type="button" onClick={() => setStatus(booking, "cancelled")}>Cancel</button>
                  )}
                  <button type="button" className="booking-admin-btn--danger" onClick={() => removeBooking(booking)}>
                    Delete
                  </button>
                </>
              )}
            </div>
          </article>
        ))}
      </div>

      {view === "list" && filtered.length > PAGE_SIZE ? (
        <div className="waiver-data-pagination">
          <span>Page {currentPage} of {totalPages}</span>
          <div>
            <button type="button" disabled={currentPage === 1} onClick={() => setPage(1)}>First</button>
            <button type="button" disabled={currentPage === 1} onClick={() => setPage((c) => Math.max(1, c - 1))}>Previous</button>
            <button type="button" disabled={currentPage === totalPages} onClick={() => setPage((c) => Math.min(totalPages, c + 1))}>Next</button>
            <button type="button" disabled={currentPage === totalPages} onClick={() => setPage(totalPages)}>Last</button>
          </div>
        </div>
      ) : null}

      {inviteData ? <InviteModal data={inviteData} onClose={() => setInviteData(null)} /> : null}
      {emailTarget ? (
        <EmailComposeModal {...emailTarget} onClose={() => setEmailTarget(null)} />
      ) : null}
      {importPreview ? (
        <ImportPreviewModal
          preview={importPreview}
          importing={importing}
          onConfirm={confirmImport}
          onCancel={cancelImport}
        />
      ) : null}
    </AdminShell>
  );
}
