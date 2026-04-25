"use client";

import { useMemo, useState } from "react";
import "../../styles/admin-invites.css";

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

export default function AdminInvitesPage() {
  const [form, setForm] = useState({
    childName: "",
    title: "",
    titleSuffix: "Birthday Party",
    greeting: "Hi,",
    guestName: "You are invited!",
    intro: "",
    date: "",
    time: "",
    venue: "Pixel Pulse Playzone",
    address: "",
    waiverText: "Please complete the waiver before the party.",
    waiverButton: "Complete waiver",
    waiverLink: "",
    rsvpText: "Please text or call",
    phone: "",
    businessPhone: "",
    directionsLink: "",
    footer: "We can't wait to celebrate with you!",
    websiteText: "www.pixelpulseplay.ca",
    websiteLink: "https://www.pixelpulseplay.ca",
    slug: "",
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const suggestedSlug = useMemo(
    () => slugify(form.slug || `${form.childName}-${form.date}`),
    [form.childName, form.date, form.slug],
  );

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function createInvite(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    const response = await fetch("/api/admin/invites", {
      method: "POST",
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

  return (
    <div className="invite-admin-page">
      <div className="invite-admin-header">
        <h1>Invite Builder</h1>
        <p>Create birthday invite links, waiver links, SMS text, and QR codes.</p>
      </div>

      <form className="invite-admin-form" onSubmit={createInvite}>
        <section>
          <h2>Party Details</h2>
          <div className="invite-admin-grid">
            <Field label="Child name">
              <input required value={form.childName} onChange={(event) => updateField("childName", event.target.value)} />
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
            <Field label="Address / directions search">
              <input value={form.address} onChange={(event) => updateField("address", event.target.value)} />
            </Field>
            <Field label="Directions link">
              <input value={form.directionsLink} onChange={(event) => updateField("directionsLink", event.target.value)} placeholder="Optional Google Maps URL" />
            </Field>
            <Field label="Waiver URL">
              <input required value={form.waiverLink} onChange={(event) => updateField("waiverLink", event.target.value)} />
            </Field>
            <Field label="RSVP phone">
              <input value={form.phone} onChange={(event) => updateField("phone", event.target.value)} />
            </Field>
            <Field label="Pixel Pulse phone">
              <input value={form.businessPhone} onChange={(event) => updateField("businessPhone", event.target.value)} />
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
          {loading ? "Creating..." : "Create Invite"}
        </button>
      </form>

      {result ? (
        <section className="invite-admin-result">
          <h2>Invite Ready</h2>
          <div className="invite-admin-output">
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
            <div className="invite-admin-qr">
              <span>QR Code</span>
              <img src={result.qrCodeUrl} alt="Invite QR code" />
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

