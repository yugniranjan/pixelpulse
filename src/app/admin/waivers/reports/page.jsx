"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/AdminShell";
import EmailComposeModal from "@/components/admin/EmailComposeModal";
import "../../../styles/admin-waivers.css";
import "../../../styles/admin-bookings.css";

const FOLLOWUP_SUBJECT = "Thanks for visiting Pixel Pulse Play Zone!";
const FOLLOWUP_MESSAGE = [
  "Hi {name},",
  "",
  "Thanks for visiting Pixel Pulse Play Zone — we hope you had a blast!",
  "",
  "We'd love to see you again. Reply to this email or visit www.pixelpulseplay.ca to plan your next visit or book a birthday party.",
  "",
  "— Pixel Pulse Play Zone",
].join("\n");

const RECORD_LIMIT = 200;

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 29);
  return { from: isoDate(from), to: isoDate(to) };
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

function childrenLabel(children = []) {
  return children
    .map((child) => (child.age !== "" && child.age != null ? `${child.name} (${child.age})` : child.name))
    .join(", ");
}

export default function WaiverReportsPage() {
  const initial = defaultRange();
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [partyIdFilter, setPartyIdFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [emailTarget, setEmailTarget] = useState(null);

  async function loadReport(rangeFrom, rangeTo) {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (rangeFrom) params.set("from", rangeFrom);
      if (rangeTo) params.set("to", rangeTo);
      const response = await fetch(`/api/admin/waivers/report?${params.toString()}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Unable to build report.");
        setReport(null);
        return;
      }
      setReport(data);
    } catch {
      setError("Unable to build report.");
      setReport(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReport(initial.from, initial.to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = report?.summary || {};
  const filteredRows = useMemo(() => {
    const nameNeedle = nameFilter.trim().toLowerCase();
    const emailNeedle = emailFilter.trim().toLowerCase();
    const partyNeedle = partyIdFilter.trim().toLowerCase();

    return (report?.rows || []).filter((row) => {
      const childMatch = (row.children || []).some((child) =>
        String(child.name || "").toLowerCase().includes(nameNeedle),
      );
      const matchesName =
        !nameNeedle || String(row.primaryName || "").toLowerCase().includes(nameNeedle) || childMatch;
      const matchesEmail =
        !emailNeedle || String(row.email || "").toLowerCase().includes(emailNeedle);
      const matchesPartyId =
        !partyNeedle || String(row.partyId || "").toLowerCase().includes(partyNeedle);
      const matchesType = typeFilter === "all" || String(row.type || "").toLowerCase() === typeFilter;

      return matchesName && matchesEmail && matchesPartyId && matchesType;
    });
  }, [emailFilter, nameFilter, partyIdFilter, report, typeFilter]);

  // By-date is derived from the SAME filtered rows as the waiver list, so the
  // "Export by-date CSV" and "Export waiver list CSV" always reconcile.
  const filteredByDate = useMemo(() => {
    const map = new Map();
    for (const row of filteredRows) {
      const key = row.date || "—";
      const entry = map.get(key) || { date: key, waivers: 0, participants: 0 };
      entry.waivers += 1;
      entry.participants += Number(row.participants) || 0;
      map.set(key, entry);
    }
    return [...map.values()].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }, [filteredRows]);

  // Range KPIs reflect the current filters (week/month stay absolute from the API).
  const derived = useMemo(() => {
    let participants = 0;
    let party = 0;
    let walkIn = 0;
    for (const row of filteredRows) {
      participants += Number(row.participants) || 0;
      if (row.type === "Party") party += 1;
      else walkIn += 1;
    }
    return {
      totalWaivers: filteredRows.length,
      totalParticipants: participants,
      partyCount: party,
      walkInCount: walkIn,
    };
  }, [filteredRows]);

  const maxParticipants = useMemo(
    () => filteredByDate.reduce((max, row) => Math.max(max, row.participants), 0),
    [filteredByDate],
  );

  const kpis = [
    { label: "Total waivers", value: derived.totalWaivers },
    { label: "Total participants", value: derived.totalParticipants },
    { label: "Party waivers", value: derived.partyCount },
    { label: "Walk-in waivers", value: derived.walkInCount },
    { label: "This week", value: summary.weekWaivers ?? 0 },
    { label: "This month", value: summary.monthWaivers ?? 0 },
  ];

  function exportByDate() {
    if (!filteredByDate.length) return;
    const header = ["Date", "Waivers", "Participants"];
    const rows = filteredByDate.map((r) => [r.date, r.waivers, r.participants]);
    downloadCsv(`waiver-report-${from}_to_${to}.csv`, [header, ...rows]);
  }

  function exportWaivers() {
    if (!filteredRows.length) return;
    const header = [
      "Date",
      "Name",
      "Child names",
      "Child ages",
      "Email",
      "Phone",
      "Party ID",
      "Walk-in",
      "Party",
      "Type",
      "Participants",
      "Submitted",
    ];
    const rows = filteredRows.map((r) => [
      r.date,
      r.primaryName,
      (r.children || []).map((c) => c.name).join("; "),
      (r.children || []).map((c) => c.age).join("; "),
      r.email,
      r.phone,
      r.partyId,
      r.type === "Walk-in" ? "Yes" : "No",
      r.type === "Party" ? "Yes" : "No",
      r.type,
      r.participants,
      r.submittedAt,
    ]);
    downloadCsv(`waiver-list-${from}_to_${to}.csv`, [header, ...rows]);
  }

  function clearRecordFilters() {
    setNameFilter("");
    setEmailFilter("");
    setPartyIdFilter("");
    setTypeFilter("all");
  }

  const parentsWithEmail = useMemo(
    () => filteredRows.filter((row) => row.email).length,
    [filteredRows],
  );

  function emailOneParent(row) {
    if (!row.email) return;
    setEmailTarget({
      title: `Follow up with ${row.primaryName || "parent"}`,
      recipients: [{ email: row.email, name: row.primaryName }],
      defaultSubject: FOLLOWUP_SUBJECT,
      defaultMessage: FOLLOWUP_MESSAGE,
    });
  }

  function emailAllParents() {
    const recipients = filteredRows
      .filter((row) => row.email)
      .map((row) => ({ email: row.email, name: row.primaryName }));
    if (!recipients.length) {
      if (typeof window !== "undefined") {
        window.alert("No parents with an email address in the current filter.");
      }
      return;
    }
    setEmailTarget({
      title: "Follow-up to parents (current filter)",
      recipients,
      defaultSubject: FOLLOWUP_SUBJECT,
      defaultMessage: FOLLOWUP_MESSAGE,
    });
  }

  return (
    <AdminShell>
      <header className="booking-admin-header">
        <div>
          <h1>Waiver Reports</h1>
          <p>Submission volume and participants over time. Dates use the visit date, falling back to the submission date.</p>
        </div>
        <Link className="report-back-link" href="/admin/waivers">
          ← Back to waivers
        </Link>
      </header>

      <div className="waiver-data-toolbar">
        <div>
          <h2>Date range</h2>
          <p>{report?.range?.from || from} → {report?.range?.to || to}</p>
        </div>
        <div className="booking-admin-filters report-range-filters">
          <label>
            <span>From</span>
            <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
          </label>
          <label>
            <span>To</span>
            <input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
          </label>
          <button type="button" onClick={() => loadReport(from, to)}>Apply</button>
          <button type="button" className="booking-admin-btn--ghost" onClick={exportByDate} disabled={!report?.byDate?.length}>
            Export by-date CSV
          </button>
          <button type="button" className="booking-admin-btn--ghost" onClick={exportWaivers} disabled={!filteredRows.length}>
            Export waiver list CSV
          </button>
        </div>
      </div>

      {error ? <p className="waiver-admin-error">{error}</p> : null}
      {loading ? <p>Building report…</p> : null}

      {!loading && report ? (
        <>
          <div className="report-kpis">
            {kpis.map((kpi) => (
              <div className="report-kpi" key={kpi.label}>
                <strong>{kpi.value.toLocaleString()}</strong>
                <span>{kpi.label}</span>
              </div>
            ))}
          </div>

          <div className="report-bydate">
            <div className="report-bydate__head">
              <h2>By date</h2>
              <span>{filteredByDate.length} {filteredByDate.length === 1 ? "day" : "days"} with activity</span>
            </div>
            {filteredByDate.length === 0 ? (
              <p className="booking-admin-empty">No waivers in this range.</p>
            ) : (
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Waivers</th>
                    <th>Participants</th>
                    <th aria-hidden="true" />
                  </tr>
                </thead>
                <tbody>
                  {filteredByDate.map((row) => (
                    <tr key={row.date}>
                      <td>{row.date}</td>
                      <td>{row.waivers}</td>
                      <td>{row.participants}</td>
                      <td className="report-table__bar-cell">
                        <span
                          className="report-table__bar"
                          style={{ width: `${maxParticipants ? (row.participants / maxParticipants) * 100 : 0}%` }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="report-records">
            <div className="report-bydate__head">
              <h2>Waiver records</h2>
              <div className="report-records__headright">
                <span>
                  {filteredRows.length} of {report.rows.length} {report.rows.length === 1 ? "record" : "records"}
                </span>
                <button
                  type="button"
                  className="report-followup-btn"
                  onClick={emailAllParents}
                  disabled={!parentsWithEmail}
                  title={parentsWithEmail ? "Email all parents in the current filter" : "No parents with an email"}
                >
                  ✉ Send follow-up to all ({parentsWithEmail})
                </button>
              </div>
            </div>
            <div className="report-record-filters">
              <label>
                <span>Name</span>
                <input value={nameFilter} onChange={(event) => setNameFilter(event.target.value)} placeholder="Search name" />
              </label>
              <label>
                <span>Email</span>
                <input value={emailFilter} onChange={(event) => setEmailFilter(event.target.value)} placeholder="Search email" />
              </label>
              <label>
                <span>Party ID</span>
                <input value={partyIdFilter} onChange={(event) => setPartyIdFilter(event.target.value)} placeholder="Search Party ID" />
              </label>
              <label>
                <span>Type</span>
                <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                  <option value="all">All</option>
                  <option value="walk-in">Walk-in</option>
                  <option value="party">Party</option>
                </select>
              </label>
              <button type="button" className="booking-admin-btn--ghost" onClick={clearRecordFilters}>
                Clear filters
              </button>
            </div>
            {filteredRows.length === 0 ? (
              <p className="booking-admin-empty">No waivers in this range.</p>
            ) : (
              <>
                <div className="report-records__scroll">
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Name</th>
                        <th>Children (age)</th>
                        <th>Party ID</th>
                        <th>Email</th>
                        <th>Walk-in</th>
                        <th>Type</th>
                        <th aria-hidden="true" />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.slice(0, RECORD_LIMIT).map((row) => (
                        <tr key={row.id}>
                          <td>{row.date || "—"}</td>
                          <td>{row.primaryName || "—"}</td>
                          <td>{childrenLabel(row.children) || "—"}</td>
                          <td>{row.partyId || "—"}</td>
                          <td>{row.email || "—"}</td>
                          <td>{row.type === "Walk-in" ? "Yes" : "No"}</td>
                          <td>{row.type}</td>
                          <td>
                            <button
                              type="button"
                              className="report-row-email"
                              onClick={() => emailOneParent(row)}
                              disabled={!row.email}
                              title={row.email ? "Email this parent" : "No email"}
                            >
                              Email
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredRows.length > RECORD_LIMIT ? (
                  <p className="report-records__note">
                    Showing first {RECORD_LIMIT} of {filteredRows.length}. Use “Export waiver list CSV” for the full filtered set.
                  </p>
                ) : null}
              </>
            )}
          </div>
        </>
      ) : null}

      {emailTarget ? (
        <EmailComposeModal {...emailTarget} onClose={() => setEmailTarget(null)} />
      ) : null}
    </AdminShell>
  );
}
