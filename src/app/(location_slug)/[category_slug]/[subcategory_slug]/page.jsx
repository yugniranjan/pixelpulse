export const dynamic = "force-dynamic";
import React from "react";
import "../../../styles/subcategory.css";
import "../../../styles/category.css";
import "../../../styles/kidsparty.css";
import "../../../styles/promotions.css";
import { getDataByParentId } from "@/utils/customFunctions";
import MotionImage from "@/components/MotionImage";
import ImageMarquee from "@/components/ImageMarquee";
import SubCategoryCard from "@/components/smallComponents/SubCategoryCard";
import {
  fetchsheetdata,
  fetchMenuData,
  generateMetadataLib,
  getWaiverLink,
  generateSchema,
} from "@/lib/sheets";
import Link from "next/link";
import { LOCATION_NAME } from "@/lib/constant";
import SectionHeading from "@/components/home/SectionHeading";
import BookingButton from "@/components/smallComponents/BookingButton";

function stripHtml(html = "") {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function looksLikeRenderableImage(url = "") {
  if (!url) return false;

  if (url.startsWith("/")) return true;

  const normalized = url.split("?")[0].toLowerCase();
  return [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".svg"].some((ext) =>
    normalized.endsWith(ext),
  );
}

function getPreferredHeroImage(pageData) {
  if (looksLikeRenderableImage(pageData?.smallimage)) return pageData.smallimage;
  if (looksLikeRenderableImage(pageData?.headerimage)) return pageData.headerimage;
  return pageData?.smallimage || pageData?.headerimage || "/assets/images/logo.png";
}

export async function generateMetadata({ params }) {
  const {
    location_slug = LOCATION_NAME || "vaughan",
    subcategory_slug,
    category_slug,
  } = params;
  const metadata = await generateMetadataLib({
    location: location_slug,
    category: category_slug,
    page: subcategory_slug,
  });
  return metadata;
}

const Subcategory = async ({ params }) => {
  // console.log("console", params);
  const {
    location_slug = LOCATION_NAME,
    subcategory_slug,
    category_slug,
  } = params;
  const [data, dataconfig, menudata] = await Promise.all([
    fetchsheetdata("Data", location_slug),
    fetchsheetdata("config", location_slug),
    fetchMenuData(location_slug),
  ]);

  const waiverLink = await getWaiverLink(location_slug);

  const categoryData = (
    await getDataByParentId(menudata, category_slug)
  )[0]?.children?.filter(
    (child) => child.path !== subcategory_slug && child.isactive == 1,
  );

  const attractionsData = Array.isArray(data)
    ? getDataByParentId(data, subcategory_slug)
    : [];

    const jsonLDschema = await generateSchema(
    data,
    '',
    subcategory_slug,
    category_slug
  );


  const safePageData = JSON.parse(JSON.stringify(attractionsData));
  const safeWaiverLink = JSON.parse(JSON.stringify(waiverLink));

  const pagedata = attractionsData?.[0];
  if (!pagedata) return;
  const isAttractionDetailPage = category_slug === "attractions";
  const isGroupsDetailPage = category_slug === "groups-events";
  const introText =
    stripHtml(pagedata?.seosection || "") ||
    pagedata?.metadescription ||
    "Step into an immersive challenge built for movement, reaction time, and repeat play.";
  const heroImage = getPreferredHeroImage(pagedata);

  return (
    <main>
      {isAttractionDetailPage ? (
        <section className="ppp-subcategory-page">
          <section className="ppp-subcategory-hero">
            <div className="aero-max-container ppp-subcategory-hero__inner">
              <div className="ppp-subcategory-hero__copy">
                <span className="ppp-subcategory-hero__eyebrow">Attraction Spotlight</span>
                <h1 className="ppp-subcategory-hero__title">{pagedata?.title}</h1>
                <p className="ppp-subcategory-hero__text">{introText}</p>

                <div className="ppp-subcategory-hero__actions">
                  <div className="aero-btn-booknow">
                    <BookingButton title="Book Now" />
                  </div>
                  {safeWaiverLink && (
                    <Link href={safeWaiverLink} target="_blank" className="ppp-subcategory-hero__link">
                      Complete Waiver
                    </Link>
                  )}
                </div>

                <div className="ppp-subcategory-hero__stats">
                  <div className="ppp-subcategory-stat">
                    <strong>{categoryData?.length || 0}</strong>
                    <span>More attractions</span>
                  </div>
                  <div className="ppp-subcategory-stat">
                    <strong>{location_slug.replace(/-/g, " ")}</strong>
                    <span>Location served</span>
                  </div>
                  <div className="ppp-subcategory-stat">
                    <strong>Active</strong>
                    <span>Play experience</span>
                  </div>
                </div>
              </div>

                <div className="ppp-subcategory-hero__panel">
                  <div className="ppp-subcategory-hero-card">
                    <img
                    src={heroImage}
                    alt={pagedata?.imagetitle || pagedata?.title || "Attraction image"}
                    />
                  </div>
                </div>
            </div>
          </section>

          <section className="subcategory_main_section-bg">
            <section className="aero-max-container ppp-subcategory-layout">
              <article className="ppp-subcategory-overview">
                <SectionHeading className="section-heading-white" mainHeading="true">
                  <span>{pagedata?.title}</span>
                </SectionHeading>
                <h2>{pagedata?.metatitle}</h2>
                <p>{pagedata?.metadescription}</p>
              </article>

              {pagedata?.seosection && (
                <article className="ppp-subcategory-content">
                  <SectionHeading className="section-heading-white">
                    Experience <span>{pagedata?.title}</span>
                  </SectionHeading>
                  <div
                    className="ppp-subcategory-richtext"
                    dangerouslySetInnerHTML={{
                      __html: pagedata.seosection || "",
                    }}
                  />
                </article>
              )}

              {categoryData?.length > 0 && (
                <section className="ppp-subcategory-grid-wrap">
                  <div className="ppp-subcategory-section-intro">
                    <SectionHeading className="section-heading-white">
                      Explore More <span>Attractions</span>
                    </SectionHeading>
                    <p>
                      Keep the momentum going with more interactive rooms and challenge-based experiences across Pixel Pulse Play.
                    </p>
                  </div>

                  <section className="ppp-subcategory-grid">
                    {categoryData.map((item, i) => (
                      <article className="ppp-subcategory-card" key={item.pageid || i}>
                        <Link
                          href={`/${location_slug}/${item?.parentid}/${item?.path}`}
                          prefetch
                          className="ppp-subcategory-card__media"
                        >
                          <img
                            src={item?.smallimage || "/assets/images/logo.png"}
                            alt={item?.metatitle || item?.desc || "Attraction image"}
                          />
                        </Link>

                        <div className="ppp-subcategory-card__body">
                          <Link href={`/${location_slug}/${item?.parentid}/${item?.path}`} prefetch>
                            <h3>{item?.desc}</h3>
                            <p>{item?.metatitle}</p>
                          </Link>
                          <Link
                            href={`/${location_slug}/${item?.parentid}/${item?.path}`}
                            prefetch
                            className="ppp-subcategory-card__link"
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
      ) : isGroupsDetailPage ? (
        <section className="ppp-groupdetail-page">
          <section className="ppp-groupdetail-hero">
            <div className="aero-max-container ppp-groupdetail-hero__inner">
              <div className="ppp-pricing-hero__panel ppp-groupdetail-hero__panel--single">
                <div className="ppp-pricing-hero-card ppp-groupdetail-hero-card--single">
                  <span className="ppp-pricing-hero-card__label">Group Events</span>
                  <h2>{pagedata?.metatitle || pagedata?.title}</h2>
                  <p className="ppp-groupdetail-hero__text">{introText}</p>

                  <div className="ppp-groupdetail-hero__actions">
                    <div className="aero-btn-booknow">
                      <BookingButton title="Inquire Now" />
                    </div>
                    {safeWaiverLink && (
                      <Link href={safeWaiverLink} target="_blank" className="ppp-groupdetail-hero__link">
                        Complete Waiver
                      </Link>
                    )}
                  </div>

                  <div className="ppp-groupdetail-hero-card__image">
                    <img
                      src={heroImage}
                      alt={pagedata?.imagetitle || pagedata?.title || "Private party image"}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="subcategory_main_section-bg">
            <section className="aero-max-container ppp-groupdetail-layout">
              <article className="ppp-groupdetail-overview">
                <SectionHeading className="section-heading-white" mainHeading="true">
                  <span>{pagedata?.title}</span>
                </SectionHeading>
                <h2>{pagedata?.metatitle}</h2>
                <p>{pagedata?.metadescription}</p>
              </article>

              {pagedata?.seosection && (
                <article className="ppp-groupdetail-content">
                  <SectionHeading className="section-heading-white">
                    Group Event <span>Details</span>
                  </SectionHeading>
                  <div
                    className="ppp-groupdetail-richtext"
                    dangerouslySetInnerHTML={{
                      __html: pagedata.seosection || "",
                    }}
                  />
                </article>
              )}

              {categoryData?.length > 0 && (
                <section className="ppp-groupdetail-grid-wrap">
                  <div className="ppp-groupdetail-section-intro">
                    <SectionHeading className="section-heading-white">
                      More Group <span>Experiences</span>
                    </SectionHeading>
                    <p>
                      Explore more event formats built for celebrations, school outings, team bonding, and private group play.
                    </p>
                  </div>

                  <section className="ppp-groupdetail-grid">
                    {categoryData.map((item, i) => (
                      <article className="ppp-groupdetail-card" key={item.pageid || i}>
                        <Link
                          href={`/${location_slug}/${item?.parentid}/${item?.path}`}
                          prefetch
                          className="ppp-groupdetail-card__media"
                        >
                          <img
                            src={item?.smallimage || "/assets/images/logo.png"}
                            alt={item?.metatitle || item?.desc || "Group event image"}
                          />
                        </Link>

                        <div className="ppp-groupdetail-card__body">
                          <Link href={`/${location_slug}/${item?.parentid}/${item?.path}`} prefetch>
                            <h3>{item?.desc}</h3>
                            <p>{item?.metatitle}</p>
                          </Link>
                          <Link
                            href={`/${location_slug}/${item?.parentid}/${item?.path}`}
                            prefetch
                            className="ppp-groupdetail-card__link"
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
        <>
          <section>
            <MotionImage pageData={safePageData} waiverLink={safeWaiverLink} />
          </section>

          <section className="subcategory_main_section-bg">
            <section className="aero-max-container ">
              <div style={{ padding: "40px 0 10px 0" }}>
                <SectionHeading mainHeading="true">
                  <span>{pagedata?.title}</span>
                </SectionHeading>
              </div>
              <div className="subcategory_main_section">
                <h2>{pagedata?.metatitle}</h2>
                <p>{pagedata?.metadescription}</p>
              </div>
            </section>

            <section className="aero_home_article_section">
              <section className="aero-max-container aero_home_seo_section">
                <div
                  dangerouslySetInnerHTML={{
                    __html: pagedata.seosection || "",
                  }}
                />
              </section>
            </section>

            <SubCategoryCard
              attractionsData={categoryData}
              location_slug={location_slug}
              theme={"default"}
              title={`Other ${pagedata.parentid}`}
              text={[pagedata.metadescription]}
            />
          </section>
        </>
      )}

      {/* <ImageMarquee imagesString={pagedata.headerimage} /> */}



       <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: jsonLDschema || "" }}
      />
    </main>
  );
};

export default Subcategory;
