"use client";

import { useState } from "react";

const INITIAL_FORM = {
  fullName: "",
  email: "",
  phone: "",
  date: "",
  message: "",
};

export default function BirthdayHeroContactForm() {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const [sent, setSent] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setStatus("Sending your party request...");
    setSent(false);

    try {
      const response = await fetch("/api/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          from: "birthday-party-landing",
          selectedEvent: "BirthDay Party",
          subject: `${formData.fullName} - Birthday Party Inquiry`,
          time: "",
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to send birthday party inquiry.");
      }

      setFormData(INITIAL_FORM);
      setSent(true);
      setStatus("Thanks. We received your birthday party request.");
    } catch (error) {
      setStatus("We could not send this request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="ppp-birthday-hero-form" onSubmit={handleSubmit} aria-busy={submitting}>
      <div className="ppp-birthday-hero-form__head">
        <p>Plan the party</p>
        <h2>Get a birthday callback</h2>
      </div>

      <div className="ppp-birthday-hero-form__fields">
        <label>
          <span>Name</span>
          <input
            name="fullName"
            value={formData.fullName}
            onChange={updateField}
            autoComplete="name"
            required
          />
        </label>

        <label>
          <span>Email</span>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={updateField}
            autoComplete="email"
            inputMode="email"
            required
          />
        </label>

        <label>
          <span>Phone</span>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={updateField}
            autoComplete="tel"
            inputMode="tel"
            required
          />
        </label>

        <label>
          <span>Preferred date</span>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={updateField}
          />
        </label>

        <label className="ppp-birthday-hero-form__wide">
          <span>Party notes</span>
          <textarea
            name="message"
            value={formData.message}
            onChange={updateField}
            placeholder="Kids, date, package, or questions"
            required
          />
        </label>
      </div>

      <button type="submit" disabled={submitting}>
        {submitting ? "Sending..." : "Send Birthday Request"}
      </button>

      <p className={sent ? "is-success" : ""} aria-live="polite">
        {status || "We will follow up with birthday package availability."}
      </p>
    </form>
  );
}
