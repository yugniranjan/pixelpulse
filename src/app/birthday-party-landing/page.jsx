export const dynamic = "force-dynamic";

import "../styles/birthday-landing.css";
import Image from "next/image";
import BookingButton from "@/components/smallComponents/BookingButton";
import { fetchMenuData, fetchsheetdata } from "@/lib/sheets";
import { getConfigValue } from "@/lib/ctaContent";

const LOCATION_SLUG = "vaughan";
const HERO_IMAGE = "https://storage.googleapis.com/pixel-pulse-play/web/birthdayparty.png";
const ATTRACTION_FALLBACK_IMAGE =
  "https://storage.googleapis.com/pixel-pulse-play/web/PrivateParty.png";

export const metadata = {
  title: "Birthday Party Offer | Pixel Pulse Play Vaughan",
  description:
    "Book a high-energy Pixel Pulse Play birthday party in Vaughan and claim up to $50 off limited discounted slots.",
  alternates: {
    canonical: "https://www.pixelpulseplay.ca/birthday-party-landing",
  },
  openGraph: {
    title: "Birthday Party Offer | Pixel Pulse Play Vaughan",
    description:
      "Book a high-energy Pixel Pulse Play birthday party in Vaughan and claim up to $50 off limited discounted slots.",
    url: "https://www.pixelpulseplay.ca/birthday-party-landing",
    images: [
      {
        url: HERO_IMAGE,
        width: 1200,
        height: 630,
        alt: "Kids birthday party at Pixel Pulse Play",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Birthday Party Offer | Pixel Pulse Play Vaughan",
    description:
      "Book a high-energy Pixel Pulse Play birthday party in Vaughan and claim up to $50 off limited discounted slots.",
    images: [HERO_IMAGE],
  },
  robots: {
    index: true,
  },
};

function parseBirthdayPackages(rows = []) {
  const raw = rows.find((item) => item.key === "birthday_packages")?.value;
  if (!raw) return null;

  try {
    return JSON.parse(
      raw
        ?.replace(/<br\/>/g, "")
        ?.replace(/\n/g, "")
        ?.replace(/,\s*([}\]])/g, "$1")
        .trim(),
    );
  } catch (error) {
    console.error("birthday landing package parse failed:", error);
    return null;
  }
}

function getPackageHighlights(packagesData) {
  const packages = Array.isArray(packagesData?.packages) ? packagesData.packages : [];

  if (!packages.length) {
    return [
      { name: "Pixel Punch", price: "$399", detail: "Up to 8 players" },
      { name: "Pixel Ultra", price: "$499", detail: "Up to 12 players" },
      { name: "Pixel Jumbo", price: "$799+", detail: "Up to 20 players" },
    ];
  }

  return packages.slice(0, 3).map((item) => ({
    name: item.name,
    price: item["Package Price"],
    detail: item["Number of Participants"] || item["Game Time Included"] || "Party package",
  }));
}

function getAttractions(menuData = []) {
  const attractions = menuData.find((item) => item.path === "attractions");
  const children = Array.isArray(attractions?.children) ? attractions.children : [];

  return children
    .filter((item) => item?.isactive == 1)
    .map((item) => ({
      title: item.title || item.desc,
      text: item.smalltext || item.metadescription || "A fast-paced Pixel Pulse challenge.",
      image: item.smallimage || item.icon || item.headerimage || ATTRACTION_FALLBACK_IMAGE,
    }));
}

