"use client";

import { useState } from "react";

const INITIAL_FORM = {
  childName: "",
  age: "",
  guardianName: "",
  phone: "",
  email: "",
  message: "",
  permission: false,
  terms: false,
};

export default function SquadSignupForm() {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setStatus("Sending your Squad request...");

    try {
      const response = await fetch("/api/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: formData.guardianName,
          email: formData.email,
          phone: formData.phone,
          date: "",
          time: "",
          from: "pixel-pulse-squad",
          selectedEvent: "Pixel Pulse Squad",
          message: [
            `Child Name: ${formData.childName}`,
            `Age: ${formData.age}`,
            `Parent/Guardian Name: ${formData.guardianName}`,
            "",
            "Notes:",
            formData.message || "No notes provided",
            "",
            `Permission confirmed: ${formData.permission ? "Yes" : "No"}`,
            `Reward-program terms accepted: ${formData.terms ? "Yes" : "No"}`,
          ].join("\n"),
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to send Squad signup.");
      }

      setFormData(INITIAL_FORM);
      setStatus("Thanks. We received your Pixel Pulse Squad request.");
    } catch {
      setStatus("We could not send this request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="ppp-squad-form" id="squad-signup" onSubmit={handleSubmit}>
      <div className="ppp-squad-form__header">
        <p>Parent sign-up</p>
        <h2>Join the Squad</h2>
      </div>

      <div className="ppp-squad-form__grid">
        <label>
          <span>Child name</span>
          <input
            name="childName"
            value={formData.childName}
            onChange={updateField}
            autoComplete="name"
            required
          />
        </label>

        <label>
          <span>Age</span>
          <input
            name="age"
            type="number"
            min="11"
            max="17"
            value={formData.age}
            onChange={updateField}
            required
          />
        </label>

        <label className="ppp-squad-form__wide">
          <span>Parent/guardian name</span>
          <input
            name="guardianName"
            value={formData.guardianName}
            onChange={updateField}
            autoComplete="name"
            required
          />
        </label>

        <label>
          <span>Phone</span>
          <input
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={updateField}
            autoComplete="tel"
            inputMode="tel"
            required
          />
        </label>

        <label>
          <span>Email</span>
          <input
            name="email"
            type="email"
            value={formData.email}
            onChange={updateField}
            autoComplete="email"
            inputMode="email"
            required
          />
        </label>

        <label className="ppp-squad-form__wide">
          <span>Notes</span>
          <textarea
            name="message"
            value={formData.message}
            onChange={updateField}
            placeholder="Questions, preferred visit day, or squad goals"
          />
        </label>
      </div>

      <label className="ppp-squad-check">
        <input
          type="checkbox"
          name="permission"
          checked={formData.permission}
          onChange={updateField}
          required
        />
        <span>I give permission for my child to participate in the Pixel Pulse Squad program.</span>
      </label>

      <label className="ppp-squad-check">
        <input
          type="checkbox"
          name="terms"
          checked={formData.terms}
          onChange={updateField}
          required
        />
        <span>I understand this is a voluntary, reward-based program with no cash compensation.</span>
      </label>

      <button type="submit" disabled={submitting}>
        {submitting ? "Sending..." : "Send Squad Request"}
      </button>

      <p aria-live="polite">{status || "A Pixel Pulse team member will follow up with next steps."}</p>
    </form>
  );
}
