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
    threshold: "5,000 PulsePoints",
    reward: "10 Arcade Credits",
    detail: "Immediate gratification that gives kids a reason to come back quickly.",
    icon: FaGift,
  },
  {
    level: "Level 2",
    threshold: "12,000 PulsePoints",
    reward: "20 Arcade Credits",
    detail: "A quick second-visit reward that keeps early momentum high.",
    icon: FaMedal,
  },
  {
    level: "Level 3",
    threshold: "20,000 PulsePoints",
    reward: "Free Slushie or Snack",
    detail: "A low-cost treat with strong kid appeal.",
    icon: FaBottleWater,
  },
  {
    level: "Level 4",
    threshold: "35,000 PulsePoints",
    reward: "30 Bonus Minutes",
    detail: "Weekday-only bonus time that drives repeat traffic.",
    icon: FaTicket,
  },
  {
    level: "Level 5",
    threshold: "50,000 PulsePoints",
    reward: "FREE VR Game 30 mins",
    detail: "A high perceived-value reward that feels like a real milestone.",
    icon: FaWallet,
  },
  {
    level: "Level 6",
    threshold: "70,000 PulsePoints",
    reward: "Friend Pass",
    detail: "Bring a friend for 30 minutes and turn loyalty into customer acquisition.",
    icon: FaGift,
  },
  {
    level: "Level 7",
    threshold: "90,000 PulsePoints",
    reward: "Free Upgrade to 90-Min Pass",
    detail: "Encourages upselling into longer sessions.",
    icon: FaShirt,
  },
  {
    level: "Level 8",
    threshold: "120,000 PulsePoints",
    reward: "FREE 60-Minute Pass",
    detail: "A major milestone for loyal repeat players.",
    icon: FaTicket,
  },
  {
    level: "Level 9",
    threshold: "160,000 PulsePoints",
    reward: "FREE 90-Minute Pass",
    detail: "Highly desirable free play that keeps families aiming higher.",
    icon: FaTicket,
  },
  {
    level: "Level 10",
    threshold: "250,000 PulsePoints",
    reward: "Pixel Pulse VIP Member",
    detail: "Aspirational status for the most loyal players.",
    icon: FaCakeCandles,
  },
];

const earningWays = [
  { label: "$1 spent", value: "100 PulsePoints" },
  { label: "Game challenge", value: "Bonus Points" },
  { label: "Birthday booking", value: "5,000 bonus points" },
  { label: "Bring a friend", value: "2,500 bonus points" },
  { label: "Weekday visits", value: "Double Points" },
];

const vipBenefits = [
  "Skip-the-line check-in",
  "10% off food and beverages",
  "2x points on weekdays",
  "Birthday bonus of 10,000 points",
  "Exclusive event invitations",
  "One free guest pass every quarter",
];

const prizeWheelRewards = [
  "10 Arcade Credits",
  "Slushie",
  "Candy",
  "Extra 15 Minutes",
  "Free Upgrade",
  "Double Points Next Visit",
  "Mystery Prize",
];

const streakRewards = [
  { visits: "2 visits in a month", reward: "1,500 Bonus Points" },
  { visits: "3 visits in a month", reward: "3,000 Bonus Points" },
  { visits: "5 visits in a month", reward: "FREE 30 Minutes" },
  { visits: "8 visits in a month", reward: "FREE 60-Minute Pass" },
];

const howSteps = [
  {
    number: "01",
    title: "Book or play",
    text: "Explorer, All-Access, Booster, parties, and add-ons all feed the same player profile.",
    accent: "$1 spent = 100 PulsePoints",
  },
  {
    number: "02",
    title: "Stack bonuses",
    text: "Challenges, friends, birthdays, and weekday visits help players climb faster.",
    accent: "Mon-Thu visits earn double",
  },
  {
    number: "03",
    title: "Unlock rewards",
    text: "Every level opens a reward, then adds a surprise prize-wheel moment at the counter.",
    accent: "Free play, upgrades, VIP status",
  },
];

