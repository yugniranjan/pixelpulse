import Link from "next/link";
import "../styles/vr.css";
import BookingButton from "@/components/smallComponents/BookingButton";
import VrLibrary from "./VrLibrary";
import { fetchsheetdata } from "@/lib/sheets";
import { getConfiguredValue, getRowValue } from "@/lib/ctaContent";
import { canonicalUrl, getCanonicalSiteUrl } from "@/lib/seo";

const LOCATION_SLUG = "vaughan";
const VR_SHEET = "VR";
const HERO_VIDEO = "/assets/videos/vr-hero.mp4";
const PAGE_BG = "/assets/images/vr-section-bg.jpg";
const SITE_URL = getCanonicalSiteUrl();
const DEFAULT_VR_BOOKING_URL =
  "https://pixelpulseplayzone.lilypadpos.app/public/onlinesales/tickets1.php?ptid=19";

const META_TITLE = "VR Experiences | Pixel Pulse Play Zone Vaughan";
const META_DESCRIPTION =
  "VR is launching soon at Pixel Pulse Play Zone in Vaughan with a focused 4x4 metre arena lineup including Holomia, Party Ship, HunterVR, and Cops and Robbers.";

const VR_LAUNCH_MODE = true;
const HUNTER_VR_IMAGE =
  "https://cdn.synthesisvr.com/gameassets/svr_79522/header460x215_1756891174.webp";
const COPS_ROBBERS_IMAGE =
  "https://cdn.synthesisvr.com/gameassets/svr_5739/header2460x215_1672244114.webp";
const LAUNCH_GAME_NAMES = [
  "Holomia",
  "Party Ship",
  "HunterVR",
  "Cops and Robbers",
];

const FALLBACK_STATS = [
  { value: "4", label: "Launch Games" },
  { value: "4x4m", label: "Arena Setup" },
  { value: "8+", label: "Ages Welcome" },
];

const FALLBACK_OFFERS = [
  {
    label: "VR Quick Play",
    title: "🎮 30-Minute VR Experience",
    desc: "Perfect for first-time players and quick adventures.",
    price: "$29.99",
    priceSuffix: "per person",
    items: [
      "Choice of available VR games",
      "Solo or multiplayer (where applicable)",
      "Staff assistance included",
    ],
    buttonText: "Book Your VR Session",
    bookingType: "ticket",
  },
  {
    label: "VR Unlimited Adventure",
    title: "🥽 60-Minute VR Experience",
    desc: "More time to explore, compete, and experience multiple VR worlds.",
    price: "$48.99",
    priceSuffix: "per person",
    items: [
      "Play multiple VR experiences",
      "Best value for groups and friends",
      "Staff assistance included",
    ],
    buttonText: "Book Your VR Session",
    bookingType: "ticket",
    featured: true,
  },
];

const FALLBACK_FEATURED = [
  {
    flag: "Launch Lineup",
    title: "HunterVR",
    desc: "Step into the arena for a compact, action-focused VR challenge built for the first rollout.",
    tags: ["Action", "Launch"],
    img: HUNTER_VR_IMAGE,
  },
  {
    flag: "Family Pick",
    title: "Party Ship",
    desc: "A light, chaotic crew adventure for groups that want something playful and social.",
    tags: ["2-4", "Party", "Family"],
    img: "https://cdn.synthesisvr.com/gameassets/svr_79692/headerr460x215_1773153241.webp",
  },
  {
    flag: "Escape",
    title: "Holomia",
    desc: "Immersive VR escape adventures designed for groups that want puzzles, teamwork, and exploration.",
    tags: ["Team", "Escape", "Adventure"],
    img: "https://cdn.synthesisvr.com/gameassets/svr_79670/header_v2460x215_1779100697.webp",
  },
];

