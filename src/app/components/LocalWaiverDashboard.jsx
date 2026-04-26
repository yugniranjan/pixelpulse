"use client";

import { useMemo, useState } from "react";

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

function WaiverRecord({ waiver }) {
  const familyMembers = Array.isArray(waiver.familyMembers) ? waiver.familyMembers : [];
  const attractions = Array.isArray(waiver.attractions) ? waiver.attractions : [];

  return (
    <details className="waiver-admin-card waiver-admin-card--intuitive">
      <summary className="waiver-admin-card__summary">
        <span>
          <strong>{waiver.primaryName || participantName(waiver.primary)}</strong>
          <em>{waiver.primary?.phone || waiver.primary?.email || "No contact"}</em>
        </span>
        <span>
          <strong>{waiver.visit?.partyId || "No party ID"}</strong>
          <em>{waiver.visit?.passType || "No pass type"}</em>
        </span>
        <span>
          <strong>{waiver.visit?.visitDate || "No visit date"}</strong>
          <em>{waiver.participantCount || 1} participant{Number(waiver.participantCount || 1) === 1 ? "" : "s"}</em>
        </span>
        <span>
          <strong>{formatDateTime(waiver.submittedAt)}</strong>
          <em>Open details</em>
        </span>
      </summary>

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
            <div><dt>Party ID</dt><dd>{waiver.visit?.partyId || "Not provided"}</dd></div>
            <div><dt>Pass</dt><dd>{waiver.visit?.passType || "Not provided"}</dd></div>
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
    </details>
  );
}

export default function LocalWaiverDashboard({ waivers }) {
  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [partyOnly, setPartyOnly] = useState(false);

  const filteredWaivers = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return waivers.filter((waiver) => {
      const matchesSearch = !needle || [
        waiver.primaryName,
        waiver.primary?.email,
        waiver.primary?.phone,
        waiver.visit?.partyId,
        waiver.visit?.passType,
        waiver.visit?.visitDate,
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

  function clearFilters() {
    setQuery("");
    setDateFrom("");
    setDateTo("");
    setPartyOnly(false);
  }

  return (
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
              list="waiver-search-suggestions"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name, phone, email, party ID"
            />
            <datalist id="waiver-search-suggestions">
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
        filteredWaivers.map((waiver) => <WaiverRecord waiver={waiver} key={waiver.id} />)
      ) : (
        <p className="waiver-admin-state">No waivers match the current filters.</p>
      )}
    </div>
  );
}
