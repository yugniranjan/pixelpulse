import "../styles/how-to-play.css";
import { canonicalUrl } from "@/lib/seo";

const videoUrl = "/assets/videos/pixel-pulse-experience.mp4";

export const metadata = {
  title: "How to Play | Pixel Pulse Play Vaughan",
  description:
    "Watch the Pixel Pulse Play how-to video and learn what to expect before your visit, birthday party, or group challenge in Vaughan.",
  alternates: {
    canonical: canonicalUrl("/how-to-play"),
  },
  openGraph: {
    title: "How to Play | Pixel Pulse Play Vaughan",
    description:
      "Watch the quick Pixel Pulse Play guide before your visit so every player knows how the challenge rooms work.",
    url: canonicalUrl("/how-to-play"),
    type: "website",
  },
  robots: {
    index: true,
  },
};

const steps = [
  {
    title: "Check in",
    body: "Our team welcomes your group, confirms waivers, and gives players the game briefing.",
  },
  {
    title: "Choose rooms",
    body: "Pick from interactive challenge rooms built around speed, reaction, teamwork, and focus.",
  },
  {
    title: "Play the challenge",
    body: "Run, jump, react, solve, and compete while each room tracks the action.",
  },
  {
    title: "Repeat and improve",
    body: "Rotate through more rooms, chase better scores, and keep the friendly competition going.",
  },
];

export default function HowToPlayPage() {
  return (
    <main className="ppp-how-page">
      <section className="ppp-how-hero">
        <div className="ppp-how-shell">
          <div className="ppp-how-copy">
            <span className="ppp-how-kicker">Before you play</span>
            <h1>How to Play at Pixel Pulse</h1>
            <p>
              Watch this quick guide before your visit so everyone knows what to
              expect inside the challenge rooms.
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
            <span>Game flow</span>
            <h2>What happens when you arrive</h2>
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
