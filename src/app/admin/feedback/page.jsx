"use client";

import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/AdminShell";
import "../../styles/admin-feedback.css";

const HEARD_ABOUT_OPTIONS = [
  "Google Search",
  "Google Maps",
  "Instagram",
  "Facebook",
  "TikTok",
  "YouTube",
  "Friend or Family",
  "Birthday Invitation",
  "School/Camp",
  "Marc & Mandy",
  "Canadian Home Trends",
  "Walked By",
  "Returning Customer",
  "Other",
];

const RATING_LABELS = {
  overall: "Overall",
  gameVariety: "Games",
  staff: "Staff",
  cleanliness: "Cleanliness",
  technology: "Tech",
  value: "Value",
};

function formatDate(value) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not recorded"
    : date.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
}

function sentenceValue(value = "") {
  return String(value || "")
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function listValue(values = []) {
  return values?.length ? values.join(", ") : "Not provided";
}

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("");
  const [minRating, setMinRating] = useState("");

  async function loadFeedback() {
    setLoading(true);
    setError("");

    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (source) params.set("source", source);
    if (minRating) params.set("minRating", minRating);

    try {
      const response = await fetch(`/api/admin/feedback?${params.toString()}`, { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to load feedback.");
        return;
      }

      setFeedback(Array.isArray(data.feedback) ? data.feedback : []);
    } catch (loadError) {
      setError("Unable to load feedback.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFeedback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const total = feedback.length;
    const scores = feedback.map((item) => Number(item.averageScore)).filter(Boolean);
    const average = scores.length
      ? (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1)
      : "0.0";
    const promoters = feedback.filter((item) => ["definitely", "probably"].includes(item.recommend)).length;
    const consent = feedback.filter((item) => item.marketingConsent).length;
    return { total, average, promoters, consent };
  }, [feedback]);

  return (
    <AdminShell>
      <div className="feedback-admin">
        <header className="waiver-admin-header waiver-admin-header--dashboard">
          <div>
            <span className="waiver-admin-kicker">Customer insights</span>
            <h1>Feedback Data</h1>
            <p>Review form submissions, source attribution, ratings, and guest comments.</p>
          </div>
        </header>

        <section className="feedback-admin__stats" aria-label="Feedback summary">
          <div className="feedback-admin__stat"><span>Total responses</span><strong>{stats.total}</strong></div>
          <div className="feedback-admin__stat"><span>Average score</span><strong>{stats.average}</strong></div>
          <div className="feedback-admin__stat"><span>Would recommend</span><strong>{stats.promoters}</strong></div>
          <div className="feedback-admin__stat"><span>Marketing consent</span><strong>{stats.consent}</strong></div>
        </section>

        <section className="feedback-admin__panel">
          <div className="feedback-admin__filters">
            <label>
              <span>Search</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, email, phone, party ID, comment" />
            </label>
            <label>
              <span>Heard about us</span>
              <select value={source} onChange={(event) => setSource(event.target.value)}>
                <option value="">All sources</option>
                {HEARD_ABOUT_OPTIONS.map((option) => <option value={option} key={option}>{option}</option>)}
              </select>
            </label>
            <label>
              <span>Minimum rating</span>
              <select value={minRating} onChange={(event) => setMinRating(event.target.value)}>
                <option value="">Any</option>
                <option value="5">5+</option>
                <option value="4">4+</option>
                <option value="3">3+</option>
                <option value="2">2+</option>
                <option value="1">1+</option>
              </select>
            </label>
            <button type="button" onClick={loadFeedback}>{loading ? "Loading..." : "Apply"}</button>
          </div>
        </section>

        {error ? <p className="feedback-admin__error">{error}</p> : null}
        {loading ? <p className="feedback-admin__empty">Loading feedback...</p> : null}
        {!loading && !error && !feedback.length ? <p className="feedback-admin__empty">No feedback submissions yet.</p> : null}

        <section className="feedback-admin__list" aria-label="Feedback submissions">
          {feedback.map((item) => (
            <article className="feedback-admin__card" key={item.id}>
              <div className="feedback-admin__card-head">
                <div>
                  <h2>{item.name}</h2>
                  <div className="feedback-admin__meta">
                    <span>{item.email}</span>
                    {item.phone ? <span>{item.phone}</span> : null}
                    <span>Submitted {formatDate(item.createdAt)}</span>
                  </div>
                </div>
                <span className="feedback-admin__score">{item.averageScore || "0.0"} / 5</span>
              </div>

              <div className="feedback-admin__tags">
                <span className="feedback-admin__tag">Heard: {item.heardAboutUs || "Not provided"}</span>
                <span className="feedback-admin__tag">Visit: {item.visitDate || "Not provided"}</span>
                {item.partyId ? <span className="feedback-admin__tag">Party ID: {item.partyId}</span> : null}
                <span className="feedback-admin__tag">Recommend: {sentenceValue(item.recommend) || "Not provided"}</span>
                <span className="feedback-admin__tag">Return: {sentenceValue(item.returnVisit) || "Not provided"}</span>
              </div>

              <div className="feedback-admin__grid">
                <div><span>Visit reasons</span><strong>{listValue(item.visitReasons)}</strong></div>
                <div><span>Challenges</span><strong>{listValue(item.rooms)}</strong></div>
                <div><span>Future ideas</span><strong>{listValue(item.futureExperiences)}</strong></div>
              </div>

              <div className="feedback-admin__grid">
                {Object.entries(RATING_LABELS).map(([key, label]) => (
                  <div key={key}>
                    <span>{label}</span>
                    <strong>{item.ratings?.[key] ? `${item.ratings[key]} / 5` : "Not provided"}</strong>
                  </div>
                ))}
              </div>

              <div className="feedback-admin__comments">
                <article>
                  <span>Biggest win</span>
                  <p>{item.favoriteMoment || "Not provided"}</p>
                </article>
                <article>
                  <span>Upgrade idea</span>
                  <p>{item.upgradeIdea || "Not provided"}</p>
                </article>
              </div>
            </article>
          ))}
        </section>
      </div>
    </AdminShell>
  );
}
