"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import "../../styles/admin-waivers.css";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const DEFAULT_PARTY_FORM = {
  partyId: "",
  primaryParticipant: "",
  visitDate: "",
  visitTime: "",
};

function formatDate(value) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function formatDateTime(value) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function participantName(person = {}) {
  return person.fullLegalName || [person.firstName, person.lastName].filter(Boolean).join(" ") || "Unnamed";
}

function makeEditForm(waiver) {
  return {
    primary: {
      firstName: waiver.primary?.firstName || "",
      lastName: waiver.primary?.lastName || "",
      dob: waiver.primary?.dob || "",
      gender: waiver.primary?.gender || "",
      email: waiver.primary?.email || "",
      phone: waiver.primary?.phone || "",
      city: waiver.primary?.city || "",
      healthCondition: waiver.primary?.healthCondition || "Not Applicable",
      medicalNotes: waiver.primary?.medicalNotes || "",
    },
    visit: {
      partyId: waiver.visit?.partyId || "",
      partyName: waiver.visit?.partyName || "",
      passType: waiver.visit?.passType || "",
      visitDate: waiver.visit?.visitDate || "",
      visitTime: waiver.visit?.visitTime || "",
      emergencyName: waiver.visit?.emergencyName || "",
      emergencyRelation: waiver.visit?.emergencyRelation || "",
      emergencyPhone: waiver.visit?.emergencyPhone || "",
      printName: waiver.visit?.printName || "",
      signDate: waiver.visit?.signDate || "",
    },
  };
}

function WaiverEditModal({ form, onChange, onClose, onSave, saving, error }) {
  function update(section, field, value) {
    onChange((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value,
      },
    }));
  }

  return (
    <div className="waiver-edit-backdrop" role="presentation">
      <form className="waiver-edit-modal" onSubmit={onSave}>
        <div className="waiver-edit-modal__head">
          <div>
            <span className="waiver-admin-kicker">Edit record</span>
            <h2>Update Waiver</h2>
          </div>
          <button type="button" onClick={onClose}>Close</button>
        </div>

        <section>
          <h3>Primary Participant</h3>
          <div className="waiver-edit-grid">
            <label><span>First name</span><input required value={form.primary.firstName} onChange={(event) => update("primary", "firstName", event.target.value)} /></label>
            <label><span>Last name</span><input required value={form.primary.lastName} onChange={(event) => update("primary", "lastName", event.target.value)} /></label>
            <label><span>DOB</span><input type="date" value={form.primary.dob} onChange={(event) => update("primary", "dob", event.target.value)} /></label>
            <label><span>Gender</span><input value={form.primary.gender} onChange={(event) => update("primary", "gender", event.target.value)} /></label>
            <label><span>Email</span><input type="email" value={form.primary.email} onChange={(event) => update("primary", "email", event.target.value)} /></label>
            <label><span>Phone</span><input value={form.primary.phone} onChange={(event) => update("primary", "phone", event.target.value)} /></label>
            <label><span>City</span><input value={form.primary.city} onChange={(event) => update("primary", "city", event.target.value)} /></label>
            <label><span>Health condition</span><input value={form.primary.healthCondition} onChange={(event) => update("primary", "healthCondition", event.target.value)} /></label>
            <label className="waiver-edit-wide"><span>Medical notes</span><textarea value={form.primary.medicalNotes} onChange={(event) => update("primary", "medicalNotes", event.target.value)} /></label>
          </div>
        </section>

        <section>
          <h3>Visit</h3>
          <div className="waiver-edit-grid">
            <label><span>Party ID</span><input value={form.visit.partyId} onChange={(event) => update("visit", "partyId", event.target.value)} /></label>
            <label><span>Party name</span><input value={form.visit.partyName} onChange={(event) => update("visit", "partyName", event.target.value)} /></label>
            <label><span>Pass type</span><input value={form.visit.passType} onChange={(event) => update("visit", "passType", event.target.value)} /></label>
            <label><span>Visit date</span><input type="date" value={form.visit.visitDate} onChange={(event) => update("visit", "visitDate", event.target.value)} /></label>
            <label><span>Party time</span><input type="time" value={form.visit.visitTime} onChange={(event) => update("visit", "visitTime", event.target.value)} /></label>
            <label><span>Emergency name</span><input value={form.visit.emergencyName} onChange={(event) => update("visit", "emergencyName", event.target.value)} /></label>
            <label><span>Relationship</span><input value={form.visit.emergencyRelation} onChange={(event) => update("visit", "emergencyRelation", event.target.value)} /></label>
            <label><span>Emergency phone</span><input value={form.visit.emergencyPhone} onChange={(event) => update("visit", "emergencyPhone", event.target.value)} /></label>
            <label><span>Printed name</span><input value={form.visit.printName} onChange={(event) => update("visit", "printName", event.target.value)} /></label>
            <label><span>Signed date</span><input type="date" value={form.visit.signDate} onChange={(event) => update("visit", "signDate", event.target.value)} /></label>
          </div>
        </section>

        {error ? <p className="waiver-admin-error">{error}</p> : null}

        <div className="waiver-edit-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
        </div>
      </form>
    </div>
  );
}

