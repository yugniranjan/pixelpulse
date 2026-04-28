export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import "../styles/waiver.css";
import Image from "next/image";
import SectionHeading from "@/components/home/SectionHeading";
import WaiverForm from "@/components/WaiverForm";

export const metadata = {
  title: "Waiver | Pixel Pulse Play Vaughan",
  description:
    "Complete your Pixel Pulse Play waiver online before your visit so check-in stays fast and easy.",
  alternates: {
    canonical: `${process.env.SITE_URL || "https://www.pixelpulseplay.ca"}/waiver`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

function searchValue(searchParams, key) {
  const value = searchParams?.[key];
  return Array.isArray(value) ? value[0] || "" : value || "";
}

export default async function WaiverPage({ searchParams }) {
  const params = await searchParams;
  const initialVisit = {
    partyId: searchValue(params, "partyId"),
    partyName: searchValue(params, "partyName"),
    passType: searchValue(params, "passType") || (searchValue(params, "partyId") ? "Birthday Party Package" : ""),
    visitDate: searchValue(params, "visitDate"),
    visitTime: searchValue(params, "visitTime"),
  };

  return (
    <main className="ppp-waiver-page">
      <section className="aero-max-container ppp-waiver-layout">
        <div className="ppp-waiver-section-intro">
          <Image
            src="/assets/images/logo.png"
            alt="Pixel Pulse Play"
            width={96}
            height={96}
            priority
            className="ppp-waiver-heading-logo"
          />
          <SectionHeading mainHeading={true}>
            Pixel Pulse <span>Waiver</span>
          </SectionHeading>
          <p>
            Add every player before you arrive, including adults and minors. This
            Vaughan waiver experience is designed for Pixel Pulse Play families,
            parties, and groups.
          </p>
        </div>

        <WaiverForm initialVisit={initialVisit} />
      </section>
    </main>
  );
}