const annualStatus = [
  {
    tier: "Bronze",
    range: "0-100k points",
    perks: ["Start earning toward major rewards"],
  },
  {
    tier: "Silver",
    range: "100k-250k points",
    perks: ["10% bonus points"],
  },
  {
    tier: "Gold",
    range: "250k+ points",
    perks: ["Double points weekdays", "Exclusive events", "Birthday free pass"],
  },
];

const heroStats = [
  { label: "Earn rate", value: "$1 = 100 pts" },
  { label: "Reward ladder", value: "10 levels" },
  { label: "Weekdays", value: "Double points" },
];

export const metadata = {
  title: "Level Up Rewards | Pixel Pulse Play",
  description:
    "Explore Pixel Pulse PulsePoints Rewards: play more, earn more, level up, and unlock arcade credits, snacks, bonus minutes, free play, and VIP status.",
  alternates: {
    canonical: rewardsSiteUrl,
  },
  openGraph: {
    title: "Level Up Rewards | Pixel Pulse Play",
    description:
      "Play More. Earn More. Level Up. Unlock arcade credits, snacks, bonus minutes, free play, and VIP status with Pixel Pulse PulsePoints.",
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
          <a href="#earn">Earn</a>
          <a href="#ladder">Rewards</a>
          <a href="#streaks">Streak</a>
          <a href="#vip">VIP</a>
        </div>
      </nav>

      <section className="ppp-level-hero" id="top">
        <div className="ppp-level-hero__image" aria-hidden="true">
          <Image src={floorImage} alt="" fill priority sizes="100vw" />
        </div>
        <div className="ppp-level-hero__stage" aria-hidden="true" />
        <div className="ppp-level-hero__content">
          <span className="ppp-level-kicker">Level Up Rewards App</span>
          <h1>
            Register for Pixel Pulse <span>Rewards.</span>
          </h1>
          <p>
            Join Level Up Rewards with your name, email, age, and optional phone number. Already
            registered? Enter your email or phone to open your Level Up dashboard.
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
              <strong>Level 10 status</strong>
              <span>Top level reached</span>
              <small>Pixel Pulse VIP</small>
            </div>
          </div>
          <div className="ppp-level-score-preview">
            <span>Lifetime points</span>
            <strong>250,000</strong>
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
              How rewards work
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
            <span>How it works</span>
            <h2>PulsePoints turns every visit into progress.</h2>
            <p>
              The program gives kids quick wins, encourages longer sessions, and creates an
              aspirational VIP tier families can work toward all year.
            </p>
          </div>
          <div className="ppp-level-app-card" aria-label="Sample rewards app dashboard">
            <div className="ppp-level-app-card__screen">
              <div>
                <span>Pixel Pulse Points</span>
                <strong>20,000</strong>
              </div>
              <div className="ppp-level-app-card__progress">
                <span style={{ width: "68%" }} />
              </div>
              <p>15,000 points to Level 4</p>
            </div>
            <div className="ppp-level-app-card__reward">
              <FaBottleWater aria-hidden="true" />
              <div>
                <strong>Next reward</strong>
                <span>30 Bonus Minutes</span>
              </div>
            </div>
          </div>
        </div>
        <div className="ppp-level-inner ppp-level-steps">
          {howSteps.map((item) => (
            <article className="ppp-level-step" key={item.number}>
              <span className="ppp-level-step__number">{item.number}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <strong>{item.accent}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="ppp-level-section ppp-level-earn" id="earn">
        <div className="ppp-level-inner ppp-level-section__header">
          <span>How to Earn</span>
          <h2>Play more. Earn more. Level up.</h2>
          <p>
            PulsePoints reward spend, gameplay, birthdays, referrals, and weekday visits so every
            return trip can move a player closer to the next unlock.
          </p>
        </div>
        <div className="ppp-level-inner ppp-level-earn__grid">
          {earningWays.map((item) => (
            <article key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="ppp-level-visual-band" aria-label="Pixel Pulse play experiences">
        <Image src={floorImage} alt="Interactive floor challenge at Pixel Pulse Play" width={520} height={360} />
        <Image src={shootingImage} alt="Target game at Pixel Pulse Play" width={520} height={360} />
        <div>
          <span>Every score counts</span>
          <strong>Keep earning points every time you play.</strong>
          <p>
            Points, challenge bonuses, referrals, birthday bookings, and weekday double-points help
            players move through the PulsePoints ladder faster.
          </p>
        </div>
      </section>

      <section className="ppp-level-section" id="ladder">
        <div className="ppp-level-inner">
          <div className="ppp-level-section__header">
            <span>Reward Ladder</span>
            <h2>From quick credits to Pixel Pulse VIP.</h2>
            <p>
              Move through 10 reward levels as your lifetime PulsePoints grow.
            </p>
          </div>
          <div className="ppp-level-tier-layout">
            <div className="ppp-level-tier-list" role="list">
              {rewardLadder.map((item, index) => {
                const Icon = item.icon;
                const tierState = index === 9 ? "is-vip" : index >= 7 ? "is-major" : "";

                return (
                  <article className={`ppp-level-tier-row ${tierState}`} key={item.level} role="listitem">
                    <div className="ppp-level-tier-row__badge">
                      <span>{index + 1}</span>
                      <Icon aria-hidden="true" />
                    </div>
                    <div>
                      <span>{item.level}</span>
                      <h3>{item.reward}</h3>
                      <p>{item.detail}</p>
                    </div>
                    <strong>{item.threshold}</strong>
                  </article>
                );
              })}
            </div>
            <aside className="ppp-level-signage-card" aria-label="Suggested rewards signage">
              <span>Suggested Signage</span>
              <h3>PulsePoints Rewards</h3>
              <p>Earn points every time you play.</p>
              <div>
                {rewardLadder.filter((_, index) => [0, 2, 3, 7, 8, 9].includes(index)).map((item) => (
                  <strong key={item.level}>
                    <span>{item.threshold.replace(" PulsePoints", " pts")}</span>
                    {item.reward}
                  </strong>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="ppp-level-section ppp-level-specials" id="vip">
        <div className="ppp-level-inner ppp-level-specials__grid">
          <article className="ppp-level-specials__panel">
            <span>VIP Member Benefits</span>
            <h2>250,000 points unlocks status.</h2>
            <div className="ppp-level-specials__list">
              {vipBenefits.map((benefit) => (
                <p key={benefit}>
                  <FaCircleCheck aria-hidden="true" />
                  {benefit}
                </p>
              ))}
            </div>
          </article>
          <article className="ppp-level-specials__panel">
            <span>Surprise Rewards</span>
            <h2>Spin the Prize Wheel.</h2>
            <p>
              Every level-up includes a surprise prize moment, because kids love not knowing exactly
              what they might win next.
            </p>
            <div className="ppp-level-prize-grid">
              {prizeWheelRewards.map((reward) => (
                <strong key={reward}>{reward}</strong>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="ppp-level-section ppp-level-streaks" id="streaks">
        <div className="ppp-level-inner ppp-level-section__header">
          <span>Repeat Visit Accelerator</span>
          <h2>Monthly streaks reward fast return visits.</h2>
          <p>
            Visit streak bonuses give families a clear reason to come back again this month instead
            of waiting for a special occasion.
          </p>
        </div>
        <div className="ppp-level-inner ppp-level-streaks__grid">
          {streakRewards.map((item) => (
            <article key={item.visits}>
              <span>{item.visits}</span>
              <strong>{item.reward}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="ppp-level-section ppp-level-annual" id="status">
        <div className="ppp-level-inner ppp-level-section__header">
          <span>Annual Membership Status</span>
          <h2>Give families a reason to keep earning.</h2>
          <p>
            Annual status keeps the program aspirational even after players redeem points for
            rewards.
          </p>
        </div>
        <div className="ppp-level-inner ppp-level-annual__grid">
          {annualStatus.map((item) => (
            <article className="ppp-level-annual-card" key={item.tier}>
              <span>{item.tier}</span>
              <strong>{item.range}</strong>
              <div>
                {item.perks.map((perk) => (
                  <p key={perk}>{perk}</p>
                ))}
              </div>
            </article>
          ))}
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
