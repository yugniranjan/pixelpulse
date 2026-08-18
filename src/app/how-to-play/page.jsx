import "../styles/how-to-play.css";
import { DEFAULT_SEO_IMAGE, canonicalUrl } from "@/lib/seo";

const videoUrl = "/assets/videos/pixel-pulse-experience.mp4";
const pageUrl = canonicalUrl("/how-to-play");
const videoContentUrl = canonicalUrl(videoUrl);

export const metadata = {
  title: "How to Play | Pixel Pulse Play Vaughan",
  description:
    "Watch the Pixel Pulse Play how-to video and learn what to expect before your visit, birthday party, or group challenge in Vaughan.",
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: "How to Play | Pixel Pulse Play Vaughan",
    description:
      "Watch the quick Pixel Pulse Play guide before your visit so every player knows how the challenge rooms work.",
    url: pageUrl,
    type: "website",
  },
  robots: {
    index: true,
  },
};

const videoJsonLd = {
  "@context": "https://schema.org",
  "@type": "VideoObject",
  name: "How to Play at Pixel Pulse Play",
  description:
    "Watch how Pixel Pulse Play wristbands, challenge rooms, scoring, and gameplay work before your Vaughan visit.",
  thumbnailUrl: [DEFAULT_SEO_IMAGE],
  uploadDate: "2026-08-01T09:00:00-04:00",
  contentUrl: videoContentUrl,
  embedUrl: pageUrl,
  publisher: {
    "@type": "Organization",
    name: "Pixel Pulse Play",
    url: canonicalUrl(),
    logo: {
      "@type": "ImageObject",
      url: DEFAULT_SEO_IMAGE,
    },
  },
};

const steps = [
  {
    title: "Check In & Get Your Wristband",
    body: "Complete your waiver, collect your Pixel Pulse wristband, and get a quick game briefing from our team. Your wristband unlocks every challenge and tracks your scores automatically.",
  },
  {
    title: "Choose a Room & Game Variant",
    body: "Explore 13 immersive challenge rooms. Each room features multiple game variants and difficulty levels, so every visit can be a new experience. Simply tap your wristband to start.",
  },
  {
    title: "Play, Score & Compete",
    body: "Run, jump, react, solve, and work together as every game tracks your points in real time. Replay your favourite rooms or try a different game variant to improve your score.",
  },
  {
    title: "Check Your Results & Check Out",
    body: "See your final score and leaderboard ranking, celebrate your achievements, and don't forget to return your wristband before you leave. We'll be ready for your next challenge!",
  },
];

export default function HowToPlayPage() {
  return (
    <main className="ppp-how-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoJsonLd) }}
      />
      <section className="ppp-how-hero">
        <div className="ppp-how-shell">
          <div className="ppp-how-copy">
            <span className="ppp-how-kicker">Ready to Play?</span>
            <h1>It&apos;s as easy as <strong>Tap. Play. Repeat.</strong></h1>
            <p>
              Whether you&apos;re visiting with family, friends, or teammates, every
              challenge room offers multiple games, different difficulty levels,
              and endless replayability.
            </p>
            <p>
              Watch the video to see how your Pixel Pulse adventure begins.
            </p>
          </div>

          <div className="ppp-how-video" aria-label="Pixel Pulse how to play video">
            <video controls preload="metadata" playsInline>
              <source src={videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </section>

      <section className="ppp-how-section">
        <div className="ppp-how-shell">
          <div className="ppp-how-section-head">
            <h2>What Happens When You Arrive</h2>
          </div>

          <div className="ppp-how-steps">
            {steps.map((step, index) => (
              <article key={step.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
