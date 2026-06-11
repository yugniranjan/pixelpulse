"use client";

import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/AdminShell";

const TIERS = [
  { min: 5, label: "Arcade credits" },
  { min: 10, label: "Free 60-minute play pass" },
  { min: 20, label: "VIP access" },
];

function tierBadge(confirmed) {
  const unlocked = [...TIERS].reverse().find((t) => confirmed >= t.min);
  return unlocked ? unlocked.label : "";
}

function nextTier(confirmed) {
  const next = TIERS.find((t) => confirmed < t.min);
  return next ? `${next.min - confirmed} more for ${next.label}` : "Top tier reached";
}

const STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  rejected: "Rejected",
};

export default function AdminSquadReferralsPage() {
  const [referrers, setReferrers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState({});
  const [busyId, setBusyId] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/squad-referrals", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load referrals.");
      const data = await res.json();
      setReferrers(Array.isArray(data.referrers) ? data.referrers : []);
    } catch (err) {
      setError(err.message || "Failed to load referrals.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(id, status) {
    setBusyId(id);
    try {
      const res = await fetch("/api/admin/squad-referrals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error("Update failed.");
      await load();
    } catch (err) {
      setError(err.message || "Update failed.");
    } finally {
      setBusyId("");
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return referrers;
    return referrers
      .map((ref) => {
        const matchReferrer =
          ref.referrerEmail.toLowerCase().includes(q) ||
          (ref.referrerName || "").toLowerCase().includes(q);
        const matchingReferrals = ref.referrals.filter(
          (r) =>
            r.friendEmail.toLowerCase().includes(q) ||
            r.promoCode.toLowerCase().includes(q),
        );
        if (matchReferrer) return ref;
        if (matchingReferrals.length) return { ...ref, referrals: matchingReferrals };
        return null;
      })
      .filter(Boolean);
  }, [referrers, search]);

  const totals = useMemo(() => {
    const confirmed = referrers.reduce((sum, r) => sum + r.confirmed, 0);
    const pending = referrers.reduce((sum, r) => sum + r.pending, 0);
    return { referrers: referrers.length, confirmed, pending };
  }, [referrers]);

  return (
    <AdminShell>
      <div style={{ padding: "8px 4px 40px", color: "#0f172a" }}>
        <header style={{ marginBottom: 18 }}>
          <h1 style={{ margin: "0 0 6px", fontSize: 24 }}>Squad Referrals</h1>
          <p style={{ margin: 0, color: "#475569", fontSize: 14 }}>
            Confirm a referral once the friend visits and redeems their code. Award
            tiers are unlocked by the count of <strong>confirmed</strong> friends per
            referrer (5 → Arcade credits, 10 → Free 60-min pass, 20 → VIP access).
          </p>
        </header>

        <div
          style={{
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            marginBottom: 18,
            fontSize: 14,
            color: "#334155",
          }}
        >
          <span><strong>{totals.referrers}</strong> referrers</span>
          <span><strong>{totals.confirmed}</strong> confirmed</span>
          <span><strong>{totals.pending}</strong> pending</span>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by referrer, friend email, or promo code"
            style={{
              flex: "1 1 320px",
              padding: "9px 12px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              fontSize: 14,
            }}
          />
          <button
            type="button"
            onClick={load}
            style={{
              padding: "9px 16px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              background: "#f8fafc",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Refresh
          </button>
        </div>

        {error ? (
          <p style={{ color: "#b91c1c", fontSize: 14 }}>{error}</p>
        ) : null}

        {loading ? (
          <p style={{ color: "#64748b" }}>Loading referrals…</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: "#64748b" }}>No referrals yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {filtered.map((ref) => {
              const isOpen = expanded[ref.referrerEmail];
              const badge = tierBadge(ref.confirmed);
              return (
                <div
                  key={ref.referrerEmail}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 12,
                    background: "#ffffff",
                    overflow: "hidden",
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpanded((cur) => ({
                        ...cur,
                        [ref.referrerEmail]: !cur[ref.referrerEmail],
                      }))
                    }
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: "14px 16px",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>
                        {ref.referrerName || "(no name)"}
                      </div>
                      <div style={{ color: "#64748b", fontSize: 13 }}>
                        {ref.referrerEmail}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      {badge ? (
                        <span
                          style={{
                            background: "#dcfce7",
                            color: "#166534",
                            borderRadius: 999,
                            padding: "4px 10px",
                            fontSize: 12,
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                          }}
                        >
                          🏆 {badge}
                        </span>
                      ) : null}
                      <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        <div style={{ fontWeight: 800, fontSize: 18, color: "#0f172a" }}>
                          {ref.confirmed}
                          <span style={{ color: "#94a3b8", fontWeight: 500, fontSize: 13 }}>
                            {" "}/ {ref.total} confirmed
                          </span>
                        </div>
                        <div style={{ color: "#64748b", fontSize: 12 }}>
                          {nextTier(ref.confirmed)}
                        </div>
                      </div>
                      <span style={{ color: "#94a3b8" }}>{isOpen ? "▲" : "▼"}</span>
                    </div>
                  </button>

                  {isOpen ? (
                    <div style={{ borderTop: "1px solid #f1f5f9" }}>
                      {ref.referrals.map((r) => (
                        <div
                          key={r.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 12,
                            padding: "10px 16px",
                            borderBottom: "1px solid #f8fafc",
                            flexWrap: "wrap",
                          }}
                        >
                          <div style={{ minWidth: 200 }}>
                            <div style={{ fontSize: 14, color: "#0f172a" }}>
                              {r.friendEmail}
                            </div>
                            <div style={{ fontSize: 12, color: "#64748b" }}>
                              Code <strong>{r.promoCode}</strong>
                              {r.confirmedAt
                                ? ` · confirmed ${new Date(r.confirmedAt).toLocaleDateString()}`
                                : ""}
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color:
                                  r.status === "confirmed"
                                    ? "#166534"
                                    : r.status === "rejected"
                                    ? "#b91c1c"
                                    : "#92400e",
                              }}
                            >
                              {STATUS_LABELS[r.status] || r.status}
                            </span>
                            {r.status !== "confirmed" ? (
                              <button
                                type="button"
                                disabled={busyId === r.id}
                                onClick={() => updateStatus(r.id, "confirmed")}
                                style={btnStyle("#16a34a")}
                              >
                                Confirm
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={busyId === r.id}
                                onClick={() => updateStatus(r.id, "pending")}
                                style={btnStyle("#64748b")}
                              >
                                Undo
                              </button>
                            )}
                            {r.status !== "rejected" ? (
                              <button
                                type="button"
                                disabled={busyId === r.id}
                                onClick={() => updateStatus(r.id, "rejected")}
                                style={btnStyle("#dc2626")}
                              >
                                Reject
                              </button>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminShell>
  );
}

function btnStyle(color) {
  return {
    padding: "5px 12px",
    borderRadius: 7,
    border: `1px solid ${color}`,
    background: "#ffffff",
    color,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
  };
}