export default async function BirthdayPartyLandingPage() {
  let configData = [];
  let menuData = [];

  try {
    [configData, menuData] = await Promise.all([
      fetchsheetdata("config", LOCATION_SLUG),
      fetchMenuData(LOCATION_SLUG),
    ]);
  } catch (error) {
    console.error("birthday landing config failed:", error);
  }

  const packagesData = parseBirthdayPackages(configData);
  const packageHighlights = getPackageHighlights(packagesData);
  const attractions = getAttractions(menuData);
  const heroImage =
    getConfigValue(configData, ["birthdayLandingImage", "partyLandingImage"]) || HERO_IMAGE;
  const headline =
    getConfigValue(configData, ["birthdayLandingHeadline", "partyLandingHeadline"]) ||
    "Book Your Birthday Today & Get Up to $50 OFF";
  const subheadline =
    getConfigValue(configData, ["birthdayLandingSubheadline", "partyLandingSubheadline"]) ||
    "High-energy games. Non-stop excitement. Zero stress for you. We handle everything while you enjoy the celebration.";
  const ctaText =
    getConfigValue(configData, ["birthdayLandingCtaText", "partyLandingCtaText"]) ||
    "Claim My $50 OFF Slot NOW";
  const urgency =
    getConfigValue(configData, ["birthdayLandingUrgency", "partyLandingUrgency"]) ||
    "Limited discounted slots available.";

  return (
    <main className="ppp-birthday-landing">
      <section className="ppp-birthday-hero" aria-labelledby="birthday-landing-title">
        <Image
          className="ppp-birthday-hero__background"
          src={heroImage}
          alt=""
          aria-hidden="true"
          fill
          priority
          sizes="100vw"
        />
        <div className="ppp-birthday-shell ppp-birthday-hero__grid">
          <div className="ppp-birthday-hero__copy">
            <p className="ppp-birthday-eyebrow">Pixel Pulse Play Birthday Parties</p>
            <h1 id="birthday-landing-title">{headline}</h1>
            <p className="ppp-birthday-hero__text">{subheadline}</p>

            <div className="ppp-birthday-actions">
              <BookingButton title={ctaText} bookingType="party" />
              <a href="#packages" className="ppp-birthday-secondary-link">
                View Packages
              </a>
            </div>

            <p className="ppp-birthday-urgency">{urgency}</p>

            <div className="ppp-birthday-stats" aria-label="Birthday party highlights">
              <div>
                <strong>100+</strong>
                <span>Parties hosted</span>
              </div>
              <div>
                <strong>5-star</strong>
                <span>Rated experience</span>
              </div>
              <div>
                <strong>Fully managed</strong>
                <span>Events</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="ppp-birthday-attractions" aria-labelledby="birthday-attractions-title">
        <div className="ppp-birthday-shell">
          <div className="ppp-birthday-section-heading">
            <p className="ppp-birthday-eyebrow">Birthday Game Arena</p>
            <h2 id="birthday-attractions-title">
              This Isn&apos;t a Party. It&apos;s a Playground of Challenges.
            </h2>
            <p>
              Interactive, competitive, and insanely fun experiences that keep everyone
              engaged from start to finish.
            </p>
          </div>

          <div className="ppp-birthday-attraction-carousel" aria-label="Pixel Pulse attractions">
            {attractions.map((item) => (
              <article className="ppp-birthday-attraction-card" key={item.title}>
                <Image
                  src={item.image}
                  alt=""
                  width={800}
                  height={600}
                  style={{ width: "100%", height: "auto" }}
                />
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="ppp-birthday-attraction-cta">
            <p>See Available Slots &amp; Unlock $50 OFF</p>
            <div className="ppp-birthday-attraction-cta__actions">
              <BookingButton title="See Available Slots" bookingType="party" />
            </div>
          </div>
        </div>
      </section>

      <section className="ppp-birthday-proof">
        <div className="ppp-birthday-shell">
          <div className="ppp-birthday-section-heading">
            <p className="ppp-birthday-eyebrow">Why Parents Book</p>
            <h2>All the birthday energy. None of the party stress.</h2>
          </div>

          <div className="ppp-birthday-card-grid">
            <article>
              <span>01</span>
              <h3>High-energy games</h3>
              <p>Interactive challenges keep the group moving, laughing, and playing together.</p>
            </article>
            <article>
              <span>02</span>
              <h3>Hosted party flow</h3>
              <p>Game time and celebration time are structured so the day feels easy.</p>
            </article>
            <article>
              <span>03</span>
              <h3>Party-room ready</h3>
              <p>Packages include the essentials families need for a smooth celebration.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="ppp-birthday-packages" id="packages">
        <div className="ppp-birthday-shell">
          <div className="ppp-birthday-section-heading">
            <p className="ppp-birthday-eyebrow">Birthday Packages</p>
            <h2>Pick your party size and lock in the date.</h2>
          </div>

          <div className="ppp-birthday-package-grid">
            {packageHighlights.map((item, index) => (
              <article className={index === 1 ? "is-featured" : ""} key={item.name}>
                <p>{index === 1 ? "Most Popular" : "Package"}</p>
                <h3>{item.name}</h3>
                <strong>{item.price}</strong>
                <span>{item.detail}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ppp-birthday-final">
        <div className="ppp-birthday-shell ppp-birthday-final__inner">
          <div>
            <p className="ppp-birthday-eyebrow">Ready to lock it in?</p>
            <h2>Claim your birthday slot before discounted times are gone.</h2>
          </div>
          <BookingButton title={ctaText} bookingType="party" />
        </div>
      </section>
    </main>
  );
}
