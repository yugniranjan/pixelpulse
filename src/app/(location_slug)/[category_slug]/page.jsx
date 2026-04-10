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

const ABOUT_US_THEME_HTML = `
<div class="container">
  <h2>Redefining How Vaughan Plays</h2>
  <p>Welcome to Pixel Pulse Playzone, Vaughan’s newest immersive entertainment destination — where physical energy meets digital innovation.</p>
  <p>Backed by the proven success of Aerosports Parks, Pixel Play is built for the next generation of play. We’re not just an indoor park. We’re a live-action gaming adventure designed to challenge the body, sharpen the mind, and ignite competitive spirit.</p>
  <p>Located in the heart of Vaughan at 960 Edgely Blvd, our 8,000+ sq. ft. arena delivers a high-energy, tech-driven experience for kids, teens, and families who want more than just screen time.</p>
  <h3>What Makes Pixel Pulse Playzone Different?</h3>
  <h4>Immersive. Interactive. Intelligent.</h4>
  <p>At Pixel Pulse Playzone, you don’t just play games — you step inside them.</p>
  <ul>
    <li>Interactive Pixel Tile Games.</li>
    <li>Virtual Reality Gaming Rooms.</li>
    <li>Ninja &amp; Agility Challenges.</li>
    <li>Competitive Arcade Battles.</li>
    <li>Private Party &amp; Event Rooms.</li>
  </ul>
  <p>Every experience is designed to build <strong>physical strength, cognitive skills, teamwork, and reflexes</strong> — all inside a safe, premium environment.</p>
  <h3>Built for the Digital Generation</h3>
  <p>Today’s kids don’t just want entertainment — they want engagement.</p>
  <p>That’s why Pixel Play integrates:</p>
  <ul>
    <li>Smart game tracking.</li>
    <li>Competitive leaderboards.</li>
    <li>High-energy sound &amp; LED environments.</li>
    <li>Skill-based progression systems.</li>
  </ul>
  <p>It feels like stepping inside a real-life console game — but you’re the controller.</p>
  <h3>Designed for Families</h3>
  <p>We’ve created a space where:</p>
  <ul>
    <li>Interactive Pixel Tile Games.</li>
    <li>Virtual Reality Gaming Rooms.</li>
    <li>Ninja &amp; Agility Challenges.</li>
    <li>Competitive Arcade Battles.</li>
    <li>Private Party &amp; Event Rooms.</li>
  </ul>
  <h3>Accessibility Commitment</h3>
  <p>We’re committed to providing an inclusive environment for all guests. Our facility is designed to be accessible, and we continually update our accessibility measures to meet the needs of our community.</p>
  <h3>Plan Your Visit</h3>
  <p>PixelPulsePlay vaughan invites you to experience the excitement firsthand. As a family-owned business, we take pride in creating a welcoming, safe space for all. For more information on hours, pricing, and bookings, please visit our <a href="https://www.PixelPulsePlayparks.ca/vaughan" target="_blank" rel="noreferrer">website</a> or contact us directly.</p>
  <h3>Location</h3>
  <p>Find us at:</p>
  <p><strong>960 Edgeley Blvd #2, Vaughan, ON L4K 4V4, Canada</strong></p>
  <p>To help you find us easily, here’s our location on the map:</p>
  <iframe
    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4066.013405274047!2d-79.53984758440566!3d43.81804602292468!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x882b2f6ce0e223b7%3A0x18311b4ed1f2c40c!2sPixel%20Pulse%20Playzone%20(formerly%20Koala%20Kidz%20Park)!5e0!3m2!1sen!2sin!4v1772556140952!5m2!1sen!2sin"
    width="600"
    height="450"
    style="border:0; width:100%"
    allowfullscreen=""
    loading="lazy"
    referrerpolicy="no-referrer-when-downgrade">
  </iframe>
</div>
`;

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
  const aboutContentHtml = isAboutPage ? ABOUT_US_THEME_HTML : pageData?.seosection || "";

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
                   <SectionHeading className="section-heading-white">
                      Featured <span>Experiences</span>
                    </SectionHeading>
                    <h2>Each room combines movement, speed, lights, and score chasing in a way that keeps every visit fresh.</h2>
                    <ul>
                      <li>Fast rounds that are easy to jump into</li>
                      <li>Great mix of solo, sibling, and team play</li>
                      <li>Perfect for drop-ins, parties, and group visits</li>
                    </ul>
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
                    <SectionHeading className="section-heading-white">
                      Group <span>Experiences</span>
                    </SectionHeading>
                    <h2>Plan a visit that feels organized for adults, exciting for kids, and easy for coordinators.</h2>
                    <ul>
                      <li>Great for school trips, camps, teams, and company outings</li>
                      <li>Flexible experiences built around energy, movement, and fun</li>
                      <li>Clear next steps for booking, planning, and group coordination</li>
                    </ul>
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
                    
                    <SectionHeading className="section-heading-white">
                     What we <span>stand for</span>
                    </SectionHeading>
                    <h2>A modern indoor play concept designed to feel active, social, and easy to come back to.</h2>
                    <ul>
                      <li>Digital-first game play that keeps kids moving and engaged</li>
                      <li>Welcoming for families, schools, teams, and celebrations</li>
                      <li>Clear information, easy planning, and a smoother visit flow</li>
                    </ul>
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
