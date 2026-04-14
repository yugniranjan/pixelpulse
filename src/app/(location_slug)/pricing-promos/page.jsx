export const dynamic = "force-dynamic";

import React from "react";
import Link from "next/link";
import "../../styles/subcategory.css";
import "../../styles/promotions.css";
import SectionHeading from "@/components/home/SectionHeading";
import BookingButton from "@/components/smallComponents/BookingButton";
import {
  fetchsheetdata,
  getWaiverLink,
  fetchPageData,
  generateMetadataLib,
} from "@/lib/sheets";
import { LOCATION_NAME } from "@/lib/constant";

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
  return configData
    ?.filter((item) => item.key === key)
    ?.map((item) => item?.value)
    ?.map((value) => value?.split(";"))
    ?.map((columns) => {
      const mappedValues = {};

      columns.forEach((column, index) => {
        mappedValues[`value${index + 1}`] = column?.trim();
      });

      return mappedValues;
    });
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

const fallbackCardMeta = [
  {
   
    
    image: "/assets/images/floorchallenge.jpg",
    imageAlt: "Game rooms at Pixel Pulse Play",
    bookable: true,
  },
  {
   
    
    
    image: "/assets/images/arcade.JPG",
    imageAlt: "Arcade at Pixel Pulse Play",
   
    bookable: false,
  },
];

function parseBoolean(value, fallback) {
  if (typeof value !== "string" || !value.trim()) {
    return fallback;
  }

  return !["0", "false", "no", "n"].includes(value.trim().toLowerCase());
}

function parseCardDetails(details = "") {
  if (typeof details !== "string" || !details.trim()) {
    return null;
  }

  const parsedDetails = details
    .split("|")
    .map((detail) => {
      const [label, ...valueParts] = detail.split(/[:=]/);
      const value = valueParts.join(":").trim();

      return {
        label: label?.trim(),
        value,
      };
    })
    .filter((detail) => detail.label && detail.value);

  return parsedDetails.length > 0 ? parsedDetails : null;
}

function isChallengeRoomsArcadeCard(title = "") {
  const normalizedTitle = title.toLowerCase();
  return normalizedTitle.includes("challenge rooms") && normalizedTitle.includes("arcade");
}

function buildCardMeta(configData) {
  const sheetCardMeta = parseConfigMatrix(configData, "pricingcardmeta") || [];
  const parsedCardMeta = sheetCardMeta
    .map((row) => {
      const details = parseCardDetails(row.value7);
      const title = row.value1 || "";

      return {
        title,
        eyebrow: row.value2 || "",
        duration: row.value3 || "",
        image: row.value4 || "",
        imageAlt: row.value5 || title,
        bookable: parseBoolean(row.value6, title !== "Arcade+"),
        ...(details ? { details } : {}),
      };
    })
    .filter((meta) => meta.title);

  return parsedCardMeta.length > 0 ? parsedCardMeta : fallbackCardMeta;
}

function buildPricingCards(pricingRows, detailKeys, pricingHeaders, cardMeta) {
  const baseCards = pricingRows.map((row) => ({
    duration: row.value1,
    details: detailKeys.map((detailKey) => ({
      label: pricingHeaders[detailKey],
      value: row[detailKey] || "N/A",
    })),
  }));

  return cardMeta.map((meta, index) => {
    const fallbackCard = baseCards[index] || { duration: "", details: [] };
    const hideDurationAndThirdRow = isChallengeRoomsArcadeCard(meta.title);
    const details = meta.details || fallbackCard.details;

    return {
      title: meta.title,
      eyebrow: meta.eyebrow,
      duration: meta.duration || fallbackCard.duration,
      hideDuration: hideDurationAndThirdRow,
      details: hideDurationAndThirdRow ? details.slice(0, 2) : details,
      image: meta.image,
      imageAlt: meta.imageAlt,
      bookable: meta.bookable,
    };
  });
}

const PricingPromosPage = async ({ params }) => {
  await params;
  const location_slug = LOCATION_NAME || "vaughan";

  let pageData = null;
  let configData = [];
  let promotions = [];
  let waiverLink = "";

  try {
    [pageData, configData, promotions, waiverLink] = await Promise.all([
      fetchPageData(location_slug, "pricing-promos"),
      fetchsheetdata("config", location_slug),
      fetchsheetdata("promotions", location_slug),
      getWaiverLink(location_slug),
    ]);
  } catch (error) {
    console.error("pricing-promos page data failed to load:", error);
  }

  const pricingHeaders = parseConfigMatrix(configData, "pricingheader")?.[0] || {};
  const pricingRows = parseConfigMatrix(configData, "pricing") || [];
  const cardMeta = buildCardMeta(configData);
  const detailKeys = Object.keys(pricingHeaders).slice(1);

  const pricingCards = buildPricingCards(pricingRows, detailKeys, pricingHeaders, cardMeta);

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
  const hasPromotions = promotions.length > 0;

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
                        <img src={card.image} alt={card.imageAlt} />
                      </div>

                      <div className="ppp-pricing-card__content">
                        <div className="ppp-pricing-card__top">
                          <span className="ppp-pricing-card__eyebrow">{card.eyebrow}</span>
                          <h3>{card.title}</h3>
                          {card.duration && !card.hideDuration && (
                            <p className="ppp-pricing-card__subhead">{card.duration}</p>
                          )}
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

                        {card.bookable && (
                          <div className="aero-btn-booknow ppp-pricing-card__cta">
                            <BookingButton title="Book Now" />
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="ppp-empty-state">
                  <p>Pricing details are being updated. Please use booking for the latest availability.</p>
                  <div className="aero-btn-booknow ppp-pricing-card__cta">
                    <BookingButton title="Book Now" />
                  </div>
                </div>
              )}
            </article>

            <article className="ppp-inline-cta">
              <div>
                <p className="ppp-inline-cta__eyebrow">Ready to lock it in?</p>
                <h3>Reserve your play session before spots fill up.</h3>
              </div>

              <div className="ppp-inline-cta__actions">
                <div className="aero-btn-booknow">
                  <BookingButton title="Book Now" />
                </div>
              </div>
            </article>

            {hasPromotions && (
              <article className="ppp-promotions-block">
                <div className="ppp-section-intro">
                  <SectionHeading className="section-heading-white">
                    Current <span>Promotions</span>
                  </SectionHeading>
                  <p>
                    These offers are designed to make your next Pixel Pulse visit
                    even more fun for less.
                  </p>
                </div>

                <div className="ppp-promotions-grid">
                  {promotions.map((promo, index) => (
                    <article className="ppp-promo-card" key={`${promo.title}-${index}`}>
                      {promo.badge && <span className="ppp-promo-card__badge">{promo.badge}</span>}

                      <div className="ppp-promo-card__body">
                        <h3>{promo.title}</h3>
                        <p>{promo.description}</p>
                      </div>

                      <div className="ppp-promo-card__meta">
                        {promo.validity && (
                          <div>
                            <span>Valid</span>
                            <strong>{promo.validity}</strong>
                          </div>
                        )}
                        {promo.code && (
                          <div>
                            <span>Code</span>
                            <strong>{promo.code}</strong>
                          </div>
                        )}
                      </div>

                      {promo.link && (
                        <Link
                          href={promo.link}
                          className="ppp-promo-card__link"
                          target={promo.link.startsWith("http") ? "_blank" : undefined}
                        >
                          {promo.linktext || "Learn More"}
                        </Link>
                      )}
                    </article>
                  ))}
                </div>
              </article>
            )}

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
          </section>
        </div>
      </section>
    </main>
  );
};

export default PricingPromosPage;
