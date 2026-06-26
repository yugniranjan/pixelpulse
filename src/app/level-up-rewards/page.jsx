import Image from "next/image";
import {
  FaArrowRight,
  FaBottleWater,
  FaCakeCandles,
  FaCircleCheck,
  FaGift,
  FaMedal,
  FaShirt,
  FaTicket,
  FaWallet,
} from "react-icons/fa6";
import RewardLookupForm from "@/components/RewardLookupForm";
import { lookupRewardPlayers } from "@/lib/rewardLookup";
import "../styles/level-up-rewards.css";

const logo = "/assets/images/logoD.png";
const arcadeImage = "/assets/images/arcade.webp";
const floorImage = "/assets/images/floorchallenge.webp";
const shootingImage = "/assets/images/shootinggame.webp";
const rewardsSiteUrl = "https://rewards.pixelpulseplay.ca";

const rewardLadder = [
  {
    level: "Level 1",
    threshold: "3 x average visit points",
    reward: "Starter reward",
    detail: "Small store credit or starter merch, designed to feel reachable after roughly three normal visits.",
    icon: FaGift,
  },
  {
    level: "Level 2",
    threshold: "5 x average visit points",
    reward: "Merch item",
    detail: "Keychain, wristband charm, or branded accessory for early momentum.",
    icon: FaMedal,
  },
  {
    level: "Level 3",
    threshold: "8 x average visit points",
    reward: "60-minute visit pass",
    detail: "A meaningful return-visit reward for players who keep coming back.",
    icon: FaTicket,
  },
  {
    level: "Level 4",
    threshold: "12 x average visit points",
    reward: "Pixel Pulse water bottle",
    detail: "Useful branded merch that feels like a premium step up.",
    icon: FaBottleWater,
  },
  {
    level: "Level 5",
    threshold: "18 x average visit points",
    reward: "Store credit",
    detail: "A controlled credit reward for snacks, merch, or approved add-ons.",
    icon: FaWallet,
  },
  {
    level: "Level 6",
    threshold: "25 x average visit points",
    reward: "80-minute visit pass",
    detail: "Higher-value play time for loyal repeat players.",
    icon: FaTicket,
  },
  {
    level: "Level 7",
    threshold: "35 x average visit points",
    reward: "Premium merchandise",
    detail: "Hat, shirt, or tote bag that creates a visible brand moment in the facility.",
    icon: FaShirt,
  },
  {
    level: "Level 8",
    threshold: "50 x average visit points",
    reward: "VIP rewards bundle",
    detail: "Merch bundle plus store credit or bonus play, with staff approval when needed.",
    icon: FaGift,
  },
  {
    level: "Level 9",
    threshold: "75 x average visit points",
    reward: "Birthday party reward",
    detail: "Top-tier loyalty reward with clear booking rules, blackout dates, and advance notice.",
    icon: FaCakeCandles,
  },
];

const appHighlights = [
  {
    title: "Points dashboard",
    text: "Guests see total points, current level, and progress to the next reward the moment they open the app.",
  },
  {
    title: "Reward wallet",
    text: "Available, redeemed, and upcoming rewards stay organized in one simple guest-facing view.",
  },
  {
    title: "Next reward card",
    text: "A bold card shows exactly what the player is working toward and how close they are.",
  },
  {
    title: "Staff-assisted redemption",
    text: "At launch, front desk staff can confirm and redeem rewards so operations stay controlled.",
  },
];

const heroStats = [
  { label: "Scoreboard sync", value: "Live" },
  { label: "Reward ladder", value: "9 levels" },
  { label: "Guest lookup", value: "Name, email, phone" },
];

const heroRewardFlow = [
  { label: "Points", value: "+850" },
  { label: "Level 3", value: "Pass" },
  { label: "Level 5", value: "Credit" },
  { label: "Level 9", value: "Party" },
];

const rules = [
  "Rewards unlock from lifetime points, so redeeming does not erase level status.",
  "Every reward should show expiry, valid-for language, and simple redemption instructions.",
  "Store credit is not cash and applies only to approved categories.",
  "Play passes should state duration, player limits, and same-day or future-valid rules.",
];

const calibrationRows = [
  {
    label: "A",
    value: "Average points earned by one normal guest in a 60-minute visit.",
  },
  {
    label: "Level 1 threshold",
    value: "Set at 3 x A so the first reward feels reachable without being instant.",
  },
  {
    label: "Data to exclude",
    value: "Test players, staff runs, broken sessions, duplicate score events, and tournament outliers.",
  },
  {
    label: "Review cadence",
    value: "Recalculate monthly until the program stabilizes, then review quarterly.",
  },
];

