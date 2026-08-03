"use client";

import { useMemo, useState } from "react";
import "../../styles/admin-invites.css";
import "../../styles/admin-waivers.css";
import AdminShell from "@/components/AdminShell";

const DEFAULT_FEEDBACK_URL = "https://www.pixelpulseplay.ca/feedback";
const DEFAULT_WEBSITE_LINK = "https://www.pixelpulseplay.ca";

function Field({ label, required = false, children }) {
  return (
    <label className="invite-admin-field">
      <span>
        {label}
        {required ? <b aria-label="required">*</b> : null}
      </span>
      {children}
    </label>
  );
}

function buildThankYouPreview(form) {
  return [
    form.firstName ? `Hi ${form.firstName},` : "Hi,",
    "",
    "Thanks for Playing at Pixel Pulse!",
    "",
    "We loved having you and hope you had an amazing time taking on our immersive challenges.",
    "",
    "💬 Help Us Level Up",
    "",
    "Your feedback helps us create an even better experience for every player.",
    "",
    "Share your feedback:",
    form.feedbackUrl,
    "",
    "🎁 Enjoy a FREE 60-Minute Play Pass",
    "",
    "As a thank you for sharing your feedback, we'll send you a FREE 60-Minute Play Pass for your next visit.*",
    "",
    "Complete the feedback form today and get ready for your next adventure!",
    "",
    "Thank you for being part of the Pixel Pulse community.",
    "",
    "See you again soon!",
    "",
    "The Pixel Pulse Team",
    "Vaughan, Ontario",
    form.websiteLink,
  ].filter((line) => line !== null && line !== undefined).join("\n");
}

export default function AdminThankYouPage() {
  const [form, setForm] = useState({
    firstName: "",
    email: "",
    partyId: "",
    feedbackUrl: DEFAULT_FEEDBACK_URL,
    websiteLink: DEFAULT_WEBSITE_LINK,
  });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [attachments, setAttachments] = useState([]);

  const previewText = useMemo(() => buildThankYouPreview(form), [form]);

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function copyText(text) {
    await navigator.clipboard.writeText(text);
  }

  async function sendThankYouEmail(event) {
    event.preventDefault();
    setSending(true);
    setStatus("");
    setError("");

    try {
      const payload = new FormData();
      payload.append("type", "thank-you");
      payload.append("email", form.email);
      payload.append("firstName", form.firstName);
      payload.append("name", form.firstName);
      payload.append("partyId", form.partyId);
      payload.append("feedbackUrl", form.feedbackUrl);
      payload.append("websiteLink", form.websiteLink);
      attachments.forEach((file) => {
        payload.append("attachments", file);
      });

      const response = await fetch("/api/admin/invites/email", {
        method: "POST",
        credentials: "same-origin",
        body: payload,
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to send thank you email.");
        return;
      }

      setStatus("Thank you email sent.");
    } catch (sendError) {
      setError("Unable to send thank you email.");
    } finally {
      setSending(false);
    }
  }

  return (
    <AdminShell>
      <div className="invite-admin-page invite-admin-page--shell">
        <div className="invite-admin-header waiver-admin-header--dashboard">
          <div>
            <span className="waiver-admin-kicker">Admin dashboard</span>
            <h1>Thank You Email</h1>
            <p>Send post-visit thank-you, feedback, and reward emails from one place.</p>
          </div>
        </div>

        <form className="invite-admin-form" onSubmit={sendThankYouEmail}>
          <section>
            <h2>Recipient</h2>
            <div className="invite-admin-grid">
              <Field label="First name">
                <input
                  value={form.firstName}
                  onChange={(event) => updateField("firstName", event.target.value)}
                  placeholder="First name"
                />
              </Field>
              <Field label="Email" required>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="name@example.com"
                />
              </Field>
              <Field label="Party ID">
                <input
                  value={form.partyId}
                  onChange={(event) => updateField("partyId", event.target.value)}
                  placeholder="Optional"
                />
              </Field>
            </div>
          </section>

          <section>
            <h2>Links</h2>
            <div className="invite-admin-grid">
              <Field label="Feedback link" required>
                <input
                  required
                  value={form.feedbackUrl}
                  onChange={(event) => updateField("feedbackUrl", event.target.value)}
                />
              </Field>
              <Field label="Website">
                <input
                  value={form.websiteLink}
                  onChange={(event) => updateField("websiteLink", event.target.value)}
                />
              </Field>
            </div>
            <p className="invite-admin-help">
              The feedback link is sent as a button in the thank-you email.
            </p>
          </section>

          <section>
            <h2>Attachments</h2>
            <div className="invite-admin-grid">
              <Field label="Receipts or files">
                <input
                  type="file"
                  multiple
                  onChange={(event) => setAttachments(Array.from(event.target.files || []))}
                />
              </Field>
            </div>
            {attachments.length ? (
              <p className="invite-admin-help">
                {attachments.length} file{attachments.length === 1 ? "" : "s"} attached. Total size must be 15 MB or less.
              </p>
            ) : null}
          </section>

          {error ? <p className="invite-admin-error">{error}</p> : null}
          {status ? <p className="invite-admin-status">{status}</p> : null}

          <button type="submit" disabled={sending}>
            {sending ? "Sending..." : "Send Thank You Email"}
          </button>
        </form>

        <section className="invite-admin-result">
          <h2>Email Preview</h2>
          <div className="invite-admin-output">
            <div>
              <span>Feedback Link</span>
              <a href={form.feedbackUrl} target="_blank" rel="noopener noreferrer">{form.feedbackUrl}</a>
              <button type="button" onClick={() => copyText(form.feedbackUrl)}>Copy</button>
            </div>
            <div>
              <span>Thank You Email Text</span>
              <textarea readOnly value={previewText} />
              <button type="button" onClick={() => copyText(previewText)}>Copy</button>
            </div>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
