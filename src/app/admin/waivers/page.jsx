"use client";

import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/AdminShell";
import "../../styles/admin-waivers.css";
import "../../styles/admin-player-info.css";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const PLAYER_SORT_OPTIONS = [
  { value: "newest", label: "Newest players" },
  { value: "points-desc", label: "Score: high to low" },
  { value: "points-asc", label: "Score: low to high" },
  { value: "repeat-desc", label: "Repeat visits: high to low" },
  { value: "rewards-desc", label: "Available rewards" },
];

const numberFormatter = new Intl.NumberFormat("en-US");

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

function formatNumber(value) {
  return numberFormatter.format(Number(value) || 0);
}

function nextRewardSummary(player = {}) {
  if (!player.nextLevel) return "Top level reached";
  const remaining = Math.max(0, Number(player.nextLevel.thresholdPoints || 0) - Number(player.lifetimePoints || 0));
  return `${formatNumber(remaining)} pts to Level ${player.nextLevel.levelNumber}`;
}

function participantName(person = {}) {
  return person.fullLegalName || [person.firstName, person.lastName].filter(Boolean).join(" ") || "Unnamed";
}

function splitFamilyMembers(familyMembers = []) {
  return {
    children: familyMembers.filter((member) => member.type === "minor"),
    additionalAdults: familyMembers.filter((member) => member.type !== "minor"),
  };
}

function relationshipSummary(children = []) {
  if (!children.length) return "No children listed";

  const names = children.map(participantName).filter(Boolean);
  if (names.length <= 2) return `Children: ${names.join(", ")}`;
  return `Children: ${names.slice(0, 2).join(", ")} +${names.length - 2} more`;
}

function normalizeSearchValue(value = "") {
  return String(value || "").trim().toLowerCase();
}

