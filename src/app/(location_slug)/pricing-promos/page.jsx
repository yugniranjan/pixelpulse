export const dynamic = "force-dynamic";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import "../../styles/subcategory.css";
import "../../styles/promotions.css";
import SectionHeading from "@/components/home/SectionHeading";
import BookingButton from "@/components/smallComponents/BookingButton";
import {
  fetchsheetdata,
  fetchsheetdataNoCache,
  getWaiverLink,
  fetchPageData,
  generateMetadataLib,
} from "@/lib/sheets";
import { LOCATION_NAME } from "@/lib/constant";
import { getCtaContent, hasConfiguredKey, resolveConfiguredValue } from "@/lib/ctaContent";

export async function generateMetadata({ params }) {
  await params;
  const metadata = await generateMetadataLib({
    location: LOCATION_NAME || "vaughan",
    category: "",
    page: "pricing-promos",
  });
  return metadata;
}

function parseConfigMatrix(configData, key) {
  const normalizedKey = String(key || "").trim().toLowerCase();

  return configData
    ?.filter((item) => String(item.key || "").trim().toLowerCase() === normalizedKey)
    ?.flatMap((item) =>
      String(item?.value || "")
        .replace(/<br\s*\/?>/gi, "\n")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
    )
    ?.map((value) => value.split(";"))
    ?.map((columns) => {
      const mappedValues = {};

      columns.forEach((column, index) => {
        mappedValues[`value${index + 1}`] = column?.trim() || "";
      });

      return mappedValues;
    });
}

function getConfigValues(configData, key) {
  const normalizedKey = String(key || "").trim().toLowerCase();

  return (Array.isArray(configData) ? configData : [])
    .filter((item) => String(item.key || "").trim().toLowerCase() === normalizedKey)
    .map((item) => item?.value)
    .filter((value) => value !== undefined && value !== null && String(value).trim());
}

function parseJsonConfigValue(value) {
  const cleaned = String(value || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .trim();

  if (!cleaned) return null;

  const candidates = [
    cleaned,
    cleaned.replace(/^"+|"+$/g, "").replace(/""/g, '"'),
  ];

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      // Try the next normalized candidate.
    }
  }

  return null;
}

function buildPricingCardsFromPricingHeaderJson(configData) {
  return getConfigValues(configData, "pricingheader")
    .map(parseJsonConfigValue)
    .filter((item) => item && typeof item === "object" && !Array.isArray(item))
    .map((item, index) => {
      const title = item.title || `Pricing Option ${index + 1}`;
      const details = Array.isArray(item.details)
        ? item.details
            .map((detail) => ({
              label: detail.duration || detail.label || detail.name || "Duration",
              value: detail.price || detail.value || detail.amount || "",
            }))
            .filter((detail) => detail.label || detail.value)
        : [];

      return {
        title,
        eyebrow: item.eyebrow || item.badge || "Pricing",
        duration: item.subtitle || item.subTitle || item.duration || "",
        details,
        image: item.img || item.image || item.imageUrl || "/assets/images/logo.png",
        imageAlt: item.imageAlt || item.alt || `${title} pricing image`,
        bookable: parseBoolean(item.is_book ?? item.bookable ?? item.isBook, true),
        ctaText: item.ctaText || item.cta || item.buttonText || "",
      };
    });
}

function getConfigRowValues(row = {}) {
  return Object.keys(row)
    .filter((key) => /^value\d+$/.test(key))
    .sort((a, b) => Number(a.replace("value", "")) - Number(b.replace("value", "")))
    .map((key) => row[key])
    .filter(Boolean);
}

