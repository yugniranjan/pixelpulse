export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { headers } from "next/headers";
import Link from "next/link";
import "../styles/admin-waivers.css";
import { db } from "@/lib/firestore";
import LocalWaiverDashboard from "@/components/LocalWaiverDashboard";

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

        {waivers.length ? (
          <LocalWaiverDashboard waivers={waivers} />
        ) : (
          <p className="waiver-admin-state">No waivers found.</p>
        )}
      </section>
    </main>
  );
}
