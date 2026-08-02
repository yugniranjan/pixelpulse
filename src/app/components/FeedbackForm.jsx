"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  FaBasketball,
  FaBolt,
  FaBriefcase,
  FaBullseye,
  FaCakeCandles,
  FaCalendarCheck,
  FaClockRotateLeft,
  FaDoorClosed,
  FaDoorOpen,
  FaFish,
  FaFutbol,
  FaGamepad,
  FaGhost,
  FaMedal,
  FaMountain,
  FaPeopleGroup,
  FaPersonWalking,
  FaPizzaSlice,
  FaPlus,
  FaPuzzlePiece,
  FaQuestion,
  FaSchool,
  FaShapes,
  FaSnowflake,
  FaThumbsDown,
  FaTrophy,
  FaUserGroup,
  FaUsers,
  FaVrCardboard,
} from "react-icons/fa6";

const LOGO_SRC = "/assets/images/logo.png";
const GOOGLE_REVIEW_URL =
  "https://g.page/r/CQzE8tFOGzEYEBM/review";

const ROOMS = [
  "Laser Maze",
  "Tile Hunt",
  "T-Rex Heist",
  "Soccer Challenge",
  "Hexa Quest",
  "Edge Climb",
  "Shoot It Out",
  "Basketball",
  "Maze Gate",
  "Pizza Delivery",
  "Ball Toss",
  "Seashells",
  "Arcade Games",
];
const ALL_ROOMS = "All rooms";

const VISIT_REASONS = [
  "Birthday Party",
  "Family Fun",
  "Friends Hangout",
  "Date Night",
  "Corporate Event",
  "School Group",
  "Walk-in Visit",
  "First Visit",
  "Returning Player",
];

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

const VISIT_REASON_ICONS = {
  "Birthday Party": FaCakeCandles,
  "Family Fun": FaUsers,
  "Friends Hangout": FaUserGroup,
  "Date Night": FaCalendarCheck,
  "Corporate Event": FaBriefcase,
  "School Group": FaSchool,
  "Walk-in Visit": FaPersonWalking,
  "First Visit": FaBolt,
  "Returning Player": FaClockRotateLeft,
};

const ROOM_ICONS = {
  [ALL_ROOMS]: FaShapes,
  "Laser Maze": FaBolt,
  "Tile Hunt": FaPuzzlePiece,
  "T-Rex Heist": FaGhost,
  "Soccer Challenge": FaFutbol,
  "Hexa Quest": FaShapes,
  "Edge Climb": FaMountain,
  "Shoot It Out": FaBullseye,
  Basketball: FaBasketball,
  "Maze Gate": FaDoorOpen,
  "Pizza Delivery": FaPizzaSlice,
  "Ball Toss": FaTrophy,
  Seashells: FaFish,
  "Arcade Games": FaGamepad,
};

const RATINGS = [
  ["overall", "Overall Fun"],
  ["gameVariety", "Game Variety"],
  ["staff", "Staff Friendliness"],
  ["cleanliness", "Cleanliness"],
  ["technology", "Technology & Gameplay"],
  ["value", "Value for Money"],
];

const RETURN_OPTIONS = [
  ["absolutely", FaCalendarCheck, "Absolutely"],
  ["friends", FaUserGroup, "With Friends"],
  ["party", FaCakeCandles, "For a Party"],
  ["maybe", FaQuestion, "Maybe"],
  ["probably-not", FaThumbsDown, "Probably Not"],
];

const FUTURE_EXPERIENCES = [
  "VR Arena",
  "Escape Rooms",
  "Family Competitions",
  "Team Tournaments",
  "More Arcade Games",
  "Seasonal Challenges",
  "Other",
];

const FUTURE_EXPERIENCE_ICONS = {
  "VR Arena": FaVrCardboard,
  "Escape Rooms": FaDoorClosed,
  "Family Competitions": FaPeopleGroup,
  "Team Tournaments": FaMedal,
  "More Arcade Games": FaGamepad,
  "Seasonal Challenges": FaSnowflake,
  Other: FaPlus,
};

