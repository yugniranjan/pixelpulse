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

const CHANNEL_GROUPS = {
  "Google Search": "Search",
  "Google Maps": "Maps",
  Instagram: "Social",
  Facebook: "Social",
  TikTok: "Social",
  YouTube: "Social",
  "Friend or Family": "Referral",
  "Birthday Invitation": "Referral",
  "School/Camp": "Groups",
  "Marc & Mandy": "Media",
  "Canadian Home Trends": "Media",
  "Walked By": "Local",
  "Returning Customer": "Retention",
  Other: "Other",
};

const DEFAULT_GIFT_CARD_SUBJECT = "Your FREE 60-Minute Pixel Pulse Play Pass";
const DEFAULT_GIFT_CARD_MESSAGE = [
  "Hi {name},",
  "",
  "Thanks for sharing your feedback with Pixel Pulse!",
  "",
  "As promised, here is your FREE 60-Minute Play Pass for your next visit.",
  "",
  "Redemption code: {code}",
  "Value: FREE 60-Minute Play Pass",
  "From: Pixel Pulse Team",
  "",
  "Valid for 30 days from issue. Terms and conditions apply.",
  "",
  "The Pixel Pulse Team",
  "Vaughan, Ontario",
  "https://www.pixelpulseplay.ca",
].join("\n");

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

function countValues(values = []) {
  const counts = new Map();
  values.filter(Boolean).forEach((value) => {
    counts.set(value, (counts.get(value) || 0) + 1);
  });

  const max = Math.max(...counts.values(), 1);
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value, percent: Math.round((value / max) * 100) }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

