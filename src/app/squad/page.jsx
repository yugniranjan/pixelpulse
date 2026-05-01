import Image from "next/image";
import Link from "next/link";
import "../styles/squad.css";
import SquadSignupForm from "@/components/SquadSignupForm";

const siteUrl = process.env.SITE_URL || "https://www.pixelpulseplay.ca";

export const metadata = {
  title: "Pixel Pulse Squad | Bring Friends, Play, Earn Rewards",
  description:
    "Join the Pixel Pulse Squad in Vaughan. Bring friends, play arcade challenges, earn rewards, and compete on leaderboards in a safe supervised program for ages 11-17.",
  alternates: {
    canonical: `${siteUrl}/squad`,
  },
  openGraph: {
    title: "Pixel Pulse Squad",
    description: "Bring your friends. Play. Earn rewards at Pixel Pulse Playzone Vaughan.",
    url: `${siteUrl}/squad`,
    images: [
      {
        url: `${siteUrl}/assets/images/arcade.JPG`,
        width: 1200,
        height: 630,
        alt: "Pixel Pulse arcade games",
      },
    ],
    type: "website",
  },
};

const rewardTiers = [
  { count: "5 friends", reward: "Arcade credits" },
  { count: "10 friends", reward: "Free 60-minute play pass" },
  { count: "20 friends", reward: "VIP access" },
];

const terms = [
  "Squad members are encouraged to participate regularly in arcade events, challenges, tournaments, and community activities to maintain active membership.",
  "Members must follow all game rules and practice fair play. Exploits, unauthorized hacks, or unsportsmanlike conduct are prohibited.",
  "Squad benefits, rewards, and promotions are subject to availability and may be modified or discontinued by Pixel Pulse Arcade at any time.",
];

export default function SquadLandingPage() {
  return (
    <main className="ppp-squad-page">
      <section className="ppp-squad-hero" aria-labelledby="squad-title">
        <div className="ppp-squad-light ppp-squad-light--left" aria-hidden="true" />
        <div className="ppp-squad-light ppp-squad-light--right" aria-hidden="true" />
        <div className="ppp-squad-shell ppp-squad-hero__inner">
          <div className="ppp-squad-brand-row">
            <Image
              src="/assets/images/logoD.png"
              alt="Pixel Pulse Play n Party"
              width={270}
              height={106}
              priority
              className="ppp-squad-main-logo"
            />
            <div className="ppp-squad-emblem" aria-label="Pixel Pulse Squad">
              <span>Pixel</span>
              <strong>Pulse</strong>
              <small>Squad</small>
            </div>
          </div>

          <div className="ppp-squad-hero__copy">
            <p className="ppp-squad-kicker">Ages 11-17 | Safe and supervised</p>
            <h1 id="squad-title">Join the Pixel Pulse Squad Today!</h1>
            <p>Bring your friends. Play. Earn rewards.</p>
          </div>

          <div className="ppp-squad-hero__grid">
            <div className="ppp-squad-hero__content">
              <div className="ppp-squad-stage">
                <div className="ppp-squad-frame">
                  <Image
                    src="/assets/images/floorchallenge.jpg"
                    alt="Players inside the Pixel Pulse floor challenge room"
                    width={980}
                    height={620}
                    priority
                  />
                </div>
              </div>
            </div>

            <SquadSignupForm />
          </div>
        </div>
      </section>

      <section className="ppp-squad-info">
        <div className="ppp-squad-shell ppp-squad-info__grid">
          <article>
            <h2>What you do?</h2>
            <ul>
              <li>Bring your friends</li>
              <li>Earn free game passes and arcade credits</li>
              <li>Compete on leaderboards</li>
            </ul>
          </article>

          <article>
            <h2>What you get?</h2>
            <div className="ppp-squad-rewards">
              {rewardTiers.map((tier) => (
                <div key={tier.count}>
                  <strong>{tier.count}</strong>
                  <span>{tier.reward}</span>
                </div>
              ))}
            </div>
          </article>

          <article>
            <p className="ppp-squad-kicker">Parent-friendly</p>
            <h2>Built for players.</h2>
            <ul>
              <li>Ages 11-17</li>
              <li>Safe and supervised</li>
              <li>No cost, no obligation</li>
              <li>Reward-based, no cash payouts</li>
            </ul>
          </article>
        </div>
      </section>

      <section className="ppp-squad-parent">
        <div className="ppp-squad-shell ppp-squad-parent__grid">
          <div className="ppp-squad-booking-panel">
            <Image
              src="/assets/images/logo.png"
              alt="Pixel Pulse Play"
              width={120}
              height={120}
            />
            <p>Pixel Pulse Playzone - Vaughan</p>
            <h3>Ask your parent to sign up today.</h3>
            <Link href="#squad-signup">Book Today</Link>
          </div>
        </div>
      </section>

      <section className="ppp-squad-signup-section">
        <div className="ppp-squad-shell ppp-squad-signup__grid">
          <div className="ppp-squad-contact-card">
            <span>www.pixelpulseplay.ca</span>
            <strong>905-760-2922</strong>
            <span>connect@pixelpulsplay.ca</span>
            <p>960 Edgeley Blvd, Vaughan Mills</p>
          </div>
        </div>
      </section>

      <section className="ppp-squad-terms">
        <div className="ppp-squad-shell">
          <h2>Terms and Conditions</h2>
          <ol>
            {terms.map((term) => (
              <li key={term}>{term}</li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  );
}
