"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/AdminShell";
import "../styles/admin-waivers.css";
import "../styles/admin-dashboard.css";

const MODULES = [
  {
    title: "Party Bookings",
    desc: "Create & manage bookings, availability calendar, party links.",
    href: "/admin/bookings",
    action: "Open bookings",
    accent: "#2563eb",
  },
  {
    title: "Player Info",
    desc: "Waivers, family members, party IDs, signatures, visit details.",
    href: "/admin/waivers",
    action: "View players",
    accent: "#a4cf5f",
  },
  {
    title: "Create Party Links",
    desc: "Birthday invite links, waiver links, SMS copy, and QR codes.",
    href: "/admin/invites",
    action: "Build invites",
    accent: "#fb923c",
  },
  {
    title: "Gift Cards",
    desc: "Create digital 30, 60, and 90 minute gameplay gift cards.",
    href: "/admin/gift-cards",
    action: "Create cards",
    accent: "#33e6df",
  },
  {
    title: "Blogs",
    desc: "Create, edit, publish, and remove Pixel Pulse blog posts.",
    href: "/admin/blogs",
    action: "Manage blogs",
    accent: "#f43f5e",
  },
];

function shouldUseDocumentNavigation(href) {
  return href.startsWith("/admin/blogs");
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function todayStr() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

function timeLabel(value = "") {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!m) return value || "";
  let h = Number(m[1]);
  const period = h >= 12 ? "PM" : "AM";
  h = h % 12 === 0 ? 12 : h % 12;
  return `${h}:${m[2]} ${period}`;
}

function effectiveWaiverDate(waiver = {}) {
  const visitDate = waiver.visit?.visitDate;
  if (/^\d{4}-\d{2}-\d{2}$/.test(visitDate || "")) return visitDate;
  return waiver.submittedAt ? String(waiver.submittedAt).slice(0, 10) : "";
}

function waiverParticipantCount(waiver = {}) {
  return Math.max(Number(waiver.participantCount) || 1, 1);
}

function isPartyWaiver(waiver = {}) {
  return Boolean(String(waiver.visit?.partyId || "").trim());
}

function startOfWeek(date) {
  const value = new Date(date);
  const day = value.getDay();
  value.setHours(0, 0, 0, 0);
  value.setDate(value.getDate() - day);
  return value;
}

function deriveReportFromWaivers(waivers = [], from = "", to = "") {
  const weekStart = startOfWeek(new Date());
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const byDateMap = new Map();
  const inRange = [];
  let weekWaivers = 0;
  let monthWaivers = 0;

  waivers.forEach((waiver) => {
    const date = effectiveWaiverDate(waiver);
    if (!date) return;

    const submittedAt = waiver.submittedAt ? new Date(waiver.submittedAt) : new Date(`${date}T00:00:00`);
    if (!Number.isNaN(submittedAt.getTime())) {
      if (submittedAt >= weekStart) weekWaivers += 1;
      if (submittedAt >= monthStart) monthWaivers += 1;
    }

    if ((from && date < from) || (to && date > to)) return;
    inRange.push(waiver);

    const entry = byDateMap.get(date) || { date, waivers: 0, participants: 0 };
    entry.waivers += 1;
    entry.participants += waiverParticipantCount(waiver);
    byDateMap.set(date, entry);
  });

  const partyCount = inRange.filter(isPartyWaiver).length;
  const walkInCount = Math.max(inRange.length - partyCount, 0);

  return {
    summary: {
      totalWaivers: inRange.length,
      totalParticipants: inRange.reduce((total, waiver) => total + waiverParticipantCount(waiver), 0),
      partyCount,
      walkInCount,
      weekWaivers,
      monthWaivers,
    },
    byDate: [...byDateMap.values()].sort((a, b) => (a.date < b.date ? -1 : 1)),
  };
}

