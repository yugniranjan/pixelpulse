import Image from "next/image";
import "../styles/summer-play-pass.css";
import { canonicalUrl, getCanonicalSiteUrl, safeImageUrl } from "@/lib/seo";
import { fetchMenuData, fetchsheetdata } from "@/lib/sheets";
import { LOCATION_NAME } from "@/lib/constant";
import { getConfiguredValue } from "@/lib/ctaContent";
import SummerPlayPassInquiryForm from "@/components/SummerPlayPassInquiryForm";

const logo = "/assets/images/logoD.png";
const arcadeImage = "/assets/images/arcade.JPG";
const floorImage = "/assets/images/floorchallenge.jpg";
const shootingImage = "/assets/images/shootinggame.jpg";
const attractionFallbackImage = "https://storage.googleapis.com/pixel-pulse-play/web/PrivateParty.png";
const siteUrl = getCanonicalSiteUrl();

export const dynamic = "force-dynamic";

const games = [
  {
    name: "Laser Maze",
    genre: "Agility / Stealth",
    emoji: "⚡",
    tags: ["Challenge", "Timed"],
    image: floorImage,
  },
  {
    name: "Hexa Quest",
    genre: "Puzzle / Reflex",
    emoji: "⬢",
    tags: ["Interactive", "Strategy"],
    image: floorImage,
  },
  {
    name: "Edge Climb",
    genre: "Climb / Balance",
    emoji: "🧗",
    tags: ["Active", "Skill"],
    image: floorImage,
  },
  {
    name: "Shoot It Out",
    genre: "Target / Action",
    emoji: "🎯",
    tags: ["Head-to-head", "Fast"],
    image: shootingImage,
  },
  {
    name: "Tile Hunt",
    genre: "Speed / Memory",
    emoji: "🟩",
    tags: ["Reflex", "Score"],
    image: floorImage,
  },
  {
    name: "Basket Ball",
    genre: "Sports / Accuracy",
    emoji: "🏀",
    tags: ["Classic", "Arcade"],
    image: arcadeImage,
  },
  {
    name: "Maze Gate",
    genre: "Puzzle / Movement",
    emoji: "🚪",
    tags: ["Team", "Challenge"],
    image: floorImage,
  },
  {
    name: "Soccer Challenge",
    genre: "Sports / Power",
    emoji: "⚽",
    tags: ["Active", "Family"],
    image: shootingImage,
  },
  {
    name: "Ball Toss",
    genre: "Aim / Score",
    emoji: "🎪",
    tags: ["Quick Play", "Fun"],
    image: shootingImage,
  },
  {
    name: "Pizza Delivery",
    genre: "Mission / Reaction",
    emoji: "🍕",
    tags: ["Kids Love It", "Quest"],
    image: floorImage,
  },
  {
    name: "T-Rex Heist",
    genre: "Adventure / Escape",
    emoji: "🦖",
    tags: ["Adventure", "Immersive"],
    image: floorImage,
  },
  {
    name: "Seashells",
    genre: "Search / Score",
    emoji: "🐚",
    tags: ["Family", "Discovery"],
    image: floorImage,
  },
];

const features = [
  {
    icon: "🎮",
    title: "Play More, Repeat Often",
    description: "Built for summer visits when kids want to come back, try another challenge, and beat their last score.",
  },
  {
    icon: "👟",
    title: "Active Indoor Fun",
    description: "A high-energy alternative to screen time, with games that get players moving, aiming, climbing, and reacting.",
  },
  {
    icon: "🏆",
    title: "Score-Chasing Challenges",
    description: "Every visit can become a rematch with friends, siblings, parents, or your own best time.",
  },
  {
    icon: "☀️",
    title: "Summer-Friendly Plans",
    description: "Choose a simple pass option for quick visits, longer play sessions, or family days at Pixel Pulse.",
  },
];

