"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/AdminShell";
import EmailComposeModal from "@/components/admin/EmailComposeModal";
import "../../../styles/admin-waivers.css";
import "../../../styles/admin-bookings.css";

const HOST_SUBJECT = "Your party at Pixel Pulse Play Zone";
const HOST_MESSAGE = [
  "Hi {name},",
  "",
  "Thanks so much for booking your party with Pixel Pulse Play Zone — we can't wait to host you and your guests!",
  "",
  "If you have any questions before your visit, just reply to this email and our team will help out.",
  "",
  "— Pixel Pulse Play Zone",
].join("\n");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function hasEmail(host) {
  return Boolean(host?.email && EMAIL_RE.test(host.email));
}

const SOURCE_LABELS = {
  booking: "from booking",
  waiver: "from signed waiver",
  "customer-export": "from customer export",
  "customer-report": "from customer report",
  "sales-report": "from sales report (unverified ages)",
};

function ChildCell({ name, age, source }) {
  if (!name) return "—";
  return (
    <span title={SOURCE_LABELS[source] || ""}>
      {name}
      {age !== "" && age != null ? <strong> · {String(age).includes(",") ? `Ages ${age}` : `Age ${age}`}</strong> : null}
      {source === "sales-report" ? <em className="party-hosts-srcflag"> ~</em> : null}
    </span>
  );
}

function SignersPanel({ signers = [] }) {
  if (!signers.length) return "—";
  return (
    <details className="report-child-panel">
      <summary>{signers.length} {signers.length === 1 ? "family" : "families"}</summary>
      <ul>
        {signers.map((s, index) => (
          <li key={`${s.email || s.name}-${index}`}>
            <span>
              {s.name || "—"}
              {s.children?.length ? ` (${s.children.map((c) => c.name).join(", ")})` : ""}
            </span>
            <strong>{s.email || "no email"}</strong>
          </li>
        ))}
      </ul>
    </details>
  );
}

