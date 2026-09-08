"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import PrizeWheel from "@/components/PrizeWheel";

const TABS = [
  { id: "status", label: "Status" },
  { id: "wallet", label: "Redeem" },
  { id: "rules", label: "Rules" },
];

const RULES = [
  "Monthly visit streaks, birthdays, referrals, and special offers can unlock extra rewards.",
  "Redeeming a reward reduces your points.",
  "Unlocked rewards are confirmed by Pixel Pulse staff.",
];

const VALID_TAB_IDS = new Set(TABS.map((tab) => tab.id));

const REWARD_COSTS = {
  1: 5_000,
  2: 12_000,
  3: 20_000,
  4: 35_000,
  5: 50_000,
  6: 70_000,
  7: 90_000,
  8: 120_000,
  9: 160_000,
  10: 250_000,
};

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
  return ((parts[0]?.[0] || "P") + (parts[1]?.[0] || "")).toUpperCase();
}

function formatPlayerName(name = "") {
  return String(name || "")
    .trim()
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function getRewardCost(reward) {
  const providedCost = Number(reward?.costPoints || 0);
  if (providedCost > 0) return providedCost;
  return REWARD_COSTS[Number(reward?.levelNumber)] || 0;
}

function getProgress(player) {
  const lifetimePoints = Number(player?.lifetimePoints || 0);
  const currentThreshold = Number(player?.currentLevel?.thresholdPoints || 0);
  const nextThreshold = Number(player?.nextLevel?.thresholdPoints || 0);

  if (!nextThreshold) {
    return {
      percent: 100,
      label: "Top level reached",
      nextReward: "Pixel Pulse VIP Member",
    };
  }

  const range = Math.max(1, nextThreshold - currentThreshold);
  const earnedInLevel = Math.max(0, lifetimePoints - currentThreshold);
  const remaining = Math.max(0, nextThreshold - lifetimePoints);

  return {
    percent: Math.min(100, Math.round((earnedInLevel / range) * 100)),
    label: `${formatNumber(remaining)} PulsePoints to Level ${player.nextLevel.levelNumber}`,
    nextReward: player.nextLevel.rewardName || "next reward",
  };
}

function EmptyState({ searched }) {
  return (
    <div className="ppp-level-app__empty">
      <strong>{searched ? "No profile found" : "Find your rewards"}</strong>
      <p>
        {searched
          ? "Try the email or phone number used for your Pixel Pulse visit or waiver."
          : "Enter the email or phone number used for your Pixel Pulse visit to load your points, level, and unlocked rewards."}
      </p>
    </div>
  );
}

function StatusPanel({ player }) {
  const progress = getProgress(player);

  return (
    <div className="ppp-level-app__panel">
      <div className="ppp-level-app__hero-stat">
        <span>Total PulsePoints</span>
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

function normalizeSpinKey(identifier = "") {
  return String(identifier || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

function WalletPanel({ player, onRedeem, redeemingRewardId }) {
  const rewards = player.availableRewards || [];

  return (
    <div className="ppp-level-app__panel">
      <div className="ppp-level-app__wallet-head">
        <div>
          <span>Reward wallet</span>
          <strong>{rewards.length ? `${rewards.length} unlocked` : "No rewards yet"}</strong>
        </div>
        <small>Request here, then show staff</small>
      </div>
      {rewards.length ? (
        <div className="ppp-level-app__rewards">
          {rewards.map((reward) => (
            <article
              key={reward.id}
              className={reward.status === "requested" ? "is-requested" : ""}
            >
              <span>Level {reward.levelNumber}</span>
              <strong>{reward.rewardName}</strong>
              <small>
                {reward.expiresAt
                  ? `Expires ${formatDate(reward.expiresAt)}`
                  : "Valid for 6 months after redemption"}
              </small>
              {reward.status === "requested" ? (
                <div className="ppp-level-app__redemption-ready">
                  Ready for staff confirmation
                </div>
              ) : (
                <button
                  type="button"
                  className="ppp-level-app__redeem-button"
                  disabled={Boolean(redeemingRewardId)}
                  onClick={() => onRedeem(reward)}
                >
                  {redeemingRewardId === reward.id ? "Requesting" : "Redeem reward"}
                </button>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="ppp-level-app__empty ppp-level-app__empty--inline">
          <strong>Keep playing</strong>
          <p>Your unlocked rewards will appear here as your PulsePoints cross each level.</p>
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
  prizeWheelRewards = [],
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
  const [success, setSuccess] = useState("");
  const [redeemingRewardId, setRedeemingRewardId] = useState("");
  const [redeemCandidate, setRedeemCandidate] = useState(null);
  const [redeemDialogError, setRedeemDialogError] = useState("");
  const appRef = useRef(null);
  const playerPickerRef = useRef(null);

  const selectedPlayer = useMemo(() => {
    if (!players.length) return null;
    return players.find((player) => player.playerId === selectedPlayerId) || players[0];
  }, [players, selectedPlayerId]);

  useEffect(() => {
    if (!redeemCandidate) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event) {
      if (event.key === "Escape" && !redeemingRewardId) {
        setRedeemCandidate(null);
        setRedeemDialogError("");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [redeemCandidate, redeemingRewardId]);

  async function handleSubmit(event) {
    event.preventDefault();
    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier) return;

    setLoading(true);
    setError("");
    setSuccess("");
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
      if (nextPlayers.length) {
        setSuccess("Your Level Up dashboard is ready.");
      }
    } catch (lookupError) {
      setError(lookupError.message || "Unable to find rewards.");
      setPlayers([]);
      setSelectedPlayerId(null);
    } finally {
      setLoading(false);
    }
  }

  function handleRedeem(reward) {
    setRedeemCandidate(reward);
    setRedeemDialogError("");
  }

  async function confirmRedemption() {
    const reward = redeemCandidate;
    if (!reward) return;

    setRedeemingRewardId(reward.id);
    setError("");
    setSuccess("");
    setRedeemDialogError("");

    try {
      const response = await fetch("/api/rewards/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifier.trim(),
          playerId: selectedPlayer.playerId,
          rewardId: reward.id,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to request this redemption.");
      }

      setPlayers((currentPlayers) => currentPlayers.map((player) => {
        if (player.playerId !== selectedPlayer.playerId) return player;
        if (data.player) return data.player;

        return {
          ...player,
          lifetimePoints: data.reward?.remainingPoints ?? player.lifetimePoints,
          availableRewards: player.availableRewards.map((item) => (
            item.id === reward.id
              ? { ...item, status: "requested", expiresAt: data.reward?.expiresAt || "" }
              : item
          )),
        };
      }));
      setSuccess("Redemption requested. Show this screen to Pixel Pulse staff to confirm it.");
      setRedeemCandidate(null);
    } catch (requestError) {
      setRedeemDialogError(requestError.message || "Unable to request this redemption.");
    } finally {
      setRedeemingRewardId("");
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

  function resetLookup() {
    setIdentifier("");
    setPlayers([]);
    setSelectedPlayerId(null);
    setActiveTab("status");
    setSearched(false);
    setLoading(false);
    setError("");
    setSuccess("");
    setRedeemCandidate(null);
    setRedeemDialogError("");
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }

  const redemptionCost = getRewardCost(redeemCandidate);
  const currentBalance = Number(selectedPlayer?.lifetimePoints || 0);
  const remainingBalance = Math.max(0, currentBalance - redemptionCost);
  const canAffordRedemption = redemptionCost > 0 && currentBalance >= redemptionCost;
  const spinKey = normalizeSpinKey(identifier);

  return (
    <>
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
          <small>Player lookup</small>
        )}
      </div>

      <form className="ppp-level-app__search" method="get" onSubmit={handleSubmit}>
        <label htmlFor="reward-lookup-input">Enter the email or phone used for your visit</label>
        <div>
          <input
            id="reward-lookup-input"
            name="lookup"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder="Email or phone number"
            autoComplete="email"
          />
          <button type="submit" disabled={loading}>
            {loading ? "Checking" : "Show my rewards"}
          </button>
          {(identifier || selectedPlayer || error || success) ? (
            <button
              type="button"
              className="ppp-level-app__reset-button"
              onClick={resetLookup}
              disabled={loading}
            >
              Reset
            </button>
          ) : null}
        </div>
      </form>

      {error ? <p className="ppp-level-app__error">{error}</p> : null}
      {success ? <p className="ppp-level-app__success">{success}</p> : null}

      {players.length > 1 ? (
        <div className="ppp-level-app__player-picker">
          <span>Player on this account</span>
          <details ref={playerPickerRef}>
            <summary>{formatPlayerName(selectedPlayer?.fullName) || "Choose a player"}</summary>
            <div className="ppp-level-app__player-options" role="listbox" aria-label="Choose a player">
              {players.map((player) => (
                <button
                  type="button"
                  role="option"
                  aria-selected={player.playerId === selectedPlayer?.playerId}
                  className={player.playerId === selectedPlayer?.playerId ? "is-active" : ""}
                  key={player.playerId}
                  onClick={() => {
                    setSelectedPlayerId(player.playerId);
                    syncLookupUrl({ playerId: player.playerId, view: activeTab });
                    playerPickerRef.current?.removeAttribute("open");
                  }}
                >
                  {formatPlayerName(player.fullName)}
                </button>
              ))}
            </div>
          </details>
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
                <strong>{formatPlayerName(selectedPlayer.fullName)}</strong>
              </div>
            </div>
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
            {activeTab === "wallet" ? (
              <WalletPanel
                player={selectedPlayer}
                onRedeem={handleRedeem}
                redeemingRewardId={redeemingRewardId}
              />
            ) : null}
            {activeTab === "rules" ? <RulesPanel /> : null}
          </div>
          <div className="ppp-level-app__spin-card">
            <div>
              <span>Surprise spin</span>
              <strong>Spin your prize wheel</strong>
              <p>One spin is available for this email or phone lookup. Show the revealed prize to staff.</p>
            </div>
            <PrizeWheel prizes={prizeWheelRewards} spinKey={spinKey} oneSpinOnly />
          </div>
        </>
      ) : (
        <EmptyState searched={searched} />
      )}
      </section>
      {redeemCandidate && typeof document !== "undefined"
        ? createPortal(
            <div
              className="ppp-redeem-modal__backdrop"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget && !redeemingRewardId) {
                  setRedeemCandidate(null);
                  setRedeemDialogError("");
                }
              }}
            >
              <div
                className="ppp-redeem-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="ppp-redeem-modal-title"
              >
                <span className="ppp-redeem-modal__kicker">Confirm redemption</span>
                <h2 id="ppp-redeem-modal-title">Redeem this reward?</h2>
                <p>
                  Continue only when a Pixel Pulse staff member is ready to confirm your reward.
                </p>
                <div className="ppp-redeem-modal__reward">
                  <span>Level {redeemCandidate.levelNumber}</span>
                  <strong>{redeemCandidate.rewardName}</strong>
                  <small>Valid for six months from today</small>
                </div>
                <div className="ppp-redeem-modal__balance" aria-label="Redemption point balance">
                  <div>
                    <span>Points deducted</span>
                    <strong>−{formatNumber(redemptionCost)}</strong>
                  </div>
                  <div>
                    <span>Balance after</span>
                    <strong>{formatNumber(remainingBalance)}</strong>
                  </div>
                </div>
                {!canAffordRedemption ? (
                  <p className="ppp-redeem-modal__error">
                    You need {formatNumber(Math.max(0, redemptionCost - currentBalance))} more
                    PulsePoints for this reward.
                  </p>
                ) : null}
                {redeemDialogError ? (
                  <p className="ppp-redeem-modal__error">{redeemDialogError}</p>
                ) : null}
                <div className="ppp-redeem-modal__actions">
                  <button
                    type="button"
                    className="ppp-redeem-modal__cancel"
                    disabled={Boolean(redeemingRewardId)}
                    autoFocus
                    onClick={() => {
                      setRedeemCandidate(null);
                      setRedeemDialogError("");
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="ppp-redeem-modal__confirm"
                    disabled={Boolean(redeemingRewardId) || !canAffordRedemption}
                    onClick={confirmRedemption}
                  >
                    {redeemingRewardId ? "Requesting" : "Confirm redemption"}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
