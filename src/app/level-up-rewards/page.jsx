import Image from "next/image";
import {
  FaArrowRight,
  FaBottleWater,
  FaCakeCandles,
  FaCircleCheck,
  FaGift,
  FaMedal,
  FaMugHot,
  FaShirt,
  FaTicket,
} from "react-icons/fa6";
import RewardLookupForm from "@/components/RewardLookupForm";
import { lookupRewardPlayers } from "@/lib/rewardLookup";
import { getRewardsSheetConfig } from "@/lib/rewardSheet";
import "../styles/level-up-rewards.css";

const logo = "/assets/images/logoD.png";
const arcadeImage = "/assets/images/arcade.webp";
const floorImage = "/assets/images/floorchallenge.webp";
const shootingImage = "/assets/images/shootinggame.webp";
const rewardsSiteUrl = "https://rewards.pixelpulseplay.ca";

const defaultRewardLadder = [
  {
    level: "Level 1",
    threshold: "5,000 PulsePoints",
    reward: "10 Arcade Credits",
    detail: "Load 10 arcade credits and keep the fun going.",
    icon: FaGift,
  },
  {
    level: "Level 2",
    threshold: "12,000 PulsePoints",
    reward: "20 Arcade Credits",
    detail: "Enjoy 20 arcade credits for even more games on your next visit.",
    icon: FaMedal,
  },
  {
    level: "Level 3",
    threshold: "20,000 PulsePoints",
    reward: "Free Drink or Snack",
    detail: "Choose a refreshing drink or a tasty snack.",
    icon: FaBottleWater,
  },
  {
    level: "Level 4",
    threshold: "35,000 PulsePoints",
    reward: "30 Bonus Minutes",
    detail: "Enjoy 30 extra minutes of play on a weekday.",
    icon: FaTicket,
  },
  {
    level: "Level 5",
    threshold: "50,000 PulsePoints",
    reward: "Pixel Pulse Coffee Mug",
    detail: "Take home your own Pixel Pulse coffee mug.",
    icon: FaMugHot,
  },
  {
    level: "Level 6",
    threshold: "70,000 PulsePoints",
    reward: "Friend Pass",
    detail: "Bring a friend and enjoy 30 minutes of play together.",
    icon: FaGift,
  },
  {
    level: "Level 7",
    threshold: "90,000 PulsePoints",
    reward: "Free Upgrade to 90-Min Pass",
    detail: "Upgrade your visit to a 90-minute pass at no extra cost.",
    icon: FaShirt,
  },
  {
    level: "Level 8",
    threshold: "120,000 PulsePoints",
    reward: "FREE 60-Minute Pass",
    detail: "Enjoy a full 60-minute play session on us.",
    icon: FaTicket,
  },
  {
    level: "Level 9",
    threshold: "160,000 PulsePoints",
    reward: "FREE 90-Minute Pass",
    detail: "Unlock a full 90-minute play session on us.",
    icon: FaTicket,
  },
  {
    level: "Level 10",
    threshold: "250,000 PulsePoints",
    reward: "Pixel Pulse VIP Member",
    detail: "Reach VIP status and enjoy our best member perks.",
    icon: FaCakeCandles,
  },
];

const defaultVipBenefits = [
  "Skip-the-line check-in",
  "10% off food and beverages",
  "Weekday member offers",
  "Birthday surprise reward",
  "Exclusive event invitations",
  "One free guest pass every quarter",
];

const defaultPrizeWheelRewards = [
  "10 Arcade Credits",
  "Drink or Snack",
  "Candy",
  "Extra 15 Minutes",
  "Free Upgrade",
  "Pixel Pulse Sticker",
  "Mystery Prize",
];

const defaultStreakRewards = [
  { visits: "2 visits in a month", reward: "Free Drink" },
  { visits: "3 visits in a month", reward: "10 Arcade Credits" },
  { visits: "5 visits in a month", reward: "FREE 30 Minutes" },
  { visits: "8 visits in a month", reward: "FREE 60-Minute Pass" },
];

const defaultHowSteps = [
  {
    number: "01",
    title: "Book or play",
    text: "Explorer, All-Access, Booster, parties, and add-ons all feed the same player profile.",
    accent: "Every visit moves you forward",
  },
  {
    number: "02",
    title: "Build your streak",
    text: "Friends, birthdays, and repeat visits help you unlock more rewards.",
    accent: "Visit more, unlock more",
  },
  {
    number: "03",
    title: "Unlock rewards",
    text: "Every level opens a reward, then adds a surprise prize-wheel moment at the counter.",
    accent: "Free play, upgrades, VIP status",
  },
];

const defaultAnnualStatus = [
  {
    tier: "Bronze",
    range: "0-100k points",
    perks: ["Start earning toward major rewards"],
  },
  {
    tier: "Silver",
    range: "100k-250k points",
    perks: ["Early access to member events"],
  },
  {
    tier: "Gold",
    range: "250k+ points",
    perks: ["Weekday member offers", "Exclusive events", "Birthday free pass"],
  },
];