const IMG = "https://cdn.synthesisvr.com/gameassets";
const FALLBACK_CATEGORIES = [
  {
    name: "Launch Lineup",
    accent: "var(--vr-magenta)",
    icon: "🥽",
    games: [
      { title: "Holomia", desc: "Immersive escape-style VR adventures for teamwork and exploration.", tags: ["Team", "Escape"], img: `${IMG}/svr_79670/header_v2460x215_1779100697.webp` },
      { title: "Party Ship", desc: "Chaotic, laugh-out-loud crew gameplay for friends and families.", tags: ["2-4", "Party"], img: `${IMG}/svr_79692/headerr460x215_1773153241.webp` },
      { title: "HunterVR", desc: "Step into the arena for a compact, action-focused VR challenge.", tags: ["Action", "Launch"], img: HUNTER_VR_IMAGE },
      { title: "Cops and Robbers", desc: "A team-based chase experience with fast rounds and arcade energy.", tags: ["Team", "Action"], img: COPS_ROBBERS_IMAGE },
    ],
  },
];

const FALLBACK_FAQS = [
  {
    q: "How many people can play at once?",
    a: "Our launch setup is planned around a 4x4 metre VR arena. Player count may vary by title, and our staff will guide each group to the right game.",
  },
  {
    q: "What's the minimum age?",
    a: "Most experiences are great for ages 7 and up. A selection of intense and horror titles are rated 16+ - our staff will guide you to the right fit.",
  },
  {
    q: "Do I need any experience with VR?",
    a: "Not at all. Headsets are wireless and intuitive, and our crew walks every group through a quick tutorial before you start.",
  },
  {
    q: "Can I book VR for a birthday or group event?",
    a: "Yes. VR will be available as a focused add-on for birthdays, friends, and group visits once the launch schedule opens.",
  },
];

async function getVrRows() {
  try {
    return await fetchsheetdata(VR_SHEET, LOCATION_SLUG);
  } catch (error) {
    console.error("VR sheet failed:", error);
    return [];
  }
}

function clean(value = "") {
  return String(value ?? "").trim();
}

function isHidden(row = {}) {
  return ["false", "no", "0", "hidden", "inactive"].includes(
    getRowValue(row, ["active", "enabled", "show", "visible"]).toLowerCase(),
  );
}

function rowSection(row = {}) {
  return getRowValue(row, ["section", "type", "kind"]).toLowerCase();
}

function ordered(rows = []) {
  return [...rows].sort((a, b) => {
    const aOrder = Number(getRowValue(a, ["order", "sort", "position"]) || 0);
    const bOrder = Number(getRowValue(b, ["order", "sort", "position"]) || 0);
    return aOrder - bOrder;
  });
}

function sectionRows(rows = [], names = []) {
  const sections = new Set((Array.isArray(names) ? names : [names]).map((name) => name.toLowerCase()));

  return ordered(
    rows.filter(
      (row) =>
        !getRowValue(row, "key") &&
        !isHidden(row) &&
        sections.has(rowSection(row)),
    ),
  );
}

function parseList(value = "") {
  return clean(value)
    .split(/\r?\n|<br\s*\/?>|\|/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getLaunchGameNames(rows = []) {
  const configuredGames = parseList(
    getConfiguredValue(
      rows,
      ["launchGameNames", "launchLineup", "launchGames", "heroLaunchGames"],
      "",
    ),
  );

  if (configuredGames.length) return configuredGames;

  const launchRows = sectionRows(rows, ["launchLineup", "launchGame", "launchGames"])
    .map((row) => firstValue(row, ["title", "name", "value", "game"]))
    .filter(Boolean);

  return launchRows.length ? launchRows : LAUNCH_GAME_NAMES;
}

function parseJsonConfig(rows = [], keys = [], fallback) {
  const raw = getConfiguredValue(rows, keys, "");
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(
      raw
        .replace(/<br\s*\/?>/gi, "")
        .replace(/\r?\n/g, "")
        .replace(/,\s*([}\]])/g, "$1")
        .trim(),
    );
    return parsed || fallback;
  } catch (error) {
    console.error(`VR sheet JSON parse failed for ${[].concat(keys).join(", ")}:`, error);
    return fallback;
  }
}

