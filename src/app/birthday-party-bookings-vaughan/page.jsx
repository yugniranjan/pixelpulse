import Image from "next/image";
import "../styles/birthday-landing.css";
import "../styles/birthday-bookings-vaughan.css";
import BirthdayHeroVideo from "@/components/BirthdayHeroVideo";
import BirthdayHeroContactForm from "@/components/BirthdayHeroContactForm";
import { fetchMenuData, fetchsheetdata } from "@/lib/sheets";
import { safeImageUrl } from "@/lib/seo";
import { getConfiguredValue } from "@/lib/ctaContent";

const heroImage = "/assets/images/birthday-party-room-hero.webp";
const heroVideo = "/assets/videos/pixelgame.mp4";
const localFloorImage = "/assets/images/floorchallenge.jpg";
const localShootingImage = "/assets/images/shootinggame.jpg";
const LOCATION_SLUG = "vaughan";
const attractionFallbackImage = "https://storage.googleapis.com/pixel-pulse-play/web/PrivateParty.png";
const phoneUrl = "tel:+19057602922";
const pageUrl = "https://birthdays.pixelpulseplay.ca";
const ogImage = `${pageUrl}/assets/images/birthday-party-room-hero.webp`;

export const revalidate = 900;

export const metadata = {
  title: "Kids & Teens Birthday Party Bookings Vaughan | Pixel Pulse Play",
  description:
    "Book a kids, tweens, or teens birthday party in Vaughan with interactive challenge rooms, hosted gameplay, private party rooms, and high-energy indoor fun.",
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: "Kids & Teens Birthday Party Bookings Vaughan | Pixel Pulse Play",
    description:
      "A high-energy birthday party in Vaughan with real-life gaming, interactive challenge rooms, hosted competitions, and private party rooms.",
    url: pageUrl,
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: "Pixel Pulse Play birthday party room in Vaughan",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kids & Teens Birthday Party Bookings Vaughan | Pixel Pulse Play",
    description:
      "Interactive birthday party bookings for kids, tweens, and teens in Vaughan.",
    images: [ogImage],
  },
};

const navLinks = [
  { label: "Highlights", href: "#highlights" },
  { label: "Games", href: "#games" },
  { label: "Packages", href: "#packages" },
];

const heroStats = [
  { value: "13+", label: "games" },
  { value: "Ages 7+", label: "kids and teens" },
  { value: "Vaughan", label: "indoor venue" },
];

const highlights = [
  {
    title: "Interactive challenge rooms",
    text: "Real-life gaming experiences with lights, targets, missions, and fast reactions.",
  },
  {
    title: "Team battles and competitions",
    text: "Perfect for groups, siblings, friends, and anyone chasing the high score.",
  },
  {
    title: "Guided party experience",
    text: "Hosted gameplay keeps the group organized, moving, and fully engaged.",
  },
  {
    title: "Private party rooms",
    text: "Celebrate, eat, open gifts, and take photos together after the games.",
  },
  {
    title: "Indoor summer fun",
    text: "Air-conditioned, weather-proof birthday fun without heat, rain, or party-hall boredom.",
  },
  {
    title: "Social-media worthy moments",
    text: "Colorful party rooms, action shots, and memorable moments parents can actually capture.",
  },
];

const fallbackAttractions = [
  {
    title: "Laser Maze",
    image: localFloorImage,
    text: "Duck, dodge, and crawl through laser beams before time runs out.",
  },
  {
    title: "Hexa Quest",
    image: localFloorImage,
    text: "Solve physical puzzles, unlock clues, and race against time.",
  },
  {
    title: "Edge Climb",
    image: localFloorImage,
    text: "Crawl, balance, climb, and move through an active challenge room.",
  },
  {
    title: "Shoot It Out",
    image: localShootingImage,
    text: "Team-based target action with zones, sensors, and light-up tiles.",
  },
];

const partyFeatures = [
  "Dedicated party rooms",
  "Guided gameplay rotations",
  "Music and high-energy atmosphere",
  "Food and add-ons available",
  "Easy online booking",
  "Great for kids, tweens, and teens",
];

// Mirrors the kids-birthday-parties "birthday_packages" config. Used as a
// fallback so the section always renders if the live config is unavailable.
const PACKAGE_PRICE_KEY = "Package Price";