function localDateString(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function effectiveWaiverDate(waiver = {}) {
  const visitDate = waiver.visit?.visitDate;
  if (/^\d{4}-\d{2}-\d{2}$/.test(visitDate || "")) return visitDate;
  return waiver.submittedAt ? String(waiver.submittedAt).slice(0, 10) : "";
}

function waiverParticipantCount(waiver = {}) {
  return Math.max(Number(waiver.participantCount) || 1, 1);
}

function PersonTile({ person, relationship }) {
  return (
    <div>
      <strong>{participantName(person)}</strong>
      <span>{relationship}</span>
      <span>DOB: {person.dob || "Not provided"}</span>
      <span>Gender: {person.gender || "Not provided"}</span>
      {person.email ? <span>Email: {person.email}</span> : null}
      <span>Health: {person.healthCondition || "Not Applicable"}</span>
      <span>Medical: {person.medicalNotes || "None"}</span>
    </div>
  );
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
          <h3>Parent / Guardian</h3>
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

function WaiverCard({ waiver, onDelete, onEdit }) {
  const [open, setOpen] = useState(false);
  const activeWaiver = waiver;
  const familyMembers = Array.isArray(activeWaiver.familyMembers) ? activeWaiver.familyMembers : [];
  const { children, additionalAdults } = splitFamilyMembers(familyMembers);
  const attractions = Array.isArray(activeWaiver.attractions) ? activeWaiver.attractions : [];

  return (
    <article className="waiver-admin-card">
      <button type="button" className="waiver-admin-card__summary" onClick={() => setOpen((current) => !current)}>
        <span>
          <strong>Parent / Guardian: {activeWaiver.primaryName || participantName(activeWaiver.primary)}</strong>
          <em>{activeWaiver.primary?.email || "No email"}</em>
        </span>
        <span>
          <strong>{children.length || "No"} child{children.length === 1 ? "" : "ren"}</strong>
          <em>{relationshipSummary(children)}</em>
        </span>
        <span>
          <strong>{activeWaiver.visit?.partyId || "No party ID"}</strong>
          <em>{activeWaiver.visit?.visitDate || "No visit date"}</em>
        </span>
        <span>
          <strong>{activeWaiver.participantCount || 1}</strong>
          <em>Participants</em>
        </span>
        <span>
          <strong>{formatDateTime(activeWaiver.submittedAt)}</strong>
          <em>Submitted</em>
        </span>
      </button>

      {open ? (
        <div className="waiver-admin-card__details">
          <section>
            <h2>Parent / Guardian</h2>
            <dl>
              <div><dt>Full legal name</dt><dd>{participantName(activeWaiver.primary)}</dd></div>
              <div><dt>DOB</dt><dd>{activeWaiver.primary?.dob || "Not provided"}</dd></div>
              <div><dt>Gender</dt><dd>{activeWaiver.primary?.gender || "Not provided"}</dd></div>
              <div><dt>Email</dt><dd>{activeWaiver.primary?.email || "Not provided"}</dd></div>
              <div><dt>Phone</dt><dd>{activeWaiver.primary?.phone || "Not provided"}</dd></div>
              <div><dt>City</dt><dd>{activeWaiver.primary?.city || "Not provided"}</dd></div>
              <div><dt>Health condition</dt><dd>{activeWaiver.primary?.healthCondition || "Not Applicable"}</dd></div>
              <div><dt>Medical notes</dt><dd>{activeWaiver.primary?.medicalNotes || "None"}</dd></div>
            </dl>
          </section>

          <section>
            <h2>Visit</h2>
            <dl>
              <div><dt>Pass</dt><dd>{activeWaiver.visit?.passType || "Not provided"}</dd></div>
              <div><dt>Party ID</dt><dd>{activeWaiver.visit?.partyId || "Not provided"}</dd></div>
              <div><dt>Party name</dt><dd>{activeWaiver.visit?.partyName || "Not provided"}</dd></div>
              <div><dt>Visit date</dt><dd>{activeWaiver.visit?.visitDate || "Not provided"}</dd></div>
              <div><dt>Party time</dt><dd>{activeWaiver.visit?.visitTime || "Not provided"}</dd></div>
              <div><dt>Emergency contact</dt><dd>{activeWaiver.visit?.emergencyName || "Not provided"}</dd></div>
              <div><dt>Relationship</dt><dd>{activeWaiver.visit?.emergencyRelation || "Not provided"}</dd></div>
              <div><dt>Emergency phone</dt><dd>{activeWaiver.visit?.emergencyPhone || "Not provided"}</dd></div>
              <div><dt>Printed name</dt><dd>{activeWaiver.visit?.printName || "Not provided"}</dd></div>
              <div><dt>Signed date</dt><dd>{activeWaiver.visit?.signDate || "Not provided"}</dd></div>
            </dl>
          </section>

          <section className="waiver-admin-card__wide">
            <h2>Children</h2>
            {children.length ? (
              <div className="waiver-admin-members">
                {children.map((member, index) => (
                  <PersonTile
                    key={`${member.firstName}-${member.lastName}-${index}`}
                    person={member}
                    relationship="Child / Minor under 18"
                  />
                ))}
              </div>
            ) : (
              <p>No children listed.</p>
            )}
          </section>

          <section className="waiver-admin-card__wide">
            <h2>Additional Adults</h2>
            {additionalAdults.length ? (
              <div className="waiver-admin-members">
                {additionalAdults.map((member, index) => (
                  <PersonTile
                    key={`${member.firstName}-${member.lastName}-${index}`}
                    person={member}
                    relationship="Additional adult"
                  />
                ))}
              </div>
            ) : (
              <p>No additional adults listed.</p>
            )}
          </section>

          <section className="waiver-admin-card__wide">
            <h2>Attractions</h2>
            <div className="waiver-admin-pills">
              {attractions.length ? attractions.map((attraction) => <span key={attraction}>{attraction}</span>) : <span>None selected</span>}
            </div>
          </section>

          <section className="waiver-admin-card__wide waiver-record-actions">
            <h2>Record Actions</h2>
            <div>
              <button type="button" onClick={() => onEdit(activeWaiver)}>Edit Record</button>
              <button type="button" className="is-danger" onClick={() => onDelete(activeWaiver)}>Delete Record</button>
            </div>
          </section>
        </div>
      ) : null}
    </article>
  );
}

function PlayerCard({ player }) {
  const [open, setOpen] = useState(false);
  const currentLevel = player.currentLevel;
  const nextLevel = player.nextLevel;

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
          <strong>{formatNumber(player.lifetimePoints)}</strong>
          <em>Lifetime points</em>
        </span>
        <span>
          <strong>{currentLevel ? `Level ${currentLevel.levelNumber}` : "No level"}</strong>
          <em>{currentLevel?.rewardName || nextRewardSummary(player)}</em>
        </span>
        <span>
          <strong>{formatNumber(player.repeatVisits)}</strong>
          <em>Repeat visits</em>
        </span>
        <span>
          <strong>{player.availableRewards || 0}</strong>
          <em>Available rewards</em>
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

          <section className="player-scorecard">
            <h2>Scorecard</h2>
            <dl>
              <div><dt>Lifetime points</dt><dd>{formatNumber(player.lifetimePoints)}</dd></div>
              <div><dt>Current level</dt><dd>{currentLevel ? `Level ${currentLevel.levelNumber}` : "No level yet"}</dd></div>
              <div><dt>Current reward</dt><dd>{currentLevel?.rewardName || "Not unlocked"}</dd></div>
              <div><dt>Next reward</dt><dd>{nextLevel ? `Level ${nextLevel.levelNumber}: ${nextLevel.rewardName}` : "Top level reached"}</dd></div>
              <div><dt>Next milestone</dt><dd>{nextRewardSummary(player)}</dd></div>
              <div><dt>Repeat visits</dt><dd>{formatNumber(player.repeatVisits)}</dd></div>
              <div><dt>Score events</dt><dd>{formatNumber(player.scoreEvents)}</dd></div>
              <div><dt>Last score</dt><dd>{formatDateTime(player.lastScoreAt)}</dd></div>
              <div><dt>Available rewards</dt><dd>{formatNumber(player.availableRewards)}</dd></div>
              <div><dt>Redeemed rewards</dt><dd>{formatNumber(player.redeemedRewards)}</dd></div>
            </dl>
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
  const [playerSort, setPlayerSort] = useState("points-desc");
  const [playerPageSize, setPlayerPageSize] = useState(25);
  const [playerPage, setPlayerPage] = useState(1);

  useEffect(() => {
    async function loadWaivers() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/admin/waivers?limit=300", { cache: "no-store" });
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
    const needle = normalizeSearchValue(query);
    const hasExactPartyIdMatch = Boolean(needle) && waivers.some(
      (waiver) => normalizeSearchValue(waiver.visit?.partyId) === needle,
    );

    return waivers.filter((waiver) => {
      const partyId = normalizeSearchValue(waiver.visit?.partyId);
      const searchableValues = [
        waiver.primaryName,
        waiver.primary?.email,
        waiver.primary?.phone,
        waiver.visit?.partyId,
        waiver.visit?.partyName,
        waiver.visit?.visitDate,
        effectiveWaiverDate(waiver),
        waiver.visit?.passType,
      ];
      const matchesSearch = !needle || (
        hasExactPartyIdMatch
          ? partyId === needle
          : searchableValues
            .filter(Boolean)
            .some((value) => normalizeSearchValue(value).includes(needle))
      );

      const waiverDate = effectiveWaiverDate(waiver);
      const matchesFrom = !dateFrom || waiverDate >= dateFrom;
      const matchesTo = !dateTo || waiverDate <= dateTo;
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
        effectiveWaiverDate(waiver),
      ]
        .filter(Boolean)
        .forEach((value) => values.add(String(value)));
    });

    return Array.from(values).sort((a, b) => a.localeCompare(b)).slice(0, 80);
  }, [waivers]);
  const totalParticipants = useMemo(
    () =>
      waivers.reduce(
        (total, waiver) => total + waiverParticipantCount(waiver),
        0,
      ),
    [waivers],
  );
  const partyGroups = useMemo(() => {
    const groups = new Map();

    waivers.forEach((waiver) => {
      const partyId = waiver.visit?.partyId?.trim();
      if (!partyId) return;

      const current = groups.get(partyId) || {
        partyId,
        partyName: waiver.visit?.partyName || "",
        visitDate: waiver.visit?.visitDate || "",
        visitTime: waiver.visit?.visitTime || "",
        records: 0,
        participants: 0,
        latestSubmittedAt: "",
      };

      current.records += 1;
      current.participants += waiverParticipantCount(waiver);
      current.partyName ||= waiver.visit?.partyName || "";
      current.visitDate ||= effectiveWaiverDate(waiver);
      current.visitTime ||= waiver.visit?.visitTime || "";
      if (!current.latestSubmittedAt || waiver.submittedAt > current.latestSubmittedAt) {
        current.latestSubmittedAt = waiver.submittedAt;
      }

      groups.set(partyId, current);
    });

    return Array.from(groups.values()).sort((a, b) =>
      (b.latestSubmittedAt || "").localeCompare(a.latestSubmittedAt || ""),
    );
  }, [waivers]);
  const todayVisits = useMemo(() => {
    const today = localDateString();
    return waivers
      .filter((waiver) => effectiveWaiverDate(waiver) === today)
      .reduce((total, waiver) => total + waiverParticipantCount(waiver), 0);
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

    const filtered = players.filter((player) => {
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

    return filtered.sort((a, b) => {
      if (playerSort === "points-desc") {
        return (b.lifetimePoints || 0) - (a.lifetimePoints || 0) || (b.repeatVisits || 0) - (a.repeatVisits || 0);
      }
      if (playerSort === "points-asc") {
        return (a.lifetimePoints || 0) - (b.lifetimePoints || 0) || (a.repeatVisits || 0) - (b.repeatVisits || 0);
      }
      if (playerSort === "repeat-desc") {
        return (b.repeatVisits || 0) - (a.repeatVisits || 0) || (b.lifetimePoints || 0) - (a.lifetimePoints || 0);
      }
      if (playerSort === "rewards-desc") {
        return (b.availableRewards || 0) - (a.availableRewards || 0) || (b.lifetimePoints || 0) - (a.lifetimePoints || 0);
      }

      return (b.createdAt || "").localeCompare(a.createdAt || "") || (b.playerId || 0) - (a.playerId || 0);
    });
  }, [playerDateFrom, playerDateTo, playerQuery, playerSort, players]);
  const playerTotalPages = Math.max(1, Math.ceil(filteredPlayers.length / playerPageSize));
  const currentPlayerPage = Math.min(playerPage, playerTotalPages);
  const playerPageStart = (currentPlayerPage - 1) * playerPageSize;
  const playerPageEnd = playerPageStart + playerPageSize;
  const visiblePlayers = filteredPlayers.slice(playerPageStart, playerPageEnd);
  const firstVisiblePlayer = filteredPlayers.length ? playerPageStart + 1 : 0;
  const lastVisiblePlayer = Math.min(playerPageEnd, filteredPlayers.length);
  const latestPlayer = players[0];
  const topPlayer = useMemo(
    () => players.reduce((leader, player) => (
      (player.lifetimePoints || 0) > (leader?.lifetimePoints || 0) ? player : leader
    ), null),
    [players],
  );
  const repeatVisitors = useMemo(
    () => players.filter((player) => Number(player.repeatVisits || 0) > 1).length,
    [players],
  );

  useEffect(() => {
    setPlayerPage(1);
  }, [playerDateFrom, playerDateTo, playerPageSize, playerQuery, playerSort]);

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

  function viewPartyWaivers(partyId) {
    setQuery(partyId);
    setPartyOnly(false);
    setPage(1);
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

  return (
    <AdminShell>
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
                <span>Loaded Waivers</span>
                <strong>{waivers.length}</strong>
              </article>
              <article>
                <span>Participants</span>
                <strong>{totalParticipants}</strong>
              </article>
              <article>
                <span>Visits Today</span>
                <strong>{todayVisits}</strong>
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
                {partyGroups.length ? (
                  <section className="waiver-party-groups" aria-label="Party waiver groups">
                    <div className="waiver-party-groups__head">
                      <div>
                        <h2>Party Waiver Groups</h2>
                        <p>Click a Party ID to show everyone who submitted a waiver for that party.</p>
                      </div>
                    </div>
                    <div className="waiver-party-groups__grid">
                      {partyGroups.slice(0, 8).map((group) => (
                        <article key={group.partyId}>
                          <div>
                            <strong>{group.partyId}</strong>
                            <span>{group.partyName || "Birthday party"}</span>
                          </div>
                          <dl>
                            <div><dt>Waivers</dt><dd>{group.records}</dd></div>
                            <div><dt>Players</dt><dd>{group.participants}</dd></div>
                            <div><dt>Date</dt><dd>{group.visitDate || "Not set"}</dd></div>
                            <div><dt>Time</dt><dd>{group.visitTime || "Not set"}</dd></div>
                          </dl>
                          <button type="button" onClick={() => viewPartyWaivers(group.partyId)}>
                            View Party
                          </button>
                        </article>
                      ))}
                    </div>
                  </section>
                ) : null}

                <div className="waiver-data-toolbar">
                  <div>
                    <h2>Recent Waiver Submissions</h2>
                    <p>
                      Showing {firstVisibleRecord}-{lastVisibleRecord} of {filteredWaivers.length}
                      {filteredWaivers.length === waivers.length ? " loaded records" : ` filtered records from ${waivers.length} loaded`}
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
                <span>Repeat Visitors</span>
                <strong>{repeatVisitors}</strong>
              </article>
              <article>
                <span>Top Score</span>
                <strong>{topPlayer ? formatNumber(topPlayer.lifetimePoints) : "0"}</strong>
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
                    <h2>Vaughan Players Scorecards</h2>
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
                      <span>Sort</span>
                      <select value={playerSort} onChange={(event) => setPlayerSort(event.target.value)}>
                        {PLAYER_SORT_OPTIONS.map((option) => (
                          <option value={option.value} key={option.value}>{option.label}</option>
                        ))}
                      </select>
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
                      <PlayerCard player={player} key={player.id} />
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
    </AdminShell>
  );
}