function firstValue(row = {}, keys = [], fallback = "") {
  return getRowValue(row, keys) || fallback;
}

function gameKey(value = "") {
  return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

const LAUNCH_GAME_ALIASES = new Map([
  ["holomia", "Holomia"],
  ["holomia escape", "Holomia"],
  ["party ship", "Party Ship"],
  ["huntervr", "HunterVR"],
  ["hunter vr", "HunterVR"],
  ["cops and robbers", "Cops and Robbers"],
  ["cops robbers", "Cops and Robbers"],
]);

function launchGameName(title = "") {
  return LAUNCH_GAME_ALIASES.get(gameKey(title));
}

function looksLikeImageUrl(value = "") {
  const url = clean(value);
  return (
    /^https?:\/\//i.test(url) &&
    (/cdn\.synthesisvr\.com/i.test(url) || /\.(avif|gif|jpe?g|png|svg|webp)(\?|$)/i.test(url))
  );
}

function rowImageValue(row = {}) {
  const direct = firstValue(row, ["img", "image", "imageUrl", "imageURL", "photo"]);

  if (looksLikeImageUrl(direct) || direct.startsWith("/")) {
    return direct;
  }

  return [
    firstValue(row, "tags"),
    firstValue(row, "flag"),
    firstValue(row, "href"),
    firstValue(row, "category"),
  ].find(looksLikeImageUrl) || "";
}

function localOrRemoteUrl(value = "", fallback = "") {
  const url = clean(value);
  if (!url) return fallback;
  return url.startsWith("http") || url.startsWith("/") ? url : `/${url}`;
}

function absoluteUrl(value = "") {
  const url = localOrRemoteUrl(value);
  if (!url) return "";
  return url.startsWith("http") ? url : `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

function cssUrl(value = "") {
  return `url("${localOrRemoteUrl(value, PAGE_BG).replace(/"/g, "%22")}")`;
}

function accentVar(value = "", fallback = "var(--vr-cyan)") {
  const raw = clean(value);
  if (!raw) return fallback;
  if (raw.startsWith("var(") || raw.startsWith("#") || raw.startsWith("rgb")) return raw;
  return `var(--vr-${raw.toLowerCase()})`;
}

function getStats(rows = []) {
  const json = parseJsonConfig(rows, ["stats", "heroStats"], null);
  if (Array.isArray(json) && json.length) return withoutLaunchSoonStat(json);

  const stats = sectionRows(rows, ["stat", "stats", "heroStat"]).map((row) => ({
    value: firstValue(row, ["value", "stat", "number", "title"]),
    label: firstValue(row, ["label", "name", "desc", "description"]),
  })).filter((item) => item.value || item.label);

  const visibleStats = withoutLaunchSoonStat(stats);
  return visibleStats.length ? visibleStats : FALLBACK_STATS;
}

function withoutLaunchSoonStat(stats = []) {
  return stats.filter((stat) => {
    const value = clean(stat?.value).toLowerCase();
    const label = clean(stat?.label).toLowerCase();
    return !(value === "soon" && label === "vr launch");
  });
}

function getVrBookingUrl(rows = []) {
  return getConfiguredValue(
    rows,
    [
      "vrBookingUrl",
      "vrBookingHref",
      "vrTicketUrl",
      "vrTicketHref",
      "heroPrimaryHref",
      "heroCtaHref",
    ],
    DEFAULT_VR_BOOKING_URL,
  );
}