function PartyWaiverLinkBuilder() {
  const [form, setForm] = useState(DEFAULT_PARTY_FORM);
  const [copied, setCopied] = useState("");
  const [origin, setOrigin] = useState("");
  const [savingParty, setSavingParty] = useState(false);
  const [partyMessage, setPartyMessage] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const waiverUrl = useMemo(() => {
    if (!origin) return "";
    const params = new URLSearchParams();
    if (form.partyId) params.set("partyId", form.partyId);
    if (form.primaryParticipant) {
      params.set("primaryParticipant", form.primaryParticipant);
      params.set("guestName", form.primaryParticipant);
    }
    if (form.visitDate) {
      params.set("visitDate", form.visitDate);
      params.set("date", form.visitDate);
    }
    if (form.visitTime) {
      params.set("visitTime", form.visitTime);
      params.set("time", form.visitTime);
    }
    const query = params.toString();
    return `${origin}/waiver${query ? `?${query}` : ""}`;
  }, [form.partyId, form.primaryParticipant, form.visitDate, form.visitTime, origin]);

  function update(field, value) {
    setCopied("");
    setPartyMessage("");
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function savePartyWaiver() {
    setSavingParty(true);
    setCopied("");
    setPartyMessage("");

    try {
      const response = await fetch("/api/admin/party-waivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) {
        setPartyMessage(data.error || "Unable to save party waiver details.");
        return false;
      }

      setPartyMessage("Party waiver details saved.");
      return true;
    } catch (saveError) {
      setPartyMessage("Unable to save party waiver details.");
      return false;
    } finally {
      setSavingParty(false);
    }
  }

  async function copyLink() {
    if (!waiverUrl) return;
    const saved = await savePartyWaiver();
    if (!saved) return;
    await navigator.clipboard.writeText(waiverUrl);
    setCopied("Waiver link copied.");
  }

  return (
    <section className="party-link-builder">
      <div>
        <span className="waiver-admin-kicker">Party waiver setup</span>
        <h2>Create a Party Waiver Link</h2>
        <p>Enter the Party ID once, then share this link so every guest waiver is attached to the same party.</p>
      </div>
      <div className="party-link-grid">
        <label>
          <span>Party ID</span>
          <input required value={form.partyId} onChange={(event) => update("partyId", event.target.value)} placeholder="PP-0428-01" />
        </label>
        <label>
          <span>Primary Participant</span>
          <input value={form.primaryParticipant} onChange={(event) => update("primaryParticipant", event.target.value)} placeholder="Vijayant Verma" />
        </label>
        <label>
          <span>Visit date</span>
          <input type="date" value={form.visitDate} onChange={(event) => update("visitDate", event.target.value)} />
        </label>
        <label>
          <span>Party time</span>
          <input type="time" value={form.visitTime} onChange={(event) => update("visitTime", event.target.value)} />
        </label>
      </div>
      <div className="party-link-output">
        <span>Prefilled waiver URL</span>
        <a href={waiverUrl} target="_blank" rel="noopener noreferrer">{waiverUrl}</a>
        <button type="button" onClick={copyLink} disabled={savingParty}>
          {savingParty ? "Saving..." : "Save & Copy Link"}
        </button>
      </div>
      {partyMessage ? <p className="party-link-copied">{partyMessage}</p> : null}
      {copied ? <p className="party-link-copied">{copied}</p> : null}
    </section>
  );
}

function WaiverCard({ waiver, onDelete, onEdit }) {
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
              <div><dt>Full legal name</dt><dd>{participantName(waiver.primary)}</dd></div>
              <div><dt>DOB</dt><dd>{waiver.primary?.dob || "Not provided"}</dd></div>
              <div><dt>Gender</dt><dd>{waiver.primary?.gender || "Not provided"}</dd></div>
              <div><dt>Email</dt><dd>{waiver.primary?.email || "Not provided"}</dd></div>
              <div><dt>Phone</dt><dd>{waiver.primary?.phone || "Not provided"}</dd></div>
              <div><dt>City</dt><dd>{waiver.primary?.city || "Not provided"}</dd></div>
              <div><dt>Health condition</dt><dd>{waiver.primary?.healthCondition || "Not Applicable"}</dd></div>
              <div><dt>Medical notes</dt><dd>{waiver.primary?.medicalNotes || "None"}</dd></div>
            </dl>
          </section>

          <section>
            <h2>Visit</h2>
            <dl>
              <div><dt>Pass</dt><dd>{waiver.visit?.passType || "Not provided"}</dd></div>
              <div><dt>Party ID</dt><dd>{waiver.visit?.partyId || "Not provided"}</dd></div>
              <div><dt>Party name</dt><dd>{waiver.visit?.partyName || "Not provided"}</dd></div>
              <div><dt>Visit date</dt><dd>{waiver.visit?.visitDate || "Not provided"}</dd></div>
              <div><dt>Party time</dt><dd>{waiver.visit?.visitTime || "Not provided"}</dd></div>
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
                    <span>Health: {member.healthCondition || "Not Applicable"}</span>
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

          <section className="waiver-admin-card__wide waiver-record-actions">
            <h2>Record Actions</h2>
            <div>
              <button type="button" onClick={() => onEdit(waiver)}>Edit Record</button>
              <button type="button" className="is-danger" onClick={() => onDelete(waiver)}>Delete Record</button>
            </div>
          </section>
        </div>
      ) : null}
    </article>
  );
}

