import Link from "next/link";
import React from "react";
import "../../styles/category.css";
import "../../styles/blogs.css";
import { getDataByParentId } from "@/utils/customFunctions";
import {
  fetchMenuData,
  fetchsheetdata,
  fetchsheetdataNoCache,
  generateMetadataLib,
  fetchPageData,
  generateSchema,
} from "@/lib/sheets";
import { LOCATION_NAME } from "@/lib/constant";
import { notFound } from "next/navigation";
import SectionHeading from "@/components/home/SectionHeading";
import BookingButton from "@/components/smallComponents/BookingButton";
import { getConfigValue, getCtaContent, resolveConfiguredValue } from "@/lib/ctaContent";

const ABOUT_BUILDING_IMAGE_FALLBACK =
  "https://storage.googleapis.com/pixel-pulse-play/web/pixelmainbuilding.jpg";
const ABOUT_BUILDING_IMAGE_REDIRECT_SOURCE = "/about-building-image";

function stripHtml(html = "") {
  return html
    ?.replace(/<br\s*\/?>/gi, " ")
    ?.replace(/<[^>]*>/g, " ")
    ?.replace(/\s+/g, " ")
    ?.trim();
}

function decodeHtmlEntities(text = "") {
  return text
    ?.replace(/&nbsp;/gi, " ")
    ?.replace(/&amp;/gi, "&")
    ?.replace(/&quot;/gi, '"')
    ?.replace(/&#39;|&apos;/gi, "'")
    ?.replace(/&lt;/gi, "<")
    ?.replace(/&gt;/gi, ">");
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
    html?.replace(/<br\s*\/?>/gi, "\n")?.replace(/<\/p>/gi, "\n")
  )
    .split("\n")
    .map((line) => stripHtml(line))
    .filter(Boolean);

  return firstLine;
}

function splitHeroHtml(content = "") {
  const html = String(content || "").trim();
  if (!html) {
    return { headingHtml: "", bodyHtml: "" };
  }

  const headingMatch = html.match(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/i);
  if (!headingMatch) {
    return { headingHtml: "", bodyHtml: html };
  }

  return {
    headingHtml: headingMatch[0],
    bodyHtml: html.replace(headingMatch[0], "").trim(),
  };
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
    ?.replace(/\r/g, "")
    ?.split("\n")
    ?.map((line) => line.replace(/^[\-\*\u2022]\s*/, "").trim())
    ?.filter(Boolean);

  return {
    heading: lines[0] || "",
    bullets: lines.slice(1),
  };
}

function getRedirectDestination(rows = [], source = "") {
  const normalizedSource = String(source || "").trim().toLowerCase();
  const matchingRow = rows.find((row) => {
    const rowSource = String(row?.source || "").trim().toLowerCase();
    return rowSource === normalizedSource || `/${rowSource}` === normalizedSource;
  });

  return String(matchingRow?.destination || "").trim();
}

function addBuildingImageNextToMap(html = "", buildingImageUrl = ABOUT_BUILDING_IMAGE_FALLBACK) {
  const content = String(html || "");
  const iframeMatch = content.match(/<iframe\b[\s\S]*?<\/iframe>/i);

  if (!iframeMatch) {
    return content;
  }

  return content.replace(
    iframeMatch[0],
    `<div class="ppp-about-map-media">${iframeMatch[0]}<figure class="ppp-about-building-media"><img src="${buildingImageUrl}" alt="Pixel Pulse Play building exterior" loading="lazy" /></figure></div>`,
  );
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
  if (looksLikeRenderableImage(pageData?.smallimage)) return pageData.smallimage;
  if (looksLikeRenderableImage(pageData?.headerimage)) return pageData.headerimage;
  return pageData?.smallimage || pageData?.headerimage || "/assets/images/logo.png";
}

export async function generateMetadata({ params }) {
  const { category_slug } = await params;
  const location_slug = LOCATION_NAME;

  const metadata = await generateMetadataLib({
    location: location_slug,
    category: "",
    page: category_slug,
  });
  return metadata;
}

