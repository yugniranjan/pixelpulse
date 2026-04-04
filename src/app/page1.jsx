export const dynamic = "force-dynamic";
import "./styles/home.css";
import "./styles/promotions.css";
import Image from "next/image";
import Link from "next/link";
import { getDataByParentId } from "@/utils/customFunctions";
import Countup from "@/components/Countup";
import MotionImage from "@/components/MotionImage";
import PromotionModal from "@/components/model/PromotionModal";
import BlogCard from "@/components/smallComponents/BlogCard";
import {
  fetchsheetdata,
  fetchMenuData,
  getWaiverLink,
  generateMetadataLib,
} from "@/lib/sheets";
import { LOCATION_NAME } from "./lib/constant";
import PixelPulseSection from "./components/home/PixelPulseSection";
import CelebrateEventsSection from "./components/home/CelebrateEventsSection";
import SectionHeading from "./components/home/SectionHeading";
import BookingButton from "./components/smallComponents/BookingButton";
import Promotions from "./components/home/Promotions";

export async function generateMetadata() {
  const location_slug = LOCATION_NAME || "vaughan";
  const metadata = await generateMetadataLib({
    location: location_slug,
    category: "",
    page: "",
  });
  return metadata;
}

const Home = async () => {
  const location_slug = LOCATION_NAME || "vaughan";

  const waiverLink = await getWaiverLink(location_slug);

  const [data, dataconfig, promotions] = await Promise.all([
    fetchMenuData(location_slug),
    fetchsheetdata("config", location_slug),
    // fetchsheetdata("promotions", location_slug),
  ]);

  const homepageSection1 = Array.isArray(dataconfig)
    ? (dataconfig.find((item) => item.key === "homepageSection1")?.value ?? "")
    : "";
  const promotionPopup = Array.isArray(dataconfig)
    ? dataconfig.filter((item) => item.key === "promotion-popup")
    : [];
  const header_image = Array.isArray(data)
    ? data.filter((item) => item.path === "home")
    : [];
  const safeHeaderImage = header_image
    ? JSON.parse(JSON.stringify(header_image))
    : {};
  const seosection = header_image?.[0]?.seosection || "";
  const attractionsData = Array.isArray(data)
    ? getDataByParentId(data, "attractions") || []
    : [];
  const blogsData = Array.isArray(data)
    ? getDataByParentId(data, "blogs") || []
    : [];

  const vaughanSchema = {
    "@context": "https://schema.org",
    "@type": "AmusementPark",
    name: "Pixel Pulse Play Vaughan",
    description:
      "A fun-filled trampoline park in Vaughan, Ontario offering amusement, activities, mini golf, and kids' party services.",
    address: {
      "@type": "PostalAddress",
      streetAddress: "960 Edgeley Blvd #2",
      addressLocality: "Vaughan",
      addressRegion: "ON",
      postalCode: "L4K 4V4",
      addressCountry: "Canada",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 43.83433,
      longitude: -79.50891,
    },
    openingHours: [
      "Mo-Th 10:00-20:00",
      "Fr 10:00-21:00",
      "Sa 10:00-21:00",
      "Su 10:00-20:00",
    ],
    priceRange: "$$",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.5",
      reviewCount: "150",
    },
  };

  return (
    <main>
      {promotionPopup.length > 0 && (
        <PromotionModal promotionPopup={promotionPopup} />
      )}

      <MotionImage pageData={safeHeaderImage} waiverLink={waiverLink} />

      {attractionsData?.[0]?.children?.length > 0 && (
        <section className="aero_home-actionbtn-bg">
          <section className="aero-max-container aero_home-actionbtn">
            <SectionHeading>
              {" "}
              JUMP STRAIGHT <span>TO</span>{" "}
            </SectionHeading>

            <section className="aero_home-actionbtn-wrap">
              <div className="aero-btn-booknow">
                <BookingButton title="Book Now" />
              </div>

              <Link
                href={`/kids-birthday-parties`}
                className="aero-btn-booknow"
                prefetch
              >
                <button>BIRTHDAY PARTIES</button>
              </Link>
              <Link href={`/attractions`} className="aero-btn-booknow" prefetch>
                <button>VIEW ATTRACTIONS</button>
              </Link>
            </section>
          </section>
          <div className="aero_home_triangle"></div>
        </section>
      )}

      <section className="aero_home-playsection">
        <section className="aero_home-playsection-bg">
          <section className="aero-max-container aero_home-playsection-1 d-flex-dir-col">
            <SectionHeading>
              {" "}
              <span>LEVEL UP YOUR PLAY</span> <br /> AT PIXEL PULSE VAUGHAN{" "}
            </SectionHeading>

            <p>{homepageSection1}</p>
          </section>
        </section>

        {/* <Promotions promotions={promotions}/> */}

        {/* <section className="aero_home_article_section">
          <section className="aero-max-container">
            <h2 className="heading-with-icon">
              {" "}
              <svg
                className="promotions__icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="8" width="18" height="4" rx="1"></rect>
                <path d="M12 8v13"></path>
                <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"></path>
                <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"></path>
              </svg>{" "}
              Celeberate your event
            </h2>
            <p>Elevate your event to next level at pixelpulseplay! </p>
            <div className="offer-section__inner container">
     
              <article className="offer-card">
                <div
                  className="offer-card__img"
                  style={{
                    backgroundImage:
                      "url('https://storage.googleapis.com/aerosports/team-building-aerosports-trampoline-park.png')",
                  }}
                  role="img"
                  aria-label="Memberships"
                >
                  <h3 className="offer-card__title">CORPORATE EVENTS</h3>
                </div>
                <div className="offer-card__body">
                  <p>
                    Elevate your corporate events at Pixel Pulse, where immersive challenges inspire teamwork, strategic thinking, and shared wins in a high-energy environment.
                  </p>
                  <Link
                    href={`/group-events/corporate-parties-events-groups`}
                    className="sigma_btn-custom"
                  >
                    More Info →
                  </Link>
                </div>
              </article>

      
              <article className="offer-card">
                <div
                  className="offer-card__img"
                  style={{
                    backgroundImage:
                      "url('https://storage.googleapis.com/aerosports/celeberate-your-birthday-parties-at-aerosports.png')",
                  }}
                  role="img"
                  aria-label="Birthday Parties"
                >
                  <h3 className="offer-card__title">BIRTHDAY PARTIES</h3>
                </div>
                <div className="offer-card__body">
                  <p>
                    The best kids birthday parties in Vaughan. All-inclusive Pixel & tile games, immersive fun, private room, party host, pizza, and excitement.
                  </p>
                  <a
                    href={`/kids-birthday-parties`}
                    className="sigma_btn-custom"
                  >
                    COMPARE PACKAGES →
                  </a>
                </div>
              </article>

      
              <article className="offer-card">
                <div
                  className="offer-card__img"
                  style={{
                    backgroundImage:
                      "url('https://storage.googleapis.com/aerosports/schools-field-trips-at-aerosports.png')",
                  }}
                  role="img"
                  aria-label="Jump Tickets"
                >
                  <h3 className="offer-card__title">Field Trips</h3>
                </div>
                <div className="offer-card__body">
                  <p>
                   We offer special field trip and team event rates for groups of 20-40 players. For groups of 20+ or to book space and food, please call us.
                  </p>
                  <a
                    href={`/group-events/school-groups`}
                    className="sigma_btn-custom"
                  >
                    More Info →
                  </a>
                </div>
              </article>
            </div>
          </section>
        </section> */}

        <CelebrateEventsSection />

        <section className="aero_home_article_section">
          <SectionHeading className="section-heading-white">
            Explore <span>attractions</span>
          </SectionHeading>
          <Link href={`/attractions`} className="aero-btn-booknow" prefetch>
            View All
          </Link>
          <section className="aero-max-container aero_home-playsection-2 ">
            <ul className="attractions-grid">
              {attractionsData[0]?.children?.map((item, i) => (
                <li key={i}>
                  <Link href={`/${item?.parentid}/${item?.path}`} prefetch>
                    <article className="d-flex-dir-col">
                      <figure>
                        <Image
                          src={item?.smallimage}
                          width={330}
                          height={200}
                          alt={item?.iconalttextforhomepage}
                          blurDataURL={item?.smallimage}
                          unoptimized
                        />
                        <figcaption className="figcaption-bg">
                          <h3>{item?.desc}</h3>
                        </figcaption>
                      </figure>{" "}
                    </article>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </section>
      </section>

      {attractionsData?.[0]?.children?.length > 0 && (
        <section className="aero_home_article_section">
          <section
            className="aero-max-container"
            style={{ marginBottom: "60px" }}
          >
            <SectionHeading className="section-heading-white">
              <span> Latest</span> Articles & News
            </SectionHeading>

            <h3 style={{ color: "white", textAlign: "center" }}>
              Every Updated Article
            </h3>

            <BlogCard blogsData={blogsData[0]} location_slug={location_slug} />
            <Link
              href={`/blogs`}
              className="aero-btn-booknow aero-btn-article-section"
              prefetch
            >
              <button>View All</button>
            </Link>
          </section>
        </section>
      )}
      {/* {attractionsData?.[0]?.children?.length > 0 && (
        <section className="aero_home_feature_section-bg">
          <section className="aero-max-container aero_home_feature_section" style={{padding:"5em 0 5em"}}>
            {[
              { num: 130, label: "Trampolines" },
              { num: 27000, label: "Square Feet" },
              { num: 4, label: "Party Rooms" },
              { num: 6, label: "Fun Attractions" },
            ].map((item, i) => (
              <article key={i} className="aero_home_feature_section-card">
                <Countup num={item.num} />
                <div>{item.label}</div>
              </article>
            ))}
          </section>
        </section>
      )} */}

      <PixelPulseSection />

      {attractionsData?.[0]?.children?.length > 0 && (
        <section className="aero_home_article_section">
          <section className="aero-max-container aero_home_seo_section">
            <div dangerouslySetInnerHTML={{ __html: seosection }} />
          </section>
        </section>
      )}
      {location_slug === LOCATION_NAME && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(vaughanSchema),
          }}
        />
      )}
    </main>
  );
};

export default Home;