const fallbackPackages = [
  {
    name: "Pixel Punch",
    [PACKAGE_PRICE_KEY]: "$399",
    "Number of Participants": "Up to 8",
    "Game Time Included": "1 hour",
    "Total Party Duration": "1 hour 45 minutes",
    Refreshments: "2 Large Pizza + Juice/ water for each participant",
  },
  {
    name: "Pixel Ultra",
    [PACKAGE_PRICE_KEY]: "$499",
    "Number of Participants": "Up to 12",
    "Game Time Included": "1 hour",
    "Total Party Duration": "2 hour",
    Refreshments: "3 Large Pizza + Juice/ water for each participant",
  },
  {
    name: "Pixel Jumbo",
    [PACKAGE_PRICE_KEY]: "$799",
    "Number of Participants": "Up to 20",
    "Game Time Included": "1.5 hours",
    "Total Party Duration": "2.5 hours",
    Refreshments: "4 Large Pizza + Juice/ water for each participant",
  },
  {
    name: "Pulse Max",
    [PACKAGE_PRICE_KEY]: "$1199",
    "Number of Participants": "Up to 25",
    "Game Time Included": "2 hours",
    "Total Party Duration": "3 hours",
    Refreshments: "6 Large Pizza + Juice/ water for each participant",
  },
];

const reviews = [
  "Best birthday party we have ever done.",
  "Finally something my 12-year-old actually loved.",
  "The kids did not want to leave.",
  "So much better than a regular trampoline park.",
];

// 8-bit pixel-art sprites that float through the hero. "1" = filled pixel.
const SPRITE_HEART = [
  "0110110",
  "1111111",
  "1111111",
  "0111110",
  "0011100",
  "0001000",
];

const SPRITE_INVADER = [
  "00100000100",
  "00010001000",
  "00111111100",
  "01101110110",
  "11111111111",
  "10111111101",
  "10100000101",
  "00011011000",
];

const SPRITE_DIAMOND = [
  "0001000",
  "0011100",
  "0111110",
  "1111111",
  "0111110",
  "0011100",
  "0001000",
];

const SPRITE_SPARKLE = [
  "00011000",
  "00011000",
  "00111100",
  "11111111",
  "11111111",
  "00111100",
  "00011000",
  "00011000",
];

const heroSprites = [SPRITE_HEART, SPRITE_INVADER, SPRITE_DIAMOND, SPRITE_SPARKLE];

function PixelSprite({ grid }) {
  const height = grid.length;
  const width = grid[0].length;
  const cells = [];

  grid.forEach((row, y) => {
    [...row].forEach((value, x) => {
      if (value === "1") {
        cells.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />);
      }
    });
  });

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      fill="currentColor"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {cells}
    </svg>
  );
}

async function getBirthdayMenuData() {
  try {
    return await fetchMenuData(LOCATION_SLUG);
  } catch (error) {
    console.error("birthday bookings menu failed:", error);
    return [];
  }
}

async function getBirthdayConfigData() {
  try {
    return await fetchsheetdata("config", LOCATION_SLUG);
  } catch (error) {
    console.error("birthday bookings config failed:", error);
    return [];
  }
}

// Parse the "birthday_packages" config blob the same way the
// kids-birthday-parties page does, then fall back to the static list.
function parsePackages(rows = []) {
  try {
    const raw = rows?.[0]?.value;
    if (!raw) return null;
    const cleaned = raw
      .replace(/<br\/>/g, "")
      .replace(/\n/g, "")
      .replace(/,\s*([}\]])/g, "$1")
      .trim();
    const parsed = JSON.parse(cleaned);
    return parsed?.packages?.length ? parsed.packages : null;
  } catch (error) {
    console.error("birthday packages parse failed:", error);
    return null;
  }
}

function getBirthdayPackages(config = []) {
  const rows = Array.isArray(config)
    ? config.filter((item) => item.key === "birthday_packages")
    : [];
  return parsePackages(rows) || fallbackPackages;
}

function getBirthdayPackageOptions(packageList = [], configData = []) {
  const privatePartyOptionText = getConfiguredValue(
    [configData],
    [
      "birthdayPrivatePartyPackageOptionText",
      "birthdayPrivatePartyPackageText",
      "birthdayHeroPrivatePartyCtaText",
      "birthdayPrivatePartyCtaText",
      "birthdayBookingsPrivatePartyCtaText",
    ],
  );
  const options = [
    ...packageList.map((pkg) => pkg.name).filter(Boolean),
    privatePartyOptionText,
  ].filter(Boolean);

  return Array.from(new Set(options));
}