const RATING_SMILEYS = [
  [1, "😞", "Poor"],
  [2, "🙁", "Okay"],
  [3, "🙂", "Good"],
  [4, "😄", "Great"],
  [5, "🤩", "Amazing"],
];

const RECOMMEND_SMILEYS = [
  ["no", "😞", "No"],
  ["probably-not", "🙁", "Probably Not"],
  ["maybe", "🙂", "Maybe"],
  ["probably", "😄", "Probably"],
  ["definitely", "🤩", "Definitely"],
];

const DEFAULT_FORM = {
  name: "",
  email: "",
  phone: "",
  visitDate: "",
  heardAboutUs: "",
  visitReasons: [],
  rooms: [],
  ratings: {
    overall: "",
    gameVariety: "",
    staff: "",
    cleanliness: "",
    technology: "",
    value: "",
  },
  ratingReasons: {
    overall: "",
    gameVariety: "",
    staff: "",
    cleanliness: "",
    technology: "",
    value: "",
  },
  recommend: "",
  returnVisit: "",
  favoriteMoment: "",
  upgradeIdea: "",
  futureExperiences: [],
  otherFutureExperience: "",
  marketingConsent: false,
};

function cleanInitial(value = "") {
  return String(value || "").trim();
}

function allRoomsSelected(rooms = []) {
  return ROOMS.every((room) => rooms.includes(room));
}

function toggleValue(list = [], value) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

