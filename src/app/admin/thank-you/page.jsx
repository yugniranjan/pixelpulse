"use client";

import { useMemo, useState } from "react";
import "../../styles/admin-invites.css";
import "../../styles/admin-waivers.css";
import AdminShell from "@/components/AdminShell";

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

function buildThankYouPreview(form = {}) {
  return [
    form.firstName ? `Hi ${form.firstName},` : "Hi {firstName},",
    "",
    "Thanks for Playing at Pixel Pulse!",
    "",
    "We loved having you and hope you had an amazing time taking on our immersive challenges.",
    "",
    "Enjoy a FREE 60-Minute Play Pass",
    "",
    "As a thank you for visiting, we'd love to invite you back for another Pixel Pulse adventure.",
    "",
    "Bring your family, friends, or teammates and take on more immersive challenge rooms.",
    "",
    "Thank you for being part of the Pixel Pulse community.",
    "",
    "See you again soon!",
    "",
    "The Pixel Pulse Team",
    "Vaughan, Ontario",
    form.websiteLink || DEFAULT_WEBSITE_LINK,
  ].filter((line) => line !== null && line !== undefined).join("\n");
}

export default function AdminThankYouPage() {
  const [form, setForm] = useState({
    firstName: "",
    emails: "",
    partyId: "",
    websiteLink: DEFAULT_WEBSITE_LINK,
    emailText: buildThankYouPreview({ websiteLink: DEFAULT_WEBSITE_LINK }),
  });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [attachments, setAttachments] = useState([]);

  const previewText = form.emailText;
  const recipientEmails = useMemo(
    () =>
      form.emails
        .split(/[\n,;]+/)
        .map((email) => email.trim())
        .filter(Boolean),
    [form.emails],
  );

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function copyText(text) {
    await navigator.clipboard.writeText(text);
  }

  async function sendPromotionalEmail(event) {
    event.preventDefault();
    setSending(true);
    setStatus("");
    setError("");

    if (!recipientEmails.length) {
      setError("Please enter at least one email address.");
      setSending(false);
      return;
    }

    try {
      for (const email of recipientEmails) {
        const payload = new FormData();
        payload.append("type", "promotional");
        payload.append("email", email);
        payload.append("firstName", form.firstName);
        payload.append("name", form.firstName);
        payload.append("partyId", form.partyId);
        payload.append("websiteLink", form.websiteLink);
        payload.append("promotionalText", form.emailText);
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
          throw new Error(data.error || `Unable to send promotional email to ${email}.`);
        }
      }

      setStatus(
        recipientEmails.length === 1
          ? "Promotional email sent."
          : `Promotional email sent individually to ${recipientEmails.length} recipients.`,
      );
    } catch (sendError) {
      setError(sendError?.message || "Unable to send promotional email.");
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
            <h1>Promotional Email</h1>
            <p>Send post-visit promotional and reward emails from one place.</p>
          </div>
        </div>

        <form className="invite-admin-form" onSubmit={sendPromotionalEmail}>
          <section>
            <h2>Recipients</h2>
            <div className="invite-admin-grid">
              <Field label="First name">
                <input
                  value={form.firstName}
                  onChange={(event) => updateField("firstName", event.target.value)}
                  placeholder="First name"
                />
              </Field>
              <Field label="Email addresses" required>
                <textarea
                  required
                  value={form.emails}
                  onChange={(event) => updateField("emails", event.target.value)}
                  placeholder="name@example.com&#10;another@example.com"
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
              <Field label="Website">
                <input
                  value={form.websiteLink}
                  onChange={(event) => updateField("websiteLink", event.target.value)}
                />
              </Field>
            </div>
            <p className="invite-admin-help">
              Add one email per line, or separate emails with commas. Each recipient receives an individual email.
            </p>
          </section>

          <section>
            <h2>Email Content</h2>
            <div className="invite-admin-grid">
              <Field label="Review and edit" required>
                <textarea
                  required
                  value={form.emailText}
                  onChange={(event) => updateField("emailText", event.target.value)}
                />
              </Field>
            </div>
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
            {sending ? "Sending..." : "Send Promotional Email"}
          </button>
        </form>

        <section className="invite-admin-result">
          <h2>Promotional Email Preview</h2>
          <div className="invite-admin-output">
            <div>
              <span>Recipients</span>
              <p>{recipientEmails.length ? `${recipientEmails.length} recipient${recipientEmails.length === 1 ? "" : "s"}` : "No recipients yet"}</p>
            </div>
            <div>
              <span>Promotional Email Text</span>
              <textarea readOnly value={form.emailText} />
              <button type="button" onClick={() => copyText(previewText)}>Copy</button>
            </div>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
