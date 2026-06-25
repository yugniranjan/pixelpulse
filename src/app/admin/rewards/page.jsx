"use client";

import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/AdminShell";

const currency = new Intl.NumberFormat("en-US");

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function nextLevelText(player) {
  if (!player?.nextLevel) return "Top level reached";
  const remaining = Math.max(0, player.nextLevel.thresholdPoints - player.lifetimePoints);
  return `${currency.format(remaining)} pts to Level ${player.nextLevel.levelNumber}`;
}

function statusStyles(status) {
  if (status === "redeemed") return { background: "#dcfce7", color: "#166534" };
  if (status === "void") return { background: "#fee2e2", color: "#991b1b" };
  return { background: "#fef3c7", color: "#92400e" };
}

export default function AdminRewardsPage() {
  const [players, setPlayers] = useState([]);
  const [stats, setStats] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [adjustment, setAdjustment] = useState({
    playerId: "",
    pointsDelta: "",
    reason: "",
  });
  const [busy, setBusy] = useState("");

  async function load(query = search) {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("search", query.trim());
      params.set("limit", "150");
      const res = await fetch(`/api/admin/rewards?${params}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load rewards.");
      setPlayers(Array.isArray(data.players) ? data.players : []);
      setStats(data.stats || null);
    } catch (err) {
      setError(err.message || "Failed to load rewards.");
    } finally {
      setLoading(false);
    }
  }

  async function loadPlayer(playerId) {
    if (!playerId) return;
    setDetailLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/rewards?playerId=${playerId}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load player rewards.");
      setSelected(data.player || null);
    } catch (err) {
      setError(err.message || "Failed to load player rewards.");
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submitAdjustment(event) {
    event.preventDefault();
    setBusy("adjustment");
    setError("");
    try {
      const res = await fetch("/api/admin/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: Number(adjustment.playerId),
          pointsDelta: Number(adjustment.pointsDelta),
          reason: adjustment.reason || "Admin adjustment",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Adjustment failed.");
      setAdjustment({ playerId: "", pointsDelta: "", reason: "" });
      setSelected(data.player || selected);
      await load(search);
    } catch (err) {
      setError(err.message || "Adjustment failed.");
    } finally {
      setBusy("");
    }
  }

  async function updateRedemption(id, status) {
    setBusy(id);
    setError("");
    try {
      const res = await fetch("/api/admin/rewards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, redeemedBy: "admin" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reward update failed.");
      setSelected(data.player || selected);
      await load(search);
    } catch (err) {
      setError(err.message || "Reward update failed.");
    } finally {
      setBusy("");
    }
  }

  const totals = useMemo(() => stats || {
    players: players.length,
    lifetimePoints: players.reduce((sum, player) => sum + player.lifetimePoints, 0),
    availableRewards: players.reduce((sum, player) => sum + player.availableRewards, 0),
    redeemedRewards: players.reduce((sum, player) => sum + player.redeemedRewards, 0),
  }, [players, stats]);

  return (
    <AdminShell>
      <div style={{ padding: "8px 4px 40px", color: "#0f172a" }}>
        <header style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 18 }}>
          <div>
            <h1 style={{ margin: "0 0 6px", fontSize: 24 }}>Level Up Rewards</h1>
            <p style={{ margin: 0, color: "#475569", fontSize: 14, maxWidth: 780 }}>
              Track lifetime reward points, current level, next reward, and staff-assisted redemptions.
              Scoreboard events should be written into the reward ledger once per score event.
            </p>
          </div>
          <button
            type="button"
            onClick={() => load(search)}
            style={{
              height: 40,
              padding: "0 16px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              background: "#f8fafc",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Refresh
          </button>
        </header>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(140px, 1fr))", gap: 12, marginBottom: 18 }}>
          {[
            ["Tracked players", totals.players],
            ["Lifetime points", currency.format(totals.lifetimePoints)],
            ["Available rewards", totals.availableRewards],
            ["Redeemed rewards", totals.redeemedRewards],
          ].map(([label, value]) => (
            <div key={label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 14 }}>
              <strong style={{ display: "block", fontSize: 22 }}>{value}</strong>
              <span style={{ color: "#64748b", fontSize: 13 }}>{label}</span>
            </div>
          ))}
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 340px", gap: 16, alignItems: "start" }}>
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ display: "flex", gap: 10, padding: 14, borderBottom: "1px solid #e2e8f0", flexWrap: "wrap" }}>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") load(event.currentTarget.value);
                }}
                placeholder="Search player name, email, or PlayerID"
                style={{
                  flex: "1 1 280px",
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  fontSize: 14,
                }}
              />
              <button
                type="button"
                onClick={() => load(search)}
                style={{
                  padding: "9px 16px",
                  borderRadius: 8,
                  border: "1px solid #0f172a",
                  background: "#0f172a",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Search
              </button>
            </div>

            {error ? <p style={{ color: "#b91c1c", padding: "0 14px", fontSize: 14 }}>{error}</p> : null}

            {loading ? (
              <p style={{ color: "#64748b", padding: 14 }}>Loading rewards…</p>
            ) : players.length === 0 ? (
              <p style={{ color: "#64748b", padding: 14 }}>
                No reward points have been recorded yet. Add a manual adjustment or connect scoreboard events to the ledger.
              </p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                  <thead>
                    <tr style={{ color: "#475569", background: "#f8fafc", textAlign: "left" }}>
                      <th style={{ padding: 12 }}>Player</th>
                      <th style={{ padding: 12 }}>Points</th>
                      <th style={{ padding: 12 }}>Level</th>
                      <th style={{ padding: 12 }}>Next</th>
                      <th style={{ padding: 12 }}>Rewards</th>
                      <th style={{ padding: 12 }}>Last Earned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.map((player) => (
                      <tr
                        key={player.playerId}
                        onClick={() => loadPlayer(player.playerId)}
                        style={{ borderTop: "1px solid #f1f5f9", cursor: "pointer" }}
                      >
                        <td style={{ padding: 12 }}>
                          <strong>{player.fullName}</strong>
                          <div style={{ color: "#64748b", fontSize: 12 }}>
                            ID {player.playerId}{player.email ? ` · ${player.email}` : ""}
                          </div>
                        </td>
                        <td style={{ padding: 12, fontWeight: 800 }}>{currency.format(player.lifetimePoints)}</td>
                        <td style={{ padding: 12 }}>
                          {player.currentLevel ? `Level ${player.currentLevel.levelNumber}` : "No level"}
                          {player.currentLevel ? (
                            <div style={{ color: "#64748b", fontSize: 12 }}>{player.currentLevel.rewardName}</div>
                          ) : null}
                        </td>
                        <td style={{ padding: 12, color: "#475569" }}>{nextLevelText(player)}</td>
                        <td style={{ padding: 12 }}>
                          <span style={{ color: "#92400e", fontWeight: 700 }}>{player.availableRewards}</span>
                          <span style={{ color: "#94a3b8" }}> / </span>
                          <span style={{ color: "#166534", fontWeight: 700 }}>{player.redeemedRewards}</span>
                        </td>
                        <td style={{ padding: 12, color: "#64748b" }}>{formatDate(player.lastEarnedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <aside style={{ display: "grid", gap: 16 }}>
            <form
              onSubmit={submitAdjustment}
              style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 14 }}
            >
              <h2 style={{ margin: "0 0 10px", fontSize: 16 }}>Manual Point Adjustment</h2>
              <label style={{ display: "grid", gap: 6, marginBottom: 10, fontSize: 13, color: "#475569" }}>
                Player ID
                <input
                  value={adjustment.playerId}
                  onChange={(event) => setAdjustment((cur) => ({ ...cur, playerId: event.target.value }))}
                  required
                  inputMode="numeric"
                  style={{ padding: "9px 10px", borderRadius: 8, border: "1px solid #cbd5e1" }}
                />
              </label>
              <label style={{ display: "grid", gap: 6, marginBottom: 10, fontSize: 13, color: "#475569" }}>
                Points
                <input
                  value={adjustment.pointsDelta}
                  onChange={(event) => setAdjustment((cur) => ({ ...cur, pointsDelta: event.target.value }))}
                  required
                  inputMode="numeric"
                  placeholder="Example: 500 or -250"
                  style={{ padding: "9px 10px", borderRadius: 8, border: "1px solid #cbd5e1" }}
                />
              </label>
              <label style={{ display: "grid", gap: 6, marginBottom: 12, fontSize: 13, color: "#475569" }}>
                Reason
                <input
                  value={adjustment.reason}
                  onChange={(event) => setAdjustment((cur) => ({ ...cur, reason: event.target.value }))}
                  placeholder="Staff correction, bonus, import test"
                  style={{ padding: "9px 10px", borderRadius: 8, border: "1px solid #cbd5e1" }}
                />
              </label>
              <button
                type="submit"
                disabled={busy === "adjustment"}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "none",
                  background: "#a4cf5f",
                  color: "#10170c",
                  cursor: "pointer",
                  fontWeight: 800,
                }}
              >
                {busy === "adjustment" ? "Saving…" : "Add Ledger Entry"}
              </button>
            </form>

            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 14 }}>
              <h2 style={{ margin: "0 0 8px", fontSize: 16 }}>Scoreboard Connection</h2>
              <p style={{ margin: 0, color: "#64748b", fontSize: 13, lineHeight: 1.55 }}>
                Send each eligible scoreboard event once to <code>/api/admin/rewards</code> with
                <code> playerId</code>, <code>pointsDelta</code>, <code>sourceScoreId</code>, and
                <code>sourceType: scoreboard</code>. Duplicate source IDs are ignored.
              </p>
            </div>
          </aside>
        </section>

        {selected ? (
          <section style={{ marginTop: 18, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
              <div>
                <h2 style={{ margin: "0 0 4px", fontSize: 18 }}>{selected.fullName}</h2>
                <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
                  Player ID {selected.playerId} · {currency.format(selected.lifetimePoints || 0)} lifetime points · {nextLevelText(selected)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                style={{ border: "1px solid #cbd5e1", background: "#fff", borderRadius: 8, padding: "8px 12px", cursor: "pointer" }}
              >
                Close
              </button>
            </div>

            {detailLoading ? <p style={{ color: "#64748b" }}>Loading player details…</p> : null}

            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 16 }}>
              <div>
                <h3 style={{ fontSize: 15, margin: "0 0 10px" }}>Rewards</h3>
                {!selected.redemptions?.length ? (
                  <p style={{ color: "#64748b", fontSize: 13 }}>No rewards unlocked yet.</p>
                ) : (
                  <div style={{ display: "grid", gap: 8 }}>
                    {selected.redemptions.map((reward) => (
                      <div key={reward.id} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                          <strong>Level {reward.levelNumber}: {reward.rewardName}</strong>
                          <span style={{ ...statusStyles(reward.status), borderRadius: 999, padding: "3px 8px", fontSize: 12, fontWeight: 800 }}>
                            {reward.status}
                          </span>
                        </div>
                        <div style={{ marginTop: 4, color: "#64748b", fontSize: 12 }}>
                          Unlocked {formatDate(reward.unlockedAt)} · Expires {formatDate(reward.expiresAt)}
                          {reward.redeemedAt ? ` · Redeemed ${formatDate(reward.redeemedAt)}` : ""}
                        </div>
                        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                          <button
                            type="button"
                            disabled={busy === reward.id || reward.status === "redeemed"}
                            onClick={() => updateRedemption(reward.id, "redeemed")}
                            style={{ border: "none", borderRadius: 8, padding: "7px 10px", background: "#dcfce7", color: "#166534", cursor: "pointer", fontWeight: 800 }}
                          >
                            Mark Redeemed
                          </button>
                          <button
                            type="button"
                            disabled={busy === reward.id || reward.status === "available"}
                            onClick={() => updateRedemption(reward.id, "available")}
                            style={{ border: "1px solid #cbd5e1", borderRadius: 8, padding: "7px 10px", background: "#fff", cursor: "pointer", fontWeight: 700 }}
                          >
                            Reopen
                          </button>
                          <button
                            type="button"
                            disabled={busy === reward.id || reward.status === "void"}
                            onClick={() => updateRedemption(reward.id, "void")}
                            style={{ border: "1px solid #fecaca", borderRadius: 8, padding: "7px 10px", background: "#fff", color: "#991b1b", cursor: "pointer", fontWeight: 700 }}
                          >
                            Void
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 style={{ fontSize: 15, margin: "0 0 10px" }}>Recent Ledger</h3>
                {!selected.ledger?.length ? (
                  <p style={{ color: "#64748b", fontSize: 13 }}>No ledger entries yet.</p>
                ) : (
                  <div style={{ display: "grid", gap: 8 }}>
                    {selected.ledger.map((entry) => (
                      <div key={entry.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, borderBottom: "1px solid #f1f5f9", paddingBottom: 8 }}>
                        <div>
                          <strong style={{ color: entry.pointsDelta >= 0 ? "#166534" : "#991b1b" }}>
                            {entry.pointsDelta >= 0 ? "+" : ""}{currency.format(entry.pointsDelta)}
                          </strong>
                          <div style={{ color: "#64748b", fontSize: 12 }}>
                            {entry.reason || entry.sourceType || "Reward points"}
                          </div>
                        </div>
                        <span style={{ color: "#64748b", fontSize: 12 }}>{formatDate(entry.earnedAt)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </AdminShell>
  );
}