function renderPreview(value = "", item = {}) {
  return String(value || "")
    .replace(/\{name\}/gi, item.name || "there")
    .replace(/\{email\}/gi, item.email || "")
    .replace(/\{code\}/gi, item.giftCardCode || "Generated when sent");
}

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("");
  const [minRating, setMinRating] = useState("");
  const [issuingId, setIssuingId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [giftEmailDraft, setGiftEmailDraft] = useState(null);
  const [giftEmailError, setGiftEmailError] = useState("");
  const [status, setStatus] = useState("");

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

  function openGiftEmail(item) {
    setGiftEmailDraft({
      item,
      subject: DEFAULT_GIFT_CARD_SUBJECT,
      message: DEFAULT_GIFT_CARD_MESSAGE,
      reviewing: false,
    });
    setError("");
    setGiftEmailError("");
    setStatus("");
  }

  function updateGiftEmail(field, value) {
    setGiftEmailDraft((current) => current ? { ...current, [field]: value } : current);
    setGiftEmailError("");
  }

  function reviewGiftEmail() {
    if (!giftEmailDraft?.subject.trim() || !giftEmailDraft?.message.trim()) {
      setGiftEmailError("Gift card email subject and message are required.");
      return;
    }
    if (!/\{code\}/i.test(giftEmailDraft.message)) {
      setGiftEmailError("Gift card email message must include the {code} placeholder.");
      return;
    }
    setGiftEmailError("");
    setGiftEmailDraft((current) => current ? { ...current, reviewing: true } : current);
  }

  async function issueGiftCard() {
    if (!giftEmailDraft?.item) return;
    const item = giftEmailDraft.item;
    setIssuingId(item.id);
    setError("");
    setGiftEmailError("");
    setStatus("");

    try {
      const response = await fetch("/api/admin/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "issue-gift-card",
          id: item.id,
          emailSubject: giftEmailDraft.subject,
          emailMessage: giftEmailDraft.message,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setGiftEmailError(data.error || "Unable to issue gift card.");
        return;
      }

      setFeedback((current) =>
        current.map((row) => (row.id === data.feedback.id ? data.feedback : row)),
      );
      setStatus(`60-minute gift card sent to ${data.feedback.email}: ${data.giftCard.code}`);
      setGiftEmailDraft(null);
    } catch (issueError) {
      setGiftEmailError("Unable to issue gift card.");
    } finally {
      setIssuingId("");
    }
  }

  async function deleteFeedback(item) {
    const confirmed = window.confirm(`Delete feedback from ${item.name || item.email || "this guest"}? This cannot be undone.`);
    if (!confirmed) return;

    setDeletingId(item.id);
    setError("");
    setStatus("");

    try {
      const response = await fetch(`/api/admin/feedback?id=${encodeURIComponent(item.id)}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to delete feedback.");
        return;
      }

      setFeedback((current) => current.filter((row) => row.id !== item.id));
      setStatus(`Deleted feedback from ${item.name || item.email || "guest"}.`);
    } catch (deleteError) {
      setError("Unable to delete feedback.");
    } finally {
      setDeletingId("");
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
    const lowScores = scores.filter((score) => score > 0 && score < 4).length;
    const topSource = countValues(feedback.map((item) => item.heardAboutUs || "Not provided"))[0]?.label || "Not provided";
    const topReason = countValues(feedback.flatMap((item) => item.visitReasons || []))[0]?.label || "Not provided";
    const promoterRate = total ? Math.round((promoters / total) * 100) : 0;
    return { total, average, promoters, consent, lowScores, topSource, topReason, promoterRate };
  }, [feedback]);
  const sourceChart = useMemo(() => {
    return countValues(feedback.map((item) => item.heardAboutUs || "Not provided")).slice(0, 8);
  }, [feedback]);
  const channelChart = useMemo(
    () =>
      countValues(
        feedback.map((item) => CHANNEL_GROUPS[item.heardAboutUs] || (item.heardAboutUs ? "Other" : "Not provided")),
      ),
    [feedback],
  );
  const visitReasonChart = useMemo(
    () => countValues(feedback.flatMap((item) => item.visitReasons || [])).slice(0, 8),
    [feedback],
  );
  const recommendChart = useMemo(
    () => countValues(feedback.map((item) => sentenceValue(item.recommend) || "Not provided")),
    [feedback],
  );
  const returnChart = useMemo(
    () => countValues(feedback.map((item) => sentenceValue(item.returnVisit) || "Not provided")),
    [feedback],
  );
  const ratingDistribution = useMemo(
    () =>
      [5, 4, 3, 2, 1].map((rating) => {
        const value = feedback.filter((item) => Math.round(Number(item.averageScore)) === rating).length;
        const max = Math.max(
          ...[5, 4, 3, 2, 1].map((score) => feedback.filter((item) => Math.round(Number(item.averageScore)) === score).length),
          1,
        );
        return { label: `${rating} star`, value, percent: Math.round((value / max) * 100) };
      }),
    [feedback],
  );
  const ratingChart = useMemo(() => {
    return Object.entries(RATING_LABELS).map(([key, label]) => {
      const values = feedback.map((item) => Number(item.ratings?.[key])).filter(Boolean);
      const average = values.length
        ? values.reduce((sum, value) => sum + value, 0) / values.length
        : 0;
      return {
        key,
        label,
        value: average ? average.toFixed(1) : "0.0",
        percent: Math.round((average / 5) * 100),
      };
    });
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
          <div className="feedback-admin__stat"><span>Would recommend</span><strong>{stats.promoterRate}%</strong></div>
          <div className="feedback-admin__stat"><span>Marketing consent</span><strong>{stats.consent}</strong></div>
        </section>

        <section className="feedback-admin__insights" aria-label="Marketing insights">
          <article><span>Top source</span><strong>{stats.topSource}</strong></article>
          <article><span>Top visit reason</span><strong>{stats.topReason}</strong></article>
          <article><span>Promoters</span><strong>{stats.promoters}</strong></article>
          <article><span>Needs follow-up</span><strong>{stats.lowScores}</strong></article>
        </section>

        <section className="feedback-admin__charts" aria-label="Feedback charts">
          <article className="feedback-admin__chart-card">
            <div className="feedback-admin__chart-head">
              <h2>How People Found Us</h2>
              <span>{sourceChart.length} sources</span>
            </div>
            <div className="feedback-admin__bar-chart">
              {sourceChart.length ? sourceChart.map((row) => (
                <div className="feedback-admin__bar-row" key={row.label}>
                  <span>{row.label}</span>
                  <div><i style={{ width: `${row.percent}%` }} /></div>
                  <strong>{row.value}</strong>
                </div>
              )) : <p>No source data yet.</p>}
            </div>
          </article>

          <article className="feedback-admin__chart-card">
            <div className="feedback-admin__chart-head">
              <h2>Marketing Channels</h2>
              <span>Grouped</span>
            </div>
            <div className="feedback-admin__bar-chart">
              {channelChart.length ? channelChart.map((row) => (
                <div className="feedback-admin__bar-row" key={row.label}>
                  <span>{row.label}</span>
                  <div><i style={{ width: `${row.percent}%` }} /></div>
                  <strong>{row.value}</strong>
                </div>
              )) : <p>No channel data yet.</p>}
            </div>
          </article>

          <article className="feedback-admin__chart-card">
            <div className="feedback-admin__chart-head">
              <h2>Average Ratings</h2>
              <span>Out of 5</span>
            </div>
            <div className="feedback-admin__bar-chart">
              {ratingChart.map((row) => (
                <div className="feedback-admin__bar-row" key={row.key}>
                  <span>{row.label}</span>
                  <div><i style={{ width: `${row.percent}%` }} /></div>
                  <strong>{row.value}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="feedback-admin__chart-card">
            <div className="feedback-admin__chart-head">
              <h2>Why People Visit</h2>
              <span>Visit reason</span>
            </div>
            <div className="feedback-admin__bar-chart">
              {visitReasonChart.length ? visitReasonChart.map((row) => (
                <div className="feedback-admin__bar-row" key={row.label}>
                  <span>{row.label}</span>
                  <div><i style={{ width: `${row.percent}%` }} /></div>
                  <strong>{row.value}</strong>
                </div>
              )) : <p>No visit reason data yet.</p>}
            </div>
          </article>

          <article className="feedback-admin__chart-card">
            <div className="feedback-admin__chart-head">
              <h2>Rating Distribution</h2>
              <span>Average score</span>
            </div>
            <div className="feedback-admin__bar-chart">
              {ratingDistribution.map((row) => (
                <div className="feedback-admin__bar-row" key={row.label}>
                  <span>{row.label}</span>
                  <div><i style={{ width: `${row.percent}%` }} /></div>
                  <strong>{row.value}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="feedback-admin__chart-card">
            <div className="feedback-admin__chart-head">
              <h2>Recommendation Intent</h2>
              <span>Advocacy</span>
            </div>
            <div className="feedback-admin__bar-chart">
              {recommendChart.length ? recommendChart.map((row) => (
                <div className="feedback-admin__bar-row" key={row.label}>
                  <span>{row.label}</span>
                  <div><i style={{ width: `${row.percent}%` }} /></div>
                  <strong>{row.value}</strong>
                </div>
              )) : <p>No recommendation data yet.</p>}
            </div>
          </article>

          <article className="feedback-admin__chart-card">
            <div className="feedback-admin__chart-head">
              <h2>What Brings People Back</h2>
              <span>Return intent</span>
            </div>
            <div className="feedback-admin__bar-chart">
              {returnChart.length ? returnChart.map((row) => (
                <div className="feedback-admin__bar-row" key={row.label}>
                  <span>{row.label}</span>
                  <div><i style={{ width: `${row.percent}%` }} /></div>
                  <strong>{row.value}</strong>
                </div>
              )) : <p>No return data yet.</p>}
            </div>
          </article>
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
        {status ? <p className="feedback-admin__status">{status}</p> : null}
        {loading ? <p className="feedback-admin__empty">Loading feedback...</p> : null}
        {!loading && !error && !feedback.length ? <p className="feedback-admin__empty">No feedback submissions yet.</p> : null}

        <section className="feedback-admin__list" aria-label="Feedback submissions">
          {feedback.map((item) => (
            <details className="feedback-admin__card" key={item.id}>
              <summary className="feedback-admin__summary">
                <div>
                  <h2>{item.name}</h2>
                  <div className="feedback-admin__meta">
                    <span>{item.email}</span>
                    {item.phone ? <span>{item.phone}</span> : null}
                    <span>Heard: {item.heardAboutUs || "Not provided"}</span>
                    <span>Submitted: {formatDate(item.createdAt)}</span>
                    <span>Visit: {item.visitDate || "Not provided"}</span>
                  </div>
                </div>
                <div className="feedback-admin__summary-actions">
                  {item.giftCardCode && item.giftCardSentAt ? (
                    <span className="feedback-admin__gift-status">Gift sent: {item.giftCardCode}</span>
                  ) : (
                    <button
                      type="button"
                      className="feedback-admin__gift-button"
                      onClick={(event) => {
                        event.preventDefault();
                        openGiftEmail(item);
                      }}
                      disabled={issuingId === item.id || !item.email}
                    >
                      {issuingId === item.id ? "Sending..." : item.giftCardCode ? "Review & Send Gift" : "Review Gift Email"}
                    </button>
                  )}
                  <button
                    type="button"
                    className="feedback-admin__delete-button"
                    onClick={(event) => {
                      event.preventDefault();
                      deleteFeedback(item);
                    }}
                    disabled={deletingId === item.id}
                  >
                    {deletingId === item.id ? "Deleting..." : "Delete"}
                  </button>
                  <span className="feedback-admin__score">{item.averageScore || "0.0"} / 5</span>
                  <span className="feedback-admin__toggle">Details</span>
                </div>
              </summary>

              <div className="feedback-admin__details">
                <div className="feedback-admin__tags">
                  <span className="feedback-admin__tag">Heard: {item.heardAboutUs || "Not provided"}</span>
                  <span className="feedback-admin__tag">Submitted: {formatDate(item.createdAt)}</span>
                  <span className="feedback-admin__tag">Visit: {item.visitDate || "Not provided"}</span>
                  <span className="feedback-admin__tag">Gift card: {item.giftCardCode || "Not sent"}</span>
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
              </div>
            </details>
          ))}
        </section>

        {giftEmailDraft ? (
          <div className="feedback-email-overlay" role="dialog" aria-modal="true" onClick={() => setGiftEmailDraft(null)}>
            <div className="feedback-email-modal" onClick={(event) => event.stopPropagation()}>
              <button
                type="button"
                className="feedback-email-modal__close"
                onClick={() => setGiftEmailDraft(null)}
                aria-label="Close"
              >
                ×
              </button>
              <h2>Review Gift Card Email</h2>
              <p className="feedback-email-modal__to">
                To <strong>{giftEmailDraft.item.email}</strong>
              </p>

              {giftEmailDraft.reviewing ? (
                <div className="feedback-email-modal__review">
                  <div className="feedback-email-modal__banner">
                    Cross-check the email before sending. The gift card code will be generated when you confirm.
                  </div>
                  <dl>
                    <div>
                      <dt>Subject</dt>
                      <dd>{renderPreview(giftEmailDraft.subject, giftEmailDraft.item)}</dd>
                    </div>
                    <div>
                      <dt>Message</dt>
                      <dd className="feedback-email-modal__preview">
                        {renderPreview(giftEmailDraft.message, giftEmailDraft.item)}
                      </dd>
                    </div>
                  </dl>
                  {giftEmailError ? <p className="feedback-email-modal__error">{giftEmailError}</p> : null}
                  <div className="feedback-email-modal__actions">
                    <button
                      type="button"
                      className="feedback-email-modal__ghost"
                      onClick={() => setGiftEmailDraft((current) => current ? { ...current, reviewing: false } : current)}
                      disabled={issuingId === giftEmailDraft.item.id}
                    >
                      Back to edit
                    </button>
                    <button type="button" onClick={issueGiftCard} disabled={issuingId === giftEmailDraft.item.id}>
                      {issuingId === giftEmailDraft.item.id ? "Sending..." : "Confirm & Send"}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <label className="feedback-email-modal__field">
                    <span>Subject</span>
                    <input value={giftEmailDraft.subject} onChange={(event) => updateGiftEmail("subject", event.target.value)} />
                  </label>
                  <label className="feedback-email-modal__field">
                    <span>Message</span>
                    <textarea rows={13} value={giftEmailDraft.message} onChange={(event) => updateGiftEmail("message", event.target.value)} />
                  </label>
                  <p className="feedback-email-modal__help">Use {"{name}"} for the guest name and keep {"{code}"} where the redemption code should appear.</p>
                  {giftEmailError ? <p className="feedback-email-modal__error">{giftEmailError}</p> : null}
                  <div className="feedback-email-modal__actions">
                    <button type="button" className="feedback-email-modal__ghost" onClick={() => setGiftEmailDraft(null)}>
                      Cancel
                    </button>
                    <button type="button" onClick={reviewGiftEmail}>
                      Review & Send
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </AdminShell>
  );
}