const Category = async ({ params }) => {
  const { category_slug } = await params;
  const location_slug = LOCATION_NAME;

  if (category_slug === "refresh") {
    await fetchsheetdata("refresh", location_slug);
    return "data refreshed";
  }

  // 1️⃣ Fetch data
  const [data, pageData, configData, redirectData] = await Promise.all([
    fetchMenuData(location_slug),
    fetchPageData(location_slug, category_slug),
    fetchsheetdata("config", location_slug),
    fetchsheetdataNoCache("redirects"),
  ]);

  // 2️⃣ Derived data
  const attractionsData = data ? getDataByParentId(data, category_slug) : null;
  const isAttractionsPage = category_slug === "attractions";
  const isGroupsEventsPage = category_slug === "group-events";
  const isAboutPage = category_slug === "about-us";
  const attractionItems =
    attractionsData?.[0]?.children?.filter((item) => item?.isactive == 1) || [];
  const introText =
    stripHtml(pageData?.seosection || "") ||
    stripHtml(pageData?.section1 || "") ||
    "Step into immersive digital game rooms built for movement, reaction, teamwork, and all-out fun.";
  const aboutBuildingImage =
    getRedirectDestination(redirectData, ABOUT_BUILDING_IMAGE_REDIRECT_SOURCE) ||
    ABOUT_BUILDING_IMAGE_FALLBACK;
  const aboutContentHtml = addBuildingImageNextToMap(
    pageData?.seosection || "",
    aboutBuildingImage,
  );
  const attractionHeroContent = parseHeroTextBlock(pageData?.section2 || "");
  const attractionHeroLabelHtml = pageData?.section3 || "";
  const attractionHeroHtml = pageData?.section2 || "";
  const attractionHeroHeading = attractionHeroContent.heading;
  const attractionHeroBullets = attractionHeroContent.bullets;
  const groupsHeroContent = parseHeroTextBlock(pageData?.section2 || "");
  const groupsHeroLabelHtml = pageData?.section3 || "";
  const groupsHeroHtml = pageData?.section2 || "";
  const groupsHeroSplit = splitHeroHtml(groupsHeroHtml);
  const groupsHeroHeading = groupsHeroContent.heading;
  const groupsHeroBullets = groupsHeroContent.bullets;
  const aboutHeroContent = parseHeroTextBlock(pageData?.section2 || "");
  const aboutHeroLabelHtml = pageData?.section3 || "";
  const aboutHeroHeading = aboutHeroContent.heading;
  const aboutHeroBullets = aboutHeroContent.bullets;
  const pageHeroContent = parseHeroTextBlock(pageData?.section2 || "");
  const pageHeroLabelHtml = pageData?.section3 || "";
  const pageHeroHeading = pageHeroContent.heading || attractionsData?.[0]?.desc || "";
  const pageHeroBullets = pageHeroContent.bullets;
  const pageHeroImage = getPreferredImage(pageData || attractionsData?.[0]);
  const pageChildren = attractionsData?.[0]?.children?.filter((item) => item?.isactive == 1) || [];
  const configCta = getCtaContent(configData);
  const pageCta = getCtaContent(pageData || {});
  const ctaContent = {
    ...configCta,
    ...Object.fromEntries(
      Object.entries(pageCta).filter(([, value]) => Boolean(value)),
    ),
  };
  const contactHref = ctaContent.contactHref || "/contactus";
  const aboutReadMoreText =
    getConfigValue(configData, ["aboutReadMoreText", "aboutCardReadMoreText"]) ||
    "Read More";
  const attractionsFinalCtaTitle = resolveConfiguredValue({
    sources: [configData, pageData || {}],
    keys: ["attractionsFinalCtaTitle", "attractionFinalCtaTitle"],
    value: ctaContent.attractionsFinalCtaTitle,
    fallback: "One place. Multiple challenges.",
  });
  const attractionsFinalCtaSubtitle = resolveConfiguredValue({
    sources: [configData, pageData || {}],
    keys: ["attractionsFinalCtaSubtitle", "attractionFinalCtaSubtitle"],
    value: ctaContent.attractionsFinalCtaSubtitle,
    fallback: "Who are you bringing?",
  });
  const attractionsFinalCtaPrimaryText = resolveConfiguredValue({
    sources: [configData, pageData || {}],
    keys: ["attractionsFinalCtaPrimaryText", "attractionFinalCtaPrimaryText"],
    value: ctaContent.attractionsFinalCtaPrimaryText,
    fallback: "Book Now",
  });
  const attractionsFinalCtaSecondaryText = resolveConfiguredValue({
    sources: [configData, pageData || {}],
    keys: ["attractionsFinalCtaSecondaryText", "attractionFinalCtaSecondaryText"],
    value: ctaContent.attractionsFinalCtaSecondaryText,
    fallback: "Plan a Party",
  });
  const groupsCardsHeading = resolveConfiguredValue({
    sources: [configData, pageData || {}],
    keys: ["groupsCardsHeading", "groupCardsHeading"],
    value: ctaContent.groupsCardsHeading,
    fallback: "What Are You Planning?",
  });
  const groupsFinalCtaTitle = resolveConfiguredValue({
    sources: [configData, pageData || {}],
    keys: ["groupsFinalCtaTitle", "groupFinalCtaTitle"],
    value: ctaContent.groupsFinalCtaTitle,
    fallback: "Let’s Plan Something Your Group Will Actually Enjoy",
  });
  const groupsFinalCtaSubtitle = resolveConfiguredValue({
    sources: [configData, pageData || {}],
    keys: ["groupsFinalCtaSubtitle", "groupFinalCtaSubtitle"],
    value: ctaContent.groupsFinalCtaSubtitle,
    fallback: "Tell us your group size and we’ll handle the rest.",
  });
  const groupsFinalCtaPrimaryText = resolveConfiguredValue({
    sources: [configData, pageData || {}],
    keys: ["groupsFinalCtaPrimaryText", "groupFinalCtaPrimaryText"],
    value: ctaContent.groupsFinalCtaPrimaryText,
    fallback: "Plan Your Event",
  });
  const groupsFinalCtaSecondaryText = resolveConfiguredValue({
    sources: [configData, pageData || {}],
    keys: ["groupsFinalCtaSecondaryText", "groupFinalCtaSecondaryText"],
    value: ctaContent.groupsFinalCtaSecondaryText,
    fallback: "Talk To Us",
  });

  const jsonLDschema = await generateSchema(
    pageData,
    '',
    "",
    category_slug
  );

  // 3️⃣ ✅ SINGLE SOURCE OF TRUTH for 404
  if (!data || !attractionsData || attractionsData.length === 0) {
    notFound(); // 👉 app/not-found.jsx
  }

  return (
    <main>
      <section>
        {isAttractionsPage ? (
          <section className="ppp-attractions-page">
            <section className="ppp-attractions-hero">
              <div className="aero-max-container ppp-attractions-hero__inner">
                <div className="ppp-attractions-hero__panel">
                  <div className="ppp-about-hero-card">
                    <div className="ppp-attractions-hero__copy-block">
                      {attractionHeroLabelHtml && (
                        <div dangerouslySetInnerHTML={{ __html: attractionHeroLabelHtml }} />
                      )}
                      {attractionHeroHtml ? (
                        <div
                          className="ppp-attractions-hero__body"
                          dangerouslySetInnerHTML={{ __html: attractionHeroHtml }}
                        />
                      ) : (
                        <>
                          {attractionHeroHeading && <h2>{attractionHeroHeading}</h2>}
                          {attractionHeroBullets.length > 0 && (
                            <ul>
                              {attractionHeroBullets.map((item, index) => (
                                <li key={`${item}-${index}`}>{item}</li>
                              ))}
                            </ul>
                          )}
                        </>
                      )}
                      <div className="ppp-attractions-hero__actions">
                        <BookingButton
                          title="Book Your Game"
                          className="ppp-attractions-hero__book-btn"
                          bookingType="ticket"
                        />
                        <Link href="/kids-birthday-parties" className="ppp-attractions-hero__link" prefetch>
                          Book a Party
                        </Link>
                      </div>
                    </div>
	                  </div>
	                </div>
	              </div>
            </section>

            <section className="aero_category_section_wrapper">
              <section className="aero-max-container ppp-attractions-layout">
                {pageData?.seosection && (
                  <article className="ppp-attractions-content">
                    <SectionHeading className="section-heading-white">
                      Discover <span>{attractionsData[0]?.desc}</span>
                    </SectionHeading>
                    <div
                      className="ppp-attractions-richtext"
                      dangerouslySetInnerHTML={{ __html: pageData?.seosection || "" }}
                    />
                  </article>
                )}

                <section className="ppp-attractions-grid-wrap">
                  <section className="ppp-attractions-grid" id="all-challenges">
                    {attractionItems.map((item, i) => (
                      <article className="ppp-attraction-card-modern" key={item.pageid || i}>
                        <Link
                          href={`${category_slug}/${item?.path}`}
                          prefetch
                          className="ppp-attraction-card-modern__media"
                        >
                          <img
                            src={item?.smallimage || "/assets/images/logo.png"}
                            alt={item?.desc || "Attraction image"}
                          />
                        </Link>

                        <div className="ppp-attraction-card-modern__body">
                          <Link href={`${category_slug}/${item?.path}`} prefetch>
                            <h2>{item.desc}</h2>
                            <p>{item.metatitle}</p>
                          </Link>
                          <Link
                            href={`${category_slug}/${item?.path}`}
                            prefetch
                            className="ppp-attraction-card-modern__link"
                          >
                            Play This Room
                          </Link>
                        </div>
                      </article>
                    ))}
                  </section>

                  <section className="ppp-attractions-final-cta">
                    <p className="ppp-attractions-final-cta__text">
                      {[
                        attractionsFinalCtaTitle,
                        attractionsFinalCtaSubtitle,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    </p>
                    <div className="ppp-attractions-final-cta__actions">
                      <BookingButton
                        title={attractionsFinalCtaPrimaryText}
                        className="ppp-attractions-final-cta__btn"
                        bookingType={ctaContent.attractionsFinalCtaPrimaryBookingType || "ticket"}
                      />
                      <BookingButton
                        title={attractionsFinalCtaSecondaryText}
                        className="ppp-attractions-final-cta__btn"
                        bookingType={ctaContent.attractionsFinalCtaSecondaryBookingType || "party"}
                      />
                    </div>
                  </section>
                </section>
              </section>
            </section>
          </section>
        ) : isGroupsEventsPage ? (
          <section className="ppp-groups-page">
            <section className="ppp-groups-hero">
              <div className="aero-max-container ppp-groups-hero__inner">
                <div className="ppp-groups-hero__panel">
                  <div className="ppp-about-hero-card">
                    {groupsHeroLabelHtml && (
                      <div dangerouslySetInnerHTML={{ __html: groupsHeroLabelHtml }} />
                    )}
                    {groupsHeroHtml ? (
                      <>
                        {groupsHeroHeading && <h2>{groupsHeroHeading}</h2>}
                        {ctaContent.groupsHeroSubtitle && (
                          <p className="ppp-groups-hero__text">{ctaContent.groupsHeroSubtitle}</p>
                        )}
                        {groupsHeroSplit.bodyHtml && (
                          <div
                            className="ppp-groups-hero__body"
                            dangerouslySetInnerHTML={{ __html: groupsHeroSplit.bodyHtml }}
                          />
                        )}
                      </>
                    ) : (
                      <>
                        {groupsHeroHeading && <h2>{groupsHeroHeading}</h2>}
                        {ctaContent.groupsHeroSubtitle && (
                          <p className="ppp-groups-hero__text">{ctaContent.groupsHeroSubtitle}</p>
                        )}
                        {groupsHeroBullets.length > 0 && (
                          <ul>
                            {groupsHeroBullets.map((item, index) => (
                              <li key={`${item}-${index}`}>{item}</li>
                            ))}
                          </ul>
                        )}
                      </>
                    )}
                    {(ctaContent.groupsHeroPrimaryText || ctaContent.groupsHeroSecondaryText) && (
                      <div className="ppp-groups-hero__actions">
                        {ctaContent.groupsHeroPrimaryText && (
                          <BookingButton
                            title={ctaContent.groupsHeroPrimaryText}
                            className="ppp-groups-hero__book-btn"
                            bookingType={ctaContent.groupsHeroPrimaryBookingType}
                          />
                        )}
                        {ctaContent.groupsHeroSecondaryText && (
                          <Link
                            href={ctaContent.groupsHeroSecondaryHref || ctaContent.contactHref || "/contactus"}
                            className="ppp-groups-hero__link"
                            prefetch
                          >
                            {ctaContent.groupsHeroSecondaryText}
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="aero_category_section_wrapper">
              <section className="aero-max-container ppp-groups-layout">
                {pageData?.seosection && (
                  <article className="ppp-groups-content">
                    <SectionHeading className="section-heading-white">
                      Plan Your <span>Group Visit</span>
                    </SectionHeading>
                    <div
                      className="ppp-groups-richtext"
                      dangerouslySetInnerHTML={{ __html: pageData?.seosection || "" }}
                    />
                  </article>
                )}

                <section className="ppp-groups-grid-wrap">
                  <div className="ppp-groups-section-intro">
                    <SectionHeading className="section-heading-white">
                      {groupsCardsHeading}
                    </SectionHeading>
                  </div>

                  <section className="ppp-groups-grid">
                    {attractionItems.map((item, i) => (
                      <article className="ppp-group-card-modern" key={item.pageid || i}>
                        <Link
                          href={`${category_slug}/${item?.path}`}
                          prefetch
                          className="ppp-group-card-modern__media"
                        >
                          <img
                            src={item?.smallimage || "/assets/images/logo.png"}
                            alt={item?.desc || "Group event image"}
                          />
                        </Link>

                        <div className="ppp-group-card-modern__body">
                          <Link href={`${category_slug}/${item?.path}`} prefetch>
                            <h2>{item.desc}</h2>
                            <p>{item.metatitle}</p>
                          </Link>
                          {ctaContent.exploreOptionText && (
                            <Link
                              href={contactHref}
                              prefetch={contactHref.startsWith("/")}
                              className="ppp-group-card-modern__link"
                            >
                              {ctaContent.exploreOptionText}
                            </Link>
                          )}
                        </div>
                      </article>
                    ))}
                  </section>
                </section>
              </section>

              <div className="aero-max-container">
                <section className="ppp-groups-final-cta">
                  <p className="ppp-groups-final-cta__text">
                    {groupsFinalCtaTitle}
                  </p>
                  <p className="ppp-groups-final-cta__subtext">
                    {groupsFinalCtaSubtitle}
                  </p>
                  <div className="ppp-groups-final-cta__actions">
                    <BookingButton
                      title={groupsFinalCtaPrimaryText}
                      className="ppp-groups-final-cta__btn"
                      bookingType={ctaContent.groupsFinalCtaPrimaryBookingType || "party"}
                    />
                    <Link
                      href={ctaContent.groupsFinalCtaSecondaryHref || contactHref}
                      className="ppp-groups-final-cta__btn"
                      prefetch={(ctaContent.groupsFinalCtaSecondaryHref || contactHref).startsWith("/")}
                    >
                      {groupsFinalCtaSecondaryText}
                    </Link>
                  </div>
                </section>
              </div>
            </section>
          </section>
        ) : isAboutPage ? (
          <section className="ppp-about-page">
            <section className="ppp-about-hero">
              <div className="aero-max-container ppp-about-hero__inner">
                <div className="ppp-about-hero__panel">
                  <div className="ppp-about-hero-card">
                    {aboutHeroLabelHtml && (
                      <div dangerouslySetInnerHTML={{ __html: aboutHeroLabelHtml }} />
                    )}
                    {aboutHeroHeading && <h2>{aboutHeroHeading}</h2>}
                    {aboutHeroBullets.length > 0 && (
                      <ul>
                        {aboutHeroBullets.map((item, index) => (
                          <li key={`${item}-${index}`}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="aero_category_section_wrapper">
              <section className="aero-max-container ppp-about-layout">
                {(isAboutPage || pageData?.seosection) && (
                  <article className="ppp-about-content">
                    <div
                      className="ppp-about-richtext"
                      dangerouslySetInnerHTML={{ __html: aboutContentHtml }}
                    />
                  </article>
                )}

                {attractionItems.length > 0 && (
                  <section className="ppp-about-grid-wrap">
                    <div className="ppp-about-section-intro">
                      <SectionHeading className="section-heading-white">
                        Explore <span>More</span>
                      </SectionHeading>
                      <p>
                        Find answers, policies, and supporting information that
                        helps you plan your visit with confidence.
                      </p>
                    </div>

                    <section className="ppp-about-grid">
                      {attractionItems.map((item, i) => (
                        <article className="ppp-about-card-modern" key={item.pageid || i}>
                          <Link
                            href={`${category_slug}/${item?.path}`}
                            prefetch
                            className="ppp-about-card-modern__media"
                          >
                            <img
                              src={item?.smallimage || "/assets/images/logo.png"}
                              alt={item?.desc || "About page image"}
                            />
                          </Link>

                          <div className="ppp-about-card-modern__body">
                            <Link href={`${category_slug}/${item?.path}`} prefetch>
                              <h2>{item.desc}</h2>
                              <p>{item.metatitle}</p>
                            </Link>
                            {aboutReadMoreText && (
                              <Link
                                href={`${category_slug}/${item?.path}`}
                                prefetch
                                className="ppp-about-card-modern__link"
                              >
                                {aboutReadMoreText}
                              </Link>
                            )}
                          </div>
                        </article>
                      ))}
                    </section>
                  </section>
                )}
              </section>
            </section>
          </section>
        ) : (
          <section className="ppp-dynamic-page">
            <section className="ppp-dynamic-hero">
              <div className="aero-max-container ppp-dynamic-hero__inner">
                <div className="ppp-dynamic-hero__copy">
                  {pageHeroLabelHtml && (
                    <div
                      className="ppp-dynamic-hero__label"
                      dangerouslySetInnerHTML={{ __html: pageHeroLabelHtml }}
                    />
                  )}
                  <SectionHeading className="section-heading-white" mainHeading="true">
                    <span>{pageHeroHeading}</span>
                  </SectionHeading>
                  {(pageData?.metadescription || introText) && (
                    <p className="ppp-dynamic-hero__text">
                      {pageData?.metadescription || introText}
                    </p>
                  )}
                  {(ctaContent.bookNowText || ctaContent.inquireText) && (
                    <div className="ppp-dynamic-hero__actions">
                      {ctaContent.bookNowText && <BookingButton title={ctaContent.bookNowText} />}
                      {ctaContent.inquireText && (
                        <Link href={contactHref} className="ppp-dynamic-btn ppp-dynamic-btn--outline" prefetch>
                          {ctaContent.inquireText}
                        </Link>
                      )}
                    </div>
                  )}
                  {pageHeroBullets.length > 0 && (
                    <ul className="ppp-dynamic-hero__list">
                      {pageHeroBullets.map((item, index) => (
                        <li key={`${item}-${index}`}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="ppp-dynamic-hero__media">
                  <img
                    src={pageHeroImage}
                    alt={pageData?.imagetitle || attractionsData[0]?.desc || "Pixel Pulse Play"}
                  />
                </div>
              </div>
            </section>

            <section className="ppp-dynamic-body">
              <div className="aero-max-container ppp-dynamic-body__inner">
                {pageData?.seosection && (
                  <article className="ppp-dynamic-richtext">
                    <div dangerouslySetInnerHTML={{ __html: pageData.seosection }} />
                  </article>
                )}

                {pageChildren.length > 0 && (
                  <section className="ppp-dynamic-grid-wrap">
                    <div className="ppp-dynamic-section-intro">
                      <SectionHeading className="section-heading-white">
                        Explore <span>{attractionsData[0]?.desc}</span>
                      </SectionHeading>
                    </div>

                    <section className="ppp-dynamic-grid">
                      {pageChildren.map((item, i) => (
                        <article className="ppp-dynamic-card" key={item.pageid || i}>
                          <Link
                            href={`/${category_slug}/${item?.path}`}
                            prefetch
                            className="ppp-dynamic-card__media"
                          >
                            <img
                              src={item?.smallimage || "/assets/images/logo.png"}
                              alt={item?.imagetitle || item?.desc || "Pixel Pulse Play"}
                            />
                          </Link>
                          <div className="ppp-dynamic-card__body">
                            <Link href={`/${category_slug}/${item?.path}`} prefetch>
                              <h2>{item.desc}</h2>
                              <p>{item.metatitle || item.metadescription}</p>
                            </Link>
                            {ctaContent.readMoreText && (
                              <Link
                                href={`/${category_slug}/${item?.path}`}
                                prefetch
                                className="ppp-dynamic-card__link"
                              >
                                {ctaContent.readMoreText}
                              </Link>
                            )}
                          </div>
                        </article>
                      ))}
                    </section>
                  </section>
                )}
              </div>
            </section>
          </section>
        )}


        {
          pageData?.section1 && (<section className="aero_home_article_section">
            <section className="aero-max-container aero_home_seo_section">
              <div
                dangerouslySetInnerHTML={{ __html: pageData?.section1 || "" }}
              />
            </section>
          </section>)
        }

	        <script
          type="application/ld+json"
          // suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: jsonLDschema || "" }}
        />
      </section>
    </main>
  );
};

export default Category;