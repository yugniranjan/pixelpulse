import PartyDashboardClient from "@/components/PartyDashboardClient";
import { canonicalUrl } from "@/lib/seo";
import "../styles/party-dashboard.css";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata = {
  title: "Party Waiver Dashboard | Pixel Pulse Play Vaughan",
  description:
    "Party hosts can check how many waiver forms have been completed for their Pixel Pulse Play party.",
  alternates: {
    canonical: canonicalUrl("/party-dashboard"),
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function PartyDashboardPage() {
  return (
    <main className="ppp-party-dashboard-page">
      <PartyDashboardClient />
    </main>
  );
}
