"use client";

import { useMemo, useRef, useState } from "react";

const TABS = [
  { id: "status", label: "Status" },
  { id: "wallet", label: "Wallet" },
  { id: "rules", label: "Rules" },
];

const RULES = [
  "Points are based on lifetime gameplay scores.",
  "Redeeming a reward does not reset your level.",
  "Unlocked rewards are confirmed by Pixel Pulse staff.",
  "Rewards can have expiry dates, blackout dates, or player limits.",
];

const VALID_TAB_IDS = new Set(TABS.map((tab) => tab.id));

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return "No recent score";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No recent score";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getLevelLabel(level) {
  return level ? `Level ${level.levelNumber}` : "Getting started";
}

function getLevelNumber(level) {
  return level?.levelNumber || 0;
}

function getInitials(name = "") {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] || "P") + (parts[1]?.[0] || "");
}

function getProgress(player) {
  const lifetimePoints = Number(player?.lifetimePoints || 0);
  const currentThreshold = Number(player?.currentLevel?.thresholdPoints || 0);
  const nextThreshold = Number(player?.nextLevel?.thresholdPoints || 0);

  if (!nextThreshold) {
    return {
      percent: 100,
      label: "Top level reached",
      nextReward: "VIP status",
    };
  }

  const range = Math.max(1, nextThreshold - currentThreshold);
  const earnedInLevel = Math.max(0, lifetimePoints - currentThreshold);
  const remaining = Math.max(0, nextThreshold - lifetimePoints);

  return {
    percent: Math.min(100, Math.round((earnedInLevel / range) * 100)),
    label: `${formatNumber(remaining)} points to Level ${player.nextLevel.levelNumber}`,
    nextReward: player.nextLevel.rewardName || "next reward",
  };
}

function EmptyState({ searched }) {
  return (
    <div className="ppp-level-app__empty">
      <strong>{searched ? "No profile found" : "Find your rewards"}</strong>
      <p>
        {searched
          ? "Try the name, email, phone number, or Player ID connected to your Pixel Pulse profile."
          : "Enter your name, email, phone, or Player ID to load your points, level, and unlocked rewards."}
      </p>
    </div>
  );
}

function StatusPanel({ player }) {
  const progress = getProgress(player);

  return (
    <div className="ppp-level-app__panel">
      <div className="ppp-level-app__hero-stat">
        <span>Total points</span>
        <strong>{formatNumber(player.lifetimePoints)}</strong>
      </div>
      <div className="ppp-level-app__meter" aria-label={progress.label}>
        <span style={{ width: `${progress.percent}%` }} />
      </div>
      <div className="ppp-level-app__progress-copy">
        <strong className="ppp-level-app__level-chip">
          <span>{getLevelNumber(player.currentLevel)}</span>
          {getLevelLabel(player.currentLevel)}
        </strong>
        <span>{progress.label}</span>
      </div>
      <div className="ppp-level-app__stats">
        <div>
          <span>Next reward</span>
          <strong>{progress.nextReward}</strong>
        </div>
        <div>
          <span>Repeat visits</span>
          <strong>{formatNumber(player.repeatVisits)}</strong>
        </div>
        <div>
          <span>Score events</span>
          <strong>{formatNumber(player.scoreEvents)}</strong>
        </div>
        <div>
          <span>Last score</span>
          <strong>{formatDate(player.lastScoreAt)}</strong>
        </div>
      </div>
    </div>
  );
}

function WalletPanel({ player }) {
  const rewards = player.availableRewards || [];

  return (
    <div className="ppp-level-app__panel">
      <div className="ppp-level-app__wallet-head">
        <div>
          <span>Reward wallet</span>
          <strong>{rewards.length ? `${rewards.length} unlocked` : "No rewards yet"}</strong>
        </div>
        <small>Show staff to redeem</small>
      </div>
      {rewards.length ? (
        <div className="ppp-level-app__rewards">
          {rewards.map((reward) => (
            <article key={reward.id}>
              <span>Level {reward.levelNumber}</span>
              <strong>{reward.rewardName}</strong>
              <small>{reward.expiresAt ? `Expires ${formatDate(reward.expiresAt)}` : "Ask staff for details"}</small>
            </article>
          ))}
        </div>
      ) : (
        <div className="ppp-level-app__empty ppp-level-app__empty--inline">
          <strong>Keep playing</strong>
          <p>Your unlocked rewards will appear here as your lifetime points cross each level.</p>
        </div>
      )}
    </div>
  );
}

function RulesPanel() {
  return (
    <div className="ppp-level-app__panel">
      <div className="ppp-level-app__rules">
        {RULES.map((rule) => (
          <p key={rule}>{rule}</p>
        ))}
      </div>
    </div>
  );
}

