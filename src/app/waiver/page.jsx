export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import "../styles/waiver.css";
import Link from "next/link";
import SectionHeading from "@/components/home/SectionHeading";

const WAIVER_URL =
  "https://pixelpulseplayzone.lilypadpos.app/public/onlinewaiver/waiver.php";

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

export default function WaiverPage() {
  return (
    <main className="ppp-waiver-page">
      

      <section className="aero-max-container ppp-waiver-layout">
        <div className="ppp-waiver-section-intro">
          <SectionHeading mainHeading={true}>
            Online <span>Waiver</span>
          </SectionHeading>
          <p>
            Use the secure form below to complete your waiver. If the form does not
            load on your device, you can open it in a separate tab.
          </p>
        </div>

        <section className="ppp-waiver-frame-shell">
          <div className="ppp-waiver-frame-toolbar">
            <span className="ppp-waiver-frame-toolbar__status">Secure form</span>
            <Link
              href={WAIVER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="ppp-waiver-frame-toolbar__link"
              prefetch={false}
            >
              Open in New Tab
            </Link>
          </div>

          <div className="ppp-waiver-frame-wrap">
            <iframe
              src={WAIVER_URL}
              title="Pixel Pulse Play Online Waiver"
              className="ppp-waiver-frame"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </section>
      </section>
    </main>
  );
}
