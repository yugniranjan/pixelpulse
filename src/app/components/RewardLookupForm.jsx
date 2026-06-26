"use client";

import { useMemo, useState } from "react";

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
        <strong>{getLevelLabel(player.currentLevel)}</strong>
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
} = {}) {
  const safeInitialPlayers = Array.isArray(initialPlayers) ? initialPlayers : [];
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [players, setPlayers] = useState(safeInitialPlayers);
  const [selectedPlayerId, setSelectedPlayerId] = useState(safeInitialPlayers[0]?.playerId || null);
  const [activeTab, setActiveTab] = useState("status");
  const [searched, setSearched] = useState(initiallySearched);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError);

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

  return (
    <section className="ppp-level-app" aria-label="Level Up Rewards app">
      <div className="ppp-level-app__topbar">
        <div>
          <span>Level Up Rewards</span>
          <strong>Player app</strong>
        </div>
        <small>{selectedPlayer ? getLevelLabel(selectedPlayer.currentLevel) : "Guest"}</small>
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
        <div className="ppp-level-app__players" aria-label="Select player">
          {players.map((player) => (
            <button
              type="button"
              key={player.playerId}
              className={player.playerId === selectedPlayer?.playerId ? "is-active" : ""}
              onClick={() => setSelectedPlayerId(player.playerId)}
            >
              {player.fullName}
            </button>
          ))}
        </div>
      ) : null}

      {selectedPlayer ? (
        <>
          <div className="ppp-level-app__identity">
            <div>
              <span>Player</span>
              <strong>{selectedPlayer.fullName}</strong>
            </div>
            <small>#{selectedPlayer.playerId}</small>
          </div>

          <div className="ppp-level-app__tabs" role="tablist" aria-label="Reward views">
            {TABS.map((tab) => (
              <button
                type="button"
                key={tab.id}
                className={activeTab === tab.id ? "is-active" : ""}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "status" ? <StatusPanel player={selectedPlayer} /> : null}
          {activeTab === "wallet" ? <WalletPanel player={selectedPlayer} /> : null}
          {activeTab === "rules" ? <RulesPanel /> : null}
        </>
      ) : (
        <EmptyState searched={searched} />
      )}
    </section>
  );
}
