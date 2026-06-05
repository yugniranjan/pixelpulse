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

const STEPS = [
  { n: 1, label: "Package" },
  { n: 2, label: "Date & time" },
  { n: 3, label: "Your details" },
];

export default function BirthdayBookingWidget({ packages = [], initialPackage = "" }) {
  const today = useMemo(todayIso, []);
  const [step, setStep] = useState(1);
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
  // Highest step the user is allowed to jump to.
  const maxStep = !pkgName ? 1 : !time ? 2 : 3;

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
    setStep(2); // advance to date & time
  }

  function chooseTime(value) {
    setTime(value);
    setStep(3); // advance to details
  }

  function goStep(n) {
    if (n <= maxStep) setStep(n);
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (!selectedPackage) return setStep(1);
    if (!date || !time) return setStep(2);

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
        // Slot was taken in the meantime — refresh and send them back to step 2.
        setError(data.error || "That time was just booked. Please choose another time.");
        if (data.suggestions?.length) {
          setSlots(data.suggestions.map((s) => ({ time: s.time, label: s.label, available: true })));
        }
        setTime("");
        setStep(2);
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
              setStep(1);
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
        <p>One party room — pick a package, an available time, and you&apos;re set.</p>
      </div>

      {/* step indicator */}
      <ol className="ppp-bday-book__steps">
        {STEPS.map((s) => (
          <li key={s.n}>
            <button
              type="button"
              className={`ppp-bday-book__steptab${step === s.n ? " is-active" : ""}${step > s.n ? " is-done" : ""}`}
              onClick={() => goStep(s.n)}
              disabled={s.n > maxStep}
            >
              <span className="ppp-bday-book__stepnum">{step > s.n ? "✓" : s.n}</span>
              {s.label}
            </button>
          </li>
        ))}
      </ol>

      <form className="ppp-bday-book__panel" onSubmit={submit}>
        {/* Step 1 — package */}
        {step === 1 ? (
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
        ) : null}

        {/* Step 2 — date + time */}
        {step === 2 ? (
          <div className="ppp-bday-book__datetime">
            <label className="ppp-bday-book__field ppp-bday-book__datefield">
              <span>Party date</span>
              <input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} />
            </label>

            {date ? (
              <div className="ppp-bday-book__slots">
                {slotsState === "loading" ? <p className="ppp-bday-book__muted">Loading available times…</p> : null}
                {slotsState === "error" ? <p className="ppp-bday-book__err">{slotError}</p> : null}
                {slotsState === "ready" && !slots.some((s) => s.available) ? (
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
                        onClick={() => s.available && chooseTime(s.time)}
                        title={s.available ? "" : "Already booked"}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="ppp-bday-book__muted">Choose a date to see available start times.</p>
            )}
          </div>
        ) : null}

        {/* Step 3 — details */}
        {step === 3 ? (
          <div className="ppp-bday-book__details">
            <div className="ppp-bday-book__summary">
              {selectedPackage?.name} · {date} · {slots.find((s) => s.time === time)?.label || time} · {selectedPackage?.totalDuration}
            </div>
            <div className="ppp-bday-book__grid">
              <label className="ppp-bday-book__field">
                <span>Your name</span>
                <input value={details.customerName} onChange={(e) => updateDetail("customerName", e.target.value)} required />
              </label>
              <label className="ppp-bday-book__field">
                <span>Email</span>
                <input type="email" value={details.email} onChange={(e) => updateDetail("email", e.target.value)} required />
              </label>
              <label className="ppp-bday-book__field">
                <span>Phone</span>
                <input value={details.phone} onChange={(e) => updateDetail("phone", e.target.value)} required />
              </label>
              <label className="ppp-bday-book__field">
                <span>Birthday child&apos;s name</span>
                <input value={details.childName} onChange={(e) => updateDetail("childName", e.target.value)} required />
              </label>
              <label className="ppp-bday-book__field">
                <span>Child&apos;s age</span>
                <input value={details.childAge} onChange={(e) => updateDetail("childAge", e.target.value)} />
              </label>
              <label className="ppp-bday-book__field">
                <span>Participants{selectedPackage ? ` (max ${selectedPackage.capacity})` : ""}</span>
                <input
                  type="number"
                  min="1"
                  max={selectedPackage ? selectedPackage.capacity : undefined}
                  value={details.partySize}
                  onChange={(e) => updateDetail("partySize", e.target.value)}
                  required
                />
              </label>
            </div>
          </div>
        ) : null}

        {error ? <p className="ppp-bday-book__err" role="alert">{error}</p> : null}

        {/* nav */}
        <div className="ppp-bday-book__nav">
          {step > 1 ? (
            <button type="button" className="ppp-bday-book__back" onClick={() => goStep(step - 1)}>
              ← Back
            </button>
          ) : <span />}
          {step === 3 ? (
            <button type="submit" className="ppp-bday-book__submit" disabled={submitting}>
              {submitting ? "Booking…" : selectedPackage ? `Book ${selectedPackage.name}` : "Book my party"}
            </button>
          ) : (
            <span className="ppp-bday-book__hint">
              {step === 1 ? "Select a package to continue" : "Select a time to continue"}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
