import "./styles/home.css";
import "./styles/pagenew.css";
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
  name: "Pixel Pulse Play — Next-Gen Indoor Gaming",
  description:
    "Vaughan's next-generation indoor gaming arena with laser mazes, interactive tile challenges, climbing walls, and more.",
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

/* ─── Stat bar data ─── */
const STATS = [
  { num: 8,    label: "Unique Attractions" },
  { num: 5000, label: "Happy Players" },
  { num: 4,    label: "Party Rooms" },
  { num: 1,    label: "GTA Interactive Arena" },
];

/* ─── Pricing tiers ─── */
const PRICING = [
  {
    tier: "Starter",
    name: "Explorer Pass (30 Min)",
    price: 19,
    unit: "per player",
    tag: null,
    features: [
      "Access to game zones",
      "30-minute session",
      
    ],
    cta: "Book Explorer",
    href: "/programs",
  },
  {
    tier: "Best Value",
    name: "All-Access Pass (60 Min)",
    price: 29,
    unit: "per player",
    tag: "Most Popular",
    features: [
      "All game zones",
      "60-minute session",
      
    ],
    cta: "Book All-Access",
    href: "/programs",
  },
  {
    tier: "Celebration",
    name: "Party Package (90 Min)",
    price: 38,
    unit: "per player",
    tag: null,
    features: [
      "All game zones",
       "90-minute session",
    ],
    cta: "Book Party",
    href: "/kids-birthday-parties",
  },
];

/* ─── Why Pixel Pulse reasons ─── */
const WHY_REASONS = [
  {
    icon: "🧠",
    title: "Physical + Cognitive Play",
    body: "Every game builds real skills — reaction time, teamwork, strategy, and physical coordination.",
  },
  {
    icon: "🛡️",
    title: "Safe & Supervised",
    body: "Trained staff on the floor at all times. Clean, maintained equipment and full safety protocols.",
  },
  {
    icon: "⚡",
    title: "Next-Gen Technology",
    body: "Interactive digital floors, laser sensors, reactive walls — built from scratch for the experience.",
  },
  {
    icon: "🎪",
    title: "Something for Everyone",
    body: "Distinct zones mean there's always a new challenge. Kids, teens, and adults all find their game.",
  },
];

/* ─── Testimonials ─── */
const REVIEWS = [
  {
    stars: 5,
    body: "We've been to every indoor playground in the GTA. Pixel Pulse is on a completely different level. My kids begged to come back the next weekend.",
    name: "Sarah M.",
    role: "Mom of 3 · Vaughan",
  },
  {
    stars: 5,
    body: "Booked a birthday party here — honestly one of the easiest and best party experiences I've ever had. The staff handled everything.",
    name: "James T.",
    role: "Dad · Woodbridge",
  },
  {
    stars: 5,
    body: "We brought our team of 22 for a corporate event. The energy was incredible — even our most reserved colleagues were fully engaged.",
    name: "Aisha K.",
    role: "HR Manager · Maple",
  },
];