function getOffers(rows = []) {
  const bookingUrl = getVrBookingUrl(rows);
  const json = parseJsonConfig(rows, ["offers", "vrOffers"], null);
  if (Array.isArray(json) && json.length) {
    return json.map((offer) => ({
      ...offer,
      href: offer.href || offer.url || offer.link || bookingUrl,
    }));
  }

  const offers = sectionRows(rows, ["offer", "offers", "package", "packages"]).map((row) => ({
    label: firstValue(row, ["label", "name"]),
    title: firstValue(row, ["title", "heading"]),
    desc: firstValue(row, ["desc", "description", "text"]),
    price: firstValue(row, ["price", "amount"]),
    priceSuffix: firstValue(row, ["priceSuffix", "price_suffix", "suffix"], "per person"),
    items: parseList(firstValue(row, ["items", "bullets", "features"])),
    buttonText: firstValue(row, ["buttonText", "ctaText", "cta"], "Book Your VR Session"),
    bookingType: firstValue(row, ["bookingType", "booking_type"], "ticket"),
    href: firstValue(row, ["href", "url", "link"], bookingUrl),
    featured: ["true", "yes", "1"].includes(firstValue(row, ["featured", "highlight"], "").toLowerCase()),
  })).filter((item) => item.title || item.label);

  return offers.length
    ? offers
    : FALLBACK_OFFERS.map((offer) => ({ ...offer, href: bookingUrl }));
}

function getFeatured(rows = []) {
  if (VR_LAUNCH_MODE) return FALLBACK_FEATURED;

  const json = parseJsonConfig(rows, ["featured", "featuredGames"], null);
  if (Array.isArray(json) && json.length) return json;

  const featured = sectionRows(rows, ["featured", "featuredGame", "spotlight"]).map((row) => ({
    flag: looksLikeImageUrl(firstValue(row, "tags"))
      ? firstValue(row, ["href", "badge", "label"])
      : firstValue(row, ["flag", "badge", "label"]),
    title: firstValue(row, ["title", "name"]),
    desc: firstValue(row, ["desc", "description", "text"]),
    tags: looksLikeImageUrl(firstValue(row, "tags"))
      ? parseList(firstValue(row, "flag"))
      : parseList(firstValue(row, ["tags", "tag", "labels"])),
    img: rowImageValue(row),
  })).filter((item) => item.title);

  return featured.length ? featured : FALLBACK_FEATURED;
}

function getCategories(rows = []) {
  if (VR_LAUNCH_MODE) {
    const sheetGames = sectionRows(rows, ["categoryGame", "category", "game", "library"])
      .map((row) => {
        const title = firstValue(row, ["title", "name"]);
        const launchTitle = launchGameName(title);

        if (!launchTitle) return null;

        return {
          title: launchTitle,
          desc: firstValue(row, ["desc", "description", "text"]),
          tags: parseList(firstValue(row, ["tags", "tag", "labels"])),
          img: rowImageValue(row),
        };
      })
      .filter(Boolean);
    const byTitle = new Map(FALLBACK_CATEGORIES[0].games.map((game) => [game.title, game]));

    sheetGames.forEach((game) => {
      byTitle.set(game.title, {
        ...byTitle.get(game.title),
        ...game,
        title: game.title,
        desc: game.desc || byTitle.get(game.title)?.desc,
        tags: game.tags?.length ? game.tags : byTitle.get(game.title)?.tags || [],
        img: game.img || byTitle.get(game.title)?.img || PAGE_BG,
      });
    });

    return [
      {
        ...FALLBACK_CATEGORIES[0],
        games: FALLBACK_CATEGORIES[0].games.map((game) => byTitle.get(game.title)).filter(Boolean),
      },
    ];
  }

  const json = parseJsonConfig(rows, ["categories", "experienceCategories", "games"], null);
  if (Array.isArray(json) && json.length) return json;

  const gameRows = sectionRows(rows, ["categoryGame", "category", "game", "library"]).filter((row) =>
    firstValue(row, ["title", "name"]),
  );

  if (!gameRows.length) {
    return FALLBACK_CATEGORIES;
  }

  const categoryMap = new Map();

  gameRows.forEach((row) => {
    const imgField = firstValue(row, ["img", "image", "imageUrl", "imageURL", "photo"]);
    const shiftedImageRow = !looksLikeImageUrl(imgField) && looksLikeImageUrl(firstValue(row, "tags"));
    const categoryName = shiftedImageRow
      ? firstValue(row, "img", "VR Experiences")
      : firstValue(row, ["category", "categoryName", "group"], "VR Experiences");

    if (!categoryMap.has(categoryName)) {
      categoryMap.set(categoryName, {
        name: categoryName,
        accent: accentVar(firstValue(row, ["accent", "categoryAccent"]), "var(--vr-cyan)"),
        icon: shiftedImageRow
          ? firstValue(row, "category", "🥽")
          : firstValue(row, ["icon", "emoji"], "🥽"),
        games: [],
      });
    }

    categoryMap.get(categoryName).games.push({
      title: firstValue(row, ["title", "name"]),
      desc: firstValue(row, ["desc", "description", "text"]),
      tags: shiftedImageRow
        ? parseList(firstValue(row, "flag"))
        : parseList(firstValue(row, ["tags", "tag", "labels"])),
      img: rowImageValue(row),
    });
  });

  return Array.from(categoryMap.values());
}