const defaultHeroStats = [
  { label: "Player access", value: "Email or phone" },
  { label: "Reward ladder", value: "10 levels" },
  { label: "Monthly streaks", value: "Extra rewards" },
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
  const sheetConfig = await getRewardsSheetConfig();
  const pageCopy = sheetConfig?.pageCopy || {};
  const content = (key, field, fallback) => pageCopy[key]?.[field] || fallback;
  const iconMap = {
    birthday: FaCakeCandles,
    drink: FaBottleWater,
    gift: FaGift,
    medal: FaMedal,
    mug: FaMugHot,
    shirt: FaShirt,
    ticket: FaTicket,
  };
  const rewardLadder = sheetConfig?.rewardLadder?.length
    ? sheetConfig.rewardLadder.map((reward) => ({
        ...reward,
        icon: iconMap[reward.icon] || FaGift,
      }))
    : defaultRewardLadder;
  const vipBenefits = sheetConfig?.vipBenefits?.length
    ? sheetConfig.vipBenefits
    : defaultVipBenefits;
  const prizeWheelRewards = sheetConfig?.prizeWheelRewards?.length
    ? sheetConfig.prizeWheelRewards
    : defaultPrizeWheelRewards;
  const streakRewards = sheetConfig?.streakRewards?.length
    ? sheetConfig.streakRewards
    : defaultStreakRewards;
  const howSteps = sheetConfig?.howSteps?.length ? sheetConfig.howSteps : defaultHowSteps;
  const annualStatus = sheetConfig?.annualStatus?.length
    ? sheetConfig.annualStatus
    : defaultAnnualStatus;
  const heroStats = sheetConfig?.heroStats?.length ? sheetConfig.heroStats : defaultHeroStats;
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
          <span className="ppp-level-kicker">
            {content("hero_kicker", "text", "Level Up Rewards App")}
          </span>
          <h1>
            {content("hero_title", "title", "Your Pixel Pulse")} {" "}
            <span>{content("hero_title", "value", "Rewards.")}</span>
          </h1>
          <p>
            {content(
              "hero_description",
              "text",
              "Already played at Pixel Pulse? Enter the email or phone number used for your visit to open your dashboard, check your points, and redeem unlocked rewards.",
            )}
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
            <span>{content("how_eyebrow", "text", "How it works")}</span>
            <h2>{content("how_title", "title", "PulsePoints turns every visit into progress.")}</h2>
            <p>
              {content(
                "how_description",
                "text",
                "Earn PulsePoints every time you play, unlock rewards as you level up, and work your way toward VIP status all year long.",
              )}
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

      <section className="ppp-level-visual-band" aria-label="Pixel Pulse play experiences">
        <Image src={floorImage} alt="Interactive floor challenge at Pixel Pulse Play" width={520} height={360} />
        <Image src={shootingImage} alt="Target game at Pixel Pulse Play" width={520} height={360} />
        <div>
          <span>{content("visual_eyebrow", "text", "Every visit counts")}</span>
          <strong>{content("visual_title", "title", "Keep moving up every time you visit.")}</strong>
          <p>
            {content(
              "visual_description",
              "text",
              "Repeat visits, referrals, birthdays, and monthly streaks bring your next reward closer.",
            )}
          </p>
        </div>
      </section>

      <section className="ppp-level-section" id="ladder">
        <div className="ppp-level-inner">
          <div className="ppp-level-section__header">
            <span>{content("ladder_eyebrow", "text", "Reward Ladder")}</span>
            <h2>{content("ladder_title", "title", "From quick credits to Pixel Pulse VIP.")}</h2>
            <p>
              {content(
                "ladder_description",
                "text",
                "Move through 10 reward levels as your lifetime PulsePoints grow.",
              )}
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
              <span>{content("signage_eyebrow", "text", "Suggested Signage")}</span>
              <h3>{content("signage_title", "title", "PulsePoints Rewards")}</h3>
              <p>{content("signage_description", "text", "Earn points every time you play.")}</p>
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
            <span>{content("vip_eyebrow", "text", "VIP Member Benefits")}</span>
            <h2>{content("vip_title", "title", "Reach VIP at 250,000 points.")}</h2>
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
            <span>{content("prize_eyebrow", "text", "Surprise Rewards")}</span>
            <h2>{content("prize_title", "title", "Spin the Prize Wheel.")}</h2>
            <p>{content("prize_description", "text", "Every level-up comes with a surprise spin. See what you win next.")}</p>
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
          <span>{content("streak_eyebrow", "text", "Monthly Visit Streaks")}</span>
          <h2>{content("streak_title", "title", "Visit more this month. Unlock extra rewards.")}</h2>
          <p>{content("streak_description", "text", "Each visit moves your monthly streak forward and brings the next reward closer.")}</p>
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
          <span>{content("annual_eyebrow", "text", "Annual Membership Status")}</span>
          <h2>{content("annual_title", "title", "Keep leveling up all year.")}</h2>
          <p>{content("annual_description", "text", "Your annual status grows with your points and unlocks even more member perks.")}</p>
        </div>
        <div className="ppp-level-inner ppp-level-annual__grid">
          {annualStatus.map((item) => {
            const tierClass = String(item.tier || "")
              .trim()
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-");

            return (
              <article
                className={`ppp-level-annual-card ppp-level-annual-card--${tierClass}`}
                key={item.tier}
              >
                <span>{item.tier}</span>
                <strong>{item.range}</strong>
                <div>
                  {item.perks.map((perk) => (
                    <p key={perk}>{perk}</p>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="ppp-level-cta" id="join">
        <div>
          <span>{content("cta_eyebrow", "text", "Ready to level up?")}</span>
          <h2>{content("cta_title", "title", "Ask staff about Level Up Rewards on your next visit.")}</h2>
          <p>{content("cta_description", "text", "Use the player app above to check your balance, level, unlocked rewards, and progress toward your next reward.")}</p>
          <a className="ppp-level-button ppp-level-button--primary" href="/contactus">
            {content("cta_button", "text", "Contact Pixel Pulse")} <FaArrowRight aria-hidden="true" />
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
