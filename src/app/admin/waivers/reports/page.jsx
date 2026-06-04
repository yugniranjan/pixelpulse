"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/AdminShell";
import "../../../styles/admin-waivers.css";
import "../../../styles/admin-bookings.css";

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

export default function WaiverReportsPage() {
  const initial = defaultRange();
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const maxParticipants = useMemo(() => {
    if (!report?.byDate?.length) return 0;
    return report.byDate.reduce((max, row) => Math.max(max, row.participants), 0);
  }, [report]);

  const summary = report?.summary || {};

  const kpis = [
    { label: "Total waivers", value: summary.totalWaivers ?? 0 },
    { label: "Total participants", value: summary.totalParticipants ?? 0 },
    { label: "Party waivers", value: summary.partyCount ?? 0 },
    { label: "Walk-in waivers", value: summary.walkInCount ?? 0 },
    { label: "This week", value: summary.weekWaivers ?? 0 },
    { label: "This month", value: summary.monthWaivers ?? 0 },
  ];

  function exportByDate() {
    if (!report?.byDate?.length) return;
    const header = ["Date", "Waivers", "Participants"];
    const rows = report.byDate.map((r) => [r.date, r.waivers, r.participants]);
    downloadCsv(`waiver-report-${from}_to_${to}.csv`, [header, ...rows]);
  }

  function exportWaivers() {
    if (!report?.rows?.length) return;
    const header = ["Date", "Name", "Type", "Participants", "Party ID", "Email", "Phone", "Submitted"];
    const rows = report.rows.map((r) => [
      r.date,
      r.primaryName,
      r.type,
      r.participants,
      r.partyId,
      r.email,
      r.phone,
      r.submittedAt,
    ]);
    downloadCsv(`waiver-list-${from}_to_${to}.csv`, [header, ...rows]);
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
          <button type="button" className="booking-admin-btn--ghost" onClick={exportWaivers} disabled={!report?.rows?.length}>
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
              <span>{report.byDate.length} {report.byDate.length === 1 ? "day" : "days"} with activity</span>
            </div>
            {report.byDate.length === 0 ? (
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
                  {report.byDate.map((row) => (
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
        </>
      ) : null}
    </AdminShell>
  );
}
