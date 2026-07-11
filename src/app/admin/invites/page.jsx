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

const DEFAULT_BUSINESS_PHONE = "+1 (905) 760-2922";
const DEFAULT_ADDRESS = "960 Edgeley Blvd #2, Vaughan, ON L4K 4V4";
const DEFAULT_DIRECTIONS_LINK =
  "https://www.google.com/maps/search/?api=1&query=960%20Edgeley%20Blvd%20%232%2C%20Vaughan%2C%20ON%20L4K%204V4";
const DEFAULT_GREETING = "Hi,";
const DEFAULT_GUEST_LINE = "You are invited!";
const DEFAULT_PARTY_INTRO =
  "🎉 Get ready for an epic birthday adventure filled with games, laughs, challenges, and nonstop fun! We’re celebrating at Pixel Pulse Playzone and you’re invited to join the action! 🎮⚡";
const PARTY_PACKAGE_OPTIONS = ["Pixel Punch", "Pixel Ultra", "Pixel Jumbo", "Pulse Max"];

export default function AdminInvitesPage() {
  const [form, setForm] = useState({
    childName: "",
    partyId: "",
    title: "Birthday Party",
    partyPackage: "",
    playDuration: "",
    childrenIncluded: "",
    partyRoomAccess: "",
    foodAddOns: "",
    additionalExtras: "",
    specialNotes: "",
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
    rsvpName: "",
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
  const [sendingConfirmationEmail, setSendingConfirmationEmail] = useState(false);
  const [sendingThankYouEmail, setSendingThankYouEmail] = useState(false);
  const [invites, setInvites] = useState([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [editingInvite, setEditingInvite] = useState(null);
  const [savingInvite, setSavingInvite] = useState(false);
  const [deletingSlug, setDeletingSlug] = useState("");
  const [inviteStatus, setInviteStatus] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);

  const suggestedSlug = useMemo(
    () => slugify(form.slug || form.childName),
    [form.childName, form.slug],
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

  async function loadInvites() {
    setLoadingInvites(true);
    setError("");

    try {
      const response = await fetch("/api/admin/invites?list=1", {
        cache: "no-store",
        credentials: "same-origin",
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to load invites.");
        return;
      }

      setInvites(data.invites || []);
    } catch (loadError) {
      setError("Unable to load invites.");
    } finally {
      setLoadingInvites(false);
    }
  }

  useEffect(() => {
    loadInvites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function updateChildName(value) {
    setForm((current) => ({
      ...current,
      childName: value,
      slug: slugEdited ? current.slug : slugify(value),
    }));
  }

  function updateSlug(value) {
    setSlugEdited(true);
    setForm((current) => ({ ...current, slug: value }));
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
      loadInvites();
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

  async function sendConfirmationEmail() {
    if (!result || !emailTo) return;
    setSendingConfirmationEmail(true);
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
          confirmationEmailText: result.confirmationEmailText,
          qrCodeUrl: result.qrCodeUrl,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setEmailStatus(data.error || "Unable to send confirmation email.");
        return;
      }

      setEmailStatus("Confirmation email sent.");
    } catch (sendError) {
      setEmailStatus("Unable to send confirmation email.");
    } finally {
      setSendingConfirmationEmail(false);
    }
  }

  async function sendThankYouEmail() {
    if (!result || !emailTo) return;
    setSendingThankYouEmail(true);
    setEmailStatus("");

    try {
      const response = await fetch("/api/admin/invites/email", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "thank-you",
          email: emailTo,
          partyId: result.partyId,
          feedbackUrl: result.feedbackUrl,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setEmailStatus(data.error || "Unable to send thank you email.");
        return;
      }

      setEmailStatus("Thank you email sent.");
    } catch (sendError) {
      setEmailStatus("Unable to send thank you email.");
    } finally {
      setSendingThankYouEmail(false);
    }
  }

  function beginEditInvite(invite) {
    setEditingInvite({
      slug: invite.slug || "",
      childName: invite.childName || "",
      partyId: invite.partyId || "",
      title: invite.title || "",
      partyPackage: invite.partyPackage || invite.titleSuffix || "",
      playDuration: invite.playDuration || "",
      childrenIncluded: invite.childrenIncluded || "",
      partyRoomAccess: invite.partyRoomAccess || "",
      foodAddOns: invite.foodAddOns || "",
      additionalExtras: invite.additionalExtras || "",
      specialNotes: invite.specialNotes || "",
      greeting: invite.greeting || DEFAULT_GREETING,
      guestName: invite.guestName || DEFAULT_GUEST_LINE,
      intro: invite.intro || "",
      date: invite.date || "",
      time: invite.time || "",
      venue: invite.venue || "",
      address: invite.address || "",
      waiverText: invite.waiverText || "",
      waiverButton: invite.waiverButton || "Complete waiver",
      rsvpText: invite.rsvpText || "",
      rsvpName: invite.rsvpName || "",
      phone: invite.phone || "",
      businessPhone: invite.businessPhone || DEFAULT_BUSINESS_PHONE,
      directionsLink: invite.directionsLink || DEFAULT_DIRECTIONS_LINK,
      footer: invite.footer || "",
      websiteText: invite.websiteText || "",
      websiteLink: invite.websiteLink || "",
    });
    setInviteStatus("");
  }

  function updateEditingInvite(name, value) {
    setEditingInvite((current) => ({ ...current, [name]: value }));
  }

  async function saveEditingInvite(event) {
    event.preventDefault();
    if (!editingInvite?.slug) return;
    setSavingInvite(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/invites?slug=${encodeURIComponent(editingInvite.slug)}`, {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingInvite),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to update invite.");
        return;
      }

      const updatedInvite = data.invite || editingInvite;
      setResult({
        partyId: updatedInvite.partyId,
        inviteUrl: updatedInvite.inviteUrl || `/invite/${updatedInvite.slug}`,
        waiverUrl: updatedInvite.waiverLink || "",
        feedbackUrl: updatedInvite.feedbackUrl || `/feedback?partyId=${encodeURIComponent(updatedInvite.partyId || "")}`,
        smsText: updatedInvite.smsText || "",
        confirmationEmailText: updatedInvite.confirmationEmailText || "",
        qrCodeUrl: `https://quickchart.io/qr?text=${encodeURIComponent(updatedInvite.inviteUrl || `/invite/${updatedInvite.slug}`)}&size=220`,
      });
      setEditingInvite(null);
      setInviteStatus("Invite updated.");
      loadInvites();
    } catch (saveError) {
      setError("Unable to update invite.");
    } finally {
      setSavingInvite(false);
    }
  }

  async function deleteInvite(invite) {
    const slug = invite.slug;
    if (!slug) return;
    if (typeof window !== "undefined" && !window.confirm(`Delete invite ${slug}?`)) return;
    setDeletingSlug(slug);
    setError("");

    try {
      const response = await fetch(`/api/admin/invites?slug=${encodeURIComponent(slug)}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to delete invite.");
        return;
      }

      if (editingInvite?.slug === slug) setEditingInvite(null);
      setInviteStatus("Invite deleted.");
      loadInvites();
    } catch (deleteError) {
      setError("Unable to delete invite.");
    } finally {
      setDeletingSlug("");
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
            <Field label="Child name" required>
              <input required value={form.childName} onChange={(event) => updateChildName(event.target.value)} />
            </Field>
            <Field label="Party ID" required>
              <input required value={form.partyId} onChange={(event) => updateField("partyId", event.target.value)} placeholder="Party ID" />
            </Field>
            <Field label="Invite look">
              <input value={form.title} onChange={(event) => updateField("title", event.target.value)} placeholder="Birthday Party" />
            </Field>
            <Field label="Party package">
              <select value={form.partyPackage} onChange={(event) => updateField("partyPackage", event.target.value)}>
                <option value="">Select party package</option>
                {PARTY_PACKAGE_OPTIONS.map((option) => (
                  <option value={option} key={option}>{option}</option>
                ))}
              </select>
            </Field>
            <Field label="Slug">
              <input value={form.slug} onChange={(event) => updateSlug(event.target.value)} placeholder={suggestedSlug} />
            </Field>
            <Field label="Date" required>
              <input required type="date" value={form.date} onChange={(event) => updateField("date", event.target.value)} />
            </Field>
            <Field label="Party Time" required>
              <input required value={form.time} onChange={(event) => updateField("time", event.target.value)} placeholder="2:00 PM - 4:00 PM" />
            </Field>
            <Field label="Play Duration">
              <input value={form.playDuration} onChange={(event) => updateField("playDuration", event.target.value)} placeholder="60 / 90 / 120 Minutes" />
            </Field>
            <Field label="Number of Children Included">
              <input value={form.childrenIncluded} onChange={(event) => updateField("childrenIncluded", event.target.value)} placeholder="Up to 12" />
            </Field>
            <Field label="Party Room Access">
              <input value={form.partyRoomAccess} onChange={(event) => updateField("partyRoomAccess", event.target.value)} placeholder="Time 00:00 hrs" />
            </Field>
            <Field label="Food & Add-ons">
              <textarea value={form.foodAddOns} onChange={(event) => updateField("foodAddOns", event.target.value)} placeholder="Pizza, drinks, arcade credits, etc." />
            </Field>
            <Field label="Additional Extras">
              <textarea value={form.additionalExtras} onChange={(event) => updateField("additionalExtras", event.target.value)} placeholder="Extra kids, decorations, return gifts, etc." />
            </Field>
            <Field label="Special Notes">
              <textarea value={form.specialNotes} onChange={(event) => updateField("specialNotes", event.target.value)} placeholder="Allergies, special requests, additional information" />
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
            <Field label="Parent / Party Host Name" required>
              <input required value={form.rsvpName} onChange={(event) => updateField("rsvpName", event.target.value)} placeholder="Parent or guardian name" />
            </Field>
            <Field label="RSVP phone" required>
              <input required value={form.phone} onChange={(event) => updateField("phone", event.target.value)} placeholder="Parent or guardian RSVP number" />
            </Field>
            <Field label="Pixel Pulse phone">
              <input value={form.businessPhone} onChange={(event) => updateField("businessPhone", event.target.value)} />
            </Field>
            <Field label="Google Maps link">
              <input value={form.directionsLink} onChange={(event) => updateField("directionsLink", event.target.value)} />
            </Field>
            <Field label="Waiver text">
              <textarea value={form.waiverText} onChange={(event) => updateField("waiverText", event.target.value)} />
            </Field>
            <Field label="Waiver button">
              <input value={form.waiverButton} onChange={(event) => updateField("waiverButton", event.target.value)} />
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
                <span>Feedback Form URL</span>
                <a href={result.feedbackUrl} target="_blank" rel="noopener noreferrer">{result.feedbackUrl}</a>
                <button type="button" onClick={() => copyText(result.feedbackUrl)}>Copy</button>
              </div>
              <div>
                <span>SMS Text</span>
                <textarea readOnly value={result.smsText} />
                <button type="button" onClick={() => copyText(result.smsText)}>Copy</button>
              </div>
              <div>
                <span>Confirmation Email Text</span>
                <textarea readOnly value={result.confirmationEmailText || ""} />
                <button type="button" onClick={() => copyText(result.confirmationEmailText || "")}>Copy</button>
              </div>
              <div>
                <span>Email</span>
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
                  {sendingEmail ? "Sending..." : "Send SMS + QR"}
                </button>
                <button
                  type="button"
                  onClick={sendConfirmationEmail}
                  disabled={sendingConfirmationEmail || !emailTo || !result.confirmationEmailText}
                >
                  {sendingConfirmationEmail ? "Sending..." : "Send Confirmation Email"}
                </button>
                <button
                  type="button"
                  onClick={sendThankYouEmail}
                  disabled={sendingThankYouEmail || !emailTo || !result.feedbackUrl}
                >
                  {sendingThankYouEmail ? "Sending..." : "Send Thank You + Feedback"}
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

        {editingInvite ? (
          <form className="invite-admin-form invite-admin-edit" onSubmit={saveEditingInvite}>
            <section>
              <div className="invite-admin-list__header">
                <div>
                  <h2>Edit Invite</h2>
                  <p>Editing /invite/{editingInvite.slug}</p>
                </div>
                <button type="button" onClick={() => setEditingInvite(null)}>Cancel</button>
              </div>
              <div className="invite-admin-edit__actions">
                <a href={`/invite/${editingInvite.slug}`} target="_blank" rel="noopener noreferrer">
                  View current invite
                </a>
              </div>
              <div className="invite-admin-grid">
                <Field label="Child name" required>
                  <input required value={editingInvite.childName} onChange={(event) => updateEditingInvite("childName", event.target.value)} />
                </Field>
                <Field label="Party ID" required>
                  <input required value={editingInvite.partyId} onChange={(event) => updateEditingInvite("partyId", event.target.value)} />
                </Field>
                <Field label="Invite look">
                  <input value={editingInvite.title} onChange={(event) => updateEditingInvite("title", event.target.value)} />
                </Field>
                <Field label="Party package">
                  <select value={editingInvite.partyPackage} onChange={(event) => updateEditingInvite("partyPackage", event.target.value)}>
                    <option value="">Select party package</option>
                    {PARTY_PACKAGE_OPTIONS.map((option) => (
                      <option value={option} key={option}>{option}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Date" required>
                  <input required type="date" value={editingInvite.date} onChange={(event) => updateEditingInvite("date", event.target.value)} />
                </Field>
                <Field label="Party Time" required>
                  <input required value={editingInvite.time} onChange={(event) => updateEditingInvite("time", event.target.value)} placeholder="2:00 PM - 4:00 PM" />
                </Field>
                <Field label="Play Duration">
                  <input value={editingInvite.playDuration} onChange={(event) => updateEditingInvite("playDuration", event.target.value)} />
                </Field>
                <Field label="Number of Children Included">
                  <input value={editingInvite.childrenIncluded} onChange={(event) => updateEditingInvite("childrenIncluded", event.target.value)} />
                </Field>
                <Field label="Party Room Access">
                  <input value={editingInvite.partyRoomAccess} onChange={(event) => updateEditingInvite("partyRoomAccess", event.target.value)} />
                </Field>
                <Field label="Food & Add-ons">
                  <textarea value={editingInvite.foodAddOns} onChange={(event) => updateEditingInvite("foodAddOns", event.target.value)} />
                </Field>
                <Field label="Additional Extras">
                  <textarea value={editingInvite.additionalExtras} onChange={(event) => updateEditingInvite("additionalExtras", event.target.value)} />
                </Field>
                <Field label="Special Notes">
                  <textarea value={editingInvite.specialNotes} onChange={(event) => updateEditingInvite("specialNotes", event.target.value)} />
                </Field>
                <Field label="Parent / Party Host Name" required>
                  <input required value={editingInvite.rsvpName} onChange={(event) => updateEditingInvite("rsvpName", event.target.value)} />
                </Field>
                <Field label="RSVP phone" required>
                  <input required value={editingInvite.phone} onChange={(event) => updateEditingInvite("phone", event.target.value)} />
                </Field>
                <Field label="Venue">
                  <input value={editingInvite.venue} onChange={(event) => updateEditingInvite("venue", event.target.value)} />
                </Field>
                <Field label="Address">
                  <input value={editingInvite.address} onChange={(event) => updateEditingInvite("address", event.target.value)} />
                </Field>
                <Field label="Greeting">
                  <input value={editingInvite.greeting} onChange={(event) => updateEditingInvite("greeting", event.target.value)} />
                </Field>
                <Field label="Guest line">
                  <input value={editingInvite.guestName} onChange={(event) => updateEditingInvite("guestName", event.target.value)} />
                </Field>
                <Field label="Intro">
                  <textarea value={editingInvite.intro} onChange={(event) => updateEditingInvite("intro", event.target.value)} />
                </Field>
                <Field label="Waiver text">
                  <textarea value={editingInvite.waiverText} onChange={(event) => updateEditingInvite("waiverText", event.target.value)} />
                </Field>
                <Field label="Waiver button">
                  <input value={editingInvite.waiverButton} onChange={(event) => updateEditingInvite("waiverButton", event.target.value)} />
                </Field>
                <Field label="RSVP text">
                  <input value={editingInvite.rsvpText} onChange={(event) => updateEditingInvite("rsvpText", event.target.value)} />
                </Field>
                <Field label="Pixel Pulse phone">
                  <input value={editingInvite.businessPhone} onChange={(event) => updateEditingInvite("businessPhone", event.target.value)} />
                </Field>
                <Field label="Google Maps link">
                  <input value={editingInvite.directionsLink} onChange={(event) => updateEditingInvite("directionsLink", event.target.value)} />
                </Field>
                <Field label="Website text">
                  <input value={editingInvite.websiteText} onChange={(event) => updateEditingInvite("websiteText", event.target.value)} />
                </Field>
                <Field label="Website URL">
                  <input value={editingInvite.websiteLink} onChange={(event) => updateEditingInvite("websiteLink", event.target.value)} />
                </Field>
                <Field label="Footer">
                  <textarea value={editingInvite.footer} onChange={(event) => updateEditingInvite("footer", event.target.value)} />
                </Field>
              </div>
            </section>
            <button type="submit" disabled={savingInvite}>
              {savingInvite ? "Saving..." : "Save Invite"}
            </button>
          </form>
        ) : null}

        <section className="invite-admin-result invite-admin-list">
          <div className="invite-admin-list__header">
            <div>
              <h2>Invite Records</h2>
              <p>View, edit, or delete party invite links created from admin.</p>
            </div>
            <button type="button" onClick={loadInvites} disabled={loadingInvites}>
              {loadingInvites ? "Refreshing..." : "Refresh"}
            </button>
          </div>
          {inviteStatus ? <p className="invite-admin-status">{inviteStatus}</p> : null}
          <div className="invite-admin-table-wrap">
            <table className="invite-admin-table">
              <thead>
                <tr>
                  <th>Child</th>
                  <th>Party ID</th>
                  <th>Date</th>
                  <th>RSVP</th>
                  <th>Invite</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingInvites ? (
                  <tr>
                    <td colSpan={6}>Loading invites...</td>
                  </tr>
                ) : invites.length ? (
                  invites.map((invite) => (
                    <tr key={invite.slug || invite.id || invite.inviteUrl}>
                      <td>{invite.childName || "—"}</td>
                      <td>{invite.partyId || "—"}</td>
                      <td>{[invite.date, invite.time].filter(Boolean).join(" ") || "—"}</td>
                      <td>{[invite.rsvpName, invite.phone].filter(Boolean).join(" · ") || "—"}</td>
                      <td>
                        {invite.inviteUrl ? (
                          <a href={invite.inviteUrl} target="_blank" rel="noopener noreferrer">View</a>
                        ) : "—"}
                      </td>
                      <td>
                        <div className="invite-admin-table__actions">
                          <button type="button" onClick={() => beginEditInvite(invite)}>Edit</button>
                          <button
                            type="button"
                            className="invite-admin-table__delete"
                            onClick={() => deleteInvite(invite)}
                            disabled={deletingSlug === invite.slug}
                          >
                            {deletingSlug === invite.slug ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6}>No invite records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