export const metadata = {
  title: "Level Up Rewards | Pixel Pulse Play",
  description:
    "Explore Pixel Pulse Level Up Rewards: earn points when you play, level up, and unlock play passes, merchandise, store credit, VIP bundles, and birthday party rewards.",
  alternates: {
    canonical: rewardsSiteUrl,
  },
  openGraph: {
    title: "Level Up Rewards | Pixel Pulse Play",
    description:
      "Earn points, level up, and unlock Pixel Pulse rewards across play passes, merchandise, store credit, and premium experiences.",
    url: rewardsSiteUrl,
    images: [`${rewardsSiteUrl}${arcadeImage}`],
  },
};

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function LevelUpRewardsPage({ searchParams = {} }) {
  const initialIdentifier = String(searchParams.lookup || "").trim();
  const initialSelectedPlayerId = /^\d+$/.test(String(searchParams.player || ""))
    ? Number(searchParams.player)
    : null;
  const initialActiveTab = ["status", "wallet", "rules"].includes(searchParams.view)
    ? searchParams.view
    : "status";
  let initialPlayers = [];
  let initialError = "";

  if (initialIdentifier) {
    try {
      initialPlayers = await lookupRewardPlayers(initialIdentifier);
    } catch (error) {
      initialError = error.message || "Unable to find rewards.";
    }
  }

  return (
    <main className="ppp-level-page">
      <nav className="ppp-level-nav" aria-label="Level Up Rewards navigation">
        <a className="ppp-level-logo" href="#top" aria-label="Pixel Pulse Play Level Up Rewards">
          <Image src={logo} alt="Pixel Pulse Play" width={174} height={78} priority />
        </a>
        <div className="ppp-level-nav__links">
          <a href="#top">Dashboard</a>
          <a href="#ladder">Rewards</a>
          <a href="#calibration">Calibration</a>
          <a href="#rules">Rules</a>
        </div>
      </nav>

      <section className="ppp-level-hero" id="top">
        <div className="ppp-level-hero__image" aria-hidden="true">
          <Image src={arcadeImage} alt="" fill priority sizes="100vw" />
        </div>
        <div className="ppp-level-reward-motion" aria-hidden="true">
          <div className="ppp-level-reward-track">
            {Array.from({ length: 9 }, (_, index) => (
              <span key={index}>L{index + 1}</span>
            ))}
          </div>
          <div className="ppp-level-reward-pulse ppp-level-reward-pulse--one">Score saved</div>
          <div className="ppp-level-reward-pulse ppp-level-reward-pulse--two">Reward unlocked</div>
          <div className="ppp-level-reward-flow">
            {heroRewardFlow.map((item) => (
              <div key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>
        <div className="ppp-level-hero__content">
          <span className="ppp-level-kicker">Level Up Rewards App</span>
          <h1>
            Your Pixel Pulse <span>Rewards.</span>
          </h1>
          <p>
            Search your profile, check lifetime points, track your level progress, and see unlocked
            rewards from one web app built around the Pixel Pulse scoreboard.
          </p>
          <div className="ppp-level-overview" aria-label="Example level progress">
            <div className="ppp-level-ring" aria-hidden="true">
              <svg width="76" height="76" viewBox="0 0 76 76">
                <circle cx="38" cy="38" r="31" fill="none" stroke="rgba(248,251,243,0.1)" strokeWidth="5" />
                <circle
                  cx="38"
                  cy="38"
                  r="31"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeDasharray="178 194"
                  strokeDashoffset="-14"
                  strokeLinecap="round"
                />
                <text x="38" y="35" textAnchor="middle" dominantBaseline="middle">9</text>
                <text className="ppp-level-ring__label" x="38" y="52" textAnchor="middle">LEVEL</text>
              </svg>
            </div>
            <div>
              <strong>Level 9 status</strong>
              <span>Top level reached</span>
              <small>Next: VIP status</small>
            </div>
          </div>
          <div className="ppp-level-score-preview">
            <span>Lifetime points</span>
            <strong>83,736</strong>
            <small>Sample player dashboard</small>
          </div>
          <div className="ppp-level-command-strip" aria-label="Rewards app highlights">
            {heroStats.map((item) => (
              <div key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
          <div className="ppp-level-actions">
            <a className="ppp-level-button ppp-level-button--primary" href="#ladder">
              See rewards <FaArrowRight aria-hidden="true" />
            </a>
            <a className="ppp-level-button ppp-level-button--secondary" href="#app">
              How it works
            </a>
          </div>
        </div>
        <div className="ppp-level-hero__side">
          <RewardLookupForm
            initialIdentifier={initialIdentifier}
            initialPlayers={initialPlayers}
            initialError={initialError}
            initiallySearched={Boolean(initialIdentifier)}
            initialSelectedPlayerId={initialSelectedPlayerId}
            initialActiveTab={initialActiveTab}
          />
        </div>
      </section>

      <section className="ppp-level-section ppp-level-how" id="app">
        <div className="ppp-level-inner ppp-level-how__grid">
          <div className="ppp-level-section__intro">
            <span>Rewards App</span>
            <h2>A lightweight rewards passport for every player.</h2>
            <p>
              The first screen stays focused on three things: current points, current level, and the
              next reward. Families should know in seconds why the next visit matters.
            </p>
          </div>
          <div className="ppp-level-app-card" aria-label="Sample rewards app dashboard">
            <div className="ppp-level-app-card__screen">
              <div>
                <span>Pixel Pulse Points</span>
                <strong>8,420</strong>
              </div>
              <div className="ppp-level-app-card__progress">
                <span style={{ width: "68%" }} />
              </div>
              <p>1,580 points to Level 4</p>
            </div>
            <div className="ppp-level-app-card__reward">
              <FaBottleWater aria-hidden="true" />
              <div>
                <strong>Next reward</strong>
                <span>Pixel Pulse water bottle</span>
              </div>
            </div>
          </div>
        </div>
        <div className="ppp-level-inner ppp-level-highlight-grid">
          {appHighlights.map((item) => (
            <article className="ppp-level-highlight" key={item.title}>
              <FaCircleCheck aria-hidden="true" />
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="ppp-level-section ppp-level-calibration" id="calibration">
        <div className="ppp-level-inner ppp-level-calibration__grid">
          <div className="ppp-level-section__intro">
            <span>Reward Calibration Principle</span>
            <h2>Ground the ladder in real visit behavior.</h2>
            <p>
              Rewards should feel exciting without becoming arbitrary. The ladder starts with the
              actual average points earned by a normal guest in a standard 60-minute visit.
            </p>
          </div>
          <div className="ppp-level-calibration__table" role="table" aria-label="Reward calibration principle">
            {calibrationRows.map((row) => (
              <div role="row" key={row.label}>
                <strong role="cell">{row.label}</strong>
                <span role="cell">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="ppp-level-visual-band" aria-label="Pixel Pulse play experiences">
        <Image src={floorImage} alt="Interactive floor challenge at Pixel Pulse Play" width={520} height={360} />
        <Image src={shootingImage} alt="Target game at Pixel Pulse Play" width={520} height={360} />
        <div>
          <span>Every score counts</span>
          <strong>Rewards are calibrated from real 60-minute visit behavior.</strong>
          <p>
            Final point numbers should be clean and easy to display, but the ladder starts from the
            real average points a normal guest earns in a standard visit.
          </p>
        </div>
      </section>

      <section className="ppp-level-section" id="ladder">
        <div className="ppp-level-inner">
          <div className="ppp-level-section__header">
            <span>Reward Ladder</span>
            <h2>From first win to birthday party reward.</h2>
            <p>
              Thresholds are shown as calibration units until Pixel Pulse calculates the final public
              point numbers from recent visit data.
            </p>
          </div>
          <div className="ppp-level-ladder">
            {rewardLadder.map((item) => {
              const Icon = item.icon;
              return (
                <article className="ppp-level-tier" key={item.level}>
                  <div className="ppp-level-tier__icon">
                    <Icon aria-hidden="true" />
                  </div>
                  <div>
                    <span>{item.level}</span>
                    <h3>{item.reward}</h3>
                    <small>{item.threshold}</small>
                    <p>{item.detail}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="ppp-level-section ppp-level-rules" id="rules">
        <div className="ppp-level-inner ppp-level-rules__grid">
          <div className="ppp-level-section__intro">
            <span>Simple Rules</span>
            <h2>Clear enough for guests. Controlled enough for staff.</h2>
            <p>
              The program should feel generous and exciting while keeping redemption rules visible,
              consistent, and easy for the front desk to confirm.
            </p>
          </div>
          <div className="ppp-level-rules__list">
            {rules.map((rule) => (
              <p key={rule}>
                <FaCircleCheck aria-hidden="true" />
                {rule}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="ppp-level-cta" id="join">
        <div>
          <span>Ready to level up?</span>
          <h2>Ask staff about Level Up Rewards on your next visit.</h2>
          <p>
            Create one consistent player profile, keep earning with every session, and watch your
            next reward move closer each time you play.
          </p>
          <a className="ppp-level-button ppp-level-button--primary" href="/contactus">
            Contact Pixel Pulse <FaArrowRight aria-hidden="true" />
          </a>
        </div>
      </section>

      <footer className="ppp-level-footer">
        <Image src={logo} alt="Pixel Pulse Play" width={138} height={62} />
        <nav aria-label="Level Up Rewards footer links">
          <a href="/pricing-promos">Pricing</a>
          <a href="/kids-birthday-parties">Birthday Parties</a>
          <a href="/contactus">Contact</a>
        </nav>
        <p>© 2026 Pixel Pulse Play. All rights reserved.</p>
      </footer>
    </main>
  );
}
