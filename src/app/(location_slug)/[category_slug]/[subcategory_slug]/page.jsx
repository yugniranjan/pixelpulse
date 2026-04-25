export const dynamic = "force-dynamic";
import React from "react";
import Image from "next/image";
import "../../../styles/subcategory.css";
import "../../../styles/category.css";
import "../../../styles/kidsparty.css";
import "../../../styles/promotions.css";
import { getDataByParentId } from "@/utils/customFunctions";
import {
  fetchsheetdata,
  fetchMenuData,
  generateMetadataLib,
  generateSchema,
} from "@/lib/sheets";
import Link from "next/link";
import { LOCATION_NAME } from "@/lib/constant";
import SectionHeading from "@/components/home/SectionHeading";
import BookingButton from "@/components/smallComponents/BookingButton";
import { getCtaContent } from "@/lib/ctaContent";

function stripHtml(html = "") {
  return html
    ?.replace(/<br\s*\/?>/gi, " ")
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
  const { subcategory_slug, category_slug } = await params;
  const location_slug = LOCATION_NAME || "vaughan";
  const metadata = await generateMetadataLib({
    location: location_slug,
    category: category_slug,
    page: subcategory_slug,
  });
  return metadata;
}

const Subcategory = async ({ params }) => {
  const { subcategory_slug, category_slug } = await params;
  const location_slug = LOCATION_NAME;
  const [data, dataconfig, menudata] = await Promise.all([
    fetchsheetdata("Data", location_slug),
    fetchsheetdata("config", location_slug),
    fetchMenuData(location_slug),
  ]);

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


  const pagedata = attractionsData?.[0];
  if (!pagedata) return;
  const configCta = getCtaContent(dataconfig);
  const pageCta = getCtaContent(pagedata || {});
  const ctaContent = {
    ...configCta,
    ...Object.fromEntries(
      Object.entries(pageCta).filter(([, value]) => Boolean(value)),
    ),
  };
  const contactHref = ctaContent.contactHref || "/contactus";
  const isAttractionDetailPage = category_slug === "attractions";
  const isGroupsDetailPage = category_slug === "group-events";
  const detailContentHtml = pagedata?.seosection || "";
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
                <article className="ppp-subcategory-overview">
                <SectionHeading className="section-heading-white" mainHeading="true">
                  <span>{pagedata?.title}</span>
                </SectionHeading>
                <h2>{pagedata?.metatitle}</h2>
                <p>{pagedata?.metadescription}</p>
              </article>
                {ctaContent.bookNowText && (
                  <div className="ppp-subcategory-hero__actions">
                    <div className="aero-btn-booknow">
                      <BookingButton title={ctaContent.bookNowText} />
                    </div>
                  </div>
                )}

                <div className="ppp-subcategory-hero__stats">
                  <div className="ppp-subcategory-stat">
                    <strong>{categoryData?.length || 0}</strong>
                    <span>More attractions</span>
                  </div>
                  <div className="ppp-subcategory-stat">
                    <strong>{LOCATION_NAME.replace(/-/g, " ")}</strong>
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
                    <Image
                      src={heroImage}
                      alt={pagedata?.imagetitle || pagedata?.title || "Attraction image"}
                      width={1200}
                      height={800}
                      style={{ width: "100%", height: "auto" }}
                    />
                  </div>
                </div>
            </div>
          </section>

          <section className="subcategory_main_section-bg">
            <section className="aero-max-container ppp-subcategory-layout">
             

              {detailContentHtml && (
                <article className="ppp-subcategory-content">
                  <SectionHeading className="section-heading-white">
                    Experience <span>{pagedata?.title}</span>
                  </SectionHeading>
                  <div
                    className="ppp-subcategory-richtext"
                    dangerouslySetInnerHTML={{
                      __html: detailContentHtml,
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
                          href={`/${item?.parentid}/${item?.path}`}
                          prefetch
                          className="ppp-subcategory-card__media"
                        >
                          <Image
                            src={item?.smallimage || "/assets/images/logo.png"}
                            alt={item?.metatitle || item?.desc || "Attraction image"}
                            width={800}
                            height={600}
                            style={{ width: "100%", height: "auto" }}
                          />
                        </Link>

                        <div className="ppp-subcategory-card__body">
                          <Link href={`/${item?.parentid}/${item?.path}`} prefetch>
                            <h3>{item?.desc}</h3>
                            <p>{item?.metatitle}</p>
                          </Link>
                          {ctaContent.readMoreText && (
                            <Link
                              href={`/${item?.parentid}/${item?.path}`}
                              prefetch
                              className="ppp-subcategory-card__link"
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
            </section>
          </section>
        </section>
      ) : isGroupsDetailPage ? (
        <section className="ppp-groupdetail-page">
          <section className="ppp-groupdetail-hero">
            <div className="aero-max-container ppp-groupdetail-hero__inner">
              <div className="ppp-groupdetail-hero__copy">
                <article className="ppp-groupdetail-overview">
                  <SectionHeading className="section-heading-white" mainHeading="true">
                    <span>{pagedata?.title}</span>
                  </SectionHeading>
                  <h2>{pagedata?.metatitle}</h2>
                </article>

                {ctaContent.inquireText && (
                  <div className="ppp-groupdetail-hero__actions">
                    <a
                      className="ppp-groupdetail-inquire-btn"
                      href={contactHref}
                    >
                      <span>{ctaContent.inquireText}</span>
                    </a>
                  </div>
                )}
              </div>

              <div className="ppp-groupdetail-hero__panel">
                <div className="ppp-groupdetail-hero-card__image">
                  <Image
                    src={heroImage}
                    alt={pagedata?.imagetitle || pagedata?.title || "Private party image"}
                    width={1200}
                    height={800}
                    style={{ width: "100%", height: "auto" }}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="subcategory_main_section-bg">
            <section className="aero-max-container ppp-groupdetail-layout">
            
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
                          <Image
                            src={item?.smallimage || "/assets/images/logo.png"}
                            alt={item?.metatitle || item?.desc || "Group event image"}
                            width={800}
                            height={600}
                            style={{ width: "100%", height: "auto" }}
                          />
                        </Link>

                        <div className="ppp-groupdetail-card__body">
                          <Link href={`/${location_slug}/${item?.parentid}/${item?.path}`} prefetch>
                            <h3>{item?.desc}</h3>
                            <p>{item?.metatitle}</p>
                          </Link>
                          {ctaContent.readMoreText && (
                            <Link
                              href={`/${location_slug}/${item?.parentid}/${item?.path}`}
                              prefetch
                              className="ppp-groupdetail-card__link"
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
            </section>
          </section>
        </section>
      ) : (
        <section className="ppp-detail-page">
          <section className="ppp-detail-hero">
            <div className="aero-max-container ppp-detail-hero__inner">
              <div className="ppp-detail-hero__copy">
                <SectionHeading className="section-heading-white" mainHeading="true">
                  <span>{pagedata?.title}</span>
                </SectionHeading>
                {pagedata?.metatitle && <h2>{pagedata.metatitle}</h2>}
                {(pagedata?.metadescription || introText) && (
                  <p>{pagedata?.metadescription || introText}</p>
                )}
                {(ctaContent.bookNowText || ctaContent.inquireText) && (
                  <div className="ppp-detail-hero__actions">
                    {ctaContent.bookNowText && <BookingButton title={ctaContent.bookNowText} />}
                    {ctaContent.inquireText && (
                      <Link href={contactHref} className="ppp-detail-btn ppp-detail-btn--outline" prefetch>
                        {ctaContent.inquireText}
                      </Link>
                    )}
                  </div>
                )}
              </div>

              <div className="ppp-detail-hero__media">
                <Image
                  src={heroImage}
                  alt={pagedata?.imagetitle || pagedata?.title || "Pixel Pulse Play"}
                  width={1200}
                  height={800}
                  style={{ width: "100%", height: "auto" }}
                />
              </div>
            </div>
          </section>

          <section className="ppp-detail-body">
            <section className="aero-max-container ppp-detail-body__inner">
              {pagedata?.seosection && (
                <article className="ppp-detail-richtext">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: pagedata.seosection,
                    }}
                  />
                </article>
              )}

              {categoryData?.length > 0 && (
                <section className="ppp-detail-grid-wrap">
                  <div className="ppp-detail-section-intro">
                    <SectionHeading className="section-heading-white">
                      More <span>{pagedata.parentid}</span>
                    </SectionHeading>
                    <p>{pagedata.metadescription}</p>
                  </div>

                  <section className="ppp-detail-grid">
                    {categoryData.map((item, i) => (
                      <article className="ppp-detail-card" key={item.pageid || i}>
                        <Link
                          href={`/${item?.parentid}/${item?.path}`}
                          prefetch
                          className="ppp-detail-card__media"
                        >
                          <Image
                            src={item?.smallimage || "/assets/images/logo.png"}
                            alt={item?.imagetitle || item?.desc || "Pixel Pulse Play"}
                            width={800}
                            height={600}
                            style={{ width: "100%", height: "auto" }}
                          />
                        </Link>

                        <div className="ppp-detail-card__body">
                          <Link href={`/${item?.parentid}/${item?.path}`} prefetch>
                            <h3>{item?.desc}</h3>
                            <p>{item?.metatitle || item?.metadescription}</p>
                          </Link>
                          {ctaContent.readMoreText && (
                            <Link
                              href={`/${item?.parentid}/${item?.path}`}
                              prefetch
                              className="ppp-detail-card__link"
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
            </section>
          </section>
        </section>
      )}
       <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: jsonLDschema || "" }}
      />
    </main>
  );
};

export default Subcategory;