const DEFAULT_SUMMER_PLAY_PASS = {
  title: "Unlimited Summer. Unlimited Play.",
  subtitle: "Beat the heat. Enter the challenge. All summer long at Pixel Pulse.",
  bookingUrl: "https://pixelpulseplayzone.lilypadpos.app/public/onlinesales/tickets1.php",
  bookingText: "Book Now",
  cards: [
    {
      title: "SUMMER PLAY PASS - 60",
      badge: "",
      price: "$99",
      features: [
        "60 minutes play access",
        "Valid for 5 visits (June-Aug)",
        "Weekday + off-peak weekend access",
      ],
      note: "Effective price: ~$20 per visit vs $35 regular",
    },
    {
      title: "SUMMER PLAY PASS - 90",
      badge: "Most Popular",
      price: "$149",
      features: [
        "90 minutes play access",
        "Valid for 5 visits (June-Aug)",
        "Priority booking slots",
      ],
      note: "Effective price: ~$30 per visit vs $44 regular",
    },
    {
      title: "UNLIMITED SUMMER PASS",
      badge: "Hero Offer",
      price: "$199",
      features: [
        "60 mins play per day",
        "Valid all summer (June-Aug)",
        "Weekdays + limited weekend slots",
        "10% off arcade credits",
      ],
      note: "",
    },
  ],
  valueTitle: "Regular price = $34-$49 per visit",
  valueText: "Save up to 40%",
  addonsTitle: "Add-ons",
  addons: [
    "Bring a friend - $19",
    "Arcade credits bonus",
    "Upgrade to party anytime",
  ],
  termsTitle: "Terms",
  terms: [
    "Valid June-Aug",
    "Booking required",
    "Non-transferable",
    "Limited weekend slots",
  ],
  cta: "Don't just play once. PLAY ALL SUMMER.",
};

function parseBoolean(value, fallback = true) {
  const normalizedValue = String(value ?? "").trim().toLowerCase();
  if (!normalizedValue) return fallback;
  if (["true", "yes", "1", "show"].includes(normalizedValue)) return true;
  if (["false", "no", "0", "hide", "hidden"].includes(normalizedValue)) return false;
  return fallback;
}

