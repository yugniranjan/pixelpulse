"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { FaArrowRight, FaCheckCircle, FaCopy } from "react-icons/fa";

function formatDate(value = "") {
  if (!value) return "Date pending";
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function plural(value, singular, pluralLabel = `${singular}s`) {
  return `${value.toLocaleString()} ${value === 1 ? singular : pluralLabel}`;
}

function progressPercent(party) {
  if (!party.expectedGuests) return 0;
  return Math.min(100, Math.round((party.participantsCovered / party.expectedGuests) * 100));
}

function remainingCount(party) {
  if (!party.expectedGuests) return 0;
  return Math.max(0, party.expectedGuests - party.participantsCovered);
}

function SignedWaivers({ party, onPlayChange, sending }) {
  if (!party.signedWaivers?.length) return null;

  return (
    <div className="ppp-party-dashboard-signers">
      <h2>Signed waivers</h2>
      <p className="ppp-party-dashboard-coverage-note">Covered includes the signer and all family members listed on each waiver.</p>
      <p className="ppp-party-dashboard-coverage-note">Check “Will play” for each person joining the games. Then email your player list to our team.</p>
      <ul>
        {party.signedWaivers.map((waiver, index) => (
          <li key={index}>
            <div className="ppp-party-dashboard-signer-heading">
              <span><FaCheckCircle aria-hidden="true" /> {waiver.name}</span>
              <small>{plural(waiver.participantsCovered, "person", "people")} covered</small>
            </div>
            {waiver.participants?.length ? (
              <ul className="ppp-party-dashboard-participant-names" aria-label={`People on ${waiver.name}'s waiver`}>
                {waiver.participants.map((person, personIndex) => (
                  <li key={personIndex}>
                    {person.name}
                    <small className={`ppp-party-dashboard-person-type ppp-party-dashboard-person-type--${person.type}`}>
                      {person.type === "minor" ? "Minor" : "Adult"}{person.isSigner ? " · Signer" : ""}
                    </small>
                    <label className="ppp-party-dashboard-will-play">
                      <input type="checkbox" checked={person.willPlay === true}
                        disabled={sending}
                        onChange={(event) => onPlayChange(party.partyId, waiver.id, person.key, event.target.checked)}
                        aria-label={`${person.name} will play`} />
                      Will play
                    </label>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function PartyDashboardClient() {
  const [lookupValue, setLookupValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [parties, setParties] = useState([]);
  const [copiedId, setCopiedId] = useState("");
  const [sendingParty, setSendingParty] = useState("");
  const [sentParty, setSentParty] = useState("");
  const [playError, setPlayError] = useState("");
  const lookupRequest = useRef(null);

  const hasResults = parties.length > 0;
  const totals = useMemo(
    () =>
      parties.reduce(
        (sum, party) => ({
          forms: sum.forms + party.waiverFormsCompleted,
          participants: sum.participants + party.participantsCovered,
          expected: sum.expected + (party.expectedGuests || 0),
        }),
        { forms: 0, participants: 0, expected: 0 },
      ),
    [parties],
  );
  const featuredParty = parties[0] || null;
  const featuredPct = featuredParty ? progressPercent(featuredParty) : 0;
  const featuredRemaining = featuredParty ? remainingCount(featuredParty) : 0;

  function setWillPlay(partyId, waiverId, participantKey, willPlay) {
    setSentParty("");
    setPlayError("");
    setParties((current) => current.map((party) => party.partyId !== partyId ? party : {
      ...party, signedWaivers: party.signedWaivers.map((waiver) => waiver.id !== waiverId ? waiver : {
        ...waiver, participants: waiver.participants.map((person) => person.key !== participantKey ? person : { ...person, willPlay }),
      }),
    }));
  }

  async function emailPlayers(party) {
    const players = party.signedWaivers.flatMap((waiver) => waiver.participants
      .filter((person) => person.willPlay).map((person) => ({ waiverId: waiver.id, participantKey: person.key })));
    setSendingParty(party.partyId);
    setPlayError("");
    setSentParty("");
    try {
      const response = await fetch("/api/party-dashboard", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partyId: party.partyId, players }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to email player list.");
      setSentParty(party.partyId);
    } catch (error) {
      setPlayError(error.message || "Unable to email player list. Please try again.");
    } finally { setSendingParty(""); }
  }

  function playerEmailButton(party) {
    const count = party.signedWaivers.reduce((total, waiver) => total + (waiver.participants || []).filter((person) => person.willPlay).length, 0);
    return <div className="ppp-party-dashboard-player-email">
      <p><b>{count}</b> selected to play.</p>
      <button type="button" className="ppp-party-dashboard-submit" disabled={!count || Boolean(sendingParty)} onClick={() => emailPlayers(party)}>
        {sendingParty === party.partyId ? "Sending…" : "Email player list"}
      </button>
      {sentParty === party.partyId ? <p role="status">Player list emailed to our team.</p> : null}
    </div>;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const value = lookupValue.trim();
    if (!value) {
      setError("Enter your party ID.");
      return;
    }

    if (value.includes("@")) {
      setError("Enter your party ID.");
      return;
    }
    setLookupValue(value);

    lookupRequest.current?.abort();
    const controller = new AbortController();
    lookupRequest.current = controller;
    setLoading(true);
    setError("");
    setParties([]);
    setSentParty("");
    setPlayError("");

    try {
      const params = new URLSearchParams({ partyId: value });
      const response = await fetch(`/api/party-dashboard?${params.toString()}`, {
        cache: "no-store",
        signal: controller.signal,
      });
      const body = await response.json();
      if (controller.signal.aborted) return;
      if (!response.ok) {
        setError(body.error || "Unable to load party waiver status.");
        return;
      }
      if (!body.parties?.length) {
        setError("No party was found. Check your party ID.");
        return;
      }
      setParties(body.parties);
    } catch {
      if (!controller.signal.aborted) setError("Unable to load party waiver status.");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  async function copyLink(party) {
    const link = `${window.location.origin}${party.waiverLink}`;
    await navigator.clipboard.writeText(link);
    setCopiedId(party.partyId);
    window.setTimeout(() => setCopiedId(""), 1600);
  }

  return (
    <div className="ppp-party-dashboard-shell">
      <a className="ppp-party-dashboard-brand" href="/" aria-label="Pixel Pulse Play home">
        <Image src="/assets/images/logo.png" alt="Pixel Pulse Play" width={184} height={64} priority />
      </a>
      <header className="ppp-party-dashboard-heading">
        <div className="ppp-party-dashboard-hero__copy">
          <span className="ppp-party-dashboard-kicker">Party waiver status</span>
          <h1>Check your party<br className="ppp-party-dashboard-title-break" /> waiver count</h1>
          <p>Who&apos;s ready to party? Check your group&apos;s waivers with your party ID.</p>
        </div>
      </header>

        <form className="ppp-party-dashboard-lookup" onSubmit={handleSubmit} noValidate>
          <label className="ppp-party-dashboard-field">
            <span>Party ID</span>
            <input
              type="text"
              value={lookupValue}
              onChange={(event) => setLookupValue(event.target.value)}
              placeholder="Your party ID"
              autoComplete="off"
            />
          </label>

          <button className="ppp-party-dashboard-submit" type="submit" disabled={loading}>
            {loading ? "Checking..." : "Check status"}
          </button>

          {error ? <p className="ppp-party-dashboard-error" role="alert">{error}</p> : null}
        </form>

      {hasResults ? (
        <section className="ppp-party-dashboard-results" aria-live="polite">
          {playError ? <p className="ppp-party-dashboard-error" role="alert">{playError}</p> : null}
          {featuredParty ? (
            <div className="ppp-party-dashboard-spotlight">
              <div className="ppp-party-dashboard-spotlight__meta">
                <span>Party {featuredParty.partyId}</span>
                <strong>{featuredParty.childName || featuredParty.hostName || "Your party"}</strong>
                <small>{formatDate(featuredParty.visitDate)}{featuredParty.startTime ? ` at ${featuredParty.startTime}` : ""}</small>
              </div>

              <div className="ppp-party-dashboard-count">
                <strong>{featuredParty.waiverFormsCompleted.toLocaleString()}</strong>
                <span>
                  {featuredParty.waiverFormsCompleted === 1 ? "waiver signed" : "waivers signed"}
                </span>
              </div>

              <p>
                <b>{plural(featuredParty.participantsCovered, "person", "people")}</b> covered
                {featuredParty.expectedGuests ? ` out of ${plural(featuredParty.expectedGuests, "expected guest")}` : ""}.
              </p>

              {featuredParty.expectedGuests ? (
                <div className="ppp-party-dashboard-meter ppp-party-dashboard-meter--large" aria-label={`${featuredPct}% of expected guests covered`}>
                  <span style={{ width: `${featuredPct}%` }} />
                </div>
              ) : null}

              {featuredParty.expectedGuests ? (
                <p>
                  {featuredRemaining ? (
                    <>
                      <b>{plural(featuredRemaining, "guest")}</b> still need a waiver.
                    </>
                  ) : (
                    <b>Everyone expected is covered.</b>
                  )}
                </p>
              ) : null}

              <SignedWaivers party={featuredParty} onPlayChange={setWillPlay} sending={Boolean(sendingParty)} />
              {playerEmailButton(featuredParty)}
            </div>
          ) : null}

          {parties.length > 1 ? (
            <div className="ppp-party-dashboard-summary">
              <div>
                <span>Waiver forms</span>
                <strong>{totals.forms.toLocaleString()}</strong>
              </div>
              <div>
                <span>Participants covered</span>
                <strong>{totals.participants.toLocaleString()}</strong>
              </div>
              <div>
                <span>Expected guests</span>
                <strong>{totals.expected ? totals.expected.toLocaleString() : "Not set"}</strong>
              </div>
            </div>
          ) : null}

          {parties.length > 1 ? (
            <div className="ppp-party-dashboard-list">
              {parties.map((party) => {
                const pct = progressPercent(party);
                return (
                  <article className="ppp-party-dashboard-card" key={party.partyId}>
                    <div className="ppp-party-dashboard-card__head">
                      <div>
                        <span>Party {party.partyId}</span>
                        <h2>{party.childName || party.hostName || "Your party"}</h2>
                        <p>{formatDate(party.visitDate)}{party.startTime ? ` at ${party.startTime}` : ""}</p>
                      </div>
                      {party.expectedGuests ? <strong>{pct}%</strong> : null}
                    </div>

                    {party.expectedGuests ? (
                      <div className="ppp-party-dashboard-meter" aria-label={`${pct}% of expected guests covered`}>
                        <span style={{ width: `${pct}%` }} />
                      </div>
                    ) : null}

                    <dl className="ppp-party-dashboard-stats">
                      <div>
                        <dt>Completed</dt>
                        <dd>{plural(party.waiverFormsCompleted, "form")}</dd>
                      </div>
                      <div>
                        <dt>Covered</dt>
                        <dd>{plural(party.participantsCovered, "person", "people")}</dd>
                      </div>
                      <div>
                        <dt>Host waiver</dt>
                        <dd>
                          {party.hostSigned ? (
                            <>
                              <FaCheckCircle aria-hidden="true" /> Complete
                            </>
                          ) : (
                            "Not found"
                          )}
                        </dd>
                      </div>
                    </dl>

                    <SignedWaivers party={party} onPlayChange={setWillPlay} sending={Boolean(sendingParty)} />
                    {playerEmailButton(party)}

                    <div className="ppp-party-dashboard-actions">
                      <a href={party.waiverLink}>
                        Open waiver <FaArrowRight aria-hidden="true" />
                      </a>
                      <button type="button" onClick={() => copyLink(party)}>
                        <FaCopy aria-hidden="true" />
                        {copiedId === party.partyId ? "Copied" : "Copy link"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}
          <p className="ppp-party-dashboard-reminder">
            Everyone playing needs a waiver before the party starts. Incomplete waivers may delay the start of your party.
          </p>
          {featuredParty ? (
            <button className="ppp-party-dashboard-copy-main" type="button" onClick={() => copyLink(featuredParty)}>
              <FaCopy aria-hidden="true" />
              {copiedId === featuredParty.partyId ? "Link copied" : "Copy waiver link"}
            </button>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
