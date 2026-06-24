import "./styles/home.css";
import "./styles/pagenew.css";
import "./styles/promotions.css";
import Image from "next/image";
import Link from "next/link";
import { getDataByParentId } from "@/utils/customFunctions";
import MotionImage from "@/components/MotionImage";
import BlogCard from "@/components/smallComponents/BlogCard";
import {
  fetchsheetdata,
  fetchMenuData,
  getWaiverLink,
  generateMetadataLib,
} from "@/lib/sheets";
import { LOCATION_NAME } from "./lib/constant";
import SectionHeading from "./components/home/SectionHeading";
import BookingButton from "./components/smallComponents/BookingButton";
import PromotionModal from "./components/model/PromotionModal";
import { getConfiguredValue, getConfigValue, getCtaContent } from "@/lib/ctaContent";
import { safeImageUrl } from "@/lib/seo";

export const revalidate = 900;

const SITE_DATA_GOOGLE_SHEET_ID = "1NEovNJVBVY4LyXWg3nHFh5-LekMt8GfL4y4eaNz7X1I";
const SITE_DATA_SHEET_NAMES = [
  "hero",
  "howItWorks",
  "howItWorksMeta",
  "games",
  "gamesMeta",
  "whyUsMeta",
  "whyUs",
  "useCases",
  "pricing",
  "pricingMeta",
  "leaderboard",
  "promotions",
  "testimonials",
  "location",
  "cta",
];

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
    ?.replace(/&/g, "and")
    ?.replace(/[^a-z0-9]+/g, "-")
    ?.replace(/^-+|-+$/g, "");
}

