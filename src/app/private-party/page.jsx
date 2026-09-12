import Image from "next/image";
import ExploreChallengesCarousel from "../components/home/ExploreChallengesCarousel";
import "../styles/private-party.css";
import { fetchMenuData } from "@/lib/sheets";
import { LOCATION_NAME } from "@/lib/constant";
import { canonicalUrl, safeImageUrl } from "@/lib/seo";
import { getDataByParentId } from "@/utils/customFunctions";

const logo = "/assets/images/logoD.png";
const heroImage = "/assets/images/private-party-hero.webp";
const heroVideo = "/assets/videos/birthday-party-room.mp4";
const contactUrl = "/contactus";
const phoneUrl = "tel:+19057602922";
const siteDataGoogleSheetId = "1NEovNJVBVY4LyXWg3nHFh5-LekMt8GfL4y4eaNz7X1I";

export const metadata = {
  title: "Private Party | Pixel Pulse Play Vaughan",
  description:
    "Plan a private party at Pixel Pulse Play Vaughan with interactive challenge rooms, live leaderboards, dedicated hosts, and group packages for birthdays, teams, families, and celebrations.",
  alternates: {
    canonical: canonicalUrl("/private-party"),
  },
  openGraph: {
    title: "Private Party | Pixel Pulse Play Vaughan",
    description:
      "Host a high-energy private party at Pixel Pulse Play with challenge rooms, arena-style gameplay, and a dedicated event flow for your group.",
    url: canonicalUrl("/private-party"),
    images: [
      {
        url: canonicalUrl(heroImage),
        width: 1200,
        height: 630,
        alt: "Private party at Pixel Pulse Play Vaughan",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Private Party | Pixel Pulse Play Vaughan",
    description:
      "Private parties, challenge rooms, live leaderboards, and dedicated hosts at Pixel Pulse Play Vaughan.",
    images: [canonicalUrl(heroImage)],
  },
  robots: {
    index: true,
  },
};

const navLinks = [
  { label: "Group Experiences", href: "#group-experiences" },
  { label: "Challenge Rooms", href: "#rooms" },
];

const groupBenefits = [
  "Designed for groups of all sizes",
  "Fully hosted and organized",
  "Active and engaging",
];

const groupEvents = [
  {
    title: "Private Party",
    body: "High-energy celebrations without the chaos, built around your group size, timing, and party flow.",
    href: contactUrl,
    image: "https://storage.googleapis.com/pixel-pulse-play/web/PrivateParty.png",
    imageAlt: "Private party room setup at Pixel Pulse Play",
  },
  {
    title: "Corporate Parties",
    body: "Team-building, work socials, and staff nights with challenge rooms, simple booking, and real group energy.",
    href: "/group-events/corporate-parties-events-groups",
    image: "https://storage.googleapis.com/pixel-pulse-play/web/CorporateParty.png",
    imageAlt: "Target challenge room for corporate group events",
  },
  {
    title: "School / Groups",
    body: "Structured trips for school groups, clubs, camps, and youth crews with hosted activities and clear timing.",
    href: "/group-events/school-groups",
    image: "https://storage.googleapis.com/pixel-pulse-play/web/SchoolTrips.png",
    imageAlt: "Interactive floor challenge for school and youth groups",
  },
  {
    title: "Fund Raising",
    body: "Give your community a reason to gather, play, and support a cause with an event people actually enjoy.",
    href: "/group-events/fund-raising",
    image: "https://storage.googleapis.com/pixel-pulse-play/web/fund-raisers.png",
    imageAlt: "Arcade games for fundraising events",
  },
];

const steps = [
  {
    number: "01",
    title: "Inquire & Customize",
    body: "Tell us your group size, date, and celebration style. We shape the event flow around your crew.",
  },
  {
    number: "02",
    title: "Confirm & Lock In",
    body: "We reserve the time slot, prepare your party zone, and plan the leaderboard setup.",
  },
  {
    number: "03",
    title: "Show Up & Compete",
    body: "Guests check in, get briefed, and jump into challenge rooms built for real group energy.",
  },
  {
    number: "04",
    title: "Crown the Champion",
    body: "Live scores, final rankings, and bragging rights give the party a finish everyone remembers.",
  },
];

const fallbackAttractions = [
  {
    title: "Laser Maze",
    body: "Duck, weave, and race the clock through a glowing obstacle path.",
    meta: "Agility + Timing",
    image: "/assets/images/vr-section-bg.webp",
    imageAlt: "Laser maze challenge room",
    href: "/attractions/laser-maze",
  },
  {
    title: "Hexa Quest",
    body: "Solve patterns, react fast, and keep your team moving.",
    meta: "Puzzle + Reflex",
    image: "/assets/images/floorchallenge.webp",
    imageAlt: "Interactive floor challenge",
    href: "/attractions/hexa-quest",
  },
  {
    title: "Edge Climb",
    body: "Balance, climb, and push for the cleanest run.",
    meta: "Climb + Balance",
    image: "/assets/images/birthday-party-room-hero.webp",
    imageAlt: "Challenge room for climbing and movement",
    href: "/attractions/edge-climb",
  },
  {
    title: "Shoot It Out",
    body: "Line up your aim and chase the highest score under pressure.",
    meta: "Target Action",
    image: "/assets/images/shootinggame.webp",
    imageAlt: "Target shooting game",
    href: "/attractions/shoot-it-out",
  },
  {
    title: "Tile Hunt",
    body: "Sprint, scan, and step through a fast memory challenge.",
    meta: "Speed + Memory",
    image: "/assets/images/floorchallenge.webp",
    imageAlt: "Tile hunt floor game",
    href: "/attractions/tile-hunt",
  },
  {
    title: "T-Rex Heist",
    body: "Work through a themed mission built for team energy.",
    meta: "Adventure Mission",
    image: "/assets/images/arcade.webp",
    imageAlt: "Arcade challenge room",
    href: "/attractions/trex-heist",
  },
  {
    title: "Soccer Challenge",
    body: "Test your accuracy and timing with a sporty scoring round.",
    meta: "Sports Accuracy",
    image: "/assets/images/floorchallenge.webp",
    imageAlt: "Soccer challenge room",
    href: "/attractions/soccer-challenge",
  },
  {
    title: "Basket Ball",
    body: "Stack points fast in a classic party-friendly scoring challenge.",
    meta: "Arcade Scoring",
    image: "/assets/images/arcade.webp",
    imageAlt: "Basketball arcade challenge",
    href: "/attractions/basket-ball",
  },
  {
    title: "Maze Gate",
    body: "Move smart, find the route, and beat the room together.",
    meta: "Movement Puzzle",
    image: "/assets/images/vr-section-bg.webp",
    imageAlt: "Maze gate challenge",
    href: "/attractions/maze-gate",
  },
  {
    title: "Pizza Delivery",
    body: "Keep up with a playful reaction quest made for quick laughs.",
    meta: "Reaction Quest",
    image: "/assets/images/arcade.webp",
    imageAlt: "Pizza delivery game",
    href: "/attractions/pizza-delivery",
  },
  {
    title: "Ball Toss",
    body: "Aim clean, throw steady, and compete for bragging rights.",
    meta: "Aim Challenge",
    image: "/assets/images/shootinggame.webp",
    imageAlt: "Ball toss challenge",
    href: "/attractions/ball-toss",
  },
  {
    title: "Seashells",
    body: "Search, score, and move through a lighter challenge room.",
    meta: "Search + Score",
    image: "/assets/images/floorchallenge.webp",
    imageAlt: "Seashells challenge room",
    href: "/attractions/seashells",
  },
];

function googleSheetCsvUrl(sheetName) {
  return `https://docs.google.com/spreadsheets/d/${siteDataGoogleSheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
}

function parseCsv(csv) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < csv.length; i += 1) {
    const char = csv[i];
    const nextChar = csv[i + 1];

    if (char === "\"" && inQuotes && nextChar === "\"") {
      value += "\"";
      i += 1;
    } else if (char === "\"") {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") i += 1;
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }

  const [headers = [], ...dataRows] = rows.filter((csvRow) =>
    csvRow.some((cell) => String(cell).trim()),
  );

  return dataRows.map((csvRow) =>
    headers.reduce((acc, header, index) => {
      acc[String(header).trim()] = csvRow[index] ?? "";
      return acc;
    }, {}),
  );
}

async function fetchGameRows() {
  const response = await fetch(googleSheetCsvUrl("games"), {
    next: { revalidate: 900 },
  });

  if (!response.ok) return [];

  return parseCsv(await response.text()).map((row) => {
    const image = row.image || row.imageUrl || row.imageurl || row.image_url || row.smallimage || row.headerimage;

    return {
      id: String(row.id || ""),
      name: String(row.name || ""),
      tag: String(row.tag || ""),
      bestFor: String(row.bestFor || ""),
      image: image ? safeImageUrl(image) : "",
      imageAlt: String(row.imageAlt || row.imagealt || row.image_alt || ""),
      link: String(row.link || row.url || row.href || ""),
    };
  }).filter((row) => row.name || row.tag);
}

function looksLikeRenderableImage(url = "") {
  if (!url) return false;
  if (url.startsWith("/")) return true;

  const normalized = url.split("?")[0].toLowerCase();
  return [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".svg"].some((ext) =>
    normalized.endsWith(ext),
  );
}

function getPreferredImage(pageData) {
  if (looksLikeRenderableImage(pageData?.smallimage)) return safeImageUrl(pageData.smallimage);
  if (looksLikeRenderableImage(pageData?.headerimage)) return safeImageUrl(pageData.headerimage);
  return safeImageUrl(pageData?.smallimage || pageData?.headerimage);
}

function normalizeAttractionKey(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function findHomepageAttractionItem(game, attractionChildren = []) {
  const gameKeys = [game?.id, game?.name]
    .map(normalizeAttractionKey)
    .filter(Boolean);

  return (
    attractionChildren.find((item) => {
      const itemKeys = [item?.path, item?.pageid, item?.metatitle, item?.desc]
        .map(normalizeAttractionKey)
        .filter(Boolean);

      return gameKeys.some((key) => itemKeys.includes(key));
    }) || null
  );
}

function formatHomepageAttractionTitle(title = "") {
  return String(title || "").replace(
    /\b(interactive|immersive)\b/gi,
    (word) => `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`,
  );
}

async function getHomepageGames() {
  try {
    const [games, menuData] = await Promise.all([
      fetchGameRows(),
      fetchMenuData(LOCATION_NAME),
    ]);
    const attractionsData = Array.isArray(menuData)
      ? getDataByParentId(menuData, "attractions") || []
      : [];
    const attractionChildren =
      attractionsData?.[0]?.children?.filter((item) => item?.isactive == 1) || [];

    const homepageGames = games.map((game) => {
      const matchedAttraction = findHomepageAttractionItem(game, attractionChildren);
      const attractionHref =
        matchedAttraction?.parentid && matchedAttraction?.path
          ? `/${matchedAttraction.parentid}/${matchedAttraction.path}`
          : "";

      return {
        title: formatHomepageAttractionTitle(game.name || matchedAttraction?.desc || "Game Room"),
        body: game.tag || matchedAttraction?.metatitle || "",
        meta: game.bestFor || "",
        image: game.image || getPreferredImage(matchedAttraction),
        imageAlt: game.imageAlt || matchedAttraction?.iconalttextforhomepage || game.name || "Pixel Pulse game room",
        href: game.link || attractionHref || "#",
      };
    });

    return homepageGames.length ? homepageGames : fallbackAttractions;
  } catch (error) {
    console.error("private party games failed:", error);
    return fallbackAttractions;
  }
}

const reasons = [
  {
    icon: "+",
    title: "Brain + Body Gameplay",
    body: "Guests think, react, move, aim, and climb across rooms built for real competition, not just screen time.",
  },
  {
    icon: "▥",
    title: "Live Group Leaderboard",
    body: "Real-time rankings for your whole party or team, whether it is coworkers, friends, or a table of tweens.",
  },
  {
    icon: "✓",
    title: "Zero Setup Stress",
    body: "A dedicated host runs the flow so you can show up and enjoy it, whether you are hosting family or clients.",
  },
  {
    icon: "↻",
    title: "Replay Value Built In",
    body: "Different rooms and rematch energy keep it fresh, from a first visit to an annual team tradition.",
  },
];

const audienceChips = [
  "Birthdays",
  "Corporate Events",
  "Team Nights",
  "Adult Groups",
  "Family Celebrations",
];

export default async function PrivatePartyPage() {
  const attractions = await getHomepageGames();

  return (
    <main className="ppp-private-page">
      <nav className="ppp-private-nav" aria-label="Private party landing navigation">
        <a className="ppp-private-logo" href="/">
          <Image src={logo} alt="Pixel Pulse Play" width={190} height={64} priority />
        </a>
        <div className="ppp-private-nav__links">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
          <a className="ppp-private-nav__cta" href={contactUrl}>
            Inquire Now
          </a>
        </div>
      </nav>

      <section className="ppp-private-hero">
        <video
          className="ppp-private-hero__image"
          poster={heroImage}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
        <div className="ppp-private-hero__grid" />
        <div className="ppp-private-shell ppp-private-hero__layout">
          <div className="ppp-private-hero__copy">
            <p className="ppp-private-kicker">Private Party | Vaughan</p>
            <h1>
              High-Energy <span>Celebrations</span> Without The Chaos.
            </h1>
            <p className="ppp-private-hero__text">
              Rent the entire arena, or build a dedicated party experience for your group.
              Pixel Pulse Play turns birthdays, team nights, family events, and friend
              hangouts into a real challenge-room celebration.
            </p>
            <div className="ppp-private-actions">
              <a className="ppp-private-btn ppp-private-btn--primary" href={contactUrl}>
                Inquire About A Party
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="ppp-private-section ppp-private-section--panel" id="group-experiences">
        <div className="ppp-private-shell ppp-private-group-intro">
          <div>
            <div className="ppp-private-section__header">
              <p>Group Experiences</p>
              <h2>
                Bring Your Group. <span>We&apos;ll Handle The Energy.</span>
              </h2>
            </div>
            <p className="ppp-private-muted">
              From corporate teams to school trips, Pixel Pulse builds high-energy
              experiences that are structured, supervised, and actually fun.
            </p>
            <div className="ppp-private-benefits" aria-label="Group event benefits">
              {groupBenefits.map((benefit) => (
                <span key={benefit}>{benefit}</span>
              ))}
            </div>
          </div>

          <div className="ppp-private-event-types">
            <p className="ppp-private-event-types__eyebrow">What Are You Planning?</p>
            {groupEvents.map((event) => (
              <article key={event.title}>
                <Image
                  src={event.image}
                  alt={event.imageAlt}
                  width={180}
                  height={128}
                  sizes="(max-width: 760px) 100vw, 180px"
                />
                <div>
                  <h3>{event.title}</h3>
                  <p>{event.body}</p>
                </div>
                <a href={event.href}>Plan This Event</a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ppp-private-section ppp-private-section--panel">
        <div className="ppp-private-shell">
          <div className="ppp-private-section__header">
            <p>The Process</p>
            <h2>
              Booked. Played. <span>Legendary.</span>
            </h2>
          </div>
          <div className="ppp-private-steps">
            {steps.map((step) => (
              <article className="ppp-private-step" key={step.number}>
                <span>{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ppp-private-section" id="rooms">
        <div className="ppp-private-shell ppp-private-rooms">
          <div>
            <div className="ppp-private-section__header">
              <p>All Included</p>
              <h2>
                13 Challenge Rooms. <span>One Private Arena.</span>
              </h2>
            </div>
            <p className="ppp-private-muted">
              Every private party can tap into the full attraction lineup, from fast
              reflex games to team missions and score-chasing rooms.
            </p>
          </div>
          <ExploreChallengesCarousel games={attractions} />
        </div>
      </section>

      <section className="ppp-private-section">
        <div className="ppp-private-shell ppp-private-experience">
          <div className="ppp-private-experience__content">
            <div className="ppp-private-section__header">
              <p>Why Pixel Pulse</p>
              <h2>
                Not Just A Venue. <span>A Victory Lap.</span>
              </h2>
            </div>
            <div className="ppp-private-audience" aria-label="Best for">
              {audienceChips.map((chip) => (
                <span key={chip}>{chip}</span>
              ))}
            </div>
            <div className="ppp-private-reasons">
              {reasons.map((reason) => (
                <article key={reason.title}>
                  <span className="ppp-private-reason-icon" aria-hidden="true">
                    {reason.icon}
                  </span>
                  <h3>{reason.title}</h3>
                  <p>{reason.body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="ppp-private-final">
        <div className="ppp-private-shell">
          <p>Book Your Private Party</p>
          <h2>
            Ready To Own The <span>Leaderboard?</span>
          </h2>
          <div className="ppp-private-actions ppp-private-actions--center">
            <a className="ppp-private-btn ppp-private-btn--primary" href={contactUrl}>
              Inquire Now
            </a>
            <a className="ppp-private-btn ppp-private-btn--ghost" href={phoneUrl}>
              Call +1 (905) 760-2922
            </a>
          </div>
          <small>Pixel Pulse Play Vaughan | connect@pixelpulseplay.ca</small>
        </div>
      </section>
    </main>
  );
}
