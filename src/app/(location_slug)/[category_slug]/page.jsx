import Link from "next/link";
import React from "react";
import "../../styles/category.css";
import "../../styles/blogs.css";
import { getDataByParentId } from "@/utils/customFunctions";
import {
  fetchMenuData,
  fetchsheetdata,
  generateMetadataLib,
  fetchPageData,
  getWaiverLink,
  generateSchema,
} from "@/lib/sheets";
import MotionImage from "@/components/MotionImage";
import { LOCATION_NAME } from "@/lib/constant";
import { notFound } from "next/navigation";
import SectionHeading from "@/components/home/SectionHeading";
import BookingButton from "@/components/smallComponents/BookingButton";

function stripHtml(html = "") {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
  const data = await fetchMenuData(location_slug);
  const pageData = await fetchPageData(location_slug, category_slug);
  // const waiverLink = await getWaiverLink(location_slug);

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
  const aboutContentHtml = pageData?.seosection || "";
  const attractionHeroContent = parseHeroTextBlock(pageData?.section2 || "");
  const attractionHeroLabelHtml = pageData?.section3 || "";
  const attractionHeroHeading = attractionHeroContent.heading;
  const attractionHeroBullets = attractionHeroContent.bullets;
  const groupsHeroContent = parseHeroTextBlock(pageData?.section2 || "");
  const groupsHeroLabelHtml = pageData?.section3 || "";
  const groupsHeroHeading = groupsHeroContent.heading;
  const groupsHeroBullets = groupsHeroContent.bullets;
  const aboutHeroContent = parseHeroTextBlock(pageData?.section2 || "");
  const aboutHeroLabelHtml = pageData?.section3 || "";
  const aboutHeroHeading = aboutHeroContent.heading;
  const aboutHeroBullets = aboutHeroContent.bullets;

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
                    {attractionHeroLabelHtml && (
                      <div dangerouslySetInnerHTML={{ __html: attractionHeroLabelHtml }} />
                    )}
                    {attractionHeroHeading && <h2>{attractionHeroHeading}</h2>}
                    {attractionHeroBullets.length > 0 && (
                      <ul>
                        {attractionHeroBullets.map((item, index) => (
                          <li key={`${item}-${index}`}>{item}</li>
                        ))}
                      </ul>
                    )}
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
                 

                  <section className="ppp-attractions-grid">
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
                            Read More
                          </Link>
                        </div>
                      </article>
                    ))}
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
                    {groupsHeroHeading && <h2>{groupsHeroHeading}</h2>}
                    {groupsHeroBullets.length > 0 && (
                      <ul>
                        {groupsHeroBullets.map((item, index) => (
                          <li key={`${item}-${index}`}>{item}</li>
                        ))}
                      </ul>
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
                          <Link
                            href={`${category_slug}/${item?.path}`}
                            prefetch
                            className="ppp-group-card-modern__link"
                          >
                            Explore Option
                          </Link>
                        </div>
                      </article>
                    ))}
                  </section>
                </section>
              </section>
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
                            <Link
                              href={`${category_slug}/${item?.path}`}
                              prefetch
                              className="ppp-about-card-modern__link"
                            >
                              Read More
                            </Link>
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
          <section className="aero_category_section_wrapper">
            {/* <MotionImage
              pageData={safePageData}
              waiverLink={safeWaiverLink}
            /> */}
            <section className="aero-max-container">
              <div style={{ padding: "50px 0 40px 0" }}>
                <SectionHeading mainHeading="true"><span>{attractionsData[0]?.desc}</span></SectionHeading>
              </div>
              {
                pageData?.seosection && (<section className="aero_home_article_section">
                  <section className="aero-max-container aero_home_seo_section">
                    <div
                      dangerouslySetInnerHTML={{ __html: pageData?.seosection || "" }}
                    />
                  </section>
                </section>)
              }


              <section className="aero-blog-main-article-wrapper">
                {attractionsData[0]?.children?.map((item, i) => {
                  return (
                    item?.isactive == 1 && (
                      <article
                        className="aero-blog-main-article-card"
                        key={item.pageid}
                      >
                        <div className="aero-blog-img-section">
                          <Link
                            href={`${category_slug}/${item?.path}`}
                            prefetch
                            key={i}
                          >
                            <img
                              src={
                                item?.smallimage || "/assets/images/logo.png"
                              }
                              alt="Article Image"
                            />
                          </Link>
                        </div>
                        <div className="aero-blog-content-section">
                          <Link
                            href={`${category_slug}/${item?.path}`}
                            prefetch
                            key={i}
                          >
                            <h2 className="aero-blog-second-heading">
                              {item.desc}
                            </h2>
                            <p className="aero-blog-second-para">{item.metatitle}</p>
                          </Link>
                          <Link
                            href={`${category_slug}/${item?.path}`}
                            prefetch
                            className="aero-blog-readmore-btn"
                          >
                            READ MORE
                          </Link>
                        </div>
                      </article>
                    )
                  );
                })}
              </section>
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

        {!isGroupsEventsPage && (
          <div className="d-flex-center aero-btn-booknow" style={{ padding: "2em", backgroundColor: "var(--black-color)" }}>
            <BookingButton title="Book Now" />
          </div>
        )}

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