function stripHtml(html = "") {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeListHtml(html = "") {
  const trimmed = typeof html === "string" ? html.trim() : "";
  if (!trimmed) {
    return "";
  }

  const hasListItems = /<li[\s>]/i.test(trimmed);
  const hasListWrapper = /<(ul|ol)[\s>]/i.test(trimmed);
  if (hasListItems && !hasListWrapper) {
    return `<ul>${trimmed}</ul>`;
  }

  return trimmed;
}

function decodeHtmlEntities(text = "") {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function extractListItems(html = "") {
  return [...html.matchAll(/<li[^>]*>(.*?)<\/li>/gis)]
    .map((match) => decodeHtmlEntities(stripHtml(match[1])))
    .filter(Boolean);
}

function extractHeroHeading(html = "") {
  const headingMatch = html.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/is);
  if (headingMatch?.[1]) {
    return decodeHtmlEntities(stripHtml(headingMatch[1]));
  }

  const paragraphMatch = html.match(/<p[^>]*>(.*?)<\/p>/is);
  if (paragraphMatch?.[1]) {
    return decodeHtmlEntities(stripHtml(paragraphMatch[1]));
  }

  const [firstLine = ""] = decodeHtmlEntities(
    html.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n")
  )
    .split("\n")
    .map((line) => stripHtml(line))
    .filter(Boolean);

  return firstLine;
}

function parseHeroTextBlock(content = "") {
  const normalizedContent = typeof content === "string" ? content.trim() : "";
  if (!normalizedContent) {
    return { heading: "", bullets: [] };
  }

  const htmlBullets = extractListItems(normalizedContent);
  const htmlHeading = extractHeroHeading(normalizedContent);
  if (htmlHeading || htmlBullets.length > 0) {
    return { heading: htmlHeading, bullets: htmlBullets };
  }

  const lines = decodeHtmlEntities(normalizedContent)
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.replace(/^[\-\*\u2022]\s*/, "").trim())
    .filter(Boolean);

  return {
    heading: lines[0] || "",
    bullets: lines.slice(1),
  };
}

const DEFAULT_PRICING_CARD_META = [
  {
    title: "Game Rooms",
    eyebrow: "Session Time",
    image: "/assets/images/floorchallenge.jpg",
    imageAlt: "Game rooms at Pixel Pulse Play",
    bookable: true,
  },
  {
    title: "Arcade+",
    eyebrow: "Arcade Card",
    duration: "Choose Your Card",
    image: "/assets/images/arcade.JPG",
    imageAlt: "Arcade at Pixel Pulse Play",
    details: [
      { label: "Arcade Card", value: "$10" },
      { label: "Arcade Card", value: "$20" },
    ],
    bookable: false,
  },
];