function getFaqs(rows = []) {
  const json = parseJsonConfig(rows, ["faqs", "faq"], null);
  if (Array.isArray(json) && json.length) return json;

  const faqs = sectionRows(rows, ["faq", "faqs"]).map((row) => ({
    q: firstValue(row, ["q", "question", "title"]),
    a: firstValue(row, ["a", "answer", "desc", "description", "text"]),
  })).filter((item) => item.q && item.a);

  return faqs.length ? faqs : FALLBACK_FAQS;
}

function getVrContent(rows = []) {
  const get = (keys, fallback = "") => getConfiguredValue(rows, keys, fallback);
  const bookingUrl = getVrBookingUrl(rows);
  const launchCopy = VR_LAUNCH_MODE
    ? {
        metaTitle: "VR Adventure | Pixel Pulse Play Zone Vaughan",
        metaDescription: META_DESCRIPTION,
        offersSubtitle:
          "VR sessions are being prepared for launch with a smaller, curated game list so every experience fits the arena setup.",
        featuredSubtitle: "A focused first wave of VR games selected for our launch setup.",
        libraryTitle: "Launch",
        libraryAccent: "Game Lineup",
        librarySubtitle:
          "Launch titles are limited while we tune the 4x4 metre arena experience. More games can be added after the rollout.",
        groupText:
          "Planning a birthday, group visit, or team outing? VR will launch as a focused add-on with game availability confirmed by our team.",
        finalText:
          "VR is almost ready. Check back soon or contact us to ask about launch availability for groups and birthdays.",
      }
    : null;

  return {
    metaTitle: launchCopy?.metaTitle || get(["metaTitle", "title"], META_TITLE),
    metaDescription: launchCopy?.metaDescription || get(["metaDescription", "description"], META_DESCRIPTION),
    canonical: get(["canonical", "canonicalUrl"], canonicalUrl("/vr")),
    ogImage: absoluteUrl(get(["ogImage", "shareImage", "backgroundImage"], PAGE_BG)),
    backgroundImage: localOrRemoteUrl(get(["backgroundImage", "pageBackgroundImage"], PAGE_BG), PAGE_BG),
    hero: {
      video: localOrRemoteUrl(get(["heroVideo", "backgroundVideo"], HERO_VIDEO), HERO_VIDEO),
      eyebrow: get(["heroEyebrow", "eyebrow"], "Pixel Pulse VR · Vaughan"),
      title: get(["heroTitle", "headline"], "VR Launch"),
      titleAccent: get(["heroTitleAccent", "headlineAccent"], "Coming Soon"),
      text: get(["heroText", "heroSubtitle", "subheadline"], "We are starting with a focused 4x4 metre VR arena lineup: Holomia, Party Ship, HunterVR, and Cops and Robbers."),
      primaryText: get(["heroPrimaryText", "heroCtaText"], "Book a VR Session"),
      primaryHref: get(["heroPrimaryHref", "heroCtaHref"], bookingUrl),
      primaryBookingType: get(["heroPrimaryBookingType", "heroBookingType"], "ticket"),
      secondaryText: get(["heroSecondaryText"], "Browse Experiences"),
      secondaryHref: get(["heroSecondaryHref"], "#experiences"),
      launchLabel: get(["launchLineupLabel", "launchStripLabel"], "Launch lineup"),
      launchGames: getLaunchGameNames(rows),
      stats: getStats(rows),
    },
    offersSection: {
      title: get(["offersTitle", "packagesTitle"], "Choose Your"),
      accent: get(["offersAccent", "packagesAccent"], "VR Session"),
      subtitle: launchCopy?.offersSubtitle || get(["offersSubtitle", "packagesSubtitle"], "Jump in for a quick adventure or stay longer to explore more worlds."),
      offers: getOffers(rows),
    },
    featuredSection: {
      title: get(["featuredTitle"], "Featured"),
      accent: get(["featuredAccent"], "This Month"),
      subtitle: launchCopy?.featuredSubtitle || get(["featuredSubtitle"], "The experiences our players keep coming back for."),
      games: getFeatured(rows),
    },
    librarySection: {
      title: launchCopy?.libraryTitle || get(["libraryTitle"], "Launch"),
      accent: launchCopy?.libraryAccent || get(["libraryAccent"], "Game Lineup"),
      subtitle: launchCopy?.librarySubtitle || get(["librarySubtitle"], "Dozens of worlds across every genre - powered by the Synthesis VR catalogue. Here's a taste of what's on rotation."),
      viewAllText: VR_LAUNCH_MODE ? "" : get(["libraryViewAllText", "viewAllText"], "View All Experiences"),
      viewAllHref: VR_LAUNCH_MODE ? "" : get(["libraryViewAllHref", "viewAllHref"], "https://games.synthesisvr.com/all"),
      categories: getCategories(rows),
    },
    groupCta: {
      title: get(["groupTitle", "groupCtaTitle"], "VR for Parties & Groups"),
      text: launchCopy?.groupText || get(["groupText", "groupCtaText"], "Birthdays, team outings, or just an unforgettable night with friends - book private arena time and take on the squad. Ask us about bundling VR with your party package."),
      ctaText: get(["groupCtaTextButton", "groupButtonText"], "Plan a Group Event"),
      href: get(["groupCtaHref", "groupHref"], "/contactus"),
    },
    faqSection: {
      title: get(["faqTitle"], "Good to"),
      accent: get(["faqAccent"], "Know"),
      faqs: getFaqs(rows),
    },
    finalCta: {
      title: get(["finalTitle", "finalCtaTitle"], "Ready to Step Inside?"),
      text: launchCopy?.finalText || get(["finalText", "finalCtaText"], "Reserve your arena, gather your squad, and play worlds you can walk into."),
      primaryText: get(["finalPrimaryText", "finalButtonText"], "Book a VR Session"),
      primaryHref: get(["finalPrimaryHref", "finalCtaHref"], bookingUrl),
      primaryBookingType: get(["finalPrimaryBookingType"], "ticket"),
      secondaryText: get(["finalSecondaryText"], "VR for Parties"),
      secondaryHref: get(["finalSecondaryHref"], "/birthday-party-bookings-vaughan"),
    },
  };
}

