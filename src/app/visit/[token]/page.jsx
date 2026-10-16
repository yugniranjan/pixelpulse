import VisitRecapView from "@/components/VisitRecapView";
import { getVisitRecap } from "@/lib/visitRecaps";
import "../../styles/visit-recap.css";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const metadata = {
  title: "Your Visit Recap | Pixel Pulse",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function VisitRecapPage({ params }) {
  if (process.env.NODE_ENV === "development" && params.token === "preview") {
    const { previewRecap } = await import("@/lib/visitRecapPreview.mjs");
    return <VisitRecapView recap={previewRecap} />;
  }
  const recap = await getVisitRecap(params.token);
  return <VisitRecapView recap={recap} />;
}
