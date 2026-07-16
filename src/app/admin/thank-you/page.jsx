"use client";

import { useMemo, useState } from "react";
import "../../styles/admin-invites.css";
import "../../styles/admin-waivers.css";
import AdminShell from "@/components/AdminShell";

const DEFAULT_FEEDBACK_URL = "https://www.pixelpulseplay.ca/feedback";
const DEFAULT_BOOKING_LINK = "https://www.pixelpulseplay.ca/booking?type=ticket";
const DEFAULT_WEBSITE_LINK = "https://www.pixelpulseplay.ca";
const DEFAULT_INSTAGRAM_LINK = "https://www.instagram.com/pixelpulseplay/";

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
    "We loved having you at Pixel Pulse and hope you had an incredible time taking on our immersive challenges, competing with your team, and making unforgettable memories.",
    "",
    "Whether you came with family, friends, or colleagues, thank you for choosing us to be part of your day. We can't wait to welcome you back for another round!",
    "",
    "Help Us Level Up",
    "We're always looking for ways to make every visit even more exciting. We'd love to hear about your experience and any ideas you have for us.",
    "",
    `Share your feedback here: ${form.feedbackUrl}`,
    "",
    "Your Next Challenge Awaits!",
    "",
    "As a thank you for visiting, here's an exclusive reward just for you.",
    "",
    "Choose ONE reward on your next visit:",
    "- 10% OFF your next play session, or",
    "- FREE 15 Extra Minutes with any regular play session.",
    "",
    "Offer valid for 14 days from your visit.",
    "Simply show this email when you arrive to redeem your reward.",
    "",
    "Challenge your friends, beat your best score, and experience even more action on your next visit!",
    "",
    `Book Your Next Visit: ${form.bookingLink}`,
    "",
    "Thank you for being part of the Pixel Pulse community.",
    "",
    "Skip the Screen. Enter the Challenge.",
    "",
    "We can't wait to welcome you back for your next adventure!",
    "",
    "See you soon,",
    "",
    "The Pixel Pulse Team",
    "Vaughan, Ontario",
    form.websiteLink,
    form.instagramLink,
  ].filter((line) => line !== null && line !== undefined).join("\n");
}

export default function AdminThankYouPage() {
  const [form, setForm] = useState({
    firstName: "",
    email: "",
    partyId: "",
    feedbackUrl: DEFAULT_FEEDBACK_URL,
    bookingLink: DEFAULT_BOOKING_LINK,
    websiteLink: DEFAULT_WEBSITE_LINK,
    instagramLink: DEFAULT_INSTAGRAM_LINK,
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
      payload.append("partyId", form.partyId);
      payload.append("feedbackUrl", form.feedbackUrl);
      payload.append("bookingLink", form.bookingLink);
      payload.append("websiteLink", form.websiteLink);
      payload.append("instagramLink", form.instagramLink);
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
              <Field label="Booking link" required>
                <input
                  required
                  value={form.bookingLink}
                  onChange={(event) => updateField("bookingLink", event.target.value)}
                />
              </Field>
              <Field label="Website">
                <input
                  value={form.websiteLink}
                  onChange={(event) => updateField("websiteLink", event.target.value)}
                />
              </Field>
              <Field label="Instagram">
                <input
                  value={form.instagramLink}
                  onChange={(event) => updateField("instagramLink", event.target.value)}
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
              <span>Booking Link</span>
              <a href={form.bookingLink} target="_blank" rel="noopener noreferrer">{form.bookingLink}</a>
              <button type="button" onClick={() => copyText(form.bookingLink)}>Copy</button>
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
