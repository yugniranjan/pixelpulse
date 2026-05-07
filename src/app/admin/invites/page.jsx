"use client";

import { useEffect, useMemo, useState } from "react";
import "../../styles/admin-invites.css";
import "../../styles/admin-waivers.css";
import AdminShell from "@/components/AdminShell";

function slugify(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    ?.replace(/['’]/g, "")
    ?.replace(/[^a-z0-9]+/g, "-")
    ?.replace(/^-+|-+$/g, "");
}

function Field({ label, children }) {
  return (
    <label className="invite-admin-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

const DEFAULT_BUSINESS_PHONE = "+1 (905) 760-2922";
const DEFAULT_ADDRESS = "960 Edgeley Blvd #2, Vaughan, ON L4K 4V4";
const DEFAULT_DIRECTIONS_LINK =
  "https://www.google.com/maps/search/?api=1&query=960%20Edgeley%20Blvd%20%232%2C%20Vaughan%2C%20ON%20L4K%204V4";
const DEFAULT_GREETING = "Hi,";
const DEFAULT_GUEST_LINE = "You are invited!";
const DEFAULT_PARTY_INTRO =
  "🎉 Get ready for an epic birthday adventure filled with games, laughs, challenges, and nonstop fun! We’re celebrating at Pixel Pulse Playzone and you’re invited to join the action! 🎮⚡";

export default function AdminInvitesPage() {
  const [form, setForm] = useState({
    childName: "",
    partyId: "",
    title: "",
    titleSuffix: "Birthday Party",
    greeting: DEFAULT_GREETING,
    guestName: DEFAULT_GUEST_LINE,
    intro: DEFAULT_PARTY_INTRO,
    date: "",
    time: "",
    venue: "Pixel Pulse Playzone",
    address: DEFAULT_ADDRESS,
    directionsLink: DEFAULT_DIRECTIONS_LINK,
    waiverText: "Please complete the waiver before the party.",
    waiverButton: "Complete waiver",
    rsvpText: "Please text or call",
    phone: "",
    businessPhone: DEFAULT_BUSINESS_PHONE,
    footer: "We can't wait to celebrate with you!",
    websiteText: "www.pixelpulseplay.ca",
    websiteLink: "https://www.pixelpulseplay.ca",
    slug: "",
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailStatus, setEmailStatus] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  const suggestedSlug = useMemo(
    () => slugify(form.slug || `${form.childName}-${form.date}`),
    [form.childName, form.date, form.slug],
  );

  useEffect(() => {
    async function loadInviteDefaults() {
      try {
        const response = await fetch("/api/admin/invites?defaults=1", {
          cache: "no-store",
          credentials: "same-origin",
        });
        const data = await response.json();
        const defaults = data?.defaults || {};

        if (!response.ok) return;

        setForm((current) => ({
          ...current,
          greeting:
            defaults.greeting &&
            (!current.greeting || current.greeting === DEFAULT_GREETING)
              ? defaults.greeting
              : current.greeting,
          guestName:
            defaults.guestName &&
            (!current.guestName || current.guestName === DEFAULT_GUEST_LINE)
              ? defaults.guestName
              : current.guestName,
          intro:
            defaults.intro &&
            (!current.intro || current.intro === DEFAULT_PARTY_INTRO)
              ? defaults.intro
              : current.intro,
        }));
      } catch (error) {
        // Keep the local default if sheet-backed defaults are unavailable.
      }
    }

    loadInviteDefaults();
  }, []);

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function createInvite(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    setEmailStatus("");

    const response = await fetch("/api/admin/invites", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, slug: suggestedSlug }),
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "Unable to create invite.");
    } else {
      setResult(data);
    }

    setLoading(false);
  }

  async function copyText(text) {
    await navigator.clipboard.writeText(text);
  }

  async function sendInviteEmail() {
    if (!result || !emailTo) return;
    setSendingEmail(true);
    setEmailStatus("");

    try {
      const response = await fetch("/api/admin/invites/email", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailTo,
          partyId: result.partyId,
          inviteUrl: result.inviteUrl,
          waiverUrl: result.waiverUrl,
          smsText: result.smsText,
          qrCodeUrl: result.qrCodeUrl,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setEmailStatus(data.error || "Unable to send email.");
        return;
      }

      setEmailStatus("Email sent.");
    } catch (sendError) {
      setEmailStatus("Unable to send email.");
    } finally {
      setSendingEmail(false);
    }
  }

  return (
    <AdminShell>
      <div className="invite-admin-page invite-admin-page--shell">
        <div className="invite-admin-header waiver-admin-header--dashboard">
          <div>
            <span className="waiver-admin-kicker">Admin dashboard</span>
            <h1>Create Party Links</h1>
            <p>Create the birthday invite, waiver link, SMS text, and QR code from one party setup.</p>
          </div>
        </div>

        <form className="invite-admin-form" onSubmit={createInvite}>
        <section>
          <h2>Party Details</h2>
          <div className="invite-admin-grid">
            <Field label="Child name">
              <input required value={form.childName} onChange={(event) => updateField("childName", event.target.value)} />
            </Field>
            <Field label="Party ID">
              <input value={form.partyId} onChange={(event) => updateField("partyId", event.target.value)} placeholder="Optional party ID" />
            </Field>
            <Field label="Title">
              <input value={form.title} onChange={(event) => updateField("title", event.target.value)} placeholder="Ariana's Birthday Party" />
            </Field>
            <Field label="Title suffix">
              <input value={form.titleSuffix} onChange={(event) => updateField("titleSuffix", event.target.value)} />
            </Field>
            <Field label="Slug">
              <input value={form.slug} onChange={(event) => updateField("slug", event.target.value)} placeholder={suggestedSlug} />
            </Field>
            <Field label="Date">
              <input required type="date" value={form.date} onChange={(event) => updateField("date", event.target.value)} />
            </Field>
            <Field label="Time">
              <input required type="time" value={form.time} onChange={(event) => updateField("time", event.target.value)} />
            </Field>
          </div>
        </section>

        <section>
          <h2>Invite Copy</h2>
          <div className="invite-admin-grid">
            <Field label="Greeting">
              <input value={form.greeting} onChange={(event) => updateField("greeting", event.target.value)} />
            </Field>
            <Field label="Guest line">
              <input value={form.guestName} onChange={(event) => updateField("guestName", event.target.value)} />
            </Field>
            <Field label="Intro">
              <textarea value={form.intro} onChange={(event) => updateField("intro", event.target.value)} />
            </Field>
            <Field label="Footer">
              <textarea value={form.footer} onChange={(event) => updateField("footer", event.target.value)} />
            </Field>
          </div>
        </section>

        <section>
          <h2>Links & Contact</h2>
          <div className="invite-admin-grid">
            <Field label="Venue">
              <input value={form.venue} onChange={(event) => updateField("venue", event.target.value)} />
            </Field>
            <Field label="Address">
              <input value={form.address} onChange={(event) => updateField("address", event.target.value)} />
            </Field>
            <Field label="RSVP phone">
              <input value={form.phone} onChange={(event) => updateField("phone", event.target.value)} placeholder="Parent or guardian RSVP number" />
            </Field>
            <Field label="Pixel Pulse phone">
              <input value={form.businessPhone} onChange={(event) => updateField("businessPhone", event.target.value)} />
            </Field>
            <Field label="Google Maps link">
              <input value={form.directionsLink} onChange={(event) => updateField("directionsLink", event.target.value)} />
            </Field>
            <Field label="Website text">
              <input value={form.websiteText} onChange={(event) => updateField("websiteText", event.target.value)} />
            </Field>
            <Field label="Website URL">
              <input value={form.websiteLink} onChange={(event) => updateField("websiteLink", event.target.value)} />
            </Field>
          </div>
        </section>

        {error ? <p className="invite-admin-error">{error}</p> : null}

        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Party Links"}
        </button>
        </form>

        {result ? (
          <section className="invite-admin-result">
            <h2>Party Links Ready</h2>
            <div className="invite-admin-output">
              <div>
                <span>Party ID</span>
                <strong>{result.partyId}</strong>
                <button type="button" onClick={() => copyText(result.partyId)}>Copy</button>
              </div>
              <div>
                <span>Invite URL</span>
                <a href={result.inviteUrl} target="_blank" rel="noopener noreferrer">{result.inviteUrl}</a>
                <button type="button" onClick={() => copyText(result.inviteUrl)}>Copy</button>
              </div>
              <div>
                <span>Waiver URL</span>
                <a href={result.waiverUrl} target="_blank" rel="noopener noreferrer">{result.waiverUrl}</a>
                <button type="button" onClick={() => copyText(result.waiverUrl)}>Copy</button>
              </div>
              <div>
                <span>SMS Text</span>
                <textarea readOnly value={result.smsText} />
                <button type="button" onClick={() => copyText(result.smsText)}>Copy</button>
              </div>
              <div>
                <span>Email SMS + QR</span>
                <input
                  type="email"
                  value={emailTo}
                  onChange={(event) => {
                    setEmailTo(event.target.value);
                    setEmailStatus("");
                  }}
                  placeholder="name@example.com"
                />
                <button type="button" onClick={sendInviteEmail} disabled={sendingEmail || !emailTo}>
                  {sendingEmail ? "Sending..." : "Send Email"}
                </button>
                {emailStatus ? <small>{emailStatus}</small> : null}
              </div>
              <div className="invite-admin-qr">
                <span>QR Code</span>
                <img src={result.qrCodeUrl} alt="Invite QR code" />
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </AdminShell>
  );
}