export default function RewardLookupForm({
  initialIdentifier = "",
  initialPlayers = [],
  initialError = "",
  initiallySearched = false,
  initialSelectedPlayerId = null,
  initialActiveTab = "status",
} = {}) {
  const safeInitialPlayers = Array.isArray(initialPlayers) ? initialPlayers : [];
  const safeInitialPlayerId =
    safeInitialPlayers.find((player) => player.playerId === Number(initialSelectedPlayerId))?.playerId ||
    safeInitialPlayers[0]?.playerId ||
    null;
  const safeInitialTab = VALID_TAB_IDS.has(initialActiveTab) ? initialActiveTab : "status";
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [players, setPlayers] = useState(safeInitialPlayers);
  const [selectedPlayerId, setSelectedPlayerId] = useState(safeInitialPlayerId);
  const [activeTab, setActiveTab] = useState(safeInitialTab);
  const [searched, setSearched] = useState(initiallySearched);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError);
  const appRef = useRef(null);

  const selectedPlayer = useMemo(() => {
    if (!players.length) return null;
    return players.find((player) => player.playerId === selectedPlayerId) || players[0];
  }, [players, selectedPlayerId]);

  async function handleSubmit(event) {
    event.preventDefault();
    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier) return;

    setLoading(true);
    setError("");
    setSearched(false);

    try {
      const response = await fetch("/api/rewards/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: cleanIdentifier }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to find rewards.");
      }

      const nextPlayers = Array.isArray(data.players) ? data.players : [];
      setPlayers(nextPlayers);
      setSelectedPlayerId(nextPlayers[0]?.playerId || null);
      setActiveTab("status");
      setSearched(true);
    } catch (lookupError) {
      setError(lookupError.message || "Unable to find rewards.");
      setPlayers([]);
      setSelectedPlayerId(null);
    } finally {
      setLoading(false);
    }
  }

  function getLookupHref({ playerId = selectedPlayer?.playerId, view = activeTab } = {}) {
    const params = new URLSearchParams();

    if (identifier.trim()) params.set("lookup", identifier.trim());
    if (playerId) params.set("player", String(playerId));
    if (view && view !== "status") params.set("view", view);

    const query = params.toString();
    return query ? `?${query}` : "?";
  }

  function syncLookupUrl({ playerId = selectedPlayer?.playerId, view = activeTab } = {}) {
    if (typeof window === "undefined") return;
    window.history.replaceState(null, "", getLookupHref({ playerId, view }));
  }

  return (
    <section
      ref={appRef}
      className={`ppp-level-app ${selectedPlayer ? "ppp-level-app--has-results" : "ppp-level-app--empty"}`}
      aria-label="Level Up Rewards app"
    >
      <div className="ppp-level-app__topbar">
        <div>
          <span>Level Up Rewards</span>
          <strong>Player app</strong>
        </div>
        {selectedPlayer ? (
          <small className="ppp-level-app__level-badge">
            <span>{getLevelNumber(selectedPlayer.currentLevel)}</span>
            {getLevelLabel(selectedPlayer.currentLevel)}
          </small>
        ) : (
          <small>Guest</small>
        )}
      </div>

      <form className="ppp-level-app__search" method="get" onSubmit={handleSubmit}>
        <label htmlFor="reward-lookup-input">Name, email, phone, or Player ID</label>
        <div>
          <input
            id="reward-lookup-input"
            name="lookup"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder="Player name, email, phone, or ID"
            autoComplete="name"
          />
          <button type="submit" disabled={loading}>
            {loading ? "Checking" : "Check"}
          </button>
        </div>
      </form>

      {error ? <p className="ppp-level-app__error">{error}</p> : null}

      {players.length > 1 ? (
        <div>
          <div className="ppp-level-app__chips-label">Players on account</div>
          <div className="ppp-level-app__players" aria-label="Select player">
            {players.map((player) => (
              <a
                href={getLookupHref({ playerId: player.playerId, view: activeTab })}
                key={player.playerId}
                className={player.playerId === selectedPlayer?.playerId ? "is-active" : ""}
                onClick={(event) => {
                  event.preventDefault();
                  setSelectedPlayerId(player.playerId);
                }}
              >
                {player.fullName}
              </a>
            ))}
          </div>
        </div>
      ) : null}

      {selectedPlayer ? (
        <>
          <div className="ppp-level-app__identity">
            <div className="ppp-level-app__identity-main">
              <div className="ppp-level-app__avatar" aria-hidden="true">
                {getInitials(selectedPlayer.fullName)}
              </div>
              <div>
                <span>Player</span>
                <strong>{selectedPlayer.fullName}</strong>
              </div>
            </div>
            <small>#{selectedPlayer.playerId}</small>
          </div>

          <div className="ppp-level-app__tabs" role="tablist" aria-label="Reward views">
            {TABS.map((tab) => (
              <button
                type="button"
                key={tab.id}
                className={activeTab === tab.id ? "is-active" : ""}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  syncLookupUrl({ playerId: selectedPlayer.playerId, view: tab.id });
                  appRef.current?.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="ppp-level-app__view" key={activeTab}>
            {activeTab === "status" ? <StatusPanel player={selectedPlayer} /> : null}
            {activeTab === "wallet" ? <WalletPanel player={selectedPlayer} /> : null}
            {activeTab === "rules" ? <RulesPanel /> : null}
          </div>
        </>
      ) : (
        <EmptyState searched={searched} />
      )}
    </section>
  );
}