function getAttractions(menuData = []) {
  const attractions = menuData.find((item) => item.path === "attractions");
  const children = Array.isArray(attractions?.children) ? attractions.children : [];

  return children
    .filter((item) => item?.isactive == 1)
    .map((item) => ({
      title: item.title || item.desc,
      text: item.smalltext || item.metadescription || "",
      image: safeImageUrl(item.smallimage || item.icon || item.headerimage, attractionFallbackImage),
    }));
}

export default async function BirthdayPartyBookingsVaughanPage() {
  const [menuData, configData] = await Promise.all([
    getBirthdayMenuData(),
    getBirthdayConfigData(),
  ]);
  const packageList = getBirthdayPackages(configData);
  const packageOptions = getBirthdayPackageOptions(packageList, configData);
  const attractions = getAttractions(menuData);
  const gameCards = attractions.length ? attractions : fallbackAttractions;

  const packageFeatureKeys = packageList.length
    ? Object.keys(packageList[0]).filter(
        (key) => key !== "name" && key !== PACKAGE_PRICE_KEY,
      )
    : [];
  const spotlightIndex = packageList.length > 1 ? 1 : 0;

  return (
    <main className="ppp-bday-booking-page">
      <nav className="ppp-bday-booking-nav" aria-label="Birthday party page navigation">
        <a className="ppp-bday-booking-logo" href="https://pixelpulseplay.ca">
          <Image src="/assets/images/logoD.png" alt="Pixel Pulse Play" width={188} height={70} priority />
        </a>
        <div>
          {navLinks.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </div>
        <a className="ppp-bday-nav-phone" href={phoneUrl}>
          Call +1 (905) 760-2922
        </a>
      </nav>

      <section className="ppp-bday-booking-hero">
        <BirthdayHeroVideo src={heroVideo} poster={heroImage} />
        <div className="ppp-bday-sprites" aria-hidden="true">
          {Array.from({ length: 9 }).map((_, index) => (
            <span className="ppp-bday-sprite" key={index}>
              <PixelSprite grid={heroSprites[index % heroSprites.length]} />
            </span>
          ))}
        </div>
        <div className="ppp-bday-booking-shell ppp-bday-booking-hero__layout">
          <div className="ppp-bday-booking-hero__copy">
            <p className="ppp-bday-kicker">Birthday parties in Vaughan</p>
            <h1>Birthday parties kids get <em>excited</em> about.</h1>
            <p>
              Interactive challenge rooms for kids, tweens, and teens.
            </p>
            <div className="ppp-bday-booking-actions">
              <a href="#packages">View party packages</a>
            </div>
            <div className="ppp-bday-hero-stats" aria-label="Birthday party highlights">
              {heroStats.map((item) => (
                <div key={item.value}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <BirthdayHeroContactForm
            urgency="Summer weekend spots fill quickly. Reserve your preferred party date today."
            packageOptions={packageOptions}
          />
        </div>
      </section>

      <section className="ppp-bday-booking-section ppp-bday-booking-section--packages" id="packages">
        <div className="ppp-bday-booking-shell">
          <div className="ppp-bday-section-heading ppp-bday-section-heading--center">
            <p>Party packages</p>
            <h2>Pick the birthday <em>package</em> that fits your group.</h2>
          </div>
          <div className="ppp-bday-package-grid">
            {packageList.map((pkg, index) => (
              <article
                key={pkg.name}
                className={index === spotlightIndex ? "is-featured" : undefined}
              >
                <p>{index === spotlightIndex ? "Most Popular" : "Package"}</p>
                <h3>{pkg.name}</h3>
                <div className="ppp-bday-package-price">{pkg[PACKAGE_PRICE_KEY]}</div>
                <ul>
                  {packageFeatureKeys.map((key) => (
                    <li key={key}>
                      <span className="ppp-bday-package-key">{key}</span>
                      <strong className="ppp-bday-package-val">{pkg[key] || "-"}</strong>
                    </li>
                  ))}
                </ul>
                <a className="ppp-bday-package-link" href="#birthday-party-form">
                  Book this package
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ppp-bday-booking-section ppp-bday-booking-section--highlights" id="highlights">
        <div className="ppp-bday-booking-shell">
          <div className="ppp-bday-section-heading ppp-bday-section-heading--center">
            <p>Quick highlights</p>
            <h2>Everything kids and teens <em>love</em> without anything they will call boring.</h2>
          </div>
          <div className="ppp-bday-highlight-grid">
            {highlights.map((item, index) => (
              <article key={item.title} tabIndex={0}>
                <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ppp-bday-booking-section" id="positioning">
        <div className="ppp-bday-booking-shell ppp-bday-positioning ppp-bday-positioning--media">
          <div className="ppp-bday-section-heading">
            <p>What makes Pixel Pulse different</p>
            <h2>Not another indoor <em>playground</em>.</h2>
            <p className="ppp-bday-section-copy">
              Pixel Pulse turns kids into players inside real-life video games. Run
              through laser mazes, hit glowing targets, race against the clock, compete
              with friends, and unlock challenges together.
            </p>
            <p className="ppp-bday-section-copy ppp-bday-section-copy--contrast">
              Every room is interactive, active, and designed to keep kids moving,
              laughing, and fully engaged. No screens, no sitting around, just real action.
            </p>
          </div>
          <div className="ppp-bday-experience-grid ppp-bday-experience-grid--compact">
            <article>
              <Image src={localFloorImage} alt="" width={720} height={520} sizes="(max-width: 900px) 100vw, 33vw" />
              <div>
                <h3>Movement games</h3>
                <p>Fast rooms built for running, reacting, and replaying.</p>
              </div>
            </article>
            <article>
              <Image src={localShootingImage} alt="" width={720} height={520} sizes="(max-width: 900px) 100vw, 33vw" />
              <div>
                <h3>Target challenges</h3>
                <p>Lights, targets, speed, and instant competition.</p>
              </div>
            </article>
          </div>
        </div>
        <div className="ppp-bday-booking-shell ppp-bday-mid-cta">
          <a href="#birthday-party-form">Check available dates</a>
        </div>
      </section>

      <section className="ppp-bday-booking-section ppp-bday-booking-section--games" id="games">
        <div className="ppp-bday-booking-shell">
          <div className="ppp-bday-section-heading">
            <p>Featured games</p>
            <h2>Every room is a new <em>challenge</em>.</h2>
          </div>
          <div className="ppp-birthday-attraction-carousel ppp-bday-game-carousel" aria-label="Featured Pixel Pulse games">
            {gameCards.map((game) => (
              <article className="ppp-birthday-attraction-card ppp-bday-game-card" key={game.title}>
                <Image
                  src={game.image}
                  alt=""
                  width={800}
                  height={600}
                  style={{ width: "100%", height: "auto" }}
                />
                <div>
                  <h3>{game.title}</h3>
                  <p>{game.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ppp-bday-booking-section ppp-bday-booking-section--party">
        <div className="ppp-bday-booking-shell ppp-bday-party-layout">
          <div className="ppp-bday-section-heading">
            <p>Party experience</p>
            <h2>We handle the chaos while you enjoy the <em>celebration</em>.</h2>
            <p className="ppp-bday-section-copy">
              Your party host keeps everything moving while kids jump into guided
              game challenges and team competitions. You celebrate. We handle the fun.
            </p>
          </div>
          <div className="ppp-bday-party-panel">
            {partyFeatures.map((feature) => (
              <span key={feature}>{feature}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="ppp-bday-booking-section ppp-bday-booking-section--summer">
        <div className="ppp-bday-booking-shell ppp-bday-summer">
          <div className="ppp-bday-section-heading">
            <p>Summer birthday positioning</p>
            <h2>The ultimate <em>summer</em> birthday experience.</h2>
            <p className="ppp-bday-section-copy">
              Skip the same old birthday party this summer. Pixel Pulse delivers
              air-conditioned indoor fun, active gameplay, immersive challenges, and
              unforgettable memories without worrying about weather, heat, or boring
              party halls.
            </p>
          </div>
          <a href="#birthday-party-form">Check available dates</a>
        </div>
      </section>

      <section className="ppp-bday-booking-section ppp-bday-booking-section--reviews">
        <div className="ppp-bday-booking-shell">
          <div className="ppp-bday-section-heading ppp-bday-section-heading--center">
            <p>Social proof</p>
            <h2>Why families <em>love</em> Pixel Pulse.</h2>
          </div>
          <div className="ppp-bday-review-grid">
            {reviews.map((review) => (
              <article key={review}>
                <p>{review}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ppp-bday-final">
        <div className="ppp-bday-booking-shell ppp-bday-final__inner">
          <div>
            <p>Book your party</p>
            <h2>Ready to give them a birthday they will <em>never forget</em>?</h2>
            <span>Summer weekend spots fill quickly. Reserve your preferred party date today.</span>
          </div>
          <div className="ppp-bday-final__actions">
            <a className="ppp-bday-final__primary" href="#birthday-party-form">
              Book your party
            </a>
            <a href={phoneUrl}>Call now</a>
          </div>
        </div>
      </section>
    </main>
  );
}