function PlayerCard({ player, onDelete }) {
  const [open, setOpen] = useState(false);

  return (
    <article className="waiver-admin-card">
      <button type="button" className="waiver-admin-card__summary player-admin-card__summary" onClick={() => setOpen((current) => !current)}>
        <span>
          <strong>{player.fullName}</strong>
          <em>{player.email || "No email"}</em>
        </span>
        <span>
          <strong>{player.playerId}</strong>
          <em>Player ID</em>
        </span>
        <span>
          <strong>{player.signeeId || "-"}</strong>
          <em>Signee ID</em>
        </span>
        <span>
          <strong>{formatDateTime(player.createdAt)}</strong>
          <em>Created</em>
        </span>
      </button>

      {open ? (
        <div className="waiver-admin-card__details">
          <section>
            <h2>Player</h2>
            <dl>
              <div><dt>Player ID</dt><dd>{player.playerId}</dd></div>
              <div><dt>First name</dt><dd>{player.firstName || "Not provided"}</dd></div>
              <div><dt>Last name</dt><dd>{player.lastName || "Not provided"}</dd></div>
              <div><dt>Date of birth</dt><dd>{formatDate(player.dateOfBirth)}</dd></div>
              <div><dt>Email</dt><dd>{player.email || "Not provided"}</dd></div>
            </dl>
          </section>

          <section>
            <h2>Record</h2>
            <dl>
              <div><dt>Signee ID</dt><dd>{player.signeeId || "Not provided"}</dd></div>
              <div><dt>Location</dt><dd>{player.locationName || "Vaughan"}</dd></div>
              <div><dt>Location ID</dt><dd>{player.locationId || "2"}</dd></div>
              <div><dt>Date signed</dt><dd>{formatDateTime(player.dateSigned)}</dd></div>
              <div><dt>Updated</dt><dd>{formatDateTime(player.updatedAt)}</dd></div>
            </dl>
          </section>

          <section className="waiver-admin-card__wide waiver-record-actions">
            <h2>Record Actions</h2>
            <div>
              <button type="button" className="is-danger" onClick={() => onDelete(player)}>Delete Player</button>
            </div>
          </section>
        </div>
      ) : null}
    </article>
  );
}

