import "../styles/feedback.css";
import FeedbackForm from "@/components/FeedbackForm";
import { canonicalUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Help Us Level Up! | Pixel Pulse Play Vaughan",
  description: "Share quick feedback after your Pixel Pulse Play visit.",
  alternates: {
    canonical: canonicalUrl("/feedback"),
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

export default async function FeedbackPage({ searchParams }) {
  const params = await searchParams;
  const initial = {
    name: searchValue(params, "name"),
    email: searchValue(params, "email"),
    phone: searchValue(params, "phone"),
    visitDate: searchValue(params, "visitDate") || searchValue(params, "date"),
    partyId: searchValue(params, "partyId"),
  };

  return (
    <main className="ppp-feedback-page">
      <FeedbackForm initial={initial} />
    </main>
  );
}
