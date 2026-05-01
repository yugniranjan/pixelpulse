"use client";

import { useState } from "react";

const INITIAL_REFERRAL = {
  referrerName: "",
  referrerEmail: "",
  friendEmails: [""],
};

export default function SquadReferralCard({ content = {} }) {
  const [formData, setFormData] = useState(INITIAL_REFERRAL);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const referralContent = {
    eyebrow: content.eyebrow || "Friend referral",
    title: content.title || "Send friends 10% off",
    description:
      content.description ||
      "Share Pixel Pulse with friends. They get a unique 10% discount code made from your initials.",
    referrerNameLabel: content.referrerNameLabel || "Your name",
    referrerEmailLabel: content.referrerEmailLabel || "Your email",
    friendEmailLabel: content.friendEmailLabel || "Friend email",
    addFriendText: content.addFriendText || "Add friend",
    removeFriendText: content.removeFriendText || "Remove",
    submitText: content.submitText || "Send 10% Referral",
    sendingText: content.sendingText || "Sending referral...",
    successText: content.successText || "Referral sent. Your friends now have a unique 10% code.",
    errorText: content.errorText || "Could not send referral. Please try again.",
    helperText: content.helperText || "Friends receive a unique 10% discount code.",
  };

  function updateField(event) {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function updateFriendEmail(index, value) {
    setFormData((current) => ({
      ...current,
      friendEmails: current.friendEmails.map((email, emailIndex) =>
        emailIndex === index ? value : email,
      ),
    }));
  }

  function addFriendEmail() {
    setFormData((current) => ({
      ...current,
      friendEmails: [...current.friendEmails, ""],
    }));
  }

  function removeFriendEmail(index) {
    setFormData((current) => ({
      ...current,
      friendEmails:
        current.friendEmails.length > 1
          ? current.friendEmails.filter((_, emailIndex) => emailIndex !== index)
          : [""],
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setStatus(referralContent.sendingText);

    try {
      const response = await fetch("/api/squad-referral", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Unable to send Squad referral.");
      }

      setFormData(INITIAL_REFERRAL);
      setStatus(referralContent.successText);
    } catch {
      setStatus(referralContent.errorText);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="ppp-squad-referral-card" onSubmit={handleSubmit}>
      <div className="ppp-squad-referral-card__header">
        <p>{referralContent.eyebrow}</p>
        <h3>{referralContent.title}</h3>
        <span>{referralContent.description}</span>
      </div>

      <div className="ppp-squad-referral-card__grid">
        <label>
          <span>{referralContent.referrerNameLabel}</span>
          <input
            name="referrerName"
            value={formData.referrerName}
            onChange={updateField}
            autoComplete="name"
            required
          />
        </label>

        <label>
          <span>{referralContent.referrerEmailLabel}</span>
          <input
            name="referrerEmail"
            type="email"
            value={formData.referrerEmail}
            onChange={updateField}
            autoComplete="email"
            inputMode="email"
            required
          />
        </label>
      </div>

      <div className="ppp-squad-referral-card__friends">
        {formData.friendEmails.map((email, index) => (
          <label key={`friend-email-${index}`}>
            <span>{`${referralContent.friendEmailLabel} ${index + 1}`}</span>
            <div>
              <input
                type="email"
                value={email}
                onChange={(event) => updateFriendEmail(index, event.target.value)}
                inputMode="email"
                required={index === 0}
              />
              {formData.friendEmails.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removeFriendEmail(index)}
                  aria-label={`${referralContent.removeFriendText} friend email ${index + 1}`}
                >
                  {referralContent.removeFriendText}
                </button>
              ) : null}
            </div>
          </label>
        ))}
      </div>

      <div className="ppp-squad-referral-card__actions">
        <button
          type="button"
          className="ppp-squad-referral-card__add"
          onClick={addFriendEmail}
          aria-label={referralContent.addFriendText}
        >
          <span aria-hidden="true">+</span>
          {referralContent.addFriendText}
        </button>
        <button
          type="submit"
          className="ppp-squad-referral-card__submit"
          disabled={submitting}
        >
          {submitting ? "Sending..." : referralContent.submitText}
        </button>
      </div>

      <p aria-live="polite">{status || referralContent.helperText}</p>
    </form>
  );
}
