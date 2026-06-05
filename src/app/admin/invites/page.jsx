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

function downloadCsv(filename, rows) {
  const escape = (value) => {
    const stringValue = String(value ?? "");
    if (/[",\n]/.test(stringValue)) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };
  const csv = rows.map((row) => row.map(escape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

const DEFAULT_BUSINESS_PHONE = "+1 (905) 760-2922";
const DEFAULT_ADDRESS = "960 Edgeley Blvd #2, Vaughan, ON L4K 4V4";
const DEFAULT_DIRECTIONS_LINK =
  "https://www.google.com/maps/search/?api=1&query=960%20Edgeley%20Blvd%20%232%2C%20Vaughan%2C%20ON%20L4K%204V4";
const DEFAULT_GREETING = "Hi,";
const DEFAULT_GUEST_LINE = "You are invited!";
const DEFAULT_PARTY_INTRO =
  "🎉 Get ready for an epic birthday adventure filled with games, laughs, challenges, and nonstop fun! We’re celebrating at Pixel Pulse Playzone and you’re invited to join the action! 🎮⚡";
const DEFAULT_FOLLOWUP_SUBJECT = "A little extra Pixel Pulse fun for {name}";
const DEFAULT_FOLLOWUP_MESSAGE = [
  "Hi {name},",
  "",
  "Thanks for celebrating with Pixel Pulse Play Zone. We hope the party was full of great games, laughs, and high-score moments.",
  "",
  "Here is an additional offer for your next visit: reply to this email and we will help you choose the best play option for your group.",
  "",
  "See you soon!",
  "Pixel Pulse Play Zone",
].join("\n");

export default function AdminInvitesPage() {
  const [form, setForm] = useState({
    childName: "",
    partyId: "",
    title: "Birthday Party",
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
    email: "",
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
  const [exporting, setExporting] = useState(false);
  const [invites, setInvites] = useState([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [followupSubject, setFollowupSubject] = useState(DEFAULT_FOLLOWUP_SUBJECT);
  const [followupMessage, setFollowupMessage] = useState(DEFAULT_FOLLOWUP_MESSAGE);
  const [sendingFollowup, setSendingFollowup] = useState(false);
  const [followupStatus, setFollowupStatus] = useState("");
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
      setSelectedIds((current) => {
        const validIds = new Set((data.invites || []).map((invite) => invite.slug || invite.id));
        return current.filter((id) => validIds.has(id));
      });
    } catch (loadError) {
      setError("Unable to load invites.");
    } finally {
      setLoadingInvites(false);
    }
  }

  useEffect(() => {
    loadInvites();
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

  async function exportInvites() {
    setExporting(true);
    setError("");

    try {
      const response = await fetch("/api/admin/invites?list=1", {
        cache: "no-store",
        credentials: "same-origin",
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to export invites.");
        return;
      }

      const header = [
        "Created At",
        "Updated At",
        "Party ID",
        "Child Name",
        "Slug",
        "Title",
        "Date",
        "Time",
        "RSVP Name",
        "RSVP Phone",
        "RSVP Email",
        "Email Source",
        "Invite URL",
        "Waiver URL",
        "SMS Text",
      ];
      const rows = (data.invites || []).map((invite) => [
        invite.createdAt || "",
        invite.updatedAt || "",
        invite.partyId || "",
        invite.childName || "",
        invite.slug || "",
        invite.title || "",
        invite.date || "",
        invite.time || "",
        invite.rsvpName || "",
        invite.phone || "",
        invite.email || "",
        invite.emailSource || "",
        invite.inviteUrl || "",
        invite.waiverLink || invite.waiverUrl || "",
        invite.smsText || "",
      ]);

      downloadCsv(`party-invites-${new Date().toISOString().slice(0, 10)}.csv`, [header, ...rows]);
    } catch (exportError) {
      setError("Unable to export invites.");
    } finally {
      setExporting(false);
    }
  }

  const selectedInvites = useMemo(
    () => invites.filter((invite) => selectedIds.includes(invite.slug || invite.id)),
    [invites, selectedIds],
  );
  const emailableInvites = useMemo(
    () => invites.filter((invite) => invite.email),
    [invites],
  );
  const selectedEmailableInvites = useMemo(
    () => selectedInvites.filter((invite) => invite.email),
    [selectedInvites],
  );
  const allEmailableSelected =
    emailableInvites.length > 0 &&
    emailableInvites.every((invite) => selectedIds.includes(invite.slug || invite.id));

  function toggleInvite(invite) {
    const id = invite.slug || invite.id;
    if (!id || !invite.email) return;

    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id],
    );
  }

  function toggleAllInvites() {
    if (allEmailableSelected) {
      setSelectedIds([]);
      return;
    }

    setSelectedIds(emailableInvites.map((invite) => invite.slug || invite.id).filter(Boolean));
  }

  async function sendFollowupEmail() {
    if (!selectedEmailableInvites.length) {
      setFollowupStatus("Select at least one invite with an email address.");
      return;
    }

    setSendingFollowup(true);
    setFollowupStatus("");
    setError("");

    try {
      const response = await fetch("/api/admin/send-email", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: followupSubject,
          message: followupMessage,
          recipients: selectedEmailableInvites.map((invite) => ({
            email: invite.email,
            name: invite.rsvpName || invite.childName || "",
          })),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setFollowupStatus(data.error || "Unable to send follow-up emails.");
        return;
      }

      setFollowupStatus(`Sent ${data.sent} email${data.sent === 1 ? "" : "s"}. ${data.failed ? `${data.failed} failed.` : ""}`);
    } catch (sendError) {
      setFollowupStatus("Unable to send follow-up emails.");
    } finally {
      setSendingFollowup(false);
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
          <button
            type="button"
            className="invite-admin-export"
            onClick={exportInvites}
            disabled={exporting}
          >
            {exporting ? "Exporting..." : "Export Invites CSV"}
          </button>
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
            <Field label="Title">
              <input value={form.title} onChange={(event) => updateField("title", event.target.value)} placeholder="Birthday Party" />
            </Field>
            <Field label="Slug">
              <input value={form.slug} onChange={(event) => updateSlug(event.target.value)} placeholder={suggestedSlug} />
            </Field>
            <Field label="Date" required>
              <input required type="date" value={form.date} onChange={(event) => updateField("date", event.target.value)} />
            </Field>
            <Field label="Time" required>
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
            <Field label="RSVP name" required>
              <input required value={form.rsvpName} onChange={(event) => updateField("rsvpName", event.target.value)} placeholder="Parent or guardian name" />
            </Field>
            <Field label="RSVP phone" required>
              <input required value={form.phone} onChange={(event) => updateField("phone", event.target.value)} placeholder="Parent or guardian RSVP number" />
            </Field>
            <Field label="RSVP email">
              <input type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} placeholder="parent@example.com" />
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

        <section className="invite-admin-result invite-admin-list">
          <div className="invite-admin-list__header">
            <div>
              <h2>Invite Records</h2>
              <p>Select invite records with email addresses to send follow-up messages or additional offers.</p>
            </div>
            <button type="button" onClick={loadInvites} disabled={loadingInvites}>
              {loadingInvites ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div className="invite-admin-followup">
            <Field label="Follow-up subject">
              <input value={followupSubject} onChange={(event) => setFollowupSubject(event.target.value)} />
            </Field>
            <Field label="Follow-up / offer message">
              <textarea value={followupMessage} onChange={(event) => setFollowupMessage(event.target.value)} />
            </Field>
            <div className="invite-admin-followup__actions">
              <span>{selectedEmailableInvites.length} selected with email</span>
              <button
                type="button"
                onClick={sendFollowupEmail}
                disabled={sendingFollowup || !selectedEmailableInvites.length}
              >
                {sendingFollowup ? "Sending..." : "Send Follow-up / Offer"}
              </button>
            </div>
            {followupStatus ? <p className="invite-admin-status">{followupStatus}</p> : null}
          </div>

          <div className="invite-admin-table-wrap">
            <table className="invite-admin-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={allEmailableSelected}
                      onChange={toggleAllInvites}
                      aria-label="Select all invites with email"
                    />
                  </th>
                  <th>Child</th>
                  <th>Party ID</th>
                  <th>Date</th>
                  <th>RSVP</th>
                  <th>Email</th>
                  <th>Source</th>
                  <th>Invite</th>
                </tr>
              </thead>
              <tbody>
                {loadingInvites ? (
                  <tr>
                    <td colSpan={8}>Loading invites...</td>
                  </tr>
                ) : invites.length ? (
                  invites.map((invite) => {
                    const id = invite.slug || invite.id;
                    const selected = selectedIds.includes(id);

                    return (
                      <tr key={id || `${invite.partyId}-${invite.inviteUrl}`}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleInvite(invite)}
                            disabled={!invite.email}
                            aria-label={`Select invite for ${invite.childName || invite.partyId || "guest"}`}
                          />
                        </td>
                        <td>{invite.childName || "—"}</td>
                        <td>{invite.partyId || "—"}</td>
                        <td>{[invite.date, invite.time].filter(Boolean).join(" ") || "—"}</td>
                        <td>{invite.rsvpName || invite.phone || "—"}</td>
                        <td>{invite.email || <span className="invite-admin-muted">No email</span>}</td>
                        <td>{invite.emailSource || "—"}</td>
                        <td>
                          {invite.inviteUrl ? (
                            <a href={invite.inviteUrl} target="_blank" rel="noopener noreferrer">
                              Open
                            </a>
                          ) : "—"}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8}>No invite records found.</td>
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
