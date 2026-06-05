"use client";

import { useEffect, useMemo, useState } from "react";

function todayIso() {
  const now = new Date();
  const tz = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - tz).toISOString().slice(0, 10);
}

const EMPTY_DETAILS = {
  customerName: "",
  email: "",
  phone: "",
  childName: "",
  childAge: "",
  partySize: "",
};

export default function BirthdayBookingWidget({ packages = [], initialPackage = "" }) {
  const today = useMemo(todayIso, []);
  const [pkgName, setPkgName] = useState(
    initialPackage && packages.some((p) => p.name === initialPackage) ? initialPackage : "",
  );
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [slotsState, setSlotsState] = useState("idle"); // idle | loading | ready | error
  const [slotError, setSlotError] = useState("");
  const [time, setTime] = useState("");
  const [details, setDetails] = useState(EMPTY_DETAILS);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(null);

  const selectedPackage = packages.find((p) => p.name === pkgName) || null;

  // Load availability whenever the package or date changes.
  useEffect(() => {
    if (!pkgName || !date) {
      setSlots([]);
      setSlotsState("idle");
      return;
    }
    let cancelled = false;
    setSlotsState("loading");
    setSlotError("");
    setTime("");
    (async () => {
      try {
        const res = await fetch(
          `/api/birthday/availability?date=${encodeURIComponent(date)}&package=${encodeURIComponent(pkgName)}`,
          { cache: "no-store" },
        );
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setSlotError(data.error || "Could not load times.");
          setSlotsState("error");
          return;
        }
        setSlots(data.slots || []);
        setSlotsState("ready");
      } catch {
        if (!cancelled) {
          setSlotError("Could not load times.");
          setSlotsState("error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pkgName, date]);

  function updateDetail(key, value) {
    setDetails((d) => ({ ...d, [key]: value }));
  }

  function choosePackage(name) {
    setPkgName(name);
    setTime("");
    setError("");
    setConfirmed(null);
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (!selectedPackage) return setError("Please choose a package.");
    if (!date) return setError("Please choose a date.");
    if (!time) return setError("Please choose an available time.");

    setSubmitting(true);
    try {
      const res = await fetch("/api/birthday/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ package: pkgName, date, startTime: time, ...details }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setConfirmed(data.booking);
        return;
      }
      if (res.status === 409 && data.conflict) {
        // Slot was taken in the meantime — refresh and ask them to re-pick.
        setError(data.error || "That time was just booked. Please choose another time.");
        setSlots(
          (data.suggestions?.length
            ? data.suggestions.map((s) => ({ ...s, available: true }))
            : slots
          ).map((s) => ({ time: s.time, label: s.label, available: true })),
        );
        setTime("");
        return;
      }
      setError(data.error || "Could not complete your booking.");
    } catch {
      setError("Could not complete your booking. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmed) {
    return (
      <div className="ppp-bday-book" id="birthday-party-form">
        <div className="ppp-bday-book__confirmed">
          <span className="ppp-bday-book__check" aria-hidden="true">✓</span>
          <h3>Your party is booked!</h3>
          <p>
            <strong>{confirmed.package}</strong> for <strong>{confirmed.childName}</strong>
            {" — "}
            {confirmed.date} · {confirmed.startTime}–{confirmed.endTime} · {confirmed.partySize} participants.
          </p>
          <p className="ppp-bday-book__muted">
            A team member will reach out with the final details. See you soon!
          </p>
          <button
            type="button"
            className="ppp-bday-book__secondary"
            onClick={() => {
              setConfirmed(null);
              setPkgName("");
              setDate("");
              setTime("");
              setDetails(EMPTY_DETAILS);
            }}
          >
            Book another party
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ppp-bday-book" id="birthday-party-form">
      <div className="ppp-bday-book__head">
        <h3>Book your party</h3>
        <p>One party room — pick a package, date, and an available time. We hold the room for your whole party.</p>
      </div>

      {/* Step 1 — package */}
      <div className="ppp-bday-book__step">
        <span className="ppp-bday-book__steplabel">1 · Choose a package</span>
        <div className="ppp-bday-book__packages">
          {packages.map((p) => (
            <button
              type="button"
              key={p.name}
              className={`ppp-bday-book__pkg${pkgName === p.name ? " is-selected" : ""}`}
              onClick={() => choosePackage(p.name)}
            >
              <strong>{p.name}</strong>
              <span className="ppp-bday-book__pkgprice">{p.price}</span>
              <span className="ppp-bday-book__pkgmeta">Up to {p.capacity} · {p.totalDuration}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2 — date + time */}
      <div className={`ppp-bday-book__step${pkgName ? "" : " is-disabled"}`}>
        <span className="ppp-bday-book__steplabel">2 · Pick a date &amp; time</span>
        <label className="ppp-bday-book__field">
          <span>Party date</span>
          <input
            type="date"
            min={today}
            value={date}
            disabled={!pkgName}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>

        {pkgName && date ? (
          <div className="ppp-bday-book__slots">
            {slotsState === "loading" ? <p className="ppp-bday-book__muted">Loading available times…</p> : null}
            {slotsState === "error" ? <p className="ppp-bday-book__err">{slotError}</p> : null}
            {slotsState === "ready" && slots.length === 0 ? (
              <p className="ppp-bday-book__muted">No times available for this package today.</p>
            ) : null}
            {slotsState === "ready" && slots.length > 0 && !slots.some((s) => s.available) ? (
              <p className="ppp-bday-book__err">Fully booked on this date — please try another date.</p>
            ) : null}
            {slotsState === "ready" && slots.some((s) => s.available) ? (
              <div className="ppp-bday-book__slotgrid">
                {slots.map((s) => (
                  <button
                    type="button"
                    key={s.time}
                    disabled={!s.available}
                    className={`ppp-bday-book__slot${time === s.time ? " is-selected" : ""}${s.available ? "" : " is-taken"}`}
                    onClick={() => s.available && setTime(s.time)}
                    title={s.available ? "" : "Already booked"}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Step 3 — details */}
      <form className={`ppp-bday-book__step${time ? "" : " is-disabled"}`} onSubmit={submit}>
        <span className="ppp-bday-book__steplabel">3 · Your details</span>
        <div className="ppp-bday-book__grid">
          <label className="ppp-bday-book__field">
            <span>Your name</span>
            <input value={details.customerName} disabled={!time} onChange={(e) => updateDetail("customerName", e.target.value)} required />
          </label>
          <label className="ppp-bday-book__field">
            <span>Email</span>
            <input type="email" value={details.email} disabled={!time} onChange={(e) => updateDetail("email", e.target.value)} required />
          </label>
          <label className="ppp-bday-book__field">
            <span>Phone</span>
            <input value={details.phone} disabled={!time} onChange={(e) => updateDetail("phone", e.target.value)} required />
          </label>
          <label className="ppp-bday-book__field">
            <span>Birthday child&apos;s name</span>
            <input value={details.childName} disabled={!time} onChange={(e) => updateDetail("childName", e.target.value)} required />
          </label>
          <label className="ppp-bday-book__field">
            <span>Child&apos;s age</span>
            <input value={details.childAge} disabled={!time} onChange={(e) => updateDetail("childAge", e.target.value)} />
          </label>
          <label className="ppp-bday-book__field">
            <span>Participants{selectedPackage ? ` (max ${selectedPackage.capacity})` : ""}</span>
            <input
              type="number"
              min="1"
              max={selectedPackage ? selectedPackage.capacity : undefined}
              value={details.partySize}
              disabled={!time}
              onChange={(e) => updateDetail("partySize", e.target.value)}
              required
            />
          </label>
        </div>

        {error ? <p className="ppp-bday-book__err" role="alert">{error}</p> : null}

        <button type="submit" className="ppp-bday-book__submit" disabled={!time || submitting}>
          {submitting ? "Booking…" : selectedPackage && time ? `Book ${selectedPackage.name}` : "Book my party"}
        </button>
      </form>
    </div>
  );
}
