"use client";

import { useState } from "react";
import { useTurnstileSiteKey } from "@/lib/useTurnstileSiteKey";
import TurnstileWidget from "./smallComponents/TurnstileWidget";

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

export default function SquadSignupForm({ content = {} }) {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const { siteKey, turnstileEnabled, turnstileLoading } = useTurnstileSiteKey();
  const formContent = {
    eyebrow: content.eyebrow || "Parent sign-up",
    title: content.title || "Join the Squad",
    childNameLabel: content.childNameLabel || "Child name",
    ageLabel: content.ageLabel || "Age",
    guardianNameLabel: content.guardianNameLabel || "Parent/guardian name",
    phoneLabel: content.phoneLabel || "Phone",
    emailLabel: content.emailLabel || "Email",
    notesLabel: content.notesLabel || "Notes",
    notesPlaceholder:
      content.notesPlaceholder || "Questions, preferred visit day, or squad goals",
    permissionText:
      content.permissionText ||
      "I give permission for my child to participate in the Pixel Pulse Squad program.",
    termsText:
      content.termsText ||
      "I understand this is a voluntary, reward-based program with no cash compensation.",
    sendingText: content.sendingText || "Sending your Squad request...",
    submitText: content.submitText || "Send Squad Request",
    successText:
      content.successText || "Thanks. We received your Pixel Pulse Squad request.",
    errorText: content.errorText || "We could not send this request. Please try again.",
    helperText:
      content.helperText || "A Pixel Pulse team member will follow up with next steps.",
    selectedEvent: content.selectedEvent || "Pixel Pulse Squad",
    source: content.source || "pixel-pulse-squad",
  };

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (turnstileLoading || (turnstileEnabled && !turnstileToken)) {
      setStatus("Please complete the verification check.");
      return;
    }

    setSubmitting(true);
    setStatus(formContent.sendingText);

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
          from: formContent.source,
          selectedEvent: formContent.selectedEvent,
          turnstileToken,
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
      setTurnstileToken("");
      setStatus(formContent.successText);
    } catch {
      setStatus(formContent.errorText);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="ppp-squad-form" id="squad-signup" onSubmit={handleSubmit}>
      <div className="ppp-squad-form__header">
        <p>{formContent.eyebrow}</p>
        <h2>{formContent.title}</h2>
      </div>

      <div className="ppp-squad-form__grid">
        <label>
          <span>{formContent.childNameLabel}</span>
          <input
            name="childName"
            value={formData.childName}
            onChange={updateField}
            autoComplete="name"
            required
          />
        </label>

        <label>
          <span>{formContent.ageLabel}</span>
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
          <span>{formContent.guardianNameLabel}</span>
          <input
            name="guardianName"
            value={formData.guardianName}
            onChange={updateField}
            autoComplete="name"
            required
          />
        </label>

        <label>
          <span>{formContent.phoneLabel}</span>
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
          <span>{formContent.emailLabel}</span>
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
          <span>{formContent.notesLabel}</span>
          <textarea
            name="message"
            value={formData.message}
            onChange={updateField}
            placeholder={formContent.notesPlaceholder}
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
        <span>{formContent.permissionText}</span>
      </label>

      <label className="ppp-squad-check">
        <input
          type="checkbox"
          name="terms"
          checked={formData.terms}
          onChange={updateField}
          required
        />
        <span>{formContent.termsText}</span>
      </label>

      {turnstileEnabled ? (
        <TurnstileWidget
          siteKey={siteKey}
          onVerify={setTurnstileToken}
          onExpire={() => setTurnstileToken("")}
          onError={() => setTurnstileToken("")}
        />
      ) : null}

      <button type="submit" disabled={submitting || turnstileLoading || (turnstileEnabled && !turnstileToken)}>
        {submitting ? "Sending..." : formContent.submitText}
      </button>

      <p aria-live="polite">{status || formContent.helperText}</p>
    </form>
  );
}