function SectionTitle({ title, accent }) {
  return (
    <h2 className="ppp-vr-section__title">
      {title} {accent ? <span>{accent}</span> : null}
    </h2>
  );
}

function ActionButton({ text, href, bookingType = "ticket", className = "" }) {
  if (!text) return null;

  if (!href) {
    return <BookingButton title={text} className={className} bookingType={bookingType} />;
  }

  if (/^https?:\/\//i.test(href)) {
    return (
      <a href={href} className={className} target="_blank" rel="noopener noreferrer">
        {text}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {text}
    </Link>
  );
}

export async function generateMetadata() {
  const rows = await getVrRows();
  const content = getVrContent(rows);

  return {
    title: content.metaTitle,
    description: content.metaDescription,
    alternates: {
      canonical: content.canonical,
    },
    openGraph: {
      title: content.metaTitle,
      description: content.metaDescription,
      url: content.canonical,
      images: [
        {
          url: content.ogImage,
          width: 1200,
          height: 630,
          alt: content.metaTitle,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: content.metaTitle,
      description: content.metaDescription,
      images: [content.ogImage],
    },
  };
}

export default async function VrPage() {
  const rows = await getVrRows();
  const content = getVrContent(rows);

  return (
    <main
      className={`ppp-vr-page${VR_LAUNCH_MODE ? " ppp-vr-page--launch" : ""}`}
      style={{ "--vr-page-bg": cssUrl(content.backgroundImage) }}
    >
      <section className="ppp-vr-hero">
        <video
          className="ppp-vr-hero__video"
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        >
          <source src={content.hero.video} type="video/mp4" />
        </video>
        <div className="ppp-vr-hero__scrim" aria-hidden="true" />
        <div className="ppp-vr-shell ppp-vr-hero__inner">
          {content.hero.eyebrow ? <span className="ppp-vr-eyebrow">{content.hero.eyebrow}</span> : null}
          <h1 className="ppp-vr-hero__title">
            {content.hero.title}
            {content.hero.titleAccent ? <span>{content.hero.titleAccent}</span> : null}
          </h1>
          {content.hero.text ? <p className="ppp-vr-hero__text">{content.hero.text}</p> : null}
          <div className="ppp-vr-hero__actions">
            <ActionButton
              text={content.hero.primaryText}
              href={content.hero.primaryHref}
              bookingType={content.hero.primaryBookingType}
              className="ppp-vr-btn ppp-vr-btn--primary"
            />
            <ActionButton
              text={content.hero.secondaryText}
              href={content.hero.secondaryHref}
              className="ppp-vr-btn ppp-vr-btn--ghost"
            />
          </div>
          {content.hero.stats.length ? (
            <div className="ppp-vr-stats">
              {content.hero.stats.map((stat, index) => (
                <div className="ppp-vr-stat" key={`${stat.value}-${stat.label}-${index}`}>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          ) : null}
          {VR_LAUNCH_MODE && content.hero.launchGames.length ? (
            <div className="ppp-vr-launch-strip" aria-label="VR launch games">
              {content.hero.launchLabel ? <span>{content.hero.launchLabel}</span> : null}
              {content.hero.launchGames.map((game) => (
                <strong key={game}>{game}</strong>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="ppp-vr-section">
        <div className="ppp-vr-shell">
          <div className="ppp-vr-section__head">
            <SectionTitle title={content.offersSection.title} accent={content.offersSection.accent} />
            {content.offersSection.subtitle ? (
              <p className="ppp-vr-section__sub">{content.offersSection.subtitle}</p>
            ) : null}
          </div>
          <div className="ppp-vr-offers">
            {content.offersSection.offers.map((offer, index) => (
              <article
                className={`ppp-vr-offer${offer.featured ? " ppp-vr-offer--featured" : ""}`}
                key={`${offer.title}-${index}`}
              >
                {offer.label ? <p className="ppp-vr-offer__label">{offer.label}</p> : null}
                {offer.title ? <h3 className="ppp-vr-offer__title">{offer.title}</h3> : null}
                {offer.desc ? <p className="ppp-vr-offer__desc">{offer.desc}</p> : null}
                {offer.price ? (
                  <p className="ppp-vr-offer__price">
                    {offer.price} {offer.priceSuffix ? <span>{offer.priceSuffix}</span> : null}
                  </p>
                ) : null}
                {Array.isArray(offer.items) && offer.items.length ? (
                  <ul className="ppp-vr-offer__list">
                    {offer.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
                <ActionButton
                  text={offer.buttonText}
                  href={offer.href}
                  bookingType={offer.bookingType}
                  className="ppp-vr-btn ppp-vr-btn--primary ppp-vr-offer__btn"
                />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ppp-vr-section">
        <div className="ppp-vr-shell">
          <div className="ppp-vr-section__head">
            <SectionTitle title={content.featuredSection.title} accent={content.featuredSection.accent} />
            {content.featuredSection.subtitle ? (
              <p className="ppp-vr-section__sub">{content.featuredSection.subtitle}</p>
            ) : null}
          </div>
          <div className="ppp-vr-featured">
            {content.featuredSection.games.map((game, index) => (
              <article className="ppp-vr-spotlight" key={`${game.title}-${index}`}>
                <div className="ppp-vr-spotlight__bg" aria-hidden="true" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="ppp-vr-spotlight__img" src={game.img} alt={game.title} loading="lazy" />
                {game.flag ? <span className="ppp-vr-spotlight__flag">{game.flag}</span> : null}
                <h3 className="ppp-vr-spotlight__title">{game.title}</h3>
                {game.desc ? <p className="ppp-vr-spotlight__desc">{game.desc}</p> : null}
                {Array.isArray(game.tags) && game.tags.length ? (
                  <div className="ppp-vr-tags">
                    {game.tags.map((tag) => (
                      <span className="ppp-vr-tag" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ppp-vr-section" id="experiences">
        <div className="ppp-vr-shell">
          <div className="ppp-vr-section__head">
            <SectionTitle title={content.librarySection.title} accent={content.librarySection.accent} />
            {content.librarySection.subtitle ? (
              <p className="ppp-vr-section__sub">{content.librarySection.subtitle}</p>
            ) : null}
          </div>

          <VrLibrary categories={content.librarySection.categories} />

          {content.librarySection.viewAllText && content.librarySection.viewAllHref ? (
            <div className="ppp-vr-more">
              <a
                href={content.librarySection.viewAllHref}
                className="ppp-vr-btn ppp-vr-btn--ghost"
                target="_blank"
                rel="noopener noreferrer"
              >
                {content.librarySection.viewAllText}
              </a>
            </div>
          ) : null}
        </div>
      </section>

      <div className="ppp-vr-shell">
        <section className="ppp-vr-band">
          <div className="ppp-vr-band__inner">
            <div>
              {content.groupCta.title ? <h2 className="ppp-vr-band__title">{content.groupCta.title}</h2> : null}
              {content.groupCta.text ? <p className="ppp-vr-band__text">{content.groupCta.text}</p> : null}
            </div>
            <ActionButton
              text={content.groupCta.ctaText}
              href={content.groupCta.href}
              className="ppp-vr-btn ppp-vr-btn--ghost"
            />
          </div>
        </section>
      </div>

      <section className="ppp-vr-section">
        <div className="ppp-vr-shell">
          <div className="ppp-vr-section__head">
            <SectionTitle title={content.faqSection.title} accent={content.faqSection.accent} />
          </div>
          <div className="ppp-vr-faq">
            {content.faqSection.faqs.map((faq, index) => (
              <div className="ppp-vr-faq__item" key={`${faq.q}-${index}`}>
                <h3 className="ppp-vr-faq__q">{faq.q}</h3>
                <p className="ppp-vr-faq__a">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="ppp-vr-final">
        <div className="ppp-vr-shell">
          {content.finalCta.title ? <h2 className="ppp-vr-final__title">{content.finalCta.title}</h2> : null}
          {content.finalCta.text ? <p className="ppp-vr-section__sub">{content.finalCta.text}</p> : null}
          <div className="ppp-vr-final__actions">
            <ActionButton
              text={content.finalCta.primaryText}
              href={content.finalCta.primaryHref}
              bookingType={content.finalCta.primaryBookingType}
              className="ppp-vr-btn ppp-vr-btn--primary"
            />
            <ActionButton
              text={content.finalCta.secondaryText}
              href={content.finalCta.secondaryHref}
              className="ppp-vr-btn ppp-vr-btn--ghost"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