function findHomepageAttractionItem(game, attractionChildren = []) {
  const gameKeys = [
    game?.id,
    game?.name,
  ]
    .map(normalizeAttractionKey)
    .filter(Boolean);

  return (
    attractionChildren.find((item) => {
      const itemKeys = [
        item?.path,
        item?.pageid,
        item?.metatitle,
        item?.desc,
      ]
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

const emptySiteData = {
  hero: {
    headline: "",
    headlineSub: "",
    subheadline: "",
    ctaPrimary: "",
    ctaPrimaryHref: "",
    ctaSecondary: "",
    partyCtaText: "",
    partyCtaHref: "",
    urgencyStrip: "",
    trust: [],
  },
  howItWorks: {
    cta: "",
    ctaButton: "",
    title: "",
    accent: "",
    subtitle: "",
    steps: [],
  },
  games: [],
  gamesMeta: {
    title: "",
    accent: "",
    subtitle: "",
  },
  whyUs: [],
  whyUsMeta: {
    title: "",
    accent: "",
    subtitle: "",
  },
  useCases: [],
  pricing: [],
  pricingCta: {
    text: "",
    button: "",
    bookingType: "ticket",
  },
  cta: {
    pricingText: "",
    pricingHref: "",
    articlesText: "",
    articlesHref: "",
    findLocationText: "",
    claimOfferText: "",
    learnMoreText: "",
    pricingSecondaryText: "",
    pricingSecondaryBookingType: "ticket",
  },
  leaderboard: [],
  promotions: [],
  testimonials: [],
  location: {
    title: "",
    address: "",
    walkIn: "",
    mapsLink: "",
    finalStrip: "",
  },
};

function googleSheetCsvUrl(sheetName) {
  return `https://docs.google.com/spreadsheets/d/${SITE_DATA_GOOGLE_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
}

function parseCsv(csv) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < csv.length; i += 1) {
    const char = csv[i];
    const nextChar = csv[i + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      value += '"';
      i += 1;
    } else if (char === '"') {
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

async function fetchGoogleSheetRows(sheetName) {
  const response = await fetch(googleSheetCsvUrl(sheetName), {
    next: { revalidate: 900 },
  });
  if (!response.ok) {
    console.warn(`Optional Google Sheet tab not loaded: ${sheetName}`);
    return [];
  }
  return parseCsv(await response.text());
}

async function fetchGoogleSiteDataSheets() {
  const entries = await Promise.all(
    SITE_DATA_SHEET_NAMES.map(async (sheetName) => [
      sheetName,
      await fetchGoogleSheetRows(sheetName).catch((error) => {
        console.warn(`Optional Google Sheet tab failed: ${sheetName} (${error.message})`);
        return [];
      }),
    ]),
  );

  return Object.fromEntries(entries);
}

function rowsFromSheet(sheets, sheetName) {
  return sheets[sheetName] || [];
}

function keyValueSheet(sheets, sheetName) {
  return rowsFromSheet(sheets, sheetName).reduce((acc, row) => {
    if (row.field) acc[row.field] = row.value;
    return acc;
  }, {});
}

function splitList(value) {
  return String(value || "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseBool(value) {
  return ["true", "yes", "1"].includes(String(value).trim().toLowerCase());
}

function parseSheetBool(value, fallback = true) {
  const normalizedValue = String(value ?? "").trim().toLowerCase();
  if (!normalizedValue) return fallback;

  if (["true", "yes", "1", "show", "visible", "enabled", "on"].includes(normalizedValue)) {
    return true;
  }

  if (["false", "no", "0", "hide", "hidden", "disabled", "off"].includes(normalizedValue)) {
    return false;
  }

  return fallback;
}

function parsePositiveInteger(value) {
  const parsed = Number.parseInt(String(value ?? "").trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseRating(value, fallback = 5) {
  const rating = Number(value || fallback);
  if (!Number.isFinite(rating)) return fallback;
  return Math.min(5, Math.max(0, Math.round(rating)));
}

function parseVisibleFlag(value, fallback = true) {
  const normalizedValue = String(value ?? "").trim().toLowerCase();
  if (!normalizedValue) {
    return fallback;
  }

  if (["true", "yes", "1", "show", "visible", "enabled"].includes(normalizedValue)) {
    return true;
  }

  if (["false", "no", "0", "hide", "hidden", "disabled"].includes(normalizedValue)) {
    return false;
  }

  return fallback;
}

function configValue(configData, key) {
  return getConfigValue(configData, [key]);
}

function hasSheetField(sheet, field) {
  return Object.prototype.hasOwnProperty.call(sheet, field);
}

function sheetValue(sheet, field) {
  return hasSheetField(sheet, field) ? sheet[field] : "";
}

function keyValueDataFromSheet(sheet, fields) {
  return fields.reduce((acc, field) => {
    acc[field] = sheetValue(sheet, field);
    return acc;
  }, {});
}

function parseSiteDataSheets(sheets) {
  const hero = keyValueSheet(sheets, "hero");
  const howCta = keyValueSheet(sheets, "howItWorksMeta");
  const gamesMeta = keyValueSheet(sheets, "gamesMeta");
  const whyUsMeta = keyValueSheet(sheets, "whyUsMeta");
  const location = keyValueSheet(sheets, "location");
  const pricingMeta = keyValueSheet(sheets, "pricingMeta");
  const cta = keyValueSheet(sheets, "cta");
  const heroData = keyValueDataFromSheet(hero, Object.keys(emptySiteData.hero));
  const locationData = keyValueDataFromSheet(location, Object.keys(emptySiteData.location));

  return {
    hero: {
      ...heroData,
      trust: heroData.trust ? splitList(heroData.trust) : [],
    },
    howItWorks: {
      title: sheetValue(howCta, "title"),
      accent: sheetValue(howCta, "accent"),
      subtitle: sheetValue(howCta, "subtitle"),
      cta: sheetValue(howCta, "cta"),
      ctaButton: sheetValue(howCta, "ctaButton"),
      steps: rowsFromSheet(sheets, "howItWorks").map((row) => ({
        n: String(row.n || ""),
        title: String(row.title || ""),
        desc: String(row.desc || ""),
      })).filter((row) => row.title || row.desc),
    },
    games: rowsFromSheet(sheets, "games").map((row) => {
      const image = row.image || row.imageUrl || row.imageurl || row.image_url || row.smallimage || row.headerimage;

      return {
        id: String(row.id || ""),
        name: String(row.name || ""),
        tag: String(row.tag || ""),
        diff: Number(row.diff || 0),
        bestFor: String(row.bestFor || ""),
        color: String(row.color || ""),
        emoji: String(row.emoji || ""),
        image: image ? safeImageUrl(image) : "",
        imageAlt: String(row.imageAlt || row.imagealt || row.image_alt || ""),
        link: String(row.link || row.url || row.href || ""),
      };
    }).filter((row) => row.name || row.tag),
    gamesMeta: {
      title: sheetValue(gamesMeta, "title"),
      accent: sheetValue(gamesMeta, "accent"),
      subtitle: sheetValue(gamesMeta, "subtitle"),
    },
    whyUsMeta: {
      title: sheetValue(whyUsMeta, "title"),
      accent: sheetValue(whyUsMeta, "accent"),
      subtitle: sheetValue(whyUsMeta, "subtitle"),
    },
    whyUs: rowsFromSheet(sheets, "whyUs").map((row) => ({
      icon: String(row.icon || ""),
      title: String(row.title || ""),
      desc: String(row.desc || ""),
    })).filter((row) => row.title || row.desc),
    useCases: rowsFromSheet(sheets, "useCases").map((row) => ({
      icon: String(row.icon || ""),
      title: String(row.title || ""),
      sub: String(row.sub || ""),
      cta: String(row.cta || ""),
      linktext: String(row.linktext || row.linkText || row.link_text || ""),
      link: String(row.link || row.url || row.href || ""),
      linktitle: String(row.linktitle || row.linkTitle || row.link_title || ""),
    })).filter((row) => row.title || row.sub),
    pricing: rowsFromSheet(sheets, "pricing").map((row) => ({
      id: String(row.id || ""),
      name: String(row.name || ""),
      duration: String(row.duration || ""),
      price: String(row.price || ""),
      tag: String(row.tag || ""),
      features: splitList(row.features),
      cta: String(row.cta || ""),
      highlight: parseBool(row.highlight),
      note: String(row.note || ""),
    })).filter((row) => row.name || row.price),
    pricingCta: {
      text: sheetValue(pricingMeta, "ctaText"),
      button: sheetValue(pricingMeta, "ctaButton"),
      bookingType: sheetValue(pricingMeta, "ctaBookingType") || "ticket",
    },
    cta: {
      pricingText: sheetValue(cta, "pricingText"),
      pricingHref: sheetValue(cta, "pricingHref"),
      articlesText: sheetValue(cta, "articlesText"),
      articlesHref: sheetValue(cta, "articlesHref"),
      findLocationText: sheetValue(cta, "findLocationText"),
      claimOfferText: sheetValue(cta, "claimOfferText"),
      learnMoreText: sheetValue(cta, "learnMoreText"),
      pricingSecondaryText: sheetValue(cta, "pricingSecondaryText"),
      pricingSecondaryBookingType:
        sheetValue(cta, "pricingSecondaryBookingType") || "ticket",
    },
    leaderboard: rowsFromSheet(sheets, "leaderboard").map((row) => ({
      rank: String(row.rank || ""),
      name: String(row.name || ""),
      game: String(row.game || ""),
      score: String(row.score || ""),
      time: String(row.time || ""),
    })).filter((row) => row.name || row.game || row.score),
    promotions: rowsFromSheet(sheets, "promotions").map((row) => ({
      tag: String(row.tag || row.badge || ""),
      title: String(row.title || ""),
      desc: String(row.desc || row.description || ""),
      code: String(row.code || ""),
      valid: String(row.valid || row.validity || row.validUntil || row.valid_until || ""),
      linktext: String(row.linktext || row.linkText || row.link_text || ""),
      link: String(row.link || row.url || row.href || ""),
      linktitle: String(row.linktitle || row.linkTitle || row.link_title || ""),
      image: String(
        row.image ||
        row.imageUrl ||
        row.imageurl ||
        row.image_url ||
        row.cardImage ||
        row.card_image ||
        row.promoImage ||
        row.promo_image ||
        row.promotionImage ||
        row.promotion_image ||
        row.currentImage ||
        row.current_image ||
        row.currentPromotionImage ||
        row.current_promotion_image ||
        row.thumbnail ||
        row.smallimage ||
        row.headerimage ||
        "",
      ),
      imageAlt: String(row.imageAlt || row.imagealt || row.image_alt || row.alt || ""),
      showInMarquee: parseSheetBool(
        row.showInMarquee ??
        row.show_in_marquee ??
        row.marquee ??
        row.showMarquee ??
        row.show_marquee ??
        row.includeInMarquee ??
        row.include_in_marquee,
        true,
      ),
      showOnHome: parseSheetBool(
        row.showOnHome ??
        row.show_on_home ??
        row.showOnHomepage ??
        row.show_on_homepage ??
        row.homepage ??
        row.homePage ??
        row.home_page ??
        row.showHomepage ??
        row.show_homepage,
        true,
      ),
      marqueeOrder: parsePositiveInteger(row.marqueeOrder || row.marquee_order || row.order),
      marqueeLimit: parsePositiveInteger(
        row.marqueeLimit ||
        row.marquee_limit ||
        row.marqueeCount ||
        row.marquee_count ||
        row.promotionMarqueeLimit ||
        row.promotion_marquee_limit,
      ),
    })).filter((row) => row.title || row.desc),
    testimonials: rowsFromSheet(sheets, "testimonials").map((row) => ({
      name: String(row.name || ""),
      role: String(row.role || ""),
      quote: String(row.quote || ""),
      rating: parseRating(row.rating || row.stars),
    })).filter((row) => row.name || row.quote),
    location: locationData,
  };
}

function renderHighlightedPromoText(value = "") {
  return String(value || "")
    .split(/(\bnew\b|\bcode\b)/gi)
    .map((part, index) => {
      if (/^(new|code)$/i.test(part)) {
        return (
          <span className="ppp-promo-highlight" key={`${part}-${index}`}>
            {part}
          </span>
        );
      }

      return part;
    });
}

function getPromotionMarqueeLimit(promotions = [], configData = []) {
  const rowLimit = promotions.map((promotion) => promotion.marqueeLimit).find(Boolean);
  if (rowLimit) return rowLimit;

  return parsePositiveInteger(
    getConfigValue(configData, [
      "promotionMarqueeLimit",
      "promoMarqueeLimit",
      "marqueePromotionLimit",
      "marqueePromotionCount",
      "homePromotionMarqueeLimit",
    ]),
  );
}

function getPromotionMarqueeItems(promotions = [], claimOfferText = "", limit = null) {
  const sortedPromotions = [...promotions].sort((first, second) => {
    const firstOrder = first.marqueeOrder || Number.MAX_SAFE_INTEGER;
    const secondOrder = second.marqueeOrder || Number.MAX_SAFE_INTEGER;
    return firstOrder - secondOrder;
  });

  const marqueePromotions = sortedPromotions
    .filter((promotion) => promotion.showInMarquee !== false)
    .slice(0, limit || sortedPromotions.length);

  return marqueePromotions
    .map((promotion) => {
      const messageParts = [
        promotion.tag,
        promotion.title,
        promotion.desc,
        promotion.valid,
        promotion.code ? `Code: ${promotion.code}` : "",
      ].filter(Boolean);

      if (!messageParts.length) return null;

      return {
        message: messageParts.join(" | "),
        link: promotion.link,
        linktext: promotion.linktext || claimOfferText,
        linktitle: promotion.linktitle || promotion.linktext || claimOfferText || promotion.title,
      };
    })
    .filter(Boolean);
}

function PromotionHeroMarquee({ promotions = [] }) {
  if (!promotions.length) return null;

  const marqueeItems = promotions.map((promotion, index) => {
    const hasLink = Boolean(promotion.link && promotion.linktext);
    const isExternalLink = hasLink && promotion.link.startsWith("http");

    return (
      <span className="ppp-promo-marquee__item" key={`${promotion.message}-${index}`}>
        <span className="ppp-promo-marquee__message">
          {renderHighlightedPromoText(promotion.message)}
        </span>
        {hasLink && (
          <Link
            href={promotion.link}
            className="ppp-promo-marquee__link"
            target={isExternalLink ? "_blank" : undefined}
            rel={isExternalLink ? "noopener noreferrer" : undefined}
            title={promotion.linktitle || undefined}
            aria-label={promotion.linktitle || promotion.linktext}
            prefetch={!isExternalLink}
          >
            {promotion.linktext}
          </Link>
        )}
      </span>
    );
  });

  const hiddenMarqueeItems = promotions.map((promotion, index) => (
    <span
      className="ppp-promo-marquee__item"
      key={`${promotion.message}-duplicate-${index}`}
      aria-hidden="true"
    >
      <span className="ppp-promo-marquee__message">
        {renderHighlightedPromoText(promotion.message)}
      </span>
      {promotion.link && promotion.linktext && (
        <span className="ppp-promo-marquee__link">{promotion.linktext}</span>
      )}
    </span>
  ));

  const itemGroupStyle = {
    "--ppp-promo-marquee-count": promotions.length,
  };

  return (
    <section className="ppp-promo-marquee" aria-label="Current promotions">
      <div className="ppp-promo-marquee__track" style={itemGroupStyle}>
        {marqueeItems}
        {hiddenMarqueeItems}
      </div>
    </section>
  );
}

export async function generateMetadata() {
  const location_slug = LOCATION_NAME || "vaughan";
  try {
    const metadata = await generateMetadataLib({
      location: location_slug,
      category: "",
      page: "",
    });
    return metadata;
  } catch (error) {
    console.error("home metadata failed:", error);
    return {
      title: "Pixel Pulse Play Vaughan",
      description: "Indoor arcade games, challenge rooms, and family fun in Vaughan.",
    };
  }
}

/* ─── JSON-LD schema updated for Vaughan ─── */
const pixelPulseSchema = {
  "@context": "https://schema.org",
  "@type": "AmusementPark",
  name: "Pixel Pulse Play Vaughan",
  description:
    "Indoor game rooms in Vaughan with laser mazes, tile challenges, climbing, sports games, birthday parties, and group bookings.",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Vaughan",
    addressRegion: "ON",
    addressCountry: "Canada",
  },
  priceRange: "$$",
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    reviewCount: "5000",
  },
  sameAs: [
    "https://www.facebook.com/pixelpulseplay",
    "https://www.instagram.com/pixelpulseplay",
  ],
};

const Home = async () => {
  const location_slug = LOCATION_NAME;

  let waiverLink = "";
  let data = [];
  let dataconfig = [];
  let siteData = emptySiteData;

  try {
    [waiverLink, data, dataconfig, siteData] = await Promise.all([
      getWaiverLink(location_slug),
      fetchMenuData(location_slug),
      fetchsheetdata("config", location_slug),
      fetchGoogleSiteDataSheets().then(parseSiteDataSheets),
    ]);
  } catch (error) {
    console.error("home page data failed:", error);
  }

  const homepageSection1 = configValue(dataconfig, "homepageSection1");
  const homepageIntroHeading = configValue(dataconfig, "homepageIntroHeading");
  const homepageIntroHeadingAccent = configValue(dataconfig, "homepageIntroHeadingAccent");
  const showHomepageIntro = parseVisibleFlag(
    configValue(dataconfig, "homepageIntroVisible") ||
      configValue(dataconfig, "homepageIntroShow"),
    true
  );
  const promotionPopup = Array.isArray(dataconfig)
    ? dataconfig.filter((item) => item.key === "promotion-popup")
    : [];
  const header_image = Array.isArray(data)
    ? data.filter((item) => item.path === "home")
    : [];

  const safeHeaderImage = header_image
    ? JSON.parse(JSON.stringify(header_image))
    : {};

  const attractionsData = Array.isArray(data)
    ? getDataByParentId(data, "attractions") || []
    : [];
  const attractionChildren =
    attractionsData?.[0]?.children?.filter((item) => item?.isactive == 1) || [];

  const blogsData = Array.isArray(data)
    ? getDataByParentId(data, "blogs") || []
    : [];
  const blogSectionHeading =
    blogsData?.[0]?.headerimagetitle || "Tips before you visit";
  const configCta = getCtaContent(dataconfig);
  const ctaContent = {
    ...siteData.cta,
    ...Object.fromEntries(
      Object.entries(configCta).filter(([, value]) => Boolean(value)),
    ),
  };
  const whyUsHeading = {
    title:
      siteData.whyUsMeta.title ||
      getConfigValue(dataconfig, ["whyUsTitle", "whyUsHeadingTitle"]),
    accent:
      siteData.whyUsMeta.accent ||
      getConfigValue(dataconfig, ["whyUsAccent", "whyUsHeadingAccent"]),
    subtitle:
      siteData.whyUsMeta.subtitle ||
      getConfigValue(dataconfig, ["whyUsSubtitle"]),
  };
  const gamesHeading = {
    title:
      siteData.gamesMeta.title ||
      getConfigValue(dataconfig, ["gamesTitle", "gamesHeadingTitle"]),
    accent:
      siteData.gamesMeta.accent ||
      getConfigValue(dataconfig, ["gamesAccent", "gamesHeadingAccent"]),
    subtitle:
      siteData.gamesMeta.subtitle ||
      getConfigValue(dataconfig, ["gamesSubtitle"]),
  };
  const homepageConfigSources = [dataconfig];
  const heroData = {
    ...siteData.hero,
    ctaPrimary:
      siteData.hero.ctaPrimary ||
      getConfiguredValue(
        homepageConfigSources,
        ["heroCtaPrimary", "heroCtaButton", "homeHeroCtaPrimary"],
        ctaContent.bookNowText,
      ),
    ctaPrimaryHref:
      siteData.hero.ctaPrimaryHref ||
      getConfiguredValue(
        homepageConfigSources,
        ["heroCtaPrimaryHref", "homeHeroCtaPrimaryHref", "heroCtaButtonHref"],
      ),
    ctaSecondary:
      siteData.hero.ctaSecondary ||
      getConfigValue(dataconfig, ["heroCtaSecondary", "homeHeroCtaSecondary"]),
    ctaSecondaryHref: getConfiguredValue(
      homepageConfigSources,
      ["heroCtaSecondaryHref", "homeHeroCtaSecondaryHref"],
      "/attractions",
    ),
    partyCtaText:
      siteData.hero.partyCtaText ||
      getConfiguredValue(
        homepageConfigSources,
        ["heroPartyCtaText", "homeHeroPartyCtaText", "heroBookPartyText"],
      ),
    partyCtaHref:
      siteData.hero.partyCtaHref ||
      getConfiguredValue(
        homepageConfigSources,
        ["heroPartyCtaHref", "homeHeroPartyCtaHref", "heroBookPartyHref"],
      ),
    urgencyStrip:
      siteData.hero.urgencyStrip ||
      getConfigValue(dataconfig, ["heroUrgencyStrip", "homeHeroUrgencyStrip"]),
  };
  const isHeroCtaPrimaryExternal = /^https?:\/\//i.test(heroData.ctaPrimaryHref);
  const howItWorksCta = {
    text:
      siteData.howItWorks.cta ||
      getConfigValue(dataconfig, ["howItWorksCtaText", "howItWorksCta"]),
    button:
      siteData.howItWorks.ctaButton ||
      getConfigValue(dataconfig, ["howItWorksCtaButton", "howItWorksButton"]),
    bookingType: getConfiguredValue(
      homepageConfigSources,
      ["howItWorksCtaBookingType"],
      "ticket",
    ),
  };
  const howItWorksHeading = {
    title:
      siteData.howItWorks.title ||
      getConfigValue(dataconfig, ["howItWorksTitle", "howItWorksHeadingTitle"]),
    accent:
      siteData.howItWorks.accent ||
      getConfigValue(dataconfig, ["howItWorksAccent", "howItWorksHeadingAccent"]),
    subtitle:
      siteData.howItWorks.subtitle ||
      getConfigValue(dataconfig, ["howItWorksSubtitle", "howItWorksSubheading"]),
  };
  const pricingCta = {
    text:
      siteData.pricingCta.text ||
      getConfigValue(dataconfig, ["pricingCtaText", "pricingTipText"]),
    button:
      siteData.pricingCta.button ||
      getConfigValue(dataconfig, ["pricingCtaButton", "pricingTipButton"]),
    bookingType:
      siteData.pricingCta.bookingType ||
      getConfiguredValue(homepageConfigSources, ["pricingCtaBookingType"], "ticket"),
  };
  const pricingHeading = {
    title: getConfigValue(dataconfig, ["pricingTitle", "pricingHeadingTitle"]),
    accent: getConfigValue(dataconfig, ["pricingAccent", "pricingHeadingAccent"]),
    subtitle: getConfigValue(dataconfig, ["pricingSubtitle"]),
  };
  const promotionsHeading = {
    title: ctaContent.promotionsHeading || getConfigValue(dataconfig, ["promotionsTitle"]),
    accent:
      ctaContent.promotionsHeadingAccent ||
      getConfigValue(dataconfig, ["promotionsAccent"]),
    subtitle: ctaContent.promotionsIntro,
  };
  const useCasesHeading = {
    title: getConfigValue(dataconfig, ["useCasesTitle", "useCasesHeadingTitle"]),
    accent: getConfigValue(dataconfig, ["useCasesAccent", "useCasesHeadingAccent"]),
    subtitle: getConfigValue(dataconfig, ["useCasesSubtitle"]),
  };
  const leaderboardHeading = {
    title: getConfiguredValue(
      homepageConfigSources,
      ["leaderboardTitle", "leaderboardHeadingTitle"],
      "Top Players",
    ),
    accent: getConfiguredValue(
      homepageConfigSources,
      ["leaderboardAccent", "leaderboardHeadingAccent"],
      "This Week",
    ),
    subtitle: getConfigValue(dataconfig, ["leaderboardSubtitle"]),
  };
  const whyUsCta = {
    text: getConfigValue(dataconfig, ["whyUsCtaText"]),
    button: getConfigValue(dataconfig, ["whyUsCtaButton"]),
    href: getConfigValue(dataconfig, ["whyUsCtaHref"]),
    bookingType: getConfiguredValue(homepageConfigSources, ["whyUsCtaBookingType"], "ticket"),
  };
  const isWhyUsCtaExternal = /^https?:\/\//i.test(whyUsCta.href);
  const pricingHref = ctaContent.pricingHref || "/pricing-promos";
  const articlesHref = ctaContent.articlesHref || "/blogs";
  const promotionMarqueeLimit = getPromotionMarqueeLimit(siteData.promotions, dataconfig);
  const promotionMarqueeItems = getPromotionMarqueeItems(
    siteData.promotions,
    ctaContent.claimOfferText,
    promotionMarqueeLimit,
  );
  const homepagePromotions = siteData.promotions.filter((promo) => promo.showOnHome !== false);
  const homepageGames = siteData.games.map((game) => {
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

  return (
    <main className="ppp-home">
      <PromotionModal
        promotionPopup={promotionPopup}
        delayMs={5000}
        claimOfferText={ctaContent.claimOfferText}
      />

      {/* ── Hero ── */}
      <PromotionHeroMarquee promotions={promotionMarqueeItems} />
      <MotionImage pageData={safeHeaderImage} heroData={heroData} waiverLink={waiverLink} />

      {(heroData.urgencyStrip || heroData.ctaPrimary) && (
      <section className="ppp-mini-cta">
        <div className="aero-max-container ppp-mini-cta__inner">
          {heroData.urgencyStrip && <p>{heroData.urgencyStrip}</p>}
          {heroData.ctaPrimary && heroData.ctaPrimaryHref ? (
            <a
              href={heroData.ctaPrimaryHref}
              className="ppp-btn ppp-btn--primary"
              target={isHeroCtaPrimaryExternal ? "_blank" : undefined}
              rel={isHeroCtaPrimaryExternal ? "noopener noreferrer" : undefined}
            >
              {heroData.ctaPrimary}
            </a>
          ) : heroData.ctaPrimary ? (
            <BookingButton title={heroData.ctaPrimary} className="ppp-btn ppp-btn--primary" bookingType="ticket" />
          ) : null}
        </div>
      </section>
      )}

      {siteData.howItWorks.steps.length > 0 && (
      <section className="ppp-section ppp-how">
        <div className="aero-max-container">
          {(howItWorksHeading.title || howItWorksHeading.accent) && (
            <SectionHeading>
              {howItWorksHeading.title} {howItWorksHeading.accent && <span>{howItWorksHeading.accent}</span>}
            </SectionHeading>
          )}
          {howItWorksHeading.subtitle && (
            <p className="ppp-section__sub">{howItWorksHeading.subtitle}</p>
          )}

          <ol className="ppp-how__grid">
            {siteData.howItWorks.steps.map((step, index) => {
              const normalizedStepTitle = String(step.title || "").toLowerCase();
              const isArenaStep = normalizedStepTitle.includes("enter the arena");
              const isPlayCompeteStep =
                normalizedStepTitle.includes("play") &&
                (normalizedStepTitle.includes("compete") ||
                  normalizedStepTitle.includes("complete"));
              const isBeatGameStep =
                normalizedStepTitle.includes("beat") &&
                normalizedStepTitle.includes("game");
              const cardClassName = [
                "ppp-how__card",
                isArenaStep ? "ppp-how__card--arena" : "",
                isPlayCompeteStep ? "ppp-how__card--play-compete" : "",
                isBeatGameStep ? "ppp-how__card--beat-game" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
              <li
                key={step.title}
                className={cardClassName}
              >
                <span className="ppp-how__watermark">{step.n || index + 1}</span>
                <span className="ppp-how__number">{step.n || index + 1}</span>
                <h3 className="ppp-how__title">{step.title}</h3>
                <p className="ppp-how__desc">{step.desc}</p>
              </li>
              );
            })}
          </ol>
        </div>
      </section>
      )}

      {howItWorksCta.text && (
      <section className="ppp-mini-cta">
        <div className="aero-max-container ppp-mini-cta__inner">
          <p>{howItWorksCta.text}</p>
          <div className="ppp-mini-cta__actions">
            {howItWorksCta.button && (
              <BookingButton title={howItWorksCta.button} className="ppp-btn ppp-btn--primary" bookingType={howItWorksCta.bookingType} />
            )}
            {ctaContent.pricingText && (
              <Link href={pricingHref} className="ppp-btn ppp-btn--outline" prefetch>
                {ctaContent.pricingText}
              </Link>
            )}
          </div>
        </div>
      </section>
      )}

      {/* ── Intro section ── */}
      {showHomepageIntro && (homepageIntroHeading || homepageIntroHeadingAccent || homepageSection1) && (
      <section className="ppp-intro">
        <div className="aero-max-container ppp-intro__inner">
          {(homepageIntroHeading || homepageIntroHeadingAccent) && (
            <SectionHeading>
              {homepageIntroHeadingAccent && <span>{homepageIntroHeadingAccent}</span>}
              {homepageIntroHeadingAccent && homepageIntroHeading && <br />}
              {homepageIntroHeading}
            </SectionHeading>
          )}
          {homepageSection1 && <p className="ppp-intro__body">{homepageSection1}</p>}
        </div>
      </section>
      )}

      {/* ── Attractions grid ── */}
      {homepageGames.length > 0 && (
        <section className="ppp-section ppp-attractions">
          <div className="aero-max-container">
            {(gamesHeading.title || gamesHeading.accent) && (
              <SectionHeading>
                {gamesHeading.title} {gamesHeading.accent && <span>{gamesHeading.accent}</span>}
              </SectionHeading>
            )}
            {gamesHeading.subtitle && (
              <p className="ppp-section__sub">{gamesHeading.subtitle}</p>
            )}
            <ul className="ppp-attractions__grid ppp-attractions__carousel" aria-label="All game rooms">
              {homepageGames.map(({ title, body, meta, image, imageAlt, href }, i) => {
                return (
                <li key={i} className="ppp-attractions__item">
                  <Link
                    href={href}
                    target={href.startsWith("http") ? "_blank" : undefined}
                    rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                    prefetch={!href.startsWith("http")}
                  >
                    <article className="ppp-attraction-card">
                      <figure className="ppp-attraction-card__fig">
                        {image && (
                          <Image
                            src={image}
                            width={400}
                            height={260}
                            alt={imageAlt || title}
                            unoptimized
                            className="ppp-attraction-card__img"
                          />
                        )}
                        <div className="ppp-attraction-card__overlay">
                          <h3 className="ppp-attraction-card__title">
                            {title}
                          </h3>
                          {body && <p className="ppp-attraction-card__body">{body}</p>}
                          {meta && <span className="ppp-attraction-card__meta">{meta}</span>}
                        </div>
                      </figure>
                    </article>
                  </Link>
                </li>
              );
              })}
            </ul>

          </div>
        </section>
      )}

      {siteData.pricing.length > 0 && (pricingCta.text || pricingCta.button) && (
      <section className="ppp-mini-cta ppp-pricing__tip">
        <div className="aero-max-container ppp-mini-cta__inner">
          {pricingCta.text && <p>{pricingCta.text}</p>}
          <div className="ppp-mini-cta__actions">
            {pricingCta.button && (
              <BookingButton
                title={pricingCta.button}
                className="ppp-btn ppp-btn--primary"
                bookingType={pricingCta.bookingType}
              />
            )}
            {ctaContent.pricingSecondaryText && (
              <BookingButton
                title={ctaContent.pricingSecondaryText}
                className="ppp-btn ppp-btn--primary"
                bookingType={ctaContent.pricingSecondaryBookingType}
              />
            )}
          </div>
        </div>
      </section>
      )}

      {/* ── Why Pixel Pulse ── */}
      {siteData.whyUs.length > 0 && (
      <section className="ppp-section ppp-why">
        <div className="aero-max-container">
          {(whyUsHeading.title || whyUsHeading.accent) && (
            <SectionHeading>
              {whyUsHeading.title} {whyUsHeading.accent && <span>{whyUsHeading.accent}</span>}
            </SectionHeading>
          )}
          {whyUsHeading.subtitle && (
            <p className="ppp-section__sub">{whyUsHeading.subtitle}</p>
          )}
          <ul className="ppp-why__grid">
            {siteData.whyUs.map((r, i) => (
              <li key={i} className="ppp-why__card">
                {r.icon && <span className="ppp-why__icon" aria-hidden="true">{r.icon}</span>}
                <h3 className="ppp-why__title">{r.title}</h3>
                <p className="ppp-why__body">{r.desc}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
      )}

      {(whyUsCta.text || whyUsCta.button) && (
      <section className="ppp-mini-cta">
        <div className="aero-max-container ppp-mini-cta__inner">
          {whyUsCta.text && <p>{whyUsCta.text}</p>}
          {whyUsCta.button && whyUsCta.href ? (
            <a
              href={whyUsCta.href}
              className="ppp-btn ppp-btn--primary"
              target={isWhyUsCtaExternal ? "_blank" : undefined}
              rel={isWhyUsCtaExternal ? "noopener noreferrer" : undefined}
            >
              {whyUsCta.button}
            </a>
          ) : whyUsCta.button ? (
            <BookingButton
              title={whyUsCta.button}
              className="ppp-btn ppp-btn--primary"
              bookingType={whyUsCta.bookingType}
            />
          ) : null}
        </div>
      </section>
      )}

      {/* ── Promotions ── */}
      {homepagePromotions.length > 0 && (
        <section className="ppp-section ppp-promos">
          <div className="aero-max-container">
            {(promotionsHeading.title || promotionsHeading.accent) && (
              <SectionHeading>
                {promotionsHeading.title} {promotionsHeading.accent && <span>{promotionsHeading.accent}</span>}
              </SectionHeading>
            )}
            {promotionsHeading.subtitle && (
              <p className="ppp-section__sub">{promotionsHeading.subtitle}</p>
            )}
            <div className="promotions__grid">
              {homepagePromotions.map((promo, index) => {
                const promoTicketText = promo.code || "Promo";

                return (
                <article
                  key={index}
                  className="promotion-card promotion-card--animated"
                >
                  <div className="promotion-card__content">
                    {promo.tag && <span className="promotion-card__badge">{promo.tag}</span>}
                    <h3 className="promotion-card__title">{renderHighlightedPromoText(promo.title)}</h3>
                    {promo.desc && (
                      <p className="promotion-card__description">
                        {renderHighlightedPromoText(promo.desc)}
                      </p>
                    )}
                    <div className="promotion-card__details">
                      {promo.valid && <time className="promotion-card__validity">{promo.valid}</time>}
                      {promo.code && (
                        <span className="promotion-card__code">
                          <span>Code</span>: {promo.code}
                        </span>
                      )}
                    </div>
                    {promo.link && (promo.linktext || ctaContent.claimOfferText) && (
                      <Link
                        href={promo.link}
                        className="promotion-card__btn"
                        target={promo.link.startsWith("http") ? "_blank" : undefined}
                        rel={promo.link.startsWith("http") ? "noopener noreferrer" : undefined}
                        title={promo.linktitle || undefined}
                        aria-label={promo.linktitle || promo.linktext || ctaContent.claimOfferText || promo.title}
                        prefetch={!promo.link.startsWith("http")}
                      >
                        {promo.linktext || ctaContent.claimOfferText}
                      </Link>
                    )}
                  </div>

                  <div className="promotion-card__motion" aria-hidden="true">
                    <span className="promotion-card__motion-ring" />
                    <span className="promotion-card__motion-ticket">
                      <span className="promotion-card__motion-ticket-text">
                        {promo.code ? <small>Code</small> : null}
                        <strong>{promoTicketText}</strong>
                      </span>
                    </span>
                    <span className="promotion-card__motion-spark" />
                  </div>
                </article>
              );
              })}
            </div>
          </div>
      </section>
      )}

      {/* ── Pricing ── */}
      {siteData.pricing.length > 0 && (
      <section className="ppp-section ppp-pricing" id="pricing">
        <div className="aero-max-container">
          {(pricingHeading.title || pricingHeading.accent) && (
            <SectionHeading>
              {pricingHeading.title} {pricingHeading.accent && <span>{pricingHeading.accent}</span>}
            </SectionHeading>
          )}
          {pricingHeading.subtitle && (
            <p className="ppp-section__sub">{pricingHeading.subtitle}</p>
          )}
          <div className="ppp-pricing__grid">
            {siteData.pricing.map((p, i) => (
              <article
                key={i}
                className={`ppp-pricing__card${p.highlight ? " ppp-pricing__card--featured" : ""}`}
              >
                {p.tag && (
                  <span className="ppp-pricing__badge">{p.tag}</span>
                )}
                {p.id && <p className="ppp-pricing__tier">{p.id}</p>}
                <h3 className="ppp-pricing__name">{p.name}</h3>
                <div className="ppp-pricing__price">
                  <span className="ppp-pricing__amount">{p.price}</span>
                  {p.duration && <span className="ppp-pricing__unit">/{p.duration}</span>}
                </div>
                <ul className="ppp-pricing__features">
                  {p.features.map((f, j) => (
                    <li key={j} className="ppp-pricing__feature">
                      <span className="ppp-pricing__check">✓</span> {f}
                    </li>
                  ))}
                </ul>
                {p.note && <p className="ppp-section__sub">{p.note}</p>}
                {p.cta && (
                  <BookingButton
                    title={p.cta}
                    className="ppp-btn ppp-btn--primary ppp-pricing__cta"
                    bookingType="ticket"
                  />
                )}
              </article>
            ))}
          </div>
        </div>
      </section>
      )}

      {siteData.useCases.length > 0 && (
      <section className="ppp-section ppp-use-cases">
        <div className="aero-max-container">
          {(useCasesHeading.title || useCasesHeading.accent) && (
            <SectionHeading>
              {useCasesHeading.title} {useCasesHeading.accent && <span>{useCasesHeading.accent}</span>}
            </SectionHeading>
          )}
          {useCasesHeading.subtitle && (
            <p className="ppp-section__sub">{useCasesHeading.subtitle}</p>
          )}
          <ul className="ppp-use-cases__grid">
            {siteData.useCases.map((item) => {
              const normalizedUseCaseTitle = String(item.title || "").toLowerCase();
              const isBirthdayUseCase = normalizedUseCaseTitle.includes("birthday");
              const isCorporateUseCase = normalizedUseCaseTitle.includes("corporate");
              const isSchoolTripsUseCase =
                normalizedUseCaseTitle.includes("school") ||
                normalizedUseCaseTitle.includes("field trip");
              const isFriendsDateUseCase =
                normalizedUseCaseTitle.includes("friend") ||
                normalizedUseCaseTitle.includes("date");
              const hasUseCaseImage =
                isBirthdayUseCase ||
                isCorporateUseCase ||
                isSchoolTripsUseCase ||
                isFriendsDateUseCase;

              return (
              <li
                key={item.title}
                className={[
                  "ppp-use-cases__item",
                  hasUseCaseImage ? "ppp-use-cases__item--wide" : "",
                ].filter(Boolean).join(" ")}
              >
                <article
                  className={[
                    "ppp-use-case-card",
                    isBirthdayUseCase ? "ppp-use-case-card--birthday" : "",
                    isCorporateUseCase ? "ppp-use-case-card--corporate" : "",
                    isSchoolTripsUseCase ? "ppp-use-case-card--school-trips" : "",
                    isFriendsDateUseCase ? "ppp-use-case-card--friends-date" : "",
                  ].filter(Boolean).join(" ")}
                >
                  {item.icon && <span className="ppp-why__icon" aria-hidden="true">{item.icon}</span>}
                  <h3>{item.title}</h3>
                  {item.sub && <p>{item.sub}</p>}
                  {item.cta && <p>{item.cta}</p>}
                  {item.link && (item.linktext || ctaContent.learnMoreText) && (
                    <Link
                      href={item.link}
                      className="ppp-use-case-card__link"
                      target={item.link.startsWith("http") ? "_blank" : undefined}
                      rel={item.link.startsWith("http") ? "noopener noreferrer" : undefined}
                      title={item.linktitle || undefined}
                      aria-label={item.linktitle || item.linktext || item.cta || item.title}
                      prefetch={!item.link.startsWith("http")}
                    >
                      {item.linktext || ctaContent.learnMoreText}
                    </Link>
                  )}
                </article>
              </li>
              );
            })}
          </ul>
        </div>
      </section>
      )}

      {siteData.leaderboard.length > 0 && (
      <section className="ppp-section ppp-competition">
        <div className="aero-max-container ppp-competition__inner">
          <SectionHeading className="section-heading-white">
            {leaderboardHeading.title} {leaderboardHeading.accent && <span>{leaderboardHeading.accent}</span>}
          </SectionHeading>
          {leaderboardHeading.subtitle && (
            <p className="ppp-section__sub">{leaderboardHeading.subtitle}</p>
          )}
          <div className="ppp-competition__board" aria-label="Leaderboard">
            <div className="ppp-competition__header" aria-hidden="true">
              <span>Rank</span>
              <span>Player</span>
              <span>Game</span>
              <span>Score</span>
              <span>Time</span>
            </div>
            {siteData.leaderboard.map((row, index) => (
              <article
                key={`${row.name}-${index}`}
                className={`ppp-competition__row${index < 3 ? " ppp-competition__row--podium" : ""}`}
              >
                <span className="ppp-competition__rank">{row.rank || index + 1}</span>
                <div className="ppp-competition__player">
                  <span className="ppp-competition__avatar" aria-hidden="true">
                    {String(row.name || "P").charAt(0)}
                  </span>
                  <strong>{row.name}</strong>
                </div>
                <span className="ppp-competition__game">{row.game || "-"}</span>
                <span className="ppp-competition__score">{row.score || "-"}</span>
                <span className="ppp-competition__time">{row.time || "-"}</span>
                <p className="ppp-competition__copy">
                  {[row.game, row.score, row.time].filter(Boolean).join(" | ")}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* ── Reviews ── */}
      {siteData.testimonials.length > 0 && (
      <section className="ppp-section ppp-reviews">
        <div className="aero-max-container">
          <div className="ppp-reviews__grid">
            {siteData.testimonials.map((r, i) => (
              <article key={i} className="ppp-review-card">
                <div className="ppp-review-card__stars" aria-label={`${r.rating} out of 5 stars`}>
                  <span aria-hidden="true">{"★".repeat(r.rating)}</span>
                </div>
                <blockquote className="ppp-review-card__quote">
                  {r.quote}
                </blockquote>
                <footer className="ppp-review-card__footer">
                  <div className="ppp-review-card__avatar" aria-hidden="true">
                    {r.name.charAt(0)}
                  </div>
                  <div>
                    <p className="ppp-review-card__name">{r.name}</p>
                    <p className="ppp-review-card__role">{r.role}</p>
                  </div>
                </footer>
              </article>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* ── Blog / Articles ── */}
      {attractionsData?.[0]?.children?.length > 0 && (
        <section className="ppp-section ppp-blog">
          <div className="aero-max-container">
            <SectionHeading className="section-heading-white ppp-blog__heading">
              {blogSectionHeading}
            </SectionHeading>

            <BlogCard blogsData={blogsData[0]} location_slug={location_slug} />

            {ctaContent.articlesText && (
              <div className="ppp-section__cta-row">
                <Link href={articlesHref} className="ppp-btn ppp-btn--outline" prefetch>
                  {ctaContent.articlesText}
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Final CTA band ── */}
      {(siteData.location.title || siteData.location.address || siteData.location.walkIn || siteData.location.finalStrip) && (
      <section className="ppp-cta-band">
        <div className="aero-max-container ppp-cta-band__inner">
          <div className="ppp-cta-band__content">
            {siteData.location.title && <SectionHeading>{siteData.location.title}</SectionHeading>}
            {siteData.location.address && <p className="ppp-cta-band__sub">{siteData.location.address}</p>}
            {siteData.location.walkIn && <p className="ppp-cta-band__sub">{siteData.location.walkIn}</p>}
            {siteData.location.finalStrip && <p className="ppp-cta-band__sub">{siteData.location.finalStrip}</p>}
            <div className="ppp-cta-band__actions">
              {heroData.ctaPrimary && heroData.ctaPrimaryHref ? (
                <a
                  href={heroData.ctaPrimaryHref}
                  className="ppp-btn ppp-btn--primary"
                  target={isHeroCtaPrimaryExternal ? "_blank" : undefined}
                  rel={isHeroCtaPrimaryExternal ? "noopener noreferrer" : undefined}
                >
                  {heroData.ctaPrimary}
                </a>
              ) : heroData.ctaPrimary ? (
                <BookingButton title={heroData.ctaPrimary} className="ppp-btn ppp-btn--primary" bookingType="ticket" />
              ) : null}
              {siteData.location.mapsLink && ctaContent.findLocationText && (
                <Link
                  href={siteData.location.mapsLink}
                  className="ppp-btn ppp-btn--outline"
                  target="_blank"
                  rel="noopener noreferrer"
                  prefetch={false}
                >
                  {ctaContent.findLocationText}
                </Link>
              )}
            </div>
          </div>
          <figure className="ppp-cta-band__media">
            <Image
              src="https://storage.googleapis.com/pixel-pulse-play/web/pixelreception.png"
              alt="Pixel Pulse Play reception area"
              width={1200}
              height={800}
              style={{ width: "100%", height: "auto" }}
            />
          </figure>
          </div>
      </section>
      )}

      {/* ── JSON-LD ── */}
      {location_slug === LOCATION_NAME && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(pixelPulseSchema) }}
        />
      )}
    </main>
  );
};

export default Home;