export default function AdminWaiversPage() {
  const [activeTab, setActiveTab] = useState("waivers");
  const [waivers, setWaivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [partyOnly, setPartyOnly] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [editingWaiver, setEditingWaiver] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");
  const [players, setPlayers] = useState([]);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [playersError, setPlayersError] = useState("");
  const [playerQuery, setPlayerQuery] = useState("");
  const [playerDateFrom, setPlayerDateFrom] = useState("");
  const [playerDateTo, setPlayerDateTo] = useState("");
  const [playerPageSize, setPlayerPageSize] = useState(25);
  const [playerPage, setPlayerPage] = useState(1);

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

  useEffect(() => {
    if (activeTab !== "players" || players.length || playersLoading) return;

    async function loadPlayers() {
      setPlayersLoading(true);
      setPlayersError("");

      try {
        const response = await fetch("/api/admin/players?locationId=2&limit=1000", { cache: "no-store" });
        const data = await response.json();

        if (!response.ok) {
          setPlayersError(data.error || "Unable to load players.");
          return;
        }

        setPlayers(data.players || []);
      } catch (loadError) {
        setPlayersError("Unable to load players.");
      } finally {
        setPlayersLoading(false);
      }
    }

    loadPlayers();
  }, [activeTab, players.length, playersLoading]);

  const filteredWaivers = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return waivers.filter((waiver) => {
      const matchesSearch = !needle || [
        waiver.primaryName,
        waiver.primary?.email,
        waiver.primary?.phone,
        waiver.visit?.partyId,
        waiver.visit?.partyName,
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
        waiver.visit?.partyName,
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
  const totalPages = Math.max(1, Math.ceil(filteredWaivers.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const pageEnd = pageStart + pageSize;
  const visibleWaivers = filteredWaivers.slice(pageStart, pageEnd);
  const firstVisibleRecord = filteredWaivers.length ? pageStart + 1 : 0;
  const lastVisibleRecord = Math.min(pageEnd, filteredWaivers.length);

  useEffect(() => {
    setPage(1);
  }, [dateFrom, dateTo, pageSize, partyOnly, query]);

  const filteredPlayers = useMemo(() => {
    const needle = playerQuery.trim().toLowerCase();

    return players.filter((player) => {
      const matchesSearch = !needle || [
        player.playerId,
        player.fullName,
        player.firstName,
        player.lastName,
        player.email,
        player.signeeId,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));

      const signedDate = player.dateSigned ? player.dateSigned.slice(0, 10) : "";
      const matchesFrom = !playerDateFrom || signedDate >= playerDateFrom;
      const matchesTo = !playerDateTo || signedDate <= playerDateTo;

      return matchesSearch && matchesFrom && matchesTo;
    });
  }, [playerDateFrom, playerDateTo, playerQuery, players]);
  const playerTotalPages = Math.max(1, Math.ceil(filteredPlayers.length / playerPageSize));
  const currentPlayerPage = Math.min(playerPage, playerTotalPages);
  const playerPageStart = (currentPlayerPage - 1) * playerPageSize;
  const playerPageEnd = playerPageStart + playerPageSize;
  const visiblePlayers = filteredPlayers.slice(playerPageStart, playerPageEnd);
  const firstVisiblePlayer = filteredPlayers.length ? playerPageStart + 1 : 0;
  const lastVisiblePlayer = Math.min(playerPageEnd, filteredPlayers.length);
  const latestPlayer = players[0];

  useEffect(() => {
    setPlayerPage(1);
  }, [playerDateFrom, playerDateTo, playerPageSize, playerQuery]);

  function clearFilters() {
    setQuery("");
    setDateFrom("");
    setDateTo("");
    setPartyOnly(false);
  }

  function clearPlayerFilters() {
    setPlayerQuery("");
    setPlayerDateFrom("");
    setPlayerDateTo("");
  }

  function startEditWaiver(waiver) {
    setEditingWaiver(waiver);
    setEditForm(makeEditForm(waiver));
    setEditError("");
  }

  function closeEditWaiver() {
    setEditingWaiver(null);
    setEditForm(null);
    setEditError("");
  }

  async function saveWaiverEdit(event) {
    event.preventDefault();
    if (!editingWaiver || !editForm) return;

    setSavingEdit(true);
    setEditError("");

    try {
      const response = await fetch(`/api/admin/waivers?id=${encodeURIComponent(editingWaiver.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await response.json();

      if (!response.ok) {
        setEditError(data.error || "Unable to update waiver.");
        return;
      }

      setWaivers((current) =>
        current.map((waiver) => (waiver.id === data.waiver.id ? data.waiver : waiver)),
      );
      closeEditWaiver();
    } catch (saveError) {
      setEditError("Unable to update waiver.");
    } finally {
      setSavingEdit(false);
    }
  }

  async function deleteWaiver(waiver) {
    const confirmed = window.confirm(`Delete waiver for ${waiver.primaryName || participantName(waiver.primary)}? This cannot be undone.`);
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/admin/waivers?id=${encodeURIComponent(waiver.id)}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to delete waiver.");
        return;
      }

      setWaivers((current) => current.filter((item) => item.id !== waiver.id));
    } catch (deleteError) {
      setError("Unable to delete waiver.");
    }
  }

  async function deletePlayer(player) {
    const confirmed = window.confirm(
      `Delete player ${player.fullName || player.playerId}? Related wristband transactions and scores may also be removed. This cannot be undone.`,
    );
    if (!confirmed) return;

    setPlayersError("");

    try {
      const response = await fetch(`/api/admin/players?id=${encodeURIComponent(player.playerId)}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        setPlayersError(data.error || "Unable to delete player.");
        return;
      }

      setPlayers((current) => current.filter((item) => item.playerId !== data.id));
    } catch (deleteError) {
      setPlayersError("Unable to delete player.");
    }
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
            <p>Review submitted waivers and Vaughan player records from one place.</p>
          </div>
        </div>

        <div className="waiver-admin-tabs" role="tablist" aria-label="Waiver dashboard sections">
          <button type="button" className={activeTab === "waivers" ? "is-active" : ""} onClick={() => setActiveTab("waivers")}>Waivers</button>
          <button type="button" className={activeTab === "players" ? "is-active" : ""} onClick={() => setActiveTab("players")}>Players</button>
        </div>

        {activeTab === "waivers" ? (
          <>
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

            <PartyWaiverLinkBuilder />

            {loading ? <p className="waiver-admin-state">Loading waivers...</p> : null}
            {error ? <p className="waiver-admin-error">{error}</p> : null}

            {!loading && !error ? (
              <div className="waiver-admin-list waiver-admin-list--dashboard">
                <div className="waiver-data-toolbar">
                  <div>
                    <h2>Recent Waiver Submissions</h2>
                    <p>
                      Showing {firstVisibleRecord}-{lastVisibleRecord} of {filteredWaivers.length}
                      {filteredWaivers.length === waivers.length ? " records" : ` filtered records from ${waivers.length} total`}
                    </p>
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
                    <label>
                      <span>Show</span>
                      <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
                        {PAGE_SIZE_OPTIONS.map((option) => (
                          <option value={option} key={option}>{option}</option>
                        ))}
                      </select>
                    </label>
                    <button type="button" onClick={clearFilters}>Clear</button>
                  </div>
                </div>
                {visibleWaivers.length ? (
                  <>
                    {visibleWaivers.map((waiver) => (
                      <WaiverCard
                        waiver={waiver}
                        key={waiver.id}
                        onDelete={deleteWaiver}
                        onEdit={startEditWaiver}
                      />
                    ))}
                    <div className="waiver-data-pagination">
                      <span>Page {currentPage} of {totalPages}</span>
                      <div>
                        <button type="button" disabled={currentPage === 1} onClick={() => setPage(1)}>First</button>
                        <button type="button" disabled={currentPage === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button>
                        <button type="button" disabled={currentPage === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>Next</button>
                        <button type="button" disabled={currentPage === totalPages} onClick={() => setPage(totalPages)}>Last</button>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="waiver-admin-state">No waivers found.</p>
                )}
              </div>
            ) : null}
          </>
        ) : (
          <>
            <div className="waiver-admin-stats" aria-label="Player summary">
              <article>
                <span>Vaughan Players</span>
                <strong>{players.length}</strong>
              </article>
              <article>
                <span>Filtered</span>
                <strong>{filteredPlayers.length}</strong>
              </article>
              <article>
                <span>Location</span>
                <strong>Vaughan</strong>
              </article>
              <article>
                <span>Latest</span>
                <strong>{latestPlayer ? formatDateTime(latestPlayer.createdAt) : "None"}</strong>
              </article>
            </div>

            {playersLoading ? <p className="waiver-admin-state">Loading Vaughan players...</p> : null}
            {playersError ? <p className="waiver-admin-error">{playersError}</p> : null}

            {!playersLoading && !playersError ? (
              <div className="waiver-admin-list waiver-admin-list--dashboard">
                <div className="waiver-data-toolbar">
                  <div>
                    <h2>Vaughan Players</h2>
                    <p>
                      Showing {firstVisiblePlayer}-{lastVisiblePlayer} of {filteredPlayers.length}
                      {filteredPlayers.length === players.length ? " records" : ` filtered records from ${players.length} total`}
                    </p>
                  </div>
                  <div className="waiver-data-filters player-data-filters">
                    <label>
                      <span>Search</span>
                      <input
                        value={playerQuery}
                        onChange={(event) => setPlayerQuery(event.target.value)}
                        placeholder="Name, email, player ID, signee ID"
                      />
                    </label>
                    <label>
                      <span>Signed From</span>
                      <input type="date" value={playerDateFrom} onChange={(event) => setPlayerDateFrom(event.target.value)} />
                    </label>
                    <label>
                      <span>Signed To</span>
                      <input type="date" value={playerDateTo} onChange={(event) => setPlayerDateTo(event.target.value)} />
                    </label>
                    <label>
                      <span>Show</span>
                      <select value={playerPageSize} onChange={(event) => setPlayerPageSize(Number(event.target.value))}>
                        {PAGE_SIZE_OPTIONS.map((option) => (
                          <option value={option} key={option}>{option}</option>
                        ))}
                      </select>
                    </label>
                    <button type="button" onClick={clearPlayerFilters}>Clear</button>
                  </div>
                </div>

                {visiblePlayers.length ? (
                  <>
                    {visiblePlayers.map((player) => (
                      <PlayerCard player={player} key={player.id} onDelete={deletePlayer} />
                    ))}
                    <div className="waiver-data-pagination">
                      <span>Page {currentPlayerPage} of {playerTotalPages}</span>
                      <div>
                        <button type="button" disabled={currentPlayerPage === 1} onClick={() => setPlayerPage(1)}>First</button>
                        <button type="button" disabled={currentPlayerPage === 1} onClick={() => setPlayerPage((current) => Math.max(1, current - 1))}>Previous</button>
                        <button type="button" disabled={currentPlayerPage === playerTotalPages} onClick={() => setPlayerPage((current) => Math.min(playerTotalPages, current + 1))}>Next</button>
                        <button type="button" disabled={currentPlayerPage === playerTotalPages} onClick={() => setPlayerPage(playerTotalPages)}>Last</button>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="waiver-admin-state">No Vaughan players found.</p>
                )}
              </div>
            ) : null}
          </>
        )}
      </section>

      {editingWaiver && editForm ? (
        <WaiverEditModal
          error={editError}
          form={editForm}
          onChange={setEditForm}
          onClose={closeEditWaiver}
          onSave={saveWaiverEdit}
          saving={savingEdit}
        />
      ) : null}
    </main>
  );
}
