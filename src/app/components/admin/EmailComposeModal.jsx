"use client";

import { useState } from "react";

/**
 * Reusable admin email composer. Sends branded emails via /api/admin/send-email.
 * `recipients` is an array of { email, name }. Use {name} in subject/message to
 * personalize per recipient.
 *
 * Flow: compose -> REVIEW (cross-check recipients + subject + message) ->
 * confirm & send. Nothing is dispatched until the admin confirms on the review
 * step.
 */
export default function EmailComposeModal({
  title = "Send email",
  recipients = [],
  defaultSubject = "",
  defaultMessage = "",
  onClose,
}) {
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState(defaultMessage);
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const validRecipients = recipients.filter((r) => r && r.email);
  const isBulk = validRecipients.length > 1;
  const previewName = validRecipients[0]?.name || "there";
  const previewMessage = message.replace(/\{name\}/gi, previewName);
  const previewSubject = subject.replace(/\{name\}/gi, previewName);

  function review() {
    if (!subject.trim() || !message.trim()) {
      setError("Subject and message are required.");
      return;
    }
    if (!validRecipients.length) {
      setError("No valid recipient email addresses.");
      return;
    }
    setError("");
    setConfirming(true);
  }

  async function send() {
    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/admin/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipients: validRecipients, subject, message }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Unable to send email.");
        setConfirming(false);
        return;
      }
      setResult(data);
    } catch {
      setError("Unable to send email.");
      setConfirming(false);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="email-compose-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="email-compose-modal" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="email-compose__close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h2>{title}</h2>

        <p className="email-compose__to">
          {isBulk ? (
            <>To <strong>{validRecipients.length} parents</strong> (one personalized email each)</>
          ) : validRecipients.length === 1 ? (
            <>To <strong>{validRecipients[0].email}</strong></>
          ) : (
            <span className="email-compose__warn">No valid recipient email.</span>
          )}
        </p>

        {result ? (
          <div className={`email-compose__result${result.failed ? " has-fail" : ""}`}>
            Sent {result.sent} of {result.total}.
            {result.failed ? ` ${result.failed} failed.` : ""}
            {result.skipped ? ` ${result.skipped} skipped (no/invalid email).` : ""}
            <div className="email-compose__actions">
              <button type="button" onClick={onClose}>Done</button>
            </div>
          </div>
        ) : confirming ? (
          <div className="email-compose__review">
            <div className="email-compose__review-banner">
              Please cross-check the details below. This will send{" "}
              <strong>{isBulk ? `${validRecipients.length} emails` : "1 email"}</strong>.
            </div>
            <dl className="email-compose__summary">
              <div>
                <dt>To</dt>
                <dd>
                  {isBulk
                    ? `${validRecipients.length} parents — ` +
                      validRecipients.slice(0, 3).map((r) => r.email).join(", ") +
                      (validRecipients.length > 3 ? ` +${validRecipients.length - 3} more` : "")
                    : validRecipients[0]?.email}
                </dd>
              </div>
              <div>
                <dt>Subject</dt>
                <dd>{previewSubject}</dd>
              </div>
              <div>
                <dt>Message {isBulk ? "(preview for first parent)" : ""}</dt>
                <dd className="email-compose__preview">{previewMessage}</dd>
              </div>
            </dl>

            {error ? <p className="email-compose__error">{error}</p> : null}

            <div className="email-compose__actions">
              <button
                type="button"
                className="email-compose__btn--ghost"
                onClick={() => setConfirming(false)}
                disabled={sending}
              >
                Back to edit
              </button>
              <button type="button" onClick={send} disabled={sending}>
                {sending ? "Sending…" : isBulk ? `Confirm & send ${validRecipients.length}` : "Confirm & send"}
              </button>
            </div>
          </div>
        ) : (
          <>
            <label className="email-compose__field">
              <span>Subject</span>
              <input value={subject} onChange={(event) => setSubject(event.target.value)} />
            </label>
            <label className="email-compose__field">
              <span>Message — use {"{name}"} to personalize</span>
              <textarea rows={9} value={message} onChange={(event) => setMessage(event.target.value)} />
            </label>

            {error ? <p className="email-compose__error">{error}</p> : null}

            <div className="email-compose__actions">
              <button type="button" className="email-compose__btn--ghost" onClick={onClose}>
                Cancel
              </button>
              <button type="button" onClick={review} disabled={!validRecipients.length}>
                Review &amp; send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