const DEFAULT_SUMMER_PLAY_PASS = {
  title: "Unlimited Summer. Unlimited Play.",
  subtitle: "Beat the heat. Enter the challenge. All summer long at Pixel Pulse.",
  cards: [
    {
      title: "SUMMER PLAY PASS - 60",
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
  if (!normalizedValue) {
    return fallback;
  }

  if (["true", "yes", "1", "bookable", "show"].includes(normalizedValue)) {
    return true;
  }

  if (["false", "no", "0", "hide", "hidden"].includes(normalizedValue)) {
    return false;
  }

  return fallback;
}

function splitConfigList(value = "") {
  return String(value || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .split(/[\n|]/)
    .map((item) => stripHtml(decodeHtmlEntities(item)).trim())
    .filter(Boolean);
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

function buildSummerPlayPassContent(configData = [], pageData = {}) {
  const sources = [configData, pageData || {}];
  const cards = parseSummerPassCards(configData);

  return {
    title: resolveConfiguredValue({
      sources,
      keys: ["summerPlayPassTitle", "summerPassTitle"],
      fallback: DEFAULT_SUMMER_PLAY_PASS.title,
    }),
    subtitle: resolveConfiguredValue({
      sources,
      keys: ["summerPlayPassSubtitle", "summerPassSubtitle"],
      fallback: DEFAULT_SUMMER_PLAY_PASS.subtitle,
    }),
    cards: cards.length > 0 ? cards : DEFAULT_SUMMER_PLAY_PASS.cards,
    valueTitle: resolveConfiguredValue({
      sources,
      keys: ["summerPlayPassValueTitle", "summerPassValueTitle"],
      fallback: DEFAULT_SUMMER_PLAY_PASS.valueTitle,
    }),
    valueText: resolveConfiguredValue({
      sources,
      keys: ["summerPlayPassValueText", "summerPassValueText"],
      fallback: DEFAULT_SUMMER_PLAY_PASS.valueText,
    }),
    addonsTitle: resolveConfiguredValue({
      sources,
      keys: ["summerPlayPassAddonsTitle", "summerPassAddonsTitle"],
      fallback: DEFAULT_SUMMER_PLAY_PASS.addonsTitle,
    }),
    addons: splitConfigList(resolveConfiguredValue({
      sources,
      keys: ["summerPlayPassAddons", "summerPassAddons"],
      fallback: DEFAULT_SUMMER_PLAY_PASS.addons.join("|"),
    })),
    termsTitle: resolveConfiguredValue({
      sources,
      keys: ["summerPlayPassTermsTitle", "summerPassTermsTitle"],
      fallback: DEFAULT_SUMMER_PLAY_PASS.termsTitle,
    }),
    terms: splitConfigList(resolveConfiguredValue({
      sources,
      keys: ["summerPlayPassTerms", "summerPassTerms"],
      fallback: DEFAULT_SUMMER_PLAY_PASS.terms.join("|"),
    })),
    cta: resolveConfiguredValue({
      sources,
      keys: ["summerPlayPassCta", "summerPassCta"],
      fallback: DEFAULT_SUMMER_PLAY_PASS.cta,
    }),
    show: parseBoolean(resolveConfiguredValue({
      sources,
      keys: ["showSummerPlayPass", "summerPlayPassShow"],
      fallback: "true",
    }), true),
  };
}

function parsePricingCardDetails(value = "") {
  return String(value || "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [label, ...valueParts] = item.split(":");
      const detailValue = valueParts.join(":").trim();

      if (!detailValue) {
        return {
          label: "Details",
          value: label.trim(),
        };
      }

      return {
        label: label.trim() || "Details",
        value: detailValue,
      };
    });
}

function buildPricingCardMeta(configData, pricingRowCount = 0) {
  const sheetMeta = [
    ...(parseConfigMatrix(configData, "pricingcard") || []),
    ...(parseConfigMatrix(configData, "pricingcards") || []),
  ];
  const cardCount = Math.max(
    pricingRowCount,
    sheetMeta.length,
    DEFAULT_PRICING_CARD_META.length
  );

  return Array.from({ length: cardCount }, (_, index) => {
    const row = sheetMeta[index] || {};
    const fallback = DEFAULT_PRICING_CARD_META[index] || {};
    const details = parsePricingCardDetails(row.value7);
    const title = row.value1 || fallback.title || "";

    return {
      title,
      eyebrow: row.value2 || fallback.eyebrow || "",
      duration: row.value3 || fallback.duration || "",
      image: row.value4 || fallback.image || "/assets/images/logo.png",
      imageAlt:
        row.value5 ||
        fallback.imageAlt ||
        title ||
        "Pixel Pulse Play pricing image",
      bookable: parseBoolean(
        row.value6,
        fallback.bookable ?? title.toLowerCase() !== "arcade+"
      ),
      details,
      fallbackDetails: fallback.details || [],
      ctaText: row.value8 || fallback.ctaText || "",
    };
  });
}

function buildPricingSections(pricingRows, pricingHeaders) {
  const headerValues = getConfigRowValues(pricingHeaders);
  const detailKeys = Object.keys(pricingHeaders).slice(1);
  const hasMatrixHeaders =
    detailKeys.length > 0 &&
    pricingRows.some((row) => detailKeys.some((detailKey) => row[detailKey]));

  if (hasMatrixHeaders) {
    return pricingRows.map((row) => ({
      duration: row.value1,
      details: detailKeys
        .map((detailKey) => ({
          label: pricingHeaders[detailKey],
          value: row[detailKey] || "",
        }))
        .filter((detail) => detail.label || detail.value),
    }));
  }

  const sections = [];
  let currentSection =
    headerValues.length === 1
      ? { duration: headerValues[0], details: [] }
      : null;

  if (currentSection) {
    sections.push(currentSection);
  }

  pricingRows.forEach((row) => {
    const values = getConfigRowValues(row);
    if (values.length === 0) return;

    if (values.length === 1) {
      currentSection = { duration: values[0], details: [] };
      sections.push(currentSection);
      return;
    }

    if (!currentSection) {
      currentSection = { duration: headerValues[0] || "", details: [] };
      sections.push(currentSection);
    }

    const [label, ...valueParts] = values;
    currentSection.details.push({
      label,
      value: valueParts.join(" "),
    });
  });

  return sections.filter((section) => section.duration || section.details.length > 0);
}

function buildPricingCards(pricingSections, cardMeta) {
  return cardMeta.map((meta, index) => {
    const pricingSection = pricingSections[index] || { duration: "", details: [] };
    const detailsFromPricingConfig = pricingSection.details || [];
    const details =
      detailsFromPricingConfig.length > 0
        ? detailsFromPricingConfig
        : meta.details?.length > 0
          ? meta.details
          : meta.fallbackDetails || [];

    return {
      title: meta.title || `Pricing Option ${index + 1}`,
      eyebrow: meta.eyebrow,
      duration: meta.duration || pricingSection.duration,
      details,
      image: meta.image,
      imageAlt: meta.imageAlt,
      bookable: meta.bookable,
      ctaText: meta.ctaText,
    };
  });
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

const PricingPromosPage = async ({ params }) => {
  await params;
  const location_slug = LOCATION_NAME || "vaughan";

  let pageData = null;
  let configData = [];
  let promotions = [];
  let allPromotions = [];
  let waiverLink = "";

  try {
    [pageData, configData, promotions, allPromotions, waiverLink] = await Promise.all([
      fetchPageData(location_slug, "pricing-promos"),
      fetchsheetdata("config", location_slug),
      fetchsheetdata("promotions", location_slug),
      fetchsheetdataNoCache("promotions"),
      getWaiverLink(location_slug),
    ]);
  } catch (error) {
    console.error("pricing-promos page data failed to load:", error);
  }

  const pricingCardsFromHeaderJson = buildPricingCardsFromPricingHeaderJson(configData);
  const pricingHeaders = parseConfigMatrix(configData, "pricingheader")?.[0] || {};
  const pricingRows = parseConfigMatrix(configData, "pricing") || [];
  const pricingSections = buildPricingSections(pricingRows, pricingHeaders);
  const pricingCardMeta = buildPricingCardMeta(configData, pricingSections.length);

  const pricingCards =
    pricingCardsFromHeaderJson.length > 0
      ? pricingCardsFromHeaderJson
      : buildPricingCards(pricingSections, pricingCardMeta);

  const introText =
    stripHtml(pageData?.section1 || "") ||
    pageData?.metadescription ||
    "Choose your session, lock in your booking, and take advantage of the latest in-store offers.";

  const pricingHeroContent = parseHeroTextBlock(pageData?.section2 || "");
  const pricingHeroLabelHtml = pageData?.section3 || "";
  const pricingHeroHeading = pricingHeroContent.heading;
  const pricingHeroBullets = pricingHeroContent.bullets;
  const helpfulDetailsHeadingHtml =
    pageData?.section5 || '<h2 class="section-heading section-heading-white">Helpful <span>Details</span></h2>';
  const helpfulDetailsHtml = normalizeListHtml(pageData?.section4 || "");
  const extraText = stripHtml(helpfulDetailsHtml);
  const hasPricingCards = pricingCards.length > 0;
  const summerPlayPass = buildSummerPlayPassContent(configData, pageData || {});
  const visiblePromotions = (promotions.length > 0 ? promotions : allPromotions).filter((promo) =>
    parseBoolean(
      promo.showOnPricingPromos ??
      promo.show_on_pricing_promos ??
      promo.showOnPricing ??
      promo.show_on_pricing ??
      promo.showOnPromos ??
      promo.show_on_promos ??
      promo.pricingPromos ??
      promo.pricing_promos ??
      promo.promosPage ??
      promo.promos_page,
      true,
    ),
  );
  const hasPromotions = visiblePromotions.length > 0;
  const configCta = getCtaContent(configData);
  const pageCta = getCtaContent(pageData || {});
  const ctaContent = {
    ...configCta,
    ...Object.fromEntries(
      Object.entries(pageCta).filter(([, value]) => Boolean(value)),
    ),
  };
  const pricingPromoHeroLinkText = resolveConfiguredValue({
    sources: [configData, pageData || {}],
    keys: [
      "pricingPromoHeroLinkText",
      "pricingPromosHeroLinkText",
      "pricingPromoHeroSecondaryText",
      "pricingPromosHeroSecondaryText",
    ],
    value: ctaContent.pricingPromoHeroLinkText,
    fallback: "View Deals & Save",
  });
  const hidePricingHeroLink = pricingPromoHeroLinkText === "";
  const pricingPromoInlineCtaTitle = resolveConfiguredValue({
    sources: [configData, pageData || {}],
    keys: ["pricingPromoInlineCtaTitle", "pricingPromosInlineCtaTitle"],
    value: ctaContent.pricingPromoInlineCtaTitle,
    fallback: "Weekday Birthday Deal",
  });
  const pricingPromoInlineCtaSubtitle = resolveConfiguredValue({
    sources: [configData, pageData || {}],
    keys: ["pricingPromoInlineCtaSubtitle", "pricingPromosInlineCtaSubtitle"],
    value: ctaContent.pricingPromoInlineCtaSubtitle,
    fallback: "Save $50 when you book Mon-Thu",
  });
  const pricingPromoInlineCtaButtonText = resolveConfiguredValue({
    sources: [configData, pageData || {}],
    keys: ["pricingPromoInlineCtaButtonText", "pricingPromosInlineCtaButtonText"],
    value: ctaContent.pricingPromoInlineCtaButtonText,
    fallback: "Apply This Offer",
  });
  const pricingPromoFinalCtaTitle = resolveConfiguredValue({
    sources: [configData, pageData || {}],
    keys: ["pricingPromoFinalCtaTitle", "pricingPromosFinalCtaTitle"],
    value: ctaContent.pricingPromoFinalCtaTitle,
    fallback: "Don’t Just Plan It.",
  });
  const pricingPromoFinalCtaAccent = resolveConfiguredValue({
    sources: [configData, pageData || {}],
    keys: ["pricingPromoFinalCtaAccent", "pricingPromosFinalCtaAccent"],
    value: ctaContent.pricingPromoFinalCtaAccent,
    fallback: "Lock It In.",
  });
  const pricingPromoFinalCtaSubtitle = resolveConfiguredValue({
    sources: [configData, pageData || {}],
    keys: ["pricingPromoFinalCtaSubtitle", "pricingPromosFinalCtaSubtitle"],
    value: ctaContent.pricingPromoFinalCtaSubtitle,
    fallback: "Your slot won’t stay open forever.",
  });
  const pricingPromoFinalCtaHighlight = resolveConfiguredValue({
    sources: [configData, pageData || {}],
    keys: ["pricingPromoFinalCtaHighlight", "pricingPromosFinalCtaHighlight"],
    value: ctaContent.pricingPromoFinalCtaHighlight,
    fallback: "Weekends sell out early",
  });
  const pricingPromoFinalCtaPrimaryText = resolveConfiguredValue({
    sources: [configData, pageData || {}],
    keys: ["pricingPromoFinalCtaPrimaryText", "pricingPromosFinalCtaPrimaryText"],
    value: ctaContent.pricingPromoFinalCtaPrimaryText,
    fallback: "Book Your Session",
  });
  const pricingPromoFinalCtaSecondaryText = resolveConfiguredValue({
    sources: [configData, pageData || {}],
    keys: ["pricingPromoFinalCtaSecondaryText", "pricingPromosFinalCtaSecondaryText"],
    value: ctaContent.pricingPromoFinalCtaSecondaryText,
    fallback: "Book With Offer",
  });
  const promotionsTitle = ctaContent.promotionsHeading || "";
  const promotionsAccent = ctaContent.promotionsHeadingAccent || "";

  return (
    <main className="ppp-pricing-page">
      <section className="ppp-pricing-hero">
        <div className="aero-max-container ppp-pricing-hero__inner">
          <div className="ppp-pricing-hero__panel">
            <div className="ppp-about-hero-card">
              {pricingHeroLabelHtml && (
                <div dangerouslySetInnerHTML={{ __html: pricingHeroLabelHtml }} />
              )}
              {pricingHeroHeading && <h2>{pricingHeroHeading}</h2>}
              {pricingHeroBullets.length > 0 && (
                <ul>
                  {pricingHeroBullets.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
              )}
              <div className="ppp-pricing-hero__actions">
                <div className="aero-btn-booknow">
                  <BookingButton
                    title="Book Your Session"
                    bookingType="ticket"
                  />
                </div>
                {!hidePricingHeroLink && (
                  <Link className="ppp-pricing-hero__link" href="#weekly-birthday-deal">
                    {pricingPromoHeroLinkText}
                  </Link>
                )}
              </div>
              <p className="ppp-pricing-hero__trust">
                Most players choose 60 minutes for the full experience
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="subcategory_main_section-bg">
        <div className="aero-max-container">
          <section className="subcategory_main_section ppp-pricing-layout">
            <article className="ppp-pricing-block">
             

              {hasPricingCards ? (
                <div className="ppp-pricing-grid">
                  {pricingCards.map((card, index) => (
                    <article className="ppp-pricing-card" key={`${card.title}-${index}`}>
                      <div className="ppp-pricing-card__media">
                        <Image
                          src={card.image}
                          alt={card.imageAlt}
                          width={800}
                          height={600}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </div>

                      <div className="ppp-pricing-card__content">
                        <div className="ppp-pricing-card__top">
                          <span className="ppp-pricing-card__eyebrow">{card.eyebrow}</span>
                          <h3>{card.title}</h3>
                          {card.duration && <p className="ppp-pricing-card__subhead">{card.duration}</p>}
                        </div>

                        <div className="ppp-pricing-card__details">
                          {card.details.map((detail, detailIndex) => (
                            <div
                              className="ppp-pricing-card__detail"
                              key={`${card.title}-${card.duration || "details"}-${detail.label || "row"}-${detailIndex}`}
                            >
                              <span>{detail.label || "Details"}</span>
                              <strong>{detail.value}</strong>
                            </div>
                          ))}
                        </div>

                        {card.bookable && (card.ctaText || ctaContent.bookNowText) && (
                          <div className="aero-btn-booknow ppp-pricing-card__cta">
                            <BookingButton title={card.ctaText || ctaContent.bookNowText} />
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="ppp-empty-state">
                  {introText && <p>{introText}</p>}
                  {ctaContent.bookNowText && (
                    <div className="aero-btn-booknow ppp-pricing-card__cta">
                      <BookingButton title={ctaContent.bookNowText} />
                    </div>
                  )}
                </div>
              )}
              {summerPlayPass.show && (
                <article className="ppp-summer-pass-block" id="summer-play-pass">
                  <div className="ppp-summer-pass-block__header">
                    <SectionHeading className="section-heading-white">
                      {summerPlayPass.title}
                    </SectionHeading>
                    {summerPlayPass.subtitle && (
                      <p className="ppp-summer-pass-block__subtitle">
                        {summerPlayPass.subtitle}
                      </p>
                    )}
                  </div>

                  <div className="ppp-summer-pass-grid">
                    {summerPlayPass.cards.map((card, index) => (
                      <article
                        className={`ppp-summer-pass-card${card.badge ? " ppp-summer-pass-card--featured" : ""}`}
                        key={`${card.title}-${index}`}
                      >
                        {card.badge && (
                          <span className="ppp-summer-pass-card__badge">{card.badge}</span>
                        )}
                        <h3>{card.title}</h3>
                        {card.price && <p className="ppp-summer-pass-card__price">{card.price}</p>}
                        {card.features.length > 0 && (
                          <ul className="ppp-summer-pass-card__features">
                            {card.features.map((feature, featureIndex) => (
                              <li key={`${card.title}-${feature}-${featureIndex}`}>
                                {feature}
                              </li>
                            ))}
                          </ul>
                        )}
                        {card.note && (
                          <p className="ppp-summer-pass-card__note">{card.note}</p>
                        )}
                      </article>
                    ))}
                  </div>

                  <div className="ppp-summer-pass-summary">
                    <div className="ppp-summer-pass-summary__value">
                      <span>Applies to summer passes</span>
                      <strong>{summerPlayPass.valueText}</strong>
                      <small>{summerPlayPass.valueTitle}</small>
                    </div>
                    {summerPlayPass.addons.length > 0 && (
                      <div className="ppp-summer-pass-summary__addons">
                        <span>{summerPlayPass.addonsTitle}</span>
                        <div>
                          {summerPlayPass.addons.map((addon, index) => (
                            <strong key={`${addon}-${index}`}>{addon}</strong>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {summerPlayPass.terms.length > 0 && (
                    <p className="ppp-summer-pass-terms">
                      <strong>{summerPlayPass.termsTitle}:</strong> {summerPlayPass.terms.join(" | ")}
                    </p>
                  )}

                  {summerPlayPass.cta && (
                    <div className="ppp-summer-pass-cta">
                      {summerPlayPass.cta}
                    </div>
                  )}
                </article>
              )}
              {hasPromotions && (
                <article className="ppp-promotions-block ppp-promos" id="deals-and-savings">
                  <SectionHeading className="section-heading-white">
                    Current <span>Promotions</span>
                  </SectionHeading>
                  <p className="ppp-section__sub">
                    Don&apos;t miss out on these amazing deals! Save big on your next visit.
                  </p>

                  <div className="promotions__grid">
                    {visiblePromotions.map((promo, index) => {
                      const promoBadge = promo.badge || promo.tag;
                      const promoDescription = promo.description || promo.desc;
                      const promoValidity = promo.validity || promo.valid || promo.validUntil || promo.valid_until;

                      return (
                        <article
                          key={`${promo.title}-${index}`}
                          className="promotion-card promotion-card--animated"
                        >
                          <div className="promotion-card__content">
                            {promoBadge && <span className="promotion-card__badge">{promoBadge}</span>}
                            <h3 className="promotion-card__title">
                              {renderHighlightedPromoText(promo.title)}
                            </h3>
                            {promoDescription && (
                              <p className="promotion-card__description">
                                {renderHighlightedPromoText(promoDescription)}
                              </p>
                            )}
                            <div className="promotion-card__details">
                              {promoValidity && (
                                <time className="promotion-card__validity">{promoValidity}</time>
                              )}
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
                                aria-label={
                                  promo.linktitle ||
                                  promo.linktext ||
                                  ctaContent.claimOfferText ||
                                  promo.title
                                }
                                prefetch={!promo.link.startsWith("http")}
                              >
                                {promo.linktext || ctaContent.claimOfferText}
                              </Link>
                            )}
                          </div>

                          <div className="promotion-card__motion" aria-hidden="true">
                            <span className="promotion-card__motion-ring" />
                            <span className="promotion-card__motion-ticket">
                              <span>Promo</span>
                            </span>
                            <span className="promotion-card__motion-spark" />
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </article>
              )}
            </article>

            <article className="ppp-inline-cta">
              <div>
                <h3>{pricingPromoInlineCtaTitle}</h3>
                <p className="ppp-section__sub">
                  {pricingPromoInlineCtaSubtitle}
                </p>
              </div>
              <div className="ppp-inline-cta__actions">
                <div className="aero-btn-booknow">
                  <BookingButton
                    title={pricingPromoInlineCtaButtonText}
                    bookingType={ctaContent.pricingPromoInlineCtaBookingType || "party"}
                  />
                </div>
              </div>
            </article>

            {(helpfulDetailsHtml || extraText) && (
              <article className="ppp-content-card pricing_promo_main_section">
                <div dangerouslySetInnerHTML={{ __html: helpfulDetailsHeadingHtml }} />
                <div
                  className="ppp-richtext"
                  dangerouslySetInnerHTML={{
                    __html: helpfulDetailsHtml,
                  }}
                />
              </article>
            )}

            <section className="ppp-cta-band ppp-cta-band--compact">
              <div className="ppp-cta-band__inner">
                <div className="ppp-cta-band__content">
                  <SectionHeading className="section-heading-white">
                    {pricingPromoFinalCtaTitle}{" "}
                    <span>{pricingPromoFinalCtaAccent}</span>
                  </SectionHeading>
                  <p className="ppp-cta-band__sub">
                    {pricingPromoFinalCtaSubtitle}
                  </p>
                  {pricingPromoFinalCtaHighlight && (
                    <p className="ppp-cta-band__highlight">
                      {pricingPromoFinalCtaHighlight}
                    </p>
                  )}
                  <div className="ppp-cta-band__actions">
                    <div className="aero-btn-booknow">
                      <BookingButton
                        title={pricingPromoFinalCtaPrimaryText}
                        bookingType={ctaContent.pricingPromoFinalCtaPrimaryBookingType || "ticket"}
                      />
                    </div>
                    <div className="aero-btn-booknow">
                      <BookingButton
                        title={pricingPromoFinalCtaSecondaryText}
                        bookingType={ctaContent.pricingPromoFinalCtaSecondaryBookingType || "ticket"}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </section>
        </div>
      </section>
    </main>
  );
};

export default PricingPromosPage;