export default function AdminDashboardPage() {
  const [report, setReport] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 29);

    async function load() {
      setLoading(true);
      setErrors([]);
      try {
        const fromDate = isoDate(from);
        const toDate = isoDate(to);
        const [reportRes, bookingsRes] = await Promise.all([
          fetch(`/api/admin/waivers/report?from=${fromDate}&to=${toDate}`, { cache: "no-store" }),
          fetch("/api/admin/bookings", { cache: "no-store" }),
        ]);

        const nextErrors = [];

        if (reportRes.ok) {
          setReport(await reportRes.json());
        } else {
          const waiversRes = await fetch("/api/admin/waivers?limit=1000", { cache: "no-store" });
          if (waiversRes.ok) {
            const data = await waiversRes.json();
            setReport(deriveReportFromWaivers(data.waivers || [], fromDate, toDate));
            nextErrors.push("Using waiver-list fallback because the summary report did not load.");
          } else {
            const data = await reportRes.json().catch(() => ({}));
            nextErrors.push(data.error || "Unable to load waiver report.");
          }
        }

        if (bookingsRes.ok) {
          const data = await bookingsRes.json();
          setBookings(data.bookings || []);
        } else {
          const data = await bookingsRes.json().catch(() => ({}));
          nextErrors.push(data.error || "Unable to load bookings.");
        }
        setErrors(nextErrors);
      } catch (error) {
        setErrors([error?.message || "Unable to load dashboard data."]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const summary = report?.summary || {};

  // Daily series (last 14 active days) for the bar chart.
  const series = useMemo(() => {
    const byDate = [...(report?.byDate || [])].sort((a, b) => (a.date < b.date ? -1 : 1));
    return byDate.slice(-14);
  }, [report]);
  const maxWaivers = useMemo(() => series.reduce((m, d) => Math.max(m, d.waivers), 0), [series]);

  const party = summary.partyCount || 0;
  const walkIn = summary.walkInCount || 0;
  const totalTyped = party + walkIn;
  const partyPct = totalTyped ? Math.round((party / totalTyped) * 100) : 0;

  const today = todayStr();
  const upcoming = useMemo(
    () =>
      bookings
        .filter((b) => b.status !== "cancelled" && b.date >= today)
        .sort((a, b) => (a.date === b.date ? (a.startMinutes ?? 0) - (b.startMinutes ?? 0) : a.date < b.date ? -1 : 1)),
    [bookings, today],
  );

  const kpis = [
    { label: "Waivers · 30d", value: summary.totalWaivers ?? 0, accent: "#a4cf5f" },
    { label: "Participants · 30d", value: summary.totalParticipants ?? 0, accent: "#38bdf8" },
    { label: "Upcoming bookings", value: upcoming.length, accent: "#2563eb" },
    { label: "Party waivers · 30d", value: party, accent: "#8b5cf6" },
    { label: "Waivers this week", value: summary.weekWaivers ?? 0, accent: "#fb923c" },
    { label: "Waivers this month", value: summary.monthWaivers ?? 0, accent: "#f43f5e" },
  ];

  return (
    <AdminShell>
      <div className="waiver-admin-header waiver-admin-header--dashboard dash-header">
        <div>
          <span className="waiver-admin-kicker">Admin dashboard</span>
          <h1>Pixel Pulse Admin</h1>
          <p>Live snapshot of bookings, waivers, and party activity.</p>
        </div>
      </div>

      {loading ? <p className="dash-loading">Loading dashboard…</p> : null}
      {errors.length ? (
        <div className="waiver-admin-error">
          {errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      ) : null}

      <div className="dash-kpis">
        {kpis.map((kpi) => (
          <div className="dash-kpi" key={kpi.label} style={{ "--accent": kpi.accent }}>
            <strong>{Number(kpi.value).toLocaleString()}</strong>
            <span>{kpi.label}</span>
          </div>
        ))}
      </div>

      <div className="dash-charts">
        <section className="dash-card dash-card--wide">
          <div className="dash-card__head">
            <h2>Waivers — last 14 active days</h2>
            <span>Bars show waivers; hover for participants</span>
          </div>
          {series.length ? (
            <div className="dash-bars">
              {series.map((d) => (
                <div
                  className="dash-bar-col"
                  key={d.date}
                  title={`${d.date}: ${d.waivers} waivers · ${d.participants} participants`}
                >
                  <div className="dash-bar-track">
                    <div
                      className="dash-bar"
                      style={{ height: `${maxWaivers ? (d.waivers / maxWaivers) * 100 : 0}%` }}
                    />
                  </div>
                  <span>{d.date.slice(5)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="dash-empty">No waiver activity yet.</p>
          )}
        </section>

        <section className="dash-card">
          <div className="dash-card__head">
            <h2>Party vs walk-in</h2>
            <span>Last 30 days</span>
          </div>
          <div className="dash-donut-wrap">
            <div
              className="dash-donut"
              style={{ "--p": partyPct }}
              role="img"
              aria-label={`${partyPct}% party waivers`}
            >
              <div className="dash-donut__hole">
                <strong>{totalTyped.toLocaleString()}</strong>
                <span>waivers</span>
              </div>
            </div>
            <ul className="dash-legend">
              <li><i style={{ background: "#a4cf5f" }} /> Party <strong>{party}</strong></li>
              <li><i style={{ background: "#fb923c" }} /> Walk-in <strong>{walkIn}</strong></li>
            </ul>
          </div>
        </section>
      </div>

      <div className="dash-lower">
        <section className="dash-card">
          <div className="dash-card__head">
            <h2>Upcoming parties</h2>
            <Link href="/admin/bookings" className="dash-card__link">View all</Link>
          </div>
          {upcoming.length ? (
            <ul className="dash-upcoming">
              {upcoming.slice(0, 6).map((b) => (
                <li key={b.id}>
                  <div className="dash-upcoming__when">
                    <strong>{b.date}</strong>
                    <span>{timeLabel(b.startTime)}</span>
                  </div>
                  <div className="dash-upcoming__who">
                    <strong>{b.customerName}</strong>
                    <span>{[b.childName && `${b.childName}`, b.package].filter(Boolean).join(" · ")}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="dash-empty">No upcoming bookings.</p>
          )}
        </section>

        <section className="dash-card">
          <div className="dash-card__head">
            <h2>Modules</h2>
          </div>
          <div className="dash-modules">
            {MODULES.map((m) => {
              const content = (
                <>
                  <span className="dash-module__title">{m.title}</span>
                  <span className="dash-module__desc">{m.desc}</span>
                  <span className="dash-module__action">{m.action} →</span>
                </>
              );

              if (shouldUseDocumentNavigation(m.href)) {
                return (
                  <a className="dash-module" href={m.href} key={m.href} style={{ "--accent": m.accent }}>
                    {content}
                  </a>
                );
              }

              return (
                <Link className="dash-module" href={m.href} key={m.href} style={{ "--accent": m.accent }}>
                  {content}
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
