import Link from "next/link";
import { canonicalUrl } from "@/lib/seo";
import { SITE_VIDEOS, videoStructuredData } from "@/lib/videoSeo.mjs";
import "../../styles/how-to-play.css";

const video = SITE_VIDEOS.partyRoom;
const pageUrl = canonicalUrl(video.watchPath);

export const metadata = {
  title: "Birthday Party Room Video Tour | Pixel Pulse Play Vaughan",
  description: video.description,
  alternates: { canonical: pageUrl },
  openGraph: { title: video.name, description: video.description, url: pageUrl, images: [canonicalUrl(video.thumbnailPath)] },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large" } },
};

export default function BirthdayPartyRoomVideoPage() {
  return (
    <main className="ppp-how-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(videoStructuredData(video, canonicalUrl())) }} />
      <section className="ppp-how-hero">
        <div className="ppp-how-shell">
          <div className="ppp-how-copy">
            <span className="ppp-how-kicker">Party room video tour</span>
            <h1>Your Party. <strong>Your Room.</strong></h1>
            <p>{video.description}</p>
          </div>
          <div className="ppp-how-video">
            <video controls muted playsInline preload="metadata" poster={video.thumbnailPath} width="960" height="540" aria-label={video.name}>
              <source src={video.contentPath} type="video/mp4" />
              <a href={video.contentPath}>Watch the birthday party room tour</a>
            </video>
          </div>
          <p><Link href="/kids-birthday-parties">Explore birthday packages</Link> · <a href="https://birthdays.pixelpulseplay.ca/">Request your party</a> · <Link href="/">Pixel Pulse Play home</Link></p>
        </div>
      </section>
    </main>
  );
}
