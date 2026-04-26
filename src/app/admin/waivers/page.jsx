"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import "../../styles/admin-waivers.css";

function formatDateTime(value) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function participantName(person = {}) {
  return [person.firstName, person.lastName].filter(Boolean).join(" ") || "Unnamed";
}

function WaiverCard({ waiver }) {
  const [open, setOpen] = useState(false);
  const familyMembers = Array.isArray(waiver.familyMembers) ? waiver.familyMembers : [];
  const attractions = Array.isArray(waiver.attractions) ? waiver.attractions : [];

  return (
    <article className="waiver-admin-card">
      <button type="button" className="waiver-admin-card__summary" onClick={() => setOpen((current) => !current)}>
        <span>
          <strong>{waiver.primaryName || participantName(waiver.primary)}</strong>
          <em>{waiver.primary?.email || "No email"}</em>
        </span>
        <span>
          <strong>{waiver.visit?.partyId || "No party ID"}</strong>
          <em>{waiver.visit?.visitDate || "No visit date"}</em>
        </span>
        <span>
          <strong>{waiver.participantCount || 1}</strong>
          <em>Participants</em>
        </span>
        <span>
          <strong>{formatDateTime(waiver.submittedAt)}</strong>
          <em>Submitted</em>
        </span>
      </button>

      {open ? (
        <div className="waiver-admin-card__details">
          <section>
            <h2>Primary Participant</h2>
            <dl>
              <div><dt>Name</dt><dd>{participantName(waiver.primary)}</dd></div>
              <div><dt>DOB</dt><dd>{waiver.primary?.dob || "Not provided"}</dd></div>
              <div><dt>Gender</dt><dd>{waiver.primary?.gender || "Not provided"}</dd></div>
              <div><dt>Email</dt><dd>{waiver.primary?.email || "Not provided"}</dd></div>
              <div><dt>Phone</dt><dd>{waiver.primary?.phone || "Not provided"}</dd></div>
              <div><dt>City</dt><dd>{waiver.primary?.city || "Not provided"}</dd></div>
              <div><dt>Medical notes</dt><dd>{waiver.primary?.medicalNotes || "None"}</dd></div>
            </dl>
          </section>

          <section>
            <h2>Visit</h2>
            <dl>
              <div><dt>Pass</dt><dd>{waiver.visit?.passType || "Not provided"}</dd></div>
              <div><dt>Party ID</dt><dd>{waiver.visit?.partyId || "Not provided"}</dd></div>
              <div><dt>Visit date</dt><dd>{waiver.visit?.visitDate || "Not provided"}</dd></div>
              <div><dt>Emergency contact</dt><dd>{waiver.visit?.emergencyName || "Not provided"}</dd></div>
              <div><dt>Relationship</dt><dd>{waiver.visit?.emergencyRelation || "Not provided"}</dd></div>
              <div><dt>Emergency phone</dt><dd>{waiver.visit?.emergencyPhone || "Not provided"}</dd></div>
              <div><dt>Printed name</dt><dd>{waiver.visit?.printName || "Not provided"}</dd></div>
              <div><dt>Signed date</dt><dd>{waiver.visit?.signDate || "Not provided"}</dd></div>
            </dl>
          </section>

          <section className="waiver-admin-card__wide">
            <h2>Family Members</h2>
            {familyMembers.length ? (
              <div className="waiver-admin-members">
                {familyMembers.map((member, index) => (
                  <div key={`${member.firstName}-${member.lastName}-${index}`}>
                    <strong>{participantName(member)}</strong>
                    <span>{member.type === "minor" ? "Minor under 18" : "Adult 18+"}</span>
                    <span>DOB: {member.dob || "Not provided"}</span>
                    <span>Gender: {member.gender || "Not provided"}</span>
                    {member.email ? <span>Email: {member.email}</span> : null}
                    <span>Medical: {member.medicalNotes || "None"}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p>No additional family members.</p>
            )}
          </section>

          <section className="waiver-admin-card__wide">
            <h2>Attractions</h2>
            <div className="waiver-admin-pills">
              {attractions.length ? attractions.map((attraction) => <span key={attraction}>{attraction}</span>) : <span>None selected</span>}
            </div>
          </section>

          <section className="waiver-admin-card__wide">
            <h2>Signature</h2>
            {waiver.signatureDataUrl ? (
              <img className="waiver-admin-signature" src={waiver.signatureDataUrl} alt={`Signature for ${waiver.primaryName || "waiver"}`} />
            ) : (
              <p>No signature image saved.</p>
            )}
          </section>
        </div>
      ) : null}
    </article>
  );
}

export default function AdminWaiversPage() {
  const [waivers, setWaivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [partyOnly, setPartyOnly] = useState(false);

  useEffect(() => {
    async function loadWaivers() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/admin/waivers", { cache: "no-store" });
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Unable to load waivers.");
          return;
        }

        setWaivers(data.waivers || []);
      } catch (loadError) {
        setError("Unable to load waivers.");
      } finally {
        setLoading(false);
      }
    }

    loadWaivers();
  }, []);

  const filteredWaivers = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return waivers.filter((waiver) => {
      const matchesSearch = !needle || [
        waiver.primaryName,
        waiver.primary?.email,
        waiver.primary?.phone,
        waiver.visit?.partyId,
        waiver.visit?.visitDate,
        waiver.visit?.passType,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));

      const waiverVisitDate = waiver.visit?.visitDate || "";
      const matchesFrom = !dateFrom || waiverVisitDate >= dateFrom;
      const matchesTo = !dateTo || waiverVisitDate <= dateTo;
      const matchesParty = !partyOnly || Boolean(waiver.visit?.partyId);

      return matchesSearch && matchesFrom && matchesTo && matchesParty;
    });
  }, [dateFrom, dateTo, partyOnly, query, waivers]);
  const searchSuggestions = useMemo(() => {
    const values = new Set();

    waivers.forEach((waiver) => {
      [
        waiver.primaryName,
        participantName(waiver.primary),
        waiver.primary?.email,
        waiver.primary?.phone,
        waiver.visit?.partyId,
        waiver.visit?.passType,
        waiver.visit?.visitDate,
      ]
        .filter(Boolean)
        .forEach((value) => values.add(String(value)));
    });

    return Array.from(values).sort((a, b) => a.localeCompare(b)).slice(0, 80);
  }, [waivers]);
  const totalParticipants = useMemo(
    () =>
      waivers.reduce(
        (total, waiver) => total + (Number(waiver.participantCount) || 1),
        0,
      ),
    [waivers],
  );
  const todayWaivers = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return waivers.filter((waiver) => waiver.visit?.visitDate === today).length;
  }, [waivers]);
  const latestWaiver = waivers[0];

  function clearFilters() {
    setQuery("");
    setDateFrom("");
    setDateTo("");
    setPartyOnly(false);
  }

  return (
    <main className="waiver-dashboard-shell">
      <aside className="waiver-dashboard-sidebar" aria-label="Dashboard navigation">
        <div className="waiver-dashboard-brand">
          <img src="/assets/images/logo.png" alt="Pixel Pulse Play" />
          <span>Admin</span>
        </div>
        <nav>
          <Link className="is-active" href="/admin/waivers">Waivers</Link>
          <Link href="/admin/invites">Invite Builder</Link>
          <Link href="/admin/blogs">Blogs</Link>
          <Link href="/waiver-data">Local Waiver Data</Link>
        </nav>
      </aside>

      <section className="waiver-admin-page waiver-admin-page--dashboard">
        <div className="waiver-admin-header waiver-admin-header--dashboard">
          <div>
            <span className="waiver-admin-kicker">Admin dashboard</span>
            <h1>Waiver Dashboard</h1>
            <p>Review submitted Pixel Pulse Play waivers and family participants.</p>
          </div>
        </div>

        <div className="waiver-admin-stats" aria-label="Waiver summary">
          <article>
            <span>Total Waivers</span>
            <strong>{waivers.length}</strong>
          </article>
          <article>
            <span>Participants</span>
            <strong>{totalParticipants}</strong>
          </article>
          <article>
            <span>Visits Today</span>
            <strong>{todayWaivers}</strong>
          </article>
          <article>
            <span>Latest</span>
            <strong>{latestWaiver ? formatDateTime(latestWaiver.submittedAt) : "None"}</strong>
          </article>
        </div>

        {loading ? <p className="waiver-admin-state">Loading waivers...</p> : null}
        {error ? <p className="waiver-admin-error">{error}</p> : null}

        {!loading && !error ? (
          <div className="waiver-admin-list waiver-admin-list--dashboard">
            <div className="waiver-data-toolbar">
              <div>
                <h2>Recent Waiver Submissions</h2>
                <p>{filteredWaivers.length} of {waivers.length} records shown</p>
              </div>
              <div className="waiver-data-filters">
                <label>
                  <span>Search</span>
                  <input
                    list="admin-waiver-search-suggestions"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Name, phone, email, party ID"
                  />
                  <datalist id="admin-waiver-search-suggestions">
                    {searchSuggestions.map((suggestion) => (
                      <option value={suggestion} key={suggestion} />
                    ))}
                  </datalist>
                </label>
                <label>
                  <span>From</span>
                  <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
                </label>
                <label>
                  <span>To</span>
                  <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
                </label>
                <label className="waiver-data-checkbox">
                  <input type="checkbox" checked={partyOnly} onChange={(event) => setPartyOnly(event.target.checked)} />
                  <span>Has party ID</span>
                </label>
                <button type="button" onClick={clearFilters}>Clear</button>
              </div>
            </div>
            {filteredWaivers.length ? (
              filteredWaivers.map((waiver) => <WaiverCard waiver={waiver} key={waiver.id} />)
            ) : (
              <p className="waiver-admin-state">No waivers found.</p>
            )}
          </div>
        ) : null}
      </section>
    </main>
  );
}