function RatingBars({ name, label, value, onChange }) {
  return (
    <div className="ppp-feedback-rating">
      <div className="ppp-feedback-rating__label">{label}</div>
      <div className="ppp-feedback-smileys" aria-label={`${label} rating`}>
        {RATING_SMILEYS.map(([score, face, text]) => (
          <label className="ppp-feedback-smiley" key={score}>
            <input
              type="radio"
              name={`rating-${name}`}
              value={score}
              checked={String(value) === String(score)}
              onChange={(event) => onChange(event.target.value)}
            />
            <span>
              <strong aria-hidden="true">{face}</strong>
              <em>{text}</em>
            </span>
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
    heardAboutUs: cleanInitial(initial.heardAboutUs),
  }));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const shouldShowGoogleReview =
    RATINGS.every(([name]) => Number(form.ratings[name]) >= 4) &&
    ["definitely", "probably"].includes(form.recommend) &&
    form.returnVisit !== "probably-not";

  const average = useMemo(() => {
    const values = Object.values(form.ratings)
      .map((rating) => Number(rating))
      .filter(Boolean);
    if (!values.length) return "";
    return (values.reduce((total, rating) => total + rating, 0) / values.length).toFixed(1);
  }, [form.ratings]);
  const ratingChart = useMemo(
    () =>
      RATINGS.map(([name, label]) => ({
        name,
        label,
        value: Number(form.ratings[name]) || 0,
      })),
    [form.ratings],
  );
  const hasRatingChart = ratingChart.some((item) => item.value > 0);

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
      ratingReasons: Number(value) >= 4
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

  function toggleArrayField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: toggleValue(current[field], value),
      otherFutureExperience:
        field === "futureExperiences" && value === "Other" && current[field].includes("Other")
          ? ""
          : current.otherFutureExperience,
    }));
  }

  async function submitFeedback(event) {
    event.preventDefault();
    setError("");

    if (!form.name.trim() || !form.email.trim() || !form.ratings.overall) {
      setError("Please add your name, email, and overall fun rating.");
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
        <h1>Help Us Level Up!</h1>
        <div className="ppp-feedback-hero-copy">
          <p><strong>Thanks for playing at Pixel Pulse!</strong></p>
          <p>
            Tell us what you loved, what could be better, and what you&apos;d like to see next. Every response is read by our team.
          </p>
        </div>
      </section>

      {submitted ? (
        <section className="ppp-feedback-confirm">
          <span>Complete</span>
          <h2>Mission Complete</h2>
          <p>
            Thanks for helping Pixel Pulse get even better. We read every response and use it
            to improve the next visit.
          </p>
          {average ? <strong>Session score: {average} / 5.0</strong> : null}
        </section>
      ) : (
        <form className="ppp-feedback-form" onSubmit={submitFeedback}>
          <section className="ppp-feedback-section">
            <div className="ppp-feedback-section__head">
              <div>
                <h2>Want us to follow up?</h2>
                <p>Leave your details if you would like us to respond personally.</p>
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
              <label>
                <span>How did you hear about us?</span>
                <select value={form.heardAboutUs} onChange={(event) => updateField("heardAboutUs", event.target.value)}>
                  <option value="">Select one</option>
                  {HEARD_ABOUT_OPTIONS.map((option) => (
                    <option value={option} key={option}>{option}</option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="ppp-feedback-section">
            <div className="ppp-feedback-section__head">
              <div>
                <h2>Tell Us About Your Visit</h2>
                <p>What brought you to Pixel Pulse today?</p>
              </div>
            </div>
            <div className="ppp-feedback-chip-grid">
              {VISIT_REASONS.map((reason) => {
                const Icon = VISIT_REASON_ICONS[reason] || FaShapes;
                return (
                  <label className="ppp-feedback-icon-option" key={reason}>
                    <input
                      type="checkbox"
                      checked={form.visitReasons.includes(reason)}
                      onChange={() => toggleArrayField("visitReasons", reason)}
                    />
                    <span>
                      <Icon aria-hidden="true" />
                      <em>{reason}</em>
                    </span>
                  </label>
                );
              })}
            </div>
          </section>

          <section className="ppp-feedback-section">
            <div className="ppp-feedback-section__head">
              <div>
                <h2>Favourite Challenge</h2>
                <p>Which challenges did you play or enjoy most?</p>
              </div>
            </div>
            <div className="ppp-feedback-chip-grid">
              {[ALL_ROOMS, ...ROOMS].map((room) => {
                const Icon = ROOM_ICONS[room] || FaGamepad;
                return (
                  <label className={`ppp-feedback-icon-option${room === ALL_ROOMS ? " ppp-feedback-icon-option--all" : ""}`} key={room}>
                    <input
                      type="checkbox"
                      checked={room === ALL_ROOMS ? allRoomsSelected(form.rooms) : form.rooms.includes(room)}
                      onChange={() => toggleRoom(room)}
                    />
                    <span>
                      <Icon aria-hidden="true" />
                      <em>{room}</em>
                    </span>
                  </label>
                );
              })}
            </div>
          </section>

          <section className="ppp-feedback-section">
            <div className="ppp-feedback-section__head">
              <div>
                <h2>Challenge the Scoreboard</h2>
                <p>How did we do? Rate each area from 1 to 5.</p>
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
                  {rating > 0 && rating < 4 ? (
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
            {hasRatingChart ? (
              <div className="ppp-feedback-chart" aria-label="Selected ratings chart">
                <div className="ppp-feedback-chart__head">
                  <h3>Your score so far</h3>
                  {average ? <strong>{average} / 5</strong> : null}
                </div>
                <div className="ppp-feedback-chart__bars">
                  {ratingChart.map((item) => (
                    <div className="ppp-feedback-chart__row" key={item.name}>
                      <span>{item.label}</span>
                      <div className="ppp-feedback-chart__track">
                        <i style={{ width: `${(item.value / 5) * 100}%` }} />
                      </div>
                      <strong>{item.value ? item.value : "-"}</strong>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          <section className="ppp-feedback-section">
            <div className="ppp-feedback-section__head">
              <div>
                <h2>How was your Pixel Pulse experience today?</h2>
                <p>Would you recommend Pixel Pulse to your friends?</p>
              </div>
            </div>
            <div className="ppp-feedback-smileys ppp-feedback-smileys--recommend" aria-label="Recommend Score">
              {RECOMMEND_SMILEYS.map(([value, face, label]) => (
                <label className="ppp-feedback-smiley" key={value}>
                  <input
                    type="radio"
                    name="recommend"
                    value={value}
                    checked={form.recommend === value}
                    onChange={(event) => updateField("recommend", event.target.value)}
                  />
                  <span>
                    <strong aria-hidden="true">{face}</strong>
                    <em>{label}</em>
                  </span>
                </label>
              ))}
            </div>
            <div className="ppp-feedback-section__subhead">
              <h3>What would bring you back?</h3>
            </div>
            <div className="ppp-feedback-toggle-group">
              {RETURN_OPTIONS.map(([value, Icon, label]) => (
                <label className="ppp-feedback-icon-option" key={value}>
                  <input
                    type="radio"
                    name="returnVisit"
                    value={value}
                    checked={form.returnVisit === value}
                    onChange={(event) => updateField("returnVisit", event.target.value)}
                  />
                  <span>
                    <Icon aria-hidden="true" />
                    <em>{label}</em>
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section className="ppp-feedback-section">
            <div className="ppp-feedback-section__head">
              <div>
                <h2>Help Us Level Up</h2>
                <p>Share the moments, upgrades, and ideas that would make Pixel Pulse even better.</p>
              </div>
            </div>
            <label className="ppp-feedback-notes">
              <span>Biggest Win</span>
              <textarea value={form.favoriteMoment} onChange={(event) => updateField("favoriteMoment", event.target.value)} placeholder="Tell us about your favourite moment..." />
            </label>
            <label className="ppp-feedback-notes">
              <span>If you could upgrade one thing, what would it be?</span>
              <textarea value={form.upgradeIdea} onChange={(event) => updateField("upgradeIdea", event.target.value)} placeholder="More games, longer sessions, food, music, new challenges... tell us anything." />
            </label>
            <div className="ppp-feedback-section__subhead">
              <h3>What experiences would you love to see next?</h3>
            </div>
            <div className="ppp-feedback-chip-grid">
              {FUTURE_EXPERIENCES.map((experience) => {
                const Icon = FUTURE_EXPERIENCE_ICONS[experience] || FaGamepad;
                return (
                  <label className="ppp-feedback-icon-option" key={experience}>
                    <input
                      type="checkbox"
                      checked={form.futureExperiences.includes(experience)}
                      onChange={() => toggleArrayField("futureExperiences", experience)}
                    />
                    <span>
                      <Icon aria-hidden="true" />
                      <em>{experience}</em>
                    </span>
                  </label>
                );
              })}
            </div>
            {form.futureExperiences.includes("Other") ? (
              <label className="ppp-feedback-notes ppp-feedback-notes--compact">
                <span>Other idea</span>
                <input value={form.otherFutureExperience} onChange={(event) => updateField("otherFutureExperience", event.target.value)} placeholder="Tell us your idea." />
              </label>
            ) : null}
            {shouldShowGoogleReview ? (
              <div className="ppp-feedback-review">
                <div>
                  <h2>Loved your experience?</h2>
                  <p>Your review helps more families discover Pixel Pulse.</p>
                </div>
                <a href={GOOGLE_REVIEW_URL} target="_blank" rel="noopener noreferrer">
                  Leave us a Google Review
                </a>
              </div>
            ) : null}
            <label className="ppp-feedback-consent">
              <input
                type="checkbox"
                checked={form.marketingConsent}
                onChange={(event) => updateField("marketingConsent", event.target.checked)}
              />
              <span>I am happy for Pixel Pulse to use my feedback with first name only.</span>
            </label>
          </section>

          <div className="ppp-feedback-submit">
            <p>Takes about 2 minutes. Your feedback shapes what we build next.</p>
            {error ? <strong>{error}</strong> : null}
            <button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Complete Mission"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
