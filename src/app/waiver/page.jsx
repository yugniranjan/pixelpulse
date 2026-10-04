export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import "../styles/waiver.css";
import WaiverForm from "@/components/WaiverForm";
import { db } from "@/lib/firestore";
import { fetchsheetdataNoCache } from "@/lib/sheets";
import { partyWaiverDocId } from "@/lib/partyWaivers";
import { getPostgresPartyWaiver, hasPostgres } from "@/lib/postgresData";
import { canonicalUrl } from "@/lib/seo";

export const metadata = {
  title: "Waiver | Pixel Pulse Play Vaughan",
  description:
    "Complete your Pixel Pulse Play waiver online before your visit so check-in stays fast and easy.",
  alternates: {
    canonical: canonicalUrl("/waiver"),
  },
  robots: {
    index: false,
    follow: true,
  },
};

function searchValue(searchParams, key) {
  const value = searchParams?.[key];
  return Array.isArray(value) ? value[0] || "" : value || "";
}

async function getPartyWaiverDetails(partyId) {
  if (hasPostgres() && partyId) {
    const partyWaiver = await getPostgresPartyWaiver(partyId);
    if (partyWaiver) return partyWaiver;
  }

  if (!db || !partyId) return null;

  const snapshot = await db.collection("partyWaivers").doc(partyWaiverDocId(partyId)).get();
  return snapshot.exists ? snapshot.data() : null;
}

async function getWaiverContent() {
  try {
    const rows = await fetchsheetdataNoCache("waiver");
    return rows
      .filter((row) => {
        const location = String(row.location ?? "");
        return location.includes("vaughan") || location === "";
      })
      .reduce((content, row) => {
        const key = String(row.key ?? "").trim();
        if (!key) return content;
        return {
          ...content,
          [key]: String(row.value ?? "").trim(),
        };
      }, {});
  } catch (error) {
    console.error("waiver sheet failed:", error);
    return {};
  }
}

export default async function WaiverPage({ searchParams }) {
  const params = await searchParams;
  const partyId = searchValue(params, "partyId");
  const queryVisitDate = searchValue(params, "visitDate") || searchValue(params, "date");
  const queryVisitTime = searchValue(params, "visitTime") || searchValue(params, "time");
  const [partyDetails, waiverContent] = await Promise.all([
    getPartyWaiverDetails(partyId),
    getWaiverContent(),
  ]);
  const primaryParticipant = partyDetails?.primaryParticipant || "";
  const initialVisit = {
    partyId,
    partyName: primaryParticipant || "",
    passType: partyDetails?.passType || (partyId ? "Birthday Party Package" : ""),
    visitDate: partyDetails?.visitDate || queryVisitDate || "",
    visitTime: partyDetails?.visitTime || queryVisitTime || "",
  };
  const initialPrimary = {
    firstName: "",
    lastName: "",
  };

  return (
    <main className="ppp-waiver-page">
      <section className="ppp-waiver-layout">
        <WaiverForm
          initialPrimary={initialPrimary}
          initialVisit={initialVisit}
          waiverContent={waiverContent}
        />
      </section>
    </main>
  );
}
