"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

const LOGO_SRC = "/assets/images/logo.png";

const ROOMS = [
  "Laser Maze",
  "Tile Hunt",
  "T-Rex Heist",
  "Soccer Challenge",
  "Hexa Quest",
  "Edge Climb",
  "Shoot It Out",
  "Basket Ball",
  "Maze Gate",
  "Pizza Delivery",
  "Ball Toss",
  "Seashells",
];
const ALL_ROOMS = "All rooms";

const RATINGS = [
  ["overall", "Overall Experience"],
  ["staff", "Staff & Crew"],
  ["cleanliness", "Cleanliness"],
  ["value", "Value for Money"],
];

const DEFAULT_FORM = {
  name: "",
  email: "",
  phone: "",
  visitDate: "",
  rooms: [],
  ratings: {
    overall: "",
    staff: "",
    cleanliness: "",
    value: "",
  },
  ratingReasons: {
    overall: "",
    staff: "",
    cleanliness: "",
    value: "",
  },
  recommend: "",
  notes: "",
};

function cleanInitial(value = "") {
  return String(value || "").trim();
}

function allRoomsSelected(rooms = []) {
  return ROOMS.every((room) => rooms.includes(room));
}

function RatingBars({ name, label, value, onChange }) {
  return (
    <div className="ppp-feedback-rating">
      <div className="ppp-feedback-rating__label">{label}</div>
      <div className="ppp-feedback-bars" aria-label={`${label} rating`}>
        {[5, 4, 3, 2, 1].map((score) => (
          <label className="ppp-feedback-bar" key={score} style={{ "--bar-height": `${10 + score * 6}px` }}>
            <input
              type="radio"
              name={`rating-${name}`}
              value={score}
              checked={String(value) === String(score)}
              onChange={(event) => onChange(event.target.value)}
            />
            <span>{score}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export default function FeedbackForm({ initial = {} }) {
  const [form, setForm] = useState(() => ({
    ...DEFAULT_FORM,
    name: cleanInitial(initial.name),
    email: cleanInitial(initial.email),
    phone: cleanInitial(initial.phone),
    visitDate: cleanInitial(initial.visitDate),
    partyId: cleanInitial(initial.partyId),
  }));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const average = useMemo(() => {
    const values = Object.values(form.ratings)
      .map((rating) => Number(rating))
      .filter(Boolean);
    if (!values.length) return "";
    return (values.reduce((total, rating) => total + rating, 0) / values.length).toFixed(1);
  }, [form.ratings]);

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function updateRating(name, value) {
    setForm((current) => ({
      ...current,
      ratings: {
        ...current.ratings,
        [name]: value,
      },
      ratingReasons: Number(value) >= 5
        ? {
            ...current.ratingReasons,
            [name]: "",
          }
        : current.ratingReasons,
    }));
  }

  function updateRatingReason(name, value) {
    setForm((current) => ({
      ...current,
      ratingReasons: {
        ...current.ratingReasons,
        [name]: value,
      },
    }));
  }

  function toggleRoom(room) {
    setForm((current) => {
      if (room === ALL_ROOMS) {
        return {
          ...current,
          rooms: allRoomsSelected(current.rooms) ? [] : [...ROOMS],
        };
      }

      const hasRoom = current.rooms.includes(room);
      return {
        ...current,
        rooms: hasRoom
          ? current.rooms.filter((item) => item !== room)
          : [...current.rooms, room],
      };
    });
  }

  async function submitFeedback(event) {
    event.preventDefault();
    setError("");

    if (!form.name.trim() || !form.email.trim() || !form.ratings.overall) {
      setError("Please add your name, email, and overall rating.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to submit feedback.");
        return;
      }

      setSubmitted(true);
    } catch (submitError) {
      setError("Unable to submit feedback.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="ppp-feedback-shell">
      <section className="ppp-feedback-hero">
        <Image
          className="ppp-feedback-logo"
          src={LOGO_SRC}
          alt="Pixel Pulse Play"
          width={240}
          height={160}
          priority
        />
        <div className="ppp-feedback-kicker">
          <span />
          Pixel Pulse Play · Vaughan, ON
        </div>
        <h1>Rate your Visit</h1>
        <p>
          You played, you scored, now share how it went. Two minutes of feedback helps us tune every room for
          the next squad through the door.
        </p>
      </section>

      {submitted ? (
        <section className="ppp-feedback-confirm">
          <span>Complete</span>
          <h2>Feedback received</h2>
          <p>Thanks for playing. We read every submission and use it to improve the next visit.</p>
          {average ? <strong>Session score: {average} / 5.0</strong> : null}
        </section>
      ) : (
        <form className="ppp-feedback-form" onSubmit={submitFeedback}>
          <section className="ppp-feedback-section">
            <div className="ppp-feedback-section__head">
              <div>
                <h2>The Basics</h2>
                <p>So we can follow up if needed.</p>
              </div>
            </div>
            <div className="ppp-feedback-grid">
              <label>
                <span>Name *</span>
                <input value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Alex K." required />
              </label>
              <label>
                <span>Email *</span>
                <input type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} placeholder="you@example.com" required />
              </label>
              <label>
                <span>Visit date</span>
                <input type="date" value={form.visitDate} onChange={(event) => updateField("visitDate", event.target.value)} />
              </label>
              <label>
                <span>Phone optional</span>
                <input type="tel" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} placeholder="Optional phone number" />
              </label>
            </div>
          </section>

          <section className="ppp-feedback-section">
            <div className="ppp-feedback-section__head">
              <div>
                <h2>Which Rooms Did You Play?</h2>
                <p>Select all that apply.</p>
              </div>
            </div>
            <div className="ppp-feedback-chip-grid">
              {[ALL_ROOMS, ...ROOMS].map((room) => (
                <label className={`ppp-feedback-chip${room === ALL_ROOMS ? " ppp-feedback-chip--all" : ""}`} key={room}>
                  <input
                    type="checkbox"
                    checked={room === ALL_ROOMS ? allRoomsSelected(form.rooms) : form.rooms.includes(room)}
                    onChange={() => toggleRoom(room)}
                  />
                  <span>{room}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="ppp-feedback-section">
            <div className="ppp-feedback-section__head">
              <div>
                <h2>Rate Your Session</h2>
                <p>Tap a bar. Higher signal, better score.</p>
              </div>
            </div>
            {RATINGS.map(([name, label]) => {
              const rating = Number(form.ratings[name]);
              return (
                <div className="ppp-feedback-rating-block" key={name}>
                  <RatingBars
                    name={name}
                    label={label}
                    value={form.ratings[name]}
                    onChange={(value) => updateRating(name, value)}
                  />
                  {rating > 0 && rating < 5 ? (
                    <label className="ppp-feedback-rating-reason">
                      <span>What could make this a 5?</span>
                      <input
                        value={form.ratingReasons[name]}
                        onChange={(event) => updateRatingReason(name, event.target.value)}
                        placeholder={`Tell us how we can improve ${label.toLowerCase()}.`}
                      />
                    </label>
                  ) : null}
                </div>
              );
            })}
          </section>

          <section className="ppp-feedback-section">
            <div className="ppp-feedback-section__head">
              <div>
                <h2>Would You Recommend Us?</h2>
              </div>
            </div>
            <div className="ppp-feedback-toggle-group">
              {[
                ["yes", "Yes, definitely"],
                ["no", "Not yet"],
              ].map(([value, label]) => (
                <label className="ppp-feedback-toggle" key={value}>
                  <input
                    type="radio"
                    name="recommend"
                    value={value}
                    checked={form.recommend === value}
                    onChange={(event) => updateField("recommend", event.target.value)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="ppp-feedback-section">
            <div className="ppp-feedback-section__head">
              <div>
                <h2>Share Your Thoughts</h2>
                <p>What should we level up, and what already hits?</p>
              </div>
            </div>
            <label className="ppp-feedback-notes">
              <span>Notes</span>
              <textarea value={form.notes} onChange={(event) => updateField("notes", event.target.value)} placeholder="Tell us about your visit..." />
            </label>
          </section>

          <div className="ppp-feedback-submit">
            <p>Takes about 2 minutes. Your feedback shapes what we build next.</p>
            {error ? <strong>{error}</strong> : null}
            <button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Feedback"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
