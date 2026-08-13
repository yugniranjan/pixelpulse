"use client";

import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/AdminShell";
import "../../styles/admin-waivers.css";
import "../../styles/admin-player-info.css";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const DEFAULT_FEEDBACK_URL = "https://www.pixelpulseplay.ca/feedback";
const DEFAULT_WEBSITE_LINK = "https://www.pixelpulseplay.ca";
const PLAYER_SORT_OPTIONS = [
  { value: "newest", label: "Newest activity" },
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

function uniqueValues(values = []) {
  return Array.from(new Set(values.map((value) => String(value || "").trim()).filter(Boolean)));
}

function peopleSearchValues(waiver = {}) {
  const familyMembers = Array.isArray(waiver.familyMembers) ? waiver.familyMembers : [];
  return [
    waiver.primaryName,
    participantName(waiver.primary),
    waiver.primary?.firstName,
    waiver.primary?.lastName,
    waiver.primary?.email,
    waiver.primary?.phone,
    waiver.primary?.city,
    ...familyMembers.flatMap((member) => [
      participantName(member),
      member.firstName,
      member.lastName,
      member.email,
      member.phone,
    ]),
  ];
}

function partyIdValue(waiver = {}) {
  return String(waiver.visit?.partyId || "").trim();
}

function partyDateValue(waiver = {}) {
  return String(waiver.visit?.partyDate || waiver.visit?.visitDate || "").trim();
}

function playerThankYouState(player = {}) {
  const thankYou = player.thankYouEmail || {};
  const feedback = player.feedbackStatus || {};
  return {
    sent: Boolean(thankYou.sent || thankYou.sentAt),
    sentAt: thankYou.sentAt || "",
    feedbackReceived: Boolean(feedback.received || feedback.latestFeedbackAt),
    feedbackAt: feedback.latestFeedbackAt || "",
  };
}

function playerSortDate(player = {}) {
  return player.lastScoreAt || player.createdAt || player.dateSigned || "";
}

function playerPlayedStatus(player = {}) {
  return player.playerEndTime ? "Already played" : "Not completed";
}

function playerReadyForThankYou(player = {}) {
  return playerPlayedStatus(player) === "Already played";
}

function playerEmailDeliveryStatus(player = {}) {
  const thankYou = playerThankYouState(player);
  if (thankYou.sent) return "Email delivered";
  if (thankYou.feedbackReceived) return "Feedback received";
  if (playerReadyForThankYou(player)) return "Session Complete — Email Not Delivered";
  return "Session not complete";
}

function playerNeedsThankYouEmail(player = {}) {
  return playerEmailDeliveryStatus(player) === "Session Complete — Email Not Delivered";
}

function sortPlayerEmailGroups(groups = [], sort = "newest") {
  return [...groups].sort((a, b) => {
    if (sort === "points-desc") {
      return (b.lifetimePoints || 0) - (a.lifetimePoints || 0) || (b.latestActivityAt || "").localeCompare(a.latestActivityAt || "");
    }
    if (sort === "points-asc") {
      return (a.lifetimePoints || 0) - (b.lifetimePoints || 0) || (b.latestActivityAt || "").localeCompare(a.latestActivityAt || "");
    }
    if (sort === "repeat-desc") {
      return (b.repeatVisits || 0) - (a.repeatVisits || 0) || (b.latestActivityAt || "").localeCompare(a.latestActivityAt || "");
    }
    if (sort === "rewards-desc") {
      return (b.availableRewards || 0) - (a.availableRewards || 0) || (b.latestActivityAt || "").localeCompare(a.latestActivityAt || "");
    }

    return (b.latestActivityAt || "").localeCompare(a.latestActivityAt || "");
  });
}

function buildPlayerEmailGroups(players = [], sort = "newest") {
  const groups = new Map();

  players.forEach((player) => {
    const email = normalizeSearchValue(player.email);
    const key = email || `no-email:${player.id}`;
    const current = groups.get(key) || {
      id: key,
      email: player.email || "",
      primaryPlayer: player,
      players: [],
      latestActivityAt: playerSortDate(player),
      partyId: player.partyId || "",
      partyDate: player.partyDate || "",
      wristbandCode: player.wristbandCode || "",
      wristbandTranDate: player.wristbandTranDate || "",
      playerStartTime: player.playerStartTime || "",
      playerEndTime: player.playerEndTime || "",
      wristbandStatusFlag: player.wristbandStatusFlag || "",
      lifetimePoints: 0,
      repeatVisits: 0,
      scoreEvents: 0,
      availableRewards: 0,
      redeemedRewards: 0,
      thankYouEmail: player.thankYouEmail || null,
      feedbackStatus: player.feedbackStatus || null,
    };

    current.players.push(player);
    current.lifetimePoints += Number(player.lifetimePoints || 0);
    current.repeatVisits += Number(player.repeatVisits || 0);
    current.scoreEvents += Number(player.scoreEvents || 0);
    current.availableRewards += Number(player.availableRewards || 0);
    current.redeemedRewards += Number(player.redeemedRewards || 0);

    if ((playerSortDate(player) || "").localeCompare(current.latestActivityAt || "") > 0) {
      current.latestActivityAt = playerSortDate(player);
      current.primaryPlayer = player;
    }

    if (player.partyId && (!current.partyDate || String(player.partyDate || "").localeCompare(String(current.partyDate || "")) >= 0)) {
      current.partyId = player.partyId;
      current.partyDate = player.partyDate || current.partyDate;
    }

    if (player.wristbandTranDate && (!current.wristbandTranDate || String(player.wristbandTranDate).localeCompare(String(current.wristbandTranDate)) >= 0)) {
      current.wristbandCode = player.wristbandCode || current.wristbandCode;
      current.wristbandTranDate = player.wristbandTranDate;
      current.playerStartTime = player.playerStartTime || "";
      current.playerEndTime = player.playerEndTime || "";
      current.wristbandStatusFlag = player.wristbandStatusFlag || "";
    }

    const state = playerThankYouState(player);
    if (state.sent) current.thankYouEmail = player.thankYouEmail || current.thankYouEmail || {};
    if (state.feedbackReceived) current.feedbackStatus = player.feedbackStatus || current.feedbackStatus || {};

    groups.set(key, current);
  });

  return sortPlayerEmailGroups(Array.from(groups.values()), sort);
}

function partyMatchesFilter(waiver = {}, filter = "all") {
  const partyId = partyIdValue(waiver);
  if (filter === "has") return Boolean(partyId);
  if (filter === "none") return !partyId;
  if (filter.startsWith("party:")) return partyId === filter.slice("party:".length);
  return true;
}

function excelText(value = "") {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function safeFilePart(value = "") {
  return String(value || "all")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "all";
}

function downloadExcelFile(filename, rows = []) {
  if (!rows.length || typeof window === "undefined") return;

  const tableRows = rows
    .map((row) => `<tr>${row.map((cell) => `<td>${excelText(cell)}</td>`).join("")}</tr>`)
    .join("");
  const html = `<!doctype html><html><head><meta charset="utf-8" /></head><body><table>${tableRows}</table></body></html>`;
  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".xls") ? filename : `${filename}.xls`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function waiverExportRow(waiver = {}) {
  const familyMembers = Array.isArray(waiver.familyMembers) ? waiver.familyMembers : [];
  const children = familyMembers.filter((member) => member.type === "minor");
  const additionalAdults = familyMembers.filter((member) => member.type !== "minor");

  return [
    waiver.id,
    effectiveWaiverDate(waiver),
    partyDateValue(waiver),
    waiver.submittedAt || "",
    partyIdValue(waiver),
    partyIdValue(waiver) ? "Party ID" : "No party ID",
    waiver.visit?.partyName || "",
    waiver.visit?.passType || "",
    waiver.visit?.visitTime || "",
    waiver.primaryName || participantName(waiver.primary),
    waiver.primary?.firstName || "",
    waiver.primary?.lastName || "",
    waiver.primary?.email || "",
    waiver.primary?.phone || "",
    waiver.primary?.city || "",
    waiverParticipantCount(waiver),
    children.map(participantName).join("; "),
    children.map((child) => child.dob || "").filter(Boolean).join("; "),
    additionalAdults.map(participantName).join("; "),
    waiver.visit?.emergencyName || "",
    waiver.visit?.emergencyRelation || "",
    waiver.visit?.emergencyPhone || "",
    waiver.source || "",
  ];
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

function buildThankYouEmailText({ firstName, feedbackUrl, websiteLink, partyId }) {
  return [
    firstName ? `Hi ${firstName},` : "Hi,",
    "",
    partyId ? `Party ID: ${partyId}` : "",
    "Thanks for Playing at Pixel Pulse!",
    "",
    "We loved having you and hope you had an amazing time taking on our immersive challenges.",
    "",
    "💬 Help Us Level Up",
    "",
    "Your feedback helps us create an even better experience for every player.",
    "",
    "Share your feedback:",
    feedbackUrl,
    "",
    "🎁 Enjoy a FREE 60-Minute Play Pass",
    "",
    "As a thank you for sharing your feedback, we'll send you a FREE 60-Minute Play Pass for your next visit.*",
    "",
    "Complete the feedback form today and get ready for your next adventure!",
    "",
    "Thank you for being part of the Pixel Pulse community.",
    "",
    "See you again soon!",
    "",
    "The Pixel Pulse Team",
    "Vaughan, Ontario",
    websiteLink,
  ].filter(Boolean).join("\n");
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

function ThankYouEmailModal({ draft, onChange, onClose, onSend, sending, error, status }) {
  function update(field, value) {
    onChange((current) => ({ ...current, [field]: value }));
  }

  return (
    <div className="waiver-edit-backdrop" role="presentation">
      <form className="waiver-edit-modal waiver-email-modal" onSubmit={onSend}>
        <div className="waiver-edit-modal__head">
          <div>
            <span className="waiver-admin-kicker">Review before sending</span>
            <h2>Thank You Email</h2>
          </div>
          <button type="button" onClick={onClose}>Close</button>
        </div>

        <section>
          <h3>Recipient</h3>
          <div className="waiver-edit-grid">
            <label><span>Email</span><input required type="email" value={draft.email} onChange={(event) => update("email", event.target.value)} /></label>
            <label><span>First name</span><input value={draft.firstName} onChange={(event) => update("firstName", event.target.value)} /></label>
            <label><span>Party ID</span><input value={draft.partyId} onChange={(event) => update("partyId", event.target.value)} /></label>
          </div>
        </section>

        <section>
          <h3>Links</h3>
          <div className="waiver-edit-grid">
            <label><span>Feedback link</span><input required value={draft.feedbackUrl} onChange={(event) => update("feedbackUrl", event.target.value)} /></label>
            <label><span>Website</span><input value={draft.websiteLink} onChange={(event) => update("websiteLink", event.target.value)} /></label>
          </div>
        </section>

        <section>
          <h3>Email Content</h3>
          <label className="waiver-edit-wide waiver-email-content">
            <span>Review and edit before sending</span>
            <textarea required value={draft.emailText} onChange={(event) => update("emailText", event.target.value)} />
          </label>
        </section>

        {error ? <p className="waiver-admin-error">{error}</p> : null}
        {status ? <p className="waiver-admin-status">{status}</p> : null}

        <div className="waiver-edit-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={sending}>{sending ? "Sending..." : "Send Email"}</button>
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
  const partyDate = partyDateValue(activeWaiver);

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
          <em>{partyDate ? `Party date: ${partyDate}` : "No party date"}</em>
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
              <div><dt>Party date</dt><dd>{partyDate || "Not provided"}</dd></div>
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

function PlayerCard({ group, onThankYouEmail }) {
  const [open, setOpen] = useState(false);
  const player = group.primaryPlayer || {};
  const currentLevel = player.currentLevel;
  const nextLevel = player.nextLevel;
  const thankYouState = playerThankYouState(group);
  const readyForThankYou = playerReadyForThankYou(group);
  const thankYouDisabled = Boolean(!group.email || !readyForThankYou || thankYouState.sent || thankYouState.feedbackReceived);

  return (
    <article className="waiver-admin-card">
      <button type="button" className="waiver-admin-card__summary player-admin-card__summary" onClick={() => setOpen((current) => !current)}>
        <span>
          <strong>{group.email || "No email"}</strong>
          <em>{group.players.length} player{group.players.length === 1 ? "" : "s"} linked</em>
        </span>
        <span className={playerNeedsThankYouEmail(group) ? "player-email-status is-needed" : "player-email-status"}>
          <strong>
            {playerNeedsThankYouEmail(group) ? <span aria-hidden="true">!</span> : null}
            {playerEmailDeliveryStatus(group)}
          </strong>
          <em>Email delivery status</em>
        </span>
        <span>
          <strong>{player.fullName || "Unnamed"}</strong>
          <em>Newest player</em>
        </span>
        <span>
          <strong>{group.partyId || "No party ID"}</strong>
          <em>{group.partyDate ? `Party date ${formatDate(group.partyDate)}` : "Party ID"}</em>
        </span>
        <span>
          <strong>{group.wristbandTranDate ? formatDateTime(group.wristbandTranDate) : "No wristband"}</strong>
          <em>{group.playerEndTime ? "Already played" : "Latest wristband"}</em>
        </span>
        <span>
          <strong>{currentLevel ? `Level ${currentLevel.levelNumber}` : "No level"}</strong>
          <em>{currentLevel?.rewardName || nextRewardSummary(player)}</em>
        </span>
        <span>
          <strong>{formatNumber(group.repeatVisits)}</strong>
          <em>Repeat visits</em>
        </span>
        <span>
          <strong>{group.availableRewards || 0}</strong>
          <em>Available rewards</em>
        </span>
        <span>
          <strong>{formatDateTime(group.latestActivityAt)}</strong>
          <em>Newest activity</em>
        </span>
      </button>

      {open ? (
        <div className="waiver-admin-card__details">
          <section className="player-session-panel">
            <div className="player-session-panel__head">
              <div>
                <h2>Session Timing</h2>
                <p>{playerEmailDeliveryStatus(group)}</p>
              </div>
              <span>{playerPlayedStatus(group)}</span>
            </div>
            <dl className="player-session-timing">
              <div>
                <dt>Wristband activated</dt>
                <dd>{formatDateTime(group.playerStartTime || group.wristbandTranDate)}</dd>
              </div>
              <div>
                <dt>Session end time</dt>
                <dd>{formatDateTime(group.playerEndTime)}</dd>
              </div>
              <div>
                <dt>Wristband transaction date</dt>
                <dd>{formatDateTime(group.wristbandTranDate)}</dd>
              </div>
              <div>
                <dt>Wristband code</dt>
                <dd>{group.wristbandCode || "Not provided"}</dd>
              </div>
              <div>
                <dt>Wristband status</dt>
                <dd>{group.wristbandStatusFlag || "Not provided"}</dd>
              </div>
              <div>
                <dt>Party date</dt>
                <dd>{formatDate(group.partyDate)}</dd>
              </div>
            </dl>
          </section>

          <section>
            <h2>Player Group</h2>
            <dl>
              <div><dt>Email</dt><dd>{group.email || "Not provided"}</dd></div>
              <div><dt>Players linked</dt><dd>{group.players.length}</dd></div>
              <div><dt>Latest player</dt><dd>{player.fullName || "Unnamed"}</dd></div>
              <div><dt>Party ID</dt><dd>{group.partyId || "Not provided"}</dd></div>
              <div><dt>Newest activity</dt><dd>{formatDateTime(group.latestActivityAt)}</dd></div>
            </dl>
          </section>

          <section>
            <h2>Linked Players</h2>
            <div className="waiver-admin-members">
              {group.players.map((item) => (
                <div key={item.id}>
                  <strong>{item.fullName || "Unnamed"}</strong>
                  <span>Player ID: {item.playerId}</span>
                  <span>Party ID: {item.partyId || "Not provided"}</span>
                  <span>Wristband: {item.wristbandCode || "Not provided"}</span>
                  <span>Activated: {formatDateTime(item.playerStartTime || item.wristbandTranDate)}</span>
                  <span>Ended: {formatDateTime(item.playerEndTime)}</span>
                  <span>Play status: {playerPlayedStatus(item)}</span>
                  <span>Email delivery status: {playerEmailDeliveryStatus(item)}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="player-scorecard">
            <h2>Combined Scorecard</h2>
            <dl>
              <div><dt>Lifetime points</dt><dd>{formatNumber(group.lifetimePoints)}</dd></div>
              <div><dt>Current level</dt><dd>{currentLevel ? `Level ${currentLevel.levelNumber}` : "No level yet"}</dd></div>
              <div><dt>Current reward</dt><dd>{currentLevel?.rewardName || "Not unlocked"}</dd></div>
              <div><dt>Next reward</dt><dd>{nextLevel ? `Level ${nextLevel.levelNumber}: ${nextLevel.rewardName}` : "Top level reached"}</dd></div>
              <div><dt>Next milestone</dt><dd>{nextRewardSummary(player)}</dd></div>
              <div><dt>Repeat visits</dt><dd>{formatNumber(group.repeatVisits)}</dd></div>
              <div><dt>Score events</dt><dd>{formatNumber(group.scoreEvents)}</dd></div>
              <div><dt>Available rewards</dt><dd>{formatNumber(group.availableRewards)}</dd></div>
              <div><dt>Redeemed rewards</dt><dd>{formatNumber(group.redeemedRewards)}</dd></div>
            </dl>
          </section>

          <section className="waiver-admin-card__wide waiver-record-actions">
            <h2>Player Email</h2>
            <div>
              <button
                type="button"
                className="waiver-thank-you-action"
                onClick={() => onThankYouEmail(group)}
                disabled={thankYouDisabled}
              >
                Thank You Email
              </button>
            </div>
            {thankYouState.sent ? (
              <p className="waiver-email-already-sent">
                Thank you email already sent{thankYouState.sentAt ? ` on ${formatDateTime(thankYouState.sentAt)}` : ""}.
              </p>
            ) : null}
            {!thankYouState.sent && thankYouState.feedbackReceived ? (
              <p className="waiver-email-already-sent">
                Feedback already received{thankYouState.feedbackAt ? ` on ${formatDateTime(thankYouState.feedbackAt)}` : ""}.
              </p>
            ) : null}
            {!thankYouState.sent && !thankYouState.feedbackReceived && !readyForThankYou ? (
              <p className="waiver-email-already-sent">
                Thank you email becomes available after the session is complete.
              </p>
            ) : null}
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
  const [partyFilter, setPartyFilter] = useState("all");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [editingWaiver, setEditingWaiver] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");
  const [thankYouDraft, setThankYouDraft] = useState(null);
  const [sendingThankYou, setSendingThankYou] = useState(false);
  const [thankYouError, setThankYouError] = useState("");
  const [thankYouStatus, setThankYouStatus] = useState("");
  const [players, setPlayers] = useState([]);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [playersError, setPlayersError] = useState("");
  const [playerQuery, setPlayerQuery] = useState("");
  const [playerDateFrom, setPlayerDateFrom] = useState("");
  const [playerDateTo, setPlayerDateTo] = useState("");
  const [playerGameStatusFilter, setPlayerGameStatusFilter] = useState("all");
  const [playerSort, setPlayerSort] = useState("newest");
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

    return waivers.filter((waiver) => {
      const searchableValues = [
        ...peopleSearchValues(waiver),
        waiver.visit?.partyId,
        waiver.visit?.partyName,
        waiver.visit?.visitDate,
        effectiveWaiverDate(waiver),
        waiver.visit?.passType,
      ];
      const matchesSearch = !needle || searchableValues
        .filter(Boolean)
        .some((value) => normalizeSearchValue(value).includes(needle));

      const waiverDate = effectiveWaiverDate(waiver);
      const matchesFrom = !dateFrom || waiverDate >= dateFrom;
      const matchesTo = !dateTo || waiverDate <= dateTo;
      const matchesParty = partyMatchesFilter(waiver, partyFilter);

      return matchesSearch && matchesFrom && matchesTo && matchesParty;
    });
  }, [dateFrom, dateTo, partyFilter, query, waivers]);
  const searchSuggestions = useMemo(() => {
    const values = new Set();

    waivers.forEach((waiver) => {
      [
        ...peopleSearchValues(waiver),
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
        partyDate: partyDateValue(waiver),
        visitDate: waiver.visit?.visitDate || "",
        visitTime: waiver.visit?.visitTime || "",
        records: 0,
        participants: 0,
        latestSubmittedAt: "",
      };

      current.records += 1;
      current.participants += waiverParticipantCount(waiver);
      current.partyName ||= waiver.visit?.partyName || "";
      current.partyDate ||= partyDateValue(waiver);
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
  const partyFilterOptions = useMemo(
    () => partyGroups.map((group) => group.partyId),
    [partyGroups],
  );
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
  }, [dateFrom, dateTo, pageSize, partyFilter, query]);

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
  const playerEmailGroupsUnfiltered = useMemo(
    () => buildPlayerEmailGroups(filteredPlayers, playerSort),
    [filteredPlayers, playerSort],
  );
  const playerEmailGroups = useMemo(
    () => playerEmailGroupsUnfiltered.filter((group) => {
      if (playerGameStatusFilter === "ended") return Boolean(group.playerEndTime);
      if (playerGameStatusFilter === "not-started") return !group.playerStartTime && !group.playerEndTime;
      return true;
    }),
    [playerEmailGroupsUnfiltered, playerGameStatusFilter],
  );
  const allPlayerEmailGroups = useMemo(
    () => buildPlayerEmailGroups(players, playerSort),
    [players, playerSort],
  );
  const playerTotalPages = Math.max(1, Math.ceil(playerEmailGroups.length / playerPageSize));
  const currentPlayerPage = Math.min(playerPage, playerTotalPages);
  const playerPageStart = (currentPlayerPage - 1) * playerPageSize;
  const playerPageEnd = playerPageStart + playerPageSize;
  const visiblePlayerGroups = playerEmailGroups.slice(playerPageStart, playerPageEnd);
  const firstVisiblePlayer = playerEmailGroups.length ? playerPageStart + 1 : 0;
  const lastVisiblePlayer = Math.min(playerPageEnd, playerEmailGroups.length);
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
  const playerEmailStats = useMemo(() => {
    const emails = new Map();

    allPlayerEmailGroups
      .filter((group) => group.email)
      .forEach((group) => {
        const state = playerThankYouState(group);
        const email = normalizeSearchValue(group.email);
        emails.set(email, {
          sent: Boolean(emails.get(email)?.sent || state.sent || state.feedbackReceived),
          ready: Boolean(emails.get(email)?.ready || playerReadyForThankYou(group)),
        });
      });

    return Array.from(emails.values()).reduce(
      (stats, email) => {
        if (email.sent) {
          stats.sent += 1;
        } else if (email.ready) {
          stats.pending += 1;
        }
        return stats;
      },
      { sent: 0, pending: 0 },
    );
  }, [allPlayerEmailGroups]);

  useEffect(() => {
    setPlayerPage(1);
  }, [playerDateFrom, playerDateTo, playerGameStatusFilter, playerPageSize, playerQuery, playerSort]);

  function clearFilters() {
    setQuery("");
    setDateFrom("");
    setDateTo("");
    setPartyFilter("all");
  }

  function clearPlayerFilters() {
    setPlayerQuery("");
    setPlayerDateFrom("");
    setPlayerDateTo("");
    setPlayerGameStatusFilter("all");
  }

  function exportWaiverRows(exportRows, label) {
    if (!exportRows.length) return;

    const header = [
      "Waiver ID",
      "Visit Date",
      "Party Date",
      "Submitted At",
      "Party ID",
      "Party ID Status",
      "Party Name",
      "Pass Type",
      "Visit Time",
      "Primary Name",
      "First Name",
      "Last Name",
      "Email",
      "Phone",
      "City",
      "Participants",
      "Children",
      "Children DOBs",
      "Additional Adults",
      "Emergency Name",
      "Emergency Relation",
      "Emergency Phone",
      "Source",
    ];
    const fromPart = dateFrom || "start";
    const toPart = dateTo || "today";
    downloadExcelFile(
      `waiver-data-${safeFilePart(label)}-${fromPart}-to-${toPart}.xls`,
      [header, ...exportRows.map(waiverExportRow)],
    );
  }

  function viewPartyWaivers(partyId) {
    setQuery(partyId);
    setPartyFilter(`party:${partyId}`);
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

  function startPlayerThankYouEmail(group) {
    const email = normalizeSearchValue(group.email);
    if (!email) {
      setThankYouError("This player group does not have an email address.");
      return;
    }

    const state = playerThankYouState(group);
    if (state.sent) {
      setThankYouError("Thank you email already sent to this email ID.");
      return;
    }
    if (state.feedbackReceived) {
      setThankYouError("Feedback has already been received from this email ID.");
      return;
    }
    if (!playerReadyForThankYou(group)) {
      setThankYouError("Thank you email can be sent only after the session is complete.");
      return;
    }

    const player = group.primaryPlayer || {};
    const draft = {
      email: group.email || "",
      firstName: player.firstName || "",
      name: player.fullName || [player.firstName, player.lastName].filter(Boolean).join(" "),
      partyId: "",
      feedbackUrl: DEFAULT_FEEDBACK_URL,
      websiteLink: DEFAULT_WEBSITE_LINK,
    };

    setThankYouDraft({
      mode: "player",
      ...draft,
      emailText: buildThankYouEmailText(draft),
    });
    setThankYouError("");
    setThankYouStatus("");
    setActiveTab("players");
  }

  function closeThankYouEmail() {
    setThankYouDraft(null);
    setThankYouError("");
    setThankYouStatus("");
  }

  async function markEmailThankYouSent(email) {
    const response = await fetch("/api/admin/waivers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "mark-thank-you-sent-by-email",
        email,
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Thank you email was sent, but the email could not be marked.");
    }

    return data.status;
  }

  async function sendThankYouEmail(event) {
    event.preventDefault();
    if (!thankYouDraft) return;

    setSendingThankYou(true);
    setThankYouError("");
    setThankYouStatus("");

    const recipientEmails = thankYouDraft.mode === "party"
      ? uniqueValues(String(thankYouDraft.emailsText || "").split(/\n|,/))
      : uniqueValues([thankYouDraft.email]);

    if (!recipientEmails.length) {
      setThankYouError("Please enter at least one recipient email.");
      setSendingThankYou(false);
      return;
    }

    try {
      const sendOne = async (email) => {
        const matchedRecipient = (thankYouDraft.recipients || []).find(
          (recipient) => normalizeSearchValue(recipient.email) === normalizeSearchValue(email),
        ) || {};
        const firstName = thankYouDraft.mode === "party"
          ? matchedRecipient.firstName || ""
          : thankYouDraft.firstName;
        const name = thankYouDraft.mode === "party"
          ? matchedRecipient.name || firstName
          : thankYouDraft.name;
        const personalizedText = String(thankYouDraft.emailText || "")
          .replaceAll("{firstName}", firstName || "there")
          .replaceAll("{name}", name || firstName || "there")
          .replaceAll("{email}", email);

        const response = await fetch("/api/admin/invites/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "thank-you",
            email,
            firstName,
            name,
            partyId: thankYouDraft.partyId,
            feedbackUrl: thankYouDraft.feedbackUrl,
            websiteLink: thankYouDraft.websiteLink,
            thankYouText: personalizedText,
          }),
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `Unable to send thank you email to ${email}.`);
        }

        const status = await markEmailThankYouSent(email);
        const normalizedEmail = normalizeSearchValue(email);
        setPlayers((current) => current.map((player) =>
          normalizeSearchValue(player.email) === normalizedEmail
            ? { ...player, thankYouEmail: { ...(player.thankYouEmail || {}), ...(status || {}), sent: true } }
            : player
        ));
        setWaivers((current) => current.map((waiver) =>
          normalizeSearchValue(waiver.primary?.email) === normalizedEmail
            ? { ...waiver, thankYouEmail: { ...(waiver.thankYouEmail || {}), ...(status || {}), sent: true } }
            : waiver
        ));
      };

      for (const email of recipientEmails) {
        await sendOne(email);
      }

      setThankYouStatus(
        recipientEmails.length === 1
          ? "Thank you email sent."
          : `Thank you email sent to ${recipientEmails.length} recipients.`,
      );
    } catch (sendError) {
      setThankYouError(sendError?.message || "Unable to send thank you email.");
    } finally {
      setSendingThankYou(false);
    }
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
        <p className="waiver-admin-tab-note">
          To send thank you emails, use the Players tab. Player records are grouped by email ID so each customer receives only one email.
        </p>

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
                            <div><dt>Party Date</dt><dd>{group.partyDate || "Not set"}</dd></div>
                            <div><dt>Visit Date</dt><dd>{group.visitDate || "Not set"}</dd></div>
                            <div><dt>Time</dt><dd>{group.visitTime || "Not set"}</dd></div>
                          </dl>
                          <div className="waiver-party-groups__actions">
                            <button type="button" onClick={() => viewPartyWaivers(group.partyId)}>
                              View Party
                            </button>
                          </div>
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
                    <label>
                      <span>Party ID</span>
                      <select value={partyFilter} onChange={(event) => setPartyFilter(event.target.value)}>
                        <option value="all">All records</option>
                        <option value="has">Has party ID</option>
                        <option value="none">No party ID</option>
                        {partyFilterOptions.length ? (
                          <optgroup label="Party IDs">
                            {partyFilterOptions.map((partyId) => (
                              <option value={`party:${partyId}`} key={partyId}>{partyId}</option>
                            ))}
                          </optgroup>
                        ) : null}
                      </select>
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
                  <div className="waiver-export-actions" aria-label="Export waiver data">
                    <button type="button" onClick={() => exportWaiverRows(filteredWaivers, "filtered")} disabled={!filteredWaivers.length}>
                      Export Filtered Excel
                    </button>
                    <button
                      type="button"
                      onClick={() => exportWaiverRows(filteredWaivers.filter((waiver) => partyIdValue(waiver)), "party-id")}
                      disabled={!filteredWaivers.some((waiver) => partyIdValue(waiver))}
                    >
                      Export Party ID Excel
                    </button>
                    <button
                      type="button"
                      onClick={() => exportWaiverRows(filteredWaivers.filter((waiver) => !partyIdValue(waiver)), "no-party-id")}
                      disabled={!filteredWaivers.some((waiver) => !partyIdValue(waiver))}
                    >
                      Export No Party ID Excel
                    </button>
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
                <strong>{playerEmailGroups.length}</strong>
              </article>
              <article>
                <span>Repeat Visitors</span>
                <strong>{repeatVisitors}</strong>
              </article>
              <article>
                <span>Session Complete — Email Not Delivered</span>
                <strong>{playerEmailStats.pending}</strong>
              </article>
              <article>
                <span>Emails Already Sent</span>
                <strong>{playerEmailStats.sent}</strong>
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
                      Showing {firstVisiblePlayer}-{lastVisiblePlayer} of {playerEmailGroups.length}
                      {playerEmailGroups.length === allPlayerEmailGroups.length ? " email groups" : ` filtered email groups from ${allPlayerEmailGroups.length} total`}
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
                      <span>Game Status</span>
                      <select value={playerGameStatusFilter} onChange={(event) => setPlayerGameStatusFilter(event.target.value)}>
                        <option value="all">All players</option>
                        <option value="ended">Already played</option>
                        <option value="not-started">Not started</option>
                      </select>
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

                {visiblePlayerGroups.length ? (
                  <>
                    {visiblePlayerGroups.map((group) => (
                      <PlayerCard
                        group={group}
                        key={group.id}
                        onThankYouEmail={startPlayerThankYouEmail}
                      />
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
      {thankYouDraft ? (
        <ThankYouEmailModal
          draft={thankYouDraft}
          error={thankYouError}
          onChange={setThankYouDraft}
          onClose={closeThankYouEmail}
          onSend={sendThankYouEmail}
          sending={sendingThankYou}
          status={thankYouStatus}
        />
      ) : null}
    </AdminShell>
  );
}
