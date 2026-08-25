import Image from "next/image";
import { FaRocket } from "react-icons/fa6";
import "../styles/levelingup.css";

const logo = "/assets/images/logoD.png";
const roomImage = "/assets/images/floorchallenge.webp";

export const metadata = {
  title: "Leveling Up | Pixel Pulse Play",
  description:
    "This Pixel Pulse Play challenge is getting a quick upgrade. Keep the action going by exploring another challenge room.",
};

export default function LevelingUpPage() {
  return (
    <main className="ppp-leveling-page">
      <section className="ppp-leveling-hero" aria-labelledby="leveling-title">
        <div className="ppp-leveling-backdrop" aria-hidden="true">
          <Image src={roomImage} alt="" fill priority sizes="100vw" />
        </div>

        <a className="ppp-leveling-logo" href="/" aria-label="Pixel Pulse Play home">
          <Image src={logo} alt="Pixel Pulse Play" width={178} height={80} priority />
        </a>

        <div className="ppp-leveling-card">
          <div className="ppp-leveling-play-icon" aria-hidden="true">
            <FaRocket />
          </div>

          <p className="ppp-leveling-eyebrow">
            <span aria-hidden="true" />
            Level-Up In Progress
          </p>

          <h1 className="ppp-leveling-title" id="leveling-title">
            We&apos;re upgrading this game<span>!</span>
          </h1>

          <p className="ppp-leveling-lede ppp-leveling-lede--strong">
            Your next challenge awaits &rarr;
          </p>
          <p className="ppp-leveling-lede">
            Try another room &amp; keep climbing the leaderboard.
          </p>

          <div className="ppp-leveling-progress" aria-label="Upgrade progress">
            <div className="ppp-leveling-progress__labels">
              <span>Maintenance Status</span>
              <strong>92%</strong>
            </div>
            <div className="ppp-leveling-progress__track">
              <span />
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