const Home = async () => {
  const location_slug = LOCATION_NAME;

  let waiverLink = "";
  let data = [];
  let dataconfig = [];
  let promotions = [];

  try {
    [waiverLink, data, dataconfig, promotions] = await Promise.all([
      getWaiverLink(location_slug),
      fetchMenuData(location_slug),
      fetchsheetdata("config", location_slug),
      fetchsheetdata("promotions", location_slug),
    ]);
  } catch (error) {
    console.error("home page data failed:", error);
  }

  const homepageSection1 =
    Array.isArray(dataconfig)
      ? dataconfig.find((item) => item.key === "homepageSection1")?.value ?? ""
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

  const attractionsData = Array.isArray(data)
    ? getDataByParentId(data, "attractions") || []
    : [];

  const blogsData = Array.isArray(data)
    ? getDataByParentId(data, "blogs") || []
    : [];

  return (
    <main className="ppp-home">
      {/* ── Promotion popup ── */}
      {promotionPopup.length > 0 && (
        <PromotionModal promotionPopup={promotionPopup} />
      )}

      {/* ── Hero ── */}
      <MotionImage pageData={safeHeaderImage} waiverLink={waiverLink} />

      {/* ── Quick-action CTA bar ── */}
      {attractionsData?.[0]?.children?.length > 0 && (
        <section className="ppp-ctabar">
          <div className="aero-max-container ppp-ctabar__inner">
            <SectionHeading>
              JUMP STRAIGHT <span>TO</span>
            </SectionHeading>

            <div className="ppp-ctabar__buttons">
              <BookingButton title="Book Now" className="ppp-btn ppp-btn--primary" bookingType="ticket" />
              <Link href="/kids-birthday-parties" className="ppp-btn ppp-btn--outline" prefetch>
                BIRTHDAY PARTIES
              </Link>
              <Link href="/attractions" className="ppp-btn ppp-btn--outline" prefetch>
                VIEW ATTRACTIONS
              </Link>
            </div>
          </div>
          <div className="aero_home_triangle" />
        </section>
      )}

      {/* ── Level Up intro section ── */}
      <section className="ppp-intro">
        <div className="aero-max-container ppp-intro__inner">
          <SectionHeading>
            <span>LEVEL UP YOUR PLAY</span>
            <br />
            AT PIXEL PULSE VAUGHAN
          </SectionHeading>
          <p className="ppp-intro__body">{homepageSection1}</p>
        </div>
      </section>

      {/* ── Stats bar ── 
      {attractionsData?.[0]?.children?.length > 0 && (
        <section className="ppp-stats">
          <div className="aero-max-container ppp-stats__grid">
            {STATS.map((item, i) => (
              <article key={i} className="ppp-stats__card">
                <Countup num={item.num} />
                <span className="ppp-stats__label">{item.label}</span>
              </article>
            ))}
          </div>
        </section>
      )}*/}

      {/* ── Attractions grid ── */}
      {attractionsData?.[0]?.children?.length > 0 && (
        <section className="ppp-section ppp-attractions">
          <div className="aero-max-container">
            <SectionHeading className="section-heading-white">
              EPIC <span>GAME ROOMS</span>
            </SectionHeading>
            <p className="ppp-section__sub">
              Every zone is designed to challenge your body and mind. Run, climb, aim, and think your way through next-level physical gaming.
            </p>

            <ul className="ppp-attractions__grid">
              {attractionsData[0]?.children?.map((item, i) => (
                <li key={i} className="ppp-attractions__item">
                  <Link href={`/${item?.parentid}/${item?.path}`} prefetch>
                    <article className="ppp-attraction-card">
                      <figure className="ppp-attraction-card__fig">
                        <Image
                          src={item?.smallimage}
                          width={400}
                          height={260}
                          alt={item?.iconalttextforhomepage}
                          unoptimized
                          className="ppp-attraction-card__img"
                        />
                        <div className="ppp-attraction-card__overlay">
                          <h3 className="ppp-attraction-card__title">
                            {item?.desc}
                          </h3>
                        </div>
                      </figure>
                    </article>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="ppp-section__cta-row">
              <Link href="/attractions" className="ppp-btn ppp-btn--outline" prefetch>
                View All Attractions →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Promotions ── */}
      {promotions?.length > 0 && (
        <section className="ppp-section ppp-promos">
          <div className="aero-max-container">
            <SectionHeading className="section-heading-white">
              Current <span>Promotions</span>
            </SectionHeading>
            <p className="ppp-section__sub">
              Don't miss out on these amazing deals! Save big on your next visit.
            </p>

            <div className="promotions__grid">
              {promotions.map((promo, index) => (
                <article key={index} className="promotion-card">
                  <span className="promotion-card__badge">{promo.badge}</span>
                  <h3 className="promotion-card__title">{promo.title}</h3>
                  <p className="promotion-card__description">{promo.description}</p>
                  <div className="promotion-card__details">
                    <time className="promotion-card__validity">{promo.validity}</time>
                    <span className="promotion-card__code">Code: {promo.code}</span>
                  </div>
                  <a href={promo.link} className="promotion-card__btn">
                    {promo.linktext}
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Celebrate / Events ── */}
      <CelebrateEventsSection />

      {/* ── Why Pixel Pulse ── */}
      <section className="ppp-section ppp-why">
        <div className="aero-max-container">
          <SectionHeading>
            NOT JUST ANOTHER <span>PLAYGROUND</span>
          </SectionHeading>

          <ul className="ppp-why__grid">
            {WHY_REASONS.map((r, i) => (
              <li key={i} className="ppp-why__card">
                <span className="ppp-why__icon" aria-hidden="true">
                  {r.icon}
                </span>
                <h3 className="ppp-why__title">{r.title}</h3>
                <p className="ppp-why__body">{r.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="ppp-section ppp-pricing" id="pricing">
        <div className="aero-max-container">
          <SectionHeading className="section-heading-white">
            SIMPLE, TRANSPARENT <span>PRICING</span>
          </SectionHeading>
          <p className="ppp-section__sub">
            No hidden fees. Pick your pass and jump straight in.
          </p>

          <div className="ppp-pricing__grid">
            {PRICING.map((p, i) => (
              <article
                key={i}
                className={`ppp-pricing__card${p.tag ? " ppp-pricing__card--featured" : ""}`}
              >
                {p.tag && (
                  <span className="ppp-pricing__badge">{p.tag}</span>
                )}
                <p className="ppp-pricing__tier">{p.tier}</p>
                <h3 className="ppp-pricing__name">{p.name}</h3>
                <div className="ppp-pricing__price">
                  <span className="ppp-pricing__dollar">$</span>
                  <span className="ppp-pricing__amount">{p.price}</span>
                  <span className="ppp-pricing__unit">/{p.unit}</span>
                </div>
                <ul className="ppp-pricing__features">
                  {p.features.map((f, j) => (
                    <li key={j} className="ppp-pricing__feature">
                      <span className="ppp-pricing__check">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <BookingButton
                  title={p.cta}
                  className="ppp-btn ppp-btn--primary ppp-pricing__cta"
                  bookingType={p.href === "/kids-birthday-parties" ? "party" : "ticket"}
                />
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Reviews ── */}
      <section className="ppp-section ppp-reviews">
        <div className="aero-max-container">
          <SectionHeading>
            PARENTS &amp; KIDS <span>LOVE IT</span>
          </SectionHeading>

          <div className="ppp-reviews__grid">
            {REVIEWS.map((r, i) => (
              <article key={i} className="ppp-review-card">
                <div className="ppp-review-card__stars" aria-label={`${r.stars} stars`}>
                  {"★".repeat(r.stars)}
                </div>
                <blockquote className="ppp-review-card__quote">
                  "{r.body}"
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

      {/* ── Blog / Articles ── */}
      {attractionsData?.[0]?.children?.length > 0 && (
        <section className="ppp-section ppp-blog">
          <div className="aero-max-container">
            <SectionHeading className="section-heading-white">
              FROM THE <span>PIXEL PULSE BLOG</span>
            </SectionHeading>
            <p className="ppp-section__sub">
              Tips, guides, and updates from Vaughan's favourite gaming arena.
            </p>

            <BlogCard blogsData={blogsData[0]} location_slug={location_slug} />

            <div className="ppp-section__cta-row">
              <Link href="/blogs" className="ppp-btn ppp-btn--outline" prefetch>
                View All Articles →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Final CTA band ── */}
      <section className="ppp-cta-band">
        <div className="aero-max-container ppp-cta-band__inner">
          <SectionHeading>
            YOUR NEXT ADVENTURE <span>AWAITS</span>
          </SectionHeading>
          <p className="ppp-cta-band__sub">
            Book online in seconds. Walk-ins welcome based on availability.
            Located in Vaughan — serving all of the GTA.
          </p>
          <div className="ppp-cta-band__actions">
            <BookingButton title="Book Now" className="ppp-btn ppp-btn--primary" bookingType="ticket" />
            <Link href="/contact" className="ppp-btn ppp-btn--outline" prefetch>
              📍 Get Directions
            </Link>
          </div>
        </div>
      </section>

      {/* ── Pixel Pulse branded section ── */}
      <PixelPulseSection />

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