export default function PartyHostsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [emailableOnly, setEmailableOnly] = useState(false);
  const [emailTarget, setEmailTarget] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/parties/roster", { cache: "no-store" });
        const body = await res.json();
        if (!res.ok) {
          setError(body.error || "Unable to load party hosts.");
          return;
        }
        setData(body);
      } catch {
        setError("Unable to load party hosts.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const parties = useMemo(() => data?.parties || [], [data]);
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return parties.filter((p) => {
      if (emailableOnly && !hasEmail(p.host)) return false;
      if (!needle) return true;
      return (
        String(p.host.name || "").toLowerCase().includes(needle) ||
        String(p.host.email || "").toLowerCase().includes(needle) ||
        String(p.partyId || "").toLowerCase().includes(needle) ||
        String(p.host.childName || "").toLowerCase().includes(needle)
      );
    });
  }, [parties, search, emailableOnly]);

  const emailableHosts = useMemo(() => filtered.filter((p) => hasEmail(p.host)), [filtered]);

  // Only hosts with a usable email are selectable. Selection is keyed by party ID.
  const selectableIds = useMemo(() => emailableHosts.map((p) => p.partyId), [emailableHosts]);
  const allVisibleSelected =
    selectableIds.length > 0 && selectableIds.every((id) => selectedIds.includes(id));
  const selectedHosts = useMemo(
    () => emailableHosts.filter((p) => selectedIds.includes(p.partyId)),
    [emailableHosts, selectedIds],
  );

  function toggleRow(id) {
    setSelectedIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  function toggleVisible() {
    setSelectedIds((cur) => {
      if (allVisibleSelected) return cur.filter((id) => !selectableIds.includes(id));
      return Array.from(new Set([...cur, ...selectableIds]));
    });
  }

  function emailSelected() {
    if (!selectedHosts.length) return;
    setEmailTarget({
      title: `Email ${selectedHosts.length} selected ${selectedHosts.length === 1 ? "host" : "hosts"}`,
      recipients: selectedHosts.map((p) => ({ email: p.host.email, name: p.host.name })),
      defaultSubject: HOST_SUBJECT,
      defaultMessage: HOST_MESSAGE,
    });
  }

  function emailHost(party) {
    if (!hasEmail(party.host)) return;
    setEmailTarget({
      title: `Email host — Party ${party.partyId}`,
      recipients: [{ email: party.host.email, name: party.host.name }],
      defaultSubject: HOST_SUBJECT,
      defaultMessage: HOST_MESSAGE,
    });
  }

  function emailAllHosts() {
    if (!emailableHosts.length) return;
    setEmailTarget({
      title: `Email ${emailableHosts.length} party hosts`,
      recipients: emailableHosts.map((p) => ({ email: p.host.email, name: p.host.name })),
      defaultSubject: HOST_SUBJECT,
      defaultMessage: HOST_MESSAGE,
    });
  }

  const stats = data?.stats || {};

  return (
    <AdminShell>
      <header className="booking-admin-header">
        <div>
          <h1>Party Hosts</h1>
          <p>The person who booked each party (from the booking record), with their child and guest count. Send a targeted email to a host below.</p>
        </div>
        <Link className="report-back-link" href="/admin/waivers">
          ← Back to waivers
        </Link>
      </header>

      {error ? <p className="waiver-admin-error">{error}</p> : null}
      {loading ? <p>Loading party hosts…</p> : null}

      {!loading && data ? (
        <>
          <div className="report-kpis">
            <div className="report-kpi"><strong>{(stats.totalParties ?? 0).toLocaleString()}</strong><span>Parties booked</span></div>
            <div className="report-kpi"><strong>{(stats.withHostEmail ?? 0).toLocaleString()}</strong><span>Hosts with email</span></div>
            <div className="report-kpi"><strong>{(stats.waiverOnlyParties ?? 0).toLocaleString()}</strong><span>Parties w/ waivers, no booking</span></div>
          </div>

          <div className="report-records">
            <div className="report-bydate__head">
              <h2>Hosts</h2>
              <div className="report-records__headright">
                <span>{filtered.length} of {parties.length} {parties.length === 1 ? "party" : "parties"}</span>
                <button
                  type="button"
                  className="report-followup-btn"
                  onClick={emailAllHosts}
                  disabled={!emailableHosts.length}
                  title={emailableHosts.length ? "Email every host in the current filter" : "No hosts with an email"}
                >
                  ✉ Email all hosts ({emailableHosts.length})
                </button>
                <button
                  type="button"
                  className="report-followup-btn report-followup-btn--selected"
                  onClick={emailSelected}
                  disabled={!selectedHosts.length}
                  title={selectedHosts.length ? "Email the selected hosts" : "Select hosts with an email"}
                >
                  Email selected ({selectedHosts.length})
                </button>
              </div>
            </div>

            <div className="report-record-filters">
              <label>
                <span>Search</span>
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Host, email, party ID, child" />
              </label>
              <label className="party-hosts-toggle">
                <span>Has email</span>
                <input type="checkbox" checked={emailableOnly} onChange={(e) => setEmailableOnly(e.target.checked)} />
              </label>
            </div>

            {filtered.length === 0 ? (
              <p className="booking-admin-empty">No parties match.</p>
            ) : (
              <div className="report-records__scroll">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          checked={allVisibleSelected}
                          onChange={toggleVisible}
                          disabled={!selectableIds.length}
                          aria-label="Select all hosts with an email"
                        />
                      </th>
                      <th>Party ID</th>
                      <th>Date</th>
                      <th>Host</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Child</th>
                      <th>Signed families</th>
                      <th aria-hidden="true" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => (
                      <tr key={p.partyId}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(p.partyId)}
                            onChange={() => toggleRow(p.partyId)}
                            disabled={!hasEmail(p.host)}
                            aria-label={`Select ${p.host.name || "host"}`}
                            title={hasEmail(p.host) ? "Select this host" : "No usable email"}
                          />
                        </td>
                        <td>{p.partyId}</td>
                        <td>{p.visitDate || "—"}</td>
                        <td>{p.host.name || "—"}</td>
                        <td>{hasEmail(p.host) ? p.host.email : <span title="No usable email">{p.host.email || "—"}</span>}</td>
                        <td>{p.host.phone || "—"}</td>
                        <td><ChildCell name={p.host.childName} age={p.host.childAge} source={p.host.childSource} /></td>
                        <td><SignersPanel signers={p.signers} /></td>
                        <td>
                          <button
                            type="button"
                            className="report-row-email"
                            onClick={() => emailHost(p)}
                            disabled={!hasEmail(p.host)}
                            title={hasEmail(p.host) ? "Email this host" : "No usable email"}
                          >
                            Email host
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