function splitConfigList(value = "") {
  return String(value || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .split(/[\n|]/)
    .map((item) => item.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function parseConfigMatrix(configData, key) {
  const normalizedKey = String(key || "").trim().toLowerCase();

  return (Array.isArray(configData) ? configData : [])
    .filter((item) => String(item.key || "").trim().toLowerCase() === normalizedKey)
    .flatMap((item) =>
      String(item?.value || "")
        .replace(/<br\s*\/?>/gi, "\n")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
    )
    .map((value) => value.split(";"))
    .map((columns) => {
      const mappedValues = {};
      columns.forEach((column, index) => {
        mappedValues[`value${index + 1}`] = column?.trim() || "";
      });
      return mappedValues;
    });
}

function parseJsonConfigValue(value) {
  const cleaned = String(value || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .trim();

  if (!cleaned) return null;

  for (const candidate of [cleaned, cleaned.replace(/^"+|"+$/g, "").replace(/""/g, '"')]) {
    try {
      return JSON.parse(candidate);
    } catch {
      // Try the next candidate.
    }
  }

  return null;
}

function getConfigValues(configData, key) {
  const normalizedKey = String(key || "").trim().toLowerCase();

  return (Array.isArray(configData) ? configData : [])
    .filter((item) => String(item.key || "").trim().toLowerCase() === normalizedKey)
    .map((item) => item?.value)
    .filter((value) => value !== undefined && value !== null && String(value).trim());
}

function parseSummerPassCards(configData = []) {
  const jsonCards = getConfigValues(configData, "summerPlayPassCards")
    .flatMap((value) => {
      const parsed = parseJsonConfigValue(value);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && typeof parsed === "object") return [parsed];
      return [];
    })
    .map((item) => ({
      title: item.title || item.name || "",
      badge: item.badge || item.tag || "",
      price: item.price || item.amount || "",
      features: Array.isArray(item.features)
        ? item.features.filter(Boolean)
        : splitConfigList(item.features || item.details),
      note: item.note || item.value || "",
    }))
    .filter((item) => item.title || item.price || item.features.length > 0);

  const matrixCards = [
    ...(parseConfigMatrix(configData, "summerPlayPassCard") || []),
    ...(parseConfigMatrix(configData, "summerPassCard") || []),
  ]
    .map((row) => ({
      title: row.value1 || "",
      badge: row.value2 || "",
      price: row.value3 || "",
      features: splitConfigList(row.value4),
      note: row.value5 || "",
    }))
    .filter((item) => item.title || item.price || item.features.length > 0);

  return [...jsonCards, ...matrixCards];
}

function buildSummerPlayPassContent(configData = []) {
  const cards = parseSummerPassCards(configData);

  return {
    title: getConfiguredValue(configData, ["summerPlayPassTitle", "summerPassTitle"], DEFAULT_SUMMER_PLAY_PASS.title),
    subtitle: getConfiguredValue(configData, ["summerPlayPassSubtitle", "summerPassSubtitle"], DEFAULT_SUMMER_PLAY_PASS.subtitle),
    cards: cards.length > 0 ? cards : DEFAULT_SUMMER_PLAY_PASS.cards,
    bookingUrl: getConfiguredValue(configData, ["summerPlayPassBookingUrl", "summerPassBookingUrl"], DEFAULT_SUMMER_PLAY_PASS.bookingUrl),
    bookingText: getConfiguredValue(configData, ["summerPlayPassBookingText", "summerPassBookingText"], DEFAULT_SUMMER_PLAY_PASS.bookingText),
    valueTitle: getConfiguredValue(configData, ["summerPlayPassValueTitle", "summerPassValueTitle"], DEFAULT_SUMMER_PLAY_PASS.valueTitle),
    valueText: getConfiguredValue(configData, ["summerPlayPassValueText", "summerPassValueText"], DEFAULT_SUMMER_PLAY_PASS.valueText),
    addonsTitle: getConfiguredValue(configData, ["summerPlayPassAddonsTitle", "summerPassAddonsTitle"], DEFAULT_SUMMER_PLAY_PASS.addonsTitle),
    addons: splitConfigList(getConfiguredValue(configData, ["summerPlayPassAddons", "summerPassAddons"], DEFAULT_SUMMER_PLAY_PASS.addons.join("|"))),
    termsTitle: getConfiguredValue(configData, ["summerPlayPassTermsTitle", "summerPassTermsTitle"], DEFAULT_SUMMER_PLAY_PASS.termsTitle),
    terms: splitConfigList(getConfiguredValue(configData, ["summerPlayPassTerms", "summerPassTerms"], DEFAULT_SUMMER_PLAY_PASS.terms.join("|"))),
    cta: getConfiguredValue(configData, ["summerPlayPassCta", "summerPassCta"], DEFAULT_SUMMER_PLAY_PASS.cta),
    show: parseBoolean(getConfiguredValue(configData, ["showSummerPlayPass", "summerPlayPassShow"], "true"), true),
  };
}

function getLineupGames(menuData = []) {
  const attractions = menuData.find((item) => item.path === "attractions");
  const children = Array.isArray(attractions?.children) ? attractions.children : [];

  return children
    .filter((item) => item?.isactive == 1)
    .map((item) => ({
      name: item.title || item.desc || "Pixel Pulse Game",
      genre: item.smalltext || item.metadescription || "",
      image: safeImageUrl(item.smallimage || item.icon || item.headerimage, attractionFallbackImage),
      tags: [],
    }))
    .filter((item) => item.name || item.genre);
}

const reviews = [
  {
    quote: "The kids kept asking to go back because every game felt different. It was active, loud, and exactly the kind of summer day we needed.",
    name: "Parent guest",
    detail: "Vaughan visit",
    avatar: "👩",
  },
  {
    quote: "Laser Maze and Shoot It Out turned into instant rematches. Everyone wanted one more try.",
    name: "Group player",
    detail: "Challenge room fan",
    avatar: "🧒",
  },
  {
    quote: "Perfect indoor option when it was too hot outside. The kids burned energy and we did not have to plan a whole production.",
    name: "Family guest",
    detail: "Summer outing",
    avatar: "👨",
  },
];

export const metadata = {
  title: "Summer Play Pass | Pixel Pulse Play Vaughan",
  description:
    "Book a Pixel Pulse Summer Play Pass in Vaughan for active indoor games, challenge rooms, arcade-style scoring, and family fun.",
  alternates: {
    canonical: canonicalUrl("/summer-play-pass"),
  },
  openGraph: {
    title: "Summer Play Pass | Pixel Pulse Play Vaughan",
    description: "Active indoor summer fun with Pixel Pulse games and challenge rooms.",
    images: [`${siteUrl}${arcadeImage}`],
  },
};

export default async function SummerPlayPassPage() {
  let configData = [];
  let menuData = [];

  try {
    configData = await fetchsheetdata("config", LOCATION_NAME || "vaughan");
  } catch (error) {
    console.error("summer-play-pass config failed to load:", error);
  }

  try {
    menuData = await fetchMenuData(LOCATION_NAME || "vaughan");
  } catch (error) {
    console.error("summer-play-pass menu failed to load:", error);
  }

  const summerPass = buildSummerPlayPassContent(configData);
  const lineupGames = getLineupGames(menuData);
  const displayGames = lineupGames.length > 0 ? lineupGames : games;
  const marqueeGames = [...displayGames.slice(0, 10), ...displayGames.slice(0, 10)];
  const passOptions = summerPass.cards.map((card) => card.title).filter(Boolean);

  return (
    <main className="ppp-summer-page">
      <nav className="ppp-summer-nav" aria-label="Summer Play Pass navigation">
        <a className="ppp-summer-logo" href="#top" aria-label="Pixel Pulse Play Summer Play Pass">
          <Image src={logo} alt="Pixel Pulse Play" width={172} height={78} priority />
        </a>
        <div className="ppp-summer-nav__links">
          <a href="#games">Games</a>
          <a href="#features">Why Visit</a>
          <a href="#pricing">Passes</a>
          <a className="ppp-summer-nav__cta" href="#pricing">Get Pass</a>
        </div>
      </nav>

      <section className="ppp-summer-hero" id="top">
        <div className="ppp-summer-rays" />
        <div className="ppp-summer-sun" />
        <div className="ppp-summer-hero__image" aria-hidden="true">
          <Image src={arcadeImage} alt="" fill priority sizes="100vw" />
        </div>
        <div className="ppp-summer-hero__layout">
          <div className="ppp-summer-hero__content">
            <span className="ppp-summer-badge">Summer 2026 | Limited Time</span>
            <h1>{summerPass.title}</h1>
            <p>{summerPass.subtitle}</p>
            <div className="ppp-summer-actions">
              <a className="ppp-summer-btn ppp-summer-btn--primary" href="#pricing">View Passes</a>
              <a className="ppp-summer-btn ppp-summer-btn--secondary" href="#games">Browse Games</a>
            </div>
            <div className="ppp-summer-stats" aria-label="Summer Play Pass highlights">
              <div><strong>{summerPass.cards.length}</strong><span>Pass Options</span></div>
              <div><strong>June-Aug</strong><span>Summer Validity</span></div>
              <div><strong>40%</strong><span>Possible Savings</span></div>
            </div>
          </div>
          <SummerPlayPassInquiryForm passOptions={passOptions} />
        </div>
      </section>

      {summerPass.show && (
        <section className="ppp-summer-section ppp-summer-pricing" id="pricing">
          <div className="ppp-summer-inner">
            <div className="ppp-summer-section__header">
              <span>Choose Your Pass</span>
              <h2>{summerPass.title}</h2>
              <p>{summerPass.subtitle}</p>
            </div>
            <div className="ppp-summer-pricing__grid">
              {summerPass.cards.map((plan) => (
                <article
                  className={`ppp-summer-plan ${plan.badge ? "is-featured" : ""}`}
                  key={plan.title}
                >
                  {plan.badge ? <span className="ppp-summer-plan__badge">{plan.badge}</span> : null}
                  <h3>{plan.title}</h3>
                  <div className="ppp-summer-plan__price">
                    <strong>{plan.price}</strong>
                  </div>
                  <ul>
                    {plan.features.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                  {plan.note && <p className="ppp-summer-plan__note">{plan.note}</p>}
                  {summerPass.bookingUrl && (
                    <a
                      className={plan.badge ? "ppp-summer-plan__button is-filled" : "ppp-summer-plan__button"}
                      href={summerPass.bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {summerPass.bookingText}
                    </a>
                  )}
                </article>
              ))}
            </div>
            <div className="ppp-summer-pass-summary">
              <div className="ppp-summer-pass-summary__value">
                <span>Applies to summer passes</span>
                <strong>{summerPass.valueText}</strong>
                <small>{summerPass.valueTitle}</small>
              </div>
              {summerPass.addons.length > 0 && (
                <div className="ppp-summer-pass-summary__addons">
                  <span>{summerPass.addonsTitle}</span>
                  <div>
                    {summerPass.addons.map((item) => <strong key={item}>{item}</strong>)}
                  </div>
                </div>
              )}
            </div>
            {summerPass.terms.length > 0 && (
              <p className="ppp-summer-pass-terms">
                <strong>{summerPass.termsTitle}:</strong> {summerPass.terms.join(" | ")}
              </p>
            )}
            {summerPass.cta && <div className="ppp-summer-pass-cta">{summerPass.cta}</div>}
          </div>
        </section>
      )}

      <div className="ppp-summer-marquee" aria-label="Pixel Pulse games">
        <div>
          {marqueeGames.map((game, index) => (
            <span key={`${game.name}-${index}`}>
              {game.emoji ? `${game.emoji} ` : ""}{game.name}
              <b>✦</b>
            </span>
          ))}
        </div>
      </div>

      <section className="ppp-summer-section ppp-summer-games" id="games">
        <div className="ppp-summer-inner">
          <div className="ppp-summer-section__header">
            <span>What&apos;s Included</span>
            <h2>Pixel Pulse Summer Lineup</h2>
            <p>Swap screen time for active challenges, score chasing, and games that feel different every time you play.</p>
          </div>
          <div className="ppp-summer-games__grid" aria-label="Pixel Pulse Summer Lineup carousel">
            {displayGames.map((game) => (
              <article className="ppp-summer-game-card" key={game.name}>
                <div className="ppp-summer-game-card__media">
                  <Image src={game.image} alt={`${game.name} at Pixel Pulse Play`} fill sizes="(max-width: 760px) 82vw, 340px" />
                </div>
                <div className="ppp-summer-game-card__body">
                  <h3>{game.name}</h3>
                  <p>{game.genre}</p>
                  {game.tags?.length ? (
                    <div>
                      {game.tags.map((tag) => <span key={tag}>{tag}</span>)}
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ppp-summer-section ppp-summer-features" id="features">
        <div className="ppp-summer-inner ppp-summer-features__grid">
          <div>
            <span className="ppp-summer-label">Why Play Pass</span>
            <h2>Everything you need for an easy summer outing</h2>
            <div className="ppp-summer-features__list">
              {features.map((feature) => (
                <article className="ppp-summer-feature" key={feature.title}>
                  <span>{feature.icon}</span>
                  <div>
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
          <div className="ppp-summer-stack" aria-hidden="true">
            <div className="ppp-summer-stack-card ppp-summer-stack-card--one">
              <strong>Summer Score Run</strong>
              <span>Laser Maze | Tile Hunt | Shoot It Out</span>
            </div>
            <div className="ppp-summer-stack-card ppp-summer-stack-card--two">
              <strong>Friend Rematch</strong>
              <span>Bring your crew and chase the board</span>
            </div>
            <div className="ppp-summer-stack-card ppp-summer-stack-card--three">
              <strong>Play Pass Active</strong>
              <span>Indoor challenges | Vaughan, ON</span>
            </div>
          </div>
        </div>
      </section>

      <section className="ppp-summer-section ppp-summer-reviews">
        <div className="ppp-summer-inner">
          <div className="ppp-summer-section__header">
            <span>Guest Love</span>
            <h2>Kids and parents agree</h2>
          </div>
          <div className="ppp-summer-reviews__grid">
            {reviews.map((review) => (
              <article className="ppp-summer-review" key={review.name}>
                <div>★★★★★</div>
                <p>&ldquo;{review.quote}&rdquo;</p>
                <footer>
                  <span>{review.avatar}</span>
                  <div>
                    <strong>{review.name}</strong>
                    <small>{review.detail}</small>
                  </div>
                </footer>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ppp-summer-cta">
        <div>
          <span className="ppp-summer-label">Don&apos;t Miss Out</span>
          <h2>Summer only lasts so long.</h2>
          <p>Plan a cool indoor play day at Pixel Pulse and let the kids burn energy in the best way.</p>
          <a className="ppp-summer-btn ppp-summer-btn--primary" href="/pricing-promos">Grab Your Pass Now</a>
          <small>No auto-renewal | Session availability may vary | Vaughan, ON</small>
        </div>
      </section>

      <footer className="ppp-summer-footer">
        <Image src={logo} alt="Pixel Pulse Play" width={138} height={62} />
        <nav aria-label="Summer footer links">
          <a href="/kids-birthday-parties">Birthday Parties</a>
          <a href="/pricing-promos">Pricing</a>
          <a href="/contactus">Contact</a>
        </nav>
        <p>© 2026 Pixel Pulse Play. All rights reserved.</p>
      </footer>
    </main>
  );
}
