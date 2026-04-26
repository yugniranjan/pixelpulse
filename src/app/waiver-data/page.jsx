export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { headers } from "next/headers";
import Link from "next/link";
import "../styles/admin-waivers.css";
import { db } from "@/lib/firestore";

function serializeDate(value) {
  if (!value) return "";
  if (typeof value.toDate === "function") return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function formatDateTime(value) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function participantName(person = {}) {
  return [person.firstName, person.lastName].filter(Boolean).join(" ") || "Unnamed";
}

function isLocalRequest(host = "") {
  return (
    process.env.NODE_ENV !== "production" ||
    host.startsWith("localhost") ||
    host.startsWith("127.0.0.1")
  );
}

async function getWaivers() {
  if (!db) {
    return { waivers: [], error: "Firestore is not configured." };
  }

  try {
    const snapshot = await db
      .collection("waivers")
      .orderBy("submittedAt", "desc")
      .limit(100)
      .get();

    return {
      waivers: snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          submittedAt: serializeDate(data.submittedAt),
          updatedAt: serializeDate(data.updatedAt),
        };
      }),
      error: "",
    };
  } catch (error) {
    return {
      waivers: [],
      error: error?.message || "Unable to load waiver data.",
    };
  }
}

export default async function LocalWaiverDataPage() {
  const host = (await headers()).get("host") || "";

  if (!isLocalRequest(host)) {
    return (
      <main className="waiver-admin-page">
        <div className="waiver-admin-header">
          <div>
            <h1>Waiver Data</h1>
            <p>This local-only viewer is disabled in production.</p>
          </div>
        </div>
      </main>
    );
  }

  const { waivers, error } = await getWaivers();
  const totalParticipants = waivers.reduce(
    (total, waiver) => total + (Number(waiver.participantCount) || 1),
    0,
  );
  const today = new Date().toISOString().split("T")[0];
  const todayWaivers = waivers.filter((waiver) => waiver.visit?.visitDate === today).length;
  const latestWaiver = waivers[0];

  return (
    <main className="waiver-dashboard-shell">
      <aside className="waiver-dashboard-sidebar" aria-label="Dashboard navigation">
        <div className="waiver-dashboard-brand">
          <img src="/assets/images/logo.png" alt="Pixel Pulse Play" />
          <span>Admin</span>
        </div>
        <nav>
          <Link className="is-active" href="/waiver-data">Waiver Data</Link>
          <Link href="/admin/waivers">Admin Waivers</Link>
          <Link href="/admin/invites">Invite Builder</Link>
          <Link href="/admin/blogs">Blogs</Link>
        </nav>
      </aside>

      <section className="waiver-admin-page waiver-admin-page--dashboard">
        <div className="waiver-admin-header waiver-admin-header--dashboard">
          <div>
            <span className="waiver-admin-kicker">Local dashboard</span>
            <h1>Waiver Data</h1>
            <p>Development-only view. No admin login required on localhost.</p>
          </div>
          <div className="waiver-admin-local-pill">Local only</div>
        </div>

        <div className="waiver-admin-stats" aria-label="Waiver summary">
          <article>
            <span>Total Waivers</span>
            <strong>{waivers.length}</strong>
          </article>
          <article>
            <span>Participants</span>
            <strong>{totalParticipants}</strong>
          </article>
          <article>
            <span>Visits Today</span>
            <strong>{todayWaivers}</strong>
          </article>
          <article>
            <span>Latest</span>
            <strong>{latestWaiver ? formatDateTime(latestWaiver.submittedAt) : "None"}</strong>
          </article>
        </div>

        {error ? <p className="waiver-admin-error">{error}</p> : null}

        <div className="waiver-admin-list waiver-admin-list--dashboard">
          <div className="waiver-admin-count">
            Recent Waiver Submissions
            <span>{waivers.length} record{waivers.length === 1 ? "" : "s"}</span>
          </div>

          {waivers.length ? (
            waivers.map((waiver) => {
              const familyMembers = Array.isArray(waiver.familyMembers) ? waiver.familyMembers : [];
              const attractions = Array.isArray(waiver.attractions) ? waiver.attractions : [];

              return (
                <details className="waiver-admin-card" key={waiver.id}>
                  <summary className="waiver-admin-card__summary">
                    <span>
                      <strong>{waiver.primaryName || participantName(waiver.primary)}</strong>
                      <em>{waiver.primary?.email || "No email"}</em>
                    </span>
                    <span>
                      <strong>{waiver.visit?.partyId || "No party ID"}</strong>
                      <em>{waiver.visit?.visitDate || "No visit date"}</em>
                    </span>
                    <span>
                      <strong>{waiver.participantCount || 1}</strong>
                      <em>Participants</em>
                    </span>
                    <span>
                      <strong>{formatDateTime(waiver.submittedAt)}</strong>
                      <em>Submitted</em>
                    </span>
                  </summary>

                  <div className="waiver-admin-card__details">
                    <section>
                      <h2>Primary Participant</h2>
                      <dl>
                        <div><dt>Name</dt><dd>{participantName(waiver.primary)}</dd></div>
                        <div><dt>DOB</dt><dd>{waiver.primary?.dob || "Not provided"}</dd></div>
                        <div><dt>Gender</dt><dd>{waiver.primary?.gender || "Not provided"}</dd></div>
                        <div><dt>Email</dt><dd>{waiver.primary?.email || "Not provided"}</dd></div>
                        <div><dt>Phone</dt><dd>{waiver.primary?.phone || "Not provided"}</dd></div>
                        <div><dt>City</dt><dd>{waiver.primary?.city || "Not provided"}</dd></div>
                        <div><dt>Medical notes</dt><dd>{waiver.primary?.medicalNotes || "None"}</dd></div>
                      </dl>
                    </section>

                    <section>
                      <h2>Visit</h2>
                      <dl>
                        <div><dt>Pass</dt><dd>{waiver.visit?.passType || "Not provided"}</dd></div>
                        <div><dt>Party ID</dt><dd>{waiver.visit?.partyId || "Not provided"}</dd></div>
                        <div><dt>Visit date</dt><dd>{waiver.visit?.visitDate || "Not provided"}</dd></div>
                        <div><dt>Emergency contact</dt><dd>{waiver.visit?.emergencyName || "Not provided"}</dd></div>
                        <div><dt>Relationship</dt><dd>{waiver.visit?.emergencyRelation || "Not provided"}</dd></div>
                        <div><dt>Emergency phone</dt><dd>{waiver.visit?.emergencyPhone || "Not provided"}</dd></div>
                        <div><dt>Printed name</dt><dd>{waiver.visit?.printName || "Not provided"}</dd></div>
                        <div><dt>Signed date</dt><dd>{waiver.visit?.signDate || "Not provided"}</dd></div>
                      </dl>
                    </section>

                    <section className="waiver-admin-card__wide">
                      <h2>Family Members</h2>
                      {familyMembers.length ? (
                        <div className="waiver-admin-members">
                          {familyMembers.map((member, index) => (
                            <div key={`${member.firstName}-${member.lastName}-${index}`}>
                              <strong>{participantName(member)}</strong>
                              <span>{member.type === "minor" ? "Minor under 18" : "Adult 18+"}</span>
                              <span>DOB: {member.dob || "Not provided"}</span>
                              <span>Gender: {member.gender || "Not provided"}</span>
                              {member.email ? <span>Email: {member.email}</span> : null}
                              <span>Medical: {member.medicalNotes || "None"}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p>No additional family members.</p>
                      )}
                    </section>

                    <section className="waiver-admin-card__wide">
                      <h2>Attractions</h2>
                      <div className="waiver-admin-pills">
                        {attractions.length ? (
                          attractions.map((attraction) => <span key={attraction}>{attraction}</span>)
                        ) : (
                          <span>None selected</span>
                        )}
                      </div>
                    </section>

                    <section className="waiver-admin-card__wide">
                      <h2>Signature</h2>
                      {waiver.signatureDataUrl ? (
                        <img
                          className="waiver-admin-signature"
                          src={waiver.signatureDataUrl}
                          alt={`Signature for ${waiver.primaryName || "waiver"}`}
                        />
                      ) : (
                        <p>No signature image saved.</p>
                      )}
                    </section>
                  </div>
                </details>
              );
            })
          ) : (
            <p className="waiver-admin-state">No waivers found.</p>
          )}
        </div>
      </section>
    </main>
  );
}
