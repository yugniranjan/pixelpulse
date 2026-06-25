"use client";

import { useState } from "react";

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(Number(value) || 0);
}

function nextLevelText(player) {
  if (!player?.nextLevel) return "Top level reached";
  const remaining = Math.max(0, player.nextLevel.thresholdPoints - player.lifetimePoints);
  return `${formatNumber(remaining)} pts to Level ${player.nextLevel.levelNumber}`;
}

export default function RewardLookupForm() {
  const [identifier, setIdentifier] = useState("");
  const [players, setPlayers] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

      setPlayers(Array.isArray(data.players) ? data.players : []);
      setSearched(true);
    } catch (lookupError) {
      setError(lookupError.message || "Unable to find rewards.");
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="ppp-level-lookup" aria-label="Check Level Up Rewards">
      <div className="ppp-level-lookup__head">
        <span>Check your rewards</span>
        <strong>See your points</strong>
      </div>
      <form onSubmit={handleSubmit}>
        <label htmlFor="reward-lookup-input">Email or phone</label>
        <div>
          <input
            id="reward-lookup-input"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder="you@example.com or phone"
            autoComplete="email"
          />
          <button type="submit" disabled={loading}>
            {loading ? "Checking" : "Check"}
          </button>
        </div>
      </form>

      {error ? <p className="ppp-level-lookup__error">{error}</p> : null}

      {searched && players.length === 0 ? (
        <p className="ppp-level-lookup__empty">
          No rewards found yet. Ask staff to confirm your player profile after your next visit.
        </p>
      ) : null}

      {players.length ? (
        <div className="ppp-level-lookup__results">
          {players.map((player) => (
            <article key={player.playerId}>
              <div>
                <strong>{player.fullName}</strong>
                <span>Player #{player.playerId}</span>
              </div>
              <div className="ppp-level-lookup__score">
                <strong>{formatNumber(player.lifetimePoints)}</strong>
                <span>lifetime points</span>
              </div>
              <div className="ppp-level-lookup__meta">
                <span>{player.currentLevel ? `Level ${player.currentLevel.levelNumber}` : "No level yet"}</span>
                <span>{nextLevelText(player)}</span>
              </div>
              {player.availableRewards?.length ? (
                <ul>
                  {player.availableRewards.slice(0, 3).map((reward) => (
                    <li key={reward.id}>{reward.rewardName}</li>
                  ))}
                </ul>
              ) : (
                <p>No unlocked rewards yet.</p>
              )}
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
