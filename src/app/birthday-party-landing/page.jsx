export const dynamic = "force-dynamic";

import "../styles/birthday-landing.css";
import Image from "next/image";
import BirthdayHeroContactForm from "@/components/BirthdayHeroContactForm";
import BookingButton from "@/components/smallComponents/BookingButton";
import { fetchMenuData, fetchsheetdata } from "@/lib/sheets";
import { getConfiguredValue } from "@/lib/ctaContent";

const LOCATION_SLUG = "vaughan";
const LANDING_PAGES_SHEET = "landing pages";
const LEGACY_LANDING_PAGES_SHEET = "landin pages";
const HERO_IMAGE = "https://storage.googleapis.com/pixel-pulse-play/web/birthdaylandinghero.png";
const ATTRACTION_FALLBACK_IMAGE =
  "https://storage.googleapis.com/pixel-pulse-play/web/PrivateParty.png";

const FALLBACK_META_TITLE = "Birthday Party Offer | Pixel Pulse Play Vaughan";
const FALLBACK_META_DESCRIPTION =
  "Book a high-energy Pixel Pulse Play birthday party in Vaughan and claim up to $50 off limited discounted slots.";
const FALLBACK_CANONICAL = "https://www.pixelpulseplay.ca/birthday-party-landing";
const FALLBACK_STATS = [
  { value: "100+", label: "Parties hosted" },
  { value: "5-star", label: "Rated experience" },
  { value: "Fully managed", label: "Events" },
];
const FALLBACK_PROOF_CARDS = [
  {
    number: "01",
    title: "High-energy games",
    text: "Interactive challenges keep the group moving, laughing, and playing together.",
  },
  {
    number: "02",
    title: "Hosted party flow",
    text: "Game time and celebration time are structured so the day feels easy.",
  },
  {
    number: "03",
    title: "Party-room ready",
    text: "Packages include the essentials families need for a smooth celebration.",
  },
];

async function getBirthdayConfigData() {
  try {
    return await fetchsheetdata("config", LOCATION_SLUG);
  } catch (error) {
    console.error("birthday landing config failed:", error);
    return [];
  }
}

async function getBirthdayLandingData() {
  try {
    const rows = await fetchsheetdata(LANDING_PAGES_SHEET, LOCATION_SLUG);
    if (rows.length) {
      return rows;
    }

    return await fetchsheetdata(LEGACY_LANDING_PAGES_SHEET, LOCATION_SLUG);
  } catch (error) {
    console.error("birthday landing sheet failed:", error);
    return [];
  }
}

export async function generateMetadata() {
  const landingData = await getBirthdayLandingData();
  const title = getConfiguredValue(
    landingData,
    ["birthdayLandingMetaTitle", "partyLandingMetaTitle"],
    FALLBACK_META_TITLE,
  );
  const description = getConfiguredValue(
    landingData,
    ["birthdayLandingMetaDescription", "partyLandingMetaDescription"],
    FALLBACK_META_DESCRIPTION,
  );
  const canonical = getConfiguredValue(
    landingData,
    ["birthdayLandingCanonical", "partyLandingCanonical"],
    FALLBACK_CANONICAL,
  );
  const image = getConfiguredValue(
    landingData,
    ["birthdayLandingHeroImage", "partyLandingHeroImage"],
    HERO_IMAGE,
  );
  const imageAlt = getConfiguredValue(
    landingData,
    ["birthdayLandingImageAlt", "partyLandingImageAlt"],
    "Kids birthday party at Pixel Pulse Play",
  );

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: imageAlt,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    robots: {
      index: true,
    },
  };
}

function parseConfigJson(rows = [], keys = []) {
  const raw = getConfiguredValue(rows, keys, "");
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
    console.error(`birthday landing JSON parse failed for ${keys.join(", ")}:`, error);
    return null;
  }
}

function parseBirthdayPackages(rows = []) {
  return parseConfigJson(rows, ["birthday_packages"]);
}

function getConfiguredItems(rows = [], keys = [], fallback = []) {
  const parsed = parseConfigJson(rows, keys);
  return Array.isArray(parsed) && parsed.length ? parsed : fallback;
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
  let menuData = [];
  const [configData, landingData] = await Promise.all([
    getBirthdayConfigData(),
    getBirthdayLandingData(),
  ]);

  try {
    menuData = await fetchMenuData(LOCATION_SLUG);
  } catch (error) {
    console.error("birthday landing menu failed:", error);
  }

  const packagesData = parseBirthdayPackages(configData);
  const packageHighlights = getPackageHighlights(packagesData);
  const attractions = getAttractions(menuData);
  const heroImage = getConfiguredValue(
    landingData,
    ["birthdayLandingHeroImage", "partyLandingHeroImage"],
    HERO_IMAGE,
  );
  const headline = getConfiguredValue(
    landingData,
    ["birthdayLandingHeadline", "partyLandingHeadline"],
    "Book Your Birthday Today & Get Up to $50 OFF",
  );
  const eyebrow = getConfiguredValue(
    landingData,
    ["birthdayLandingEyebrow", "partyLandingEyebrow"],
    "Pixel Pulse Play Birthday Parties",
  );
  const subheadline = getConfiguredValue(
    landingData,
    ["birthdayLandingSubheadline", "partyLandingSubheadline"],
    "High-energy games. Non-stop excitement. Zero stress for you. We handle everything while you enjoy the celebration.",
  );
  const ctaText = getConfiguredValue(
    landingData,
    ["birthdayLandingCtaText", "partyLandingCtaText"],
    "Claim My $50 OFF Slot NOW",
  );
  const urgency = getConfiguredValue(
    landingData,
    ["birthdayLandingUrgency", "partyLandingUrgency"],
    "Limited discounted slots available.",
  );
  const secondaryCtaText = getConfiguredValue(
    landingData,
    ["birthdayLandingSecondaryCtaText", "partyLandingSecondaryCtaText"],
    "View Packages",
  );
  const stats = getConfiguredItems(
    landingData,
    ["birthdayLandingStats", "partyLandingStats"],
    FALLBACK_STATS,
  );
  const attractionsEyebrow = getConfiguredValue(
    landingData,
    ["birthdayLandingAttractionsEyebrow", "partyLandingAttractionsEyebrow"],
    "Birthday Game Arena",
  );
  const attractionsTitle = getConfiguredValue(
    landingData,
    ["birthdayLandingAttractionsTitle", "partyLandingAttractionsTitle"],
    "This Isn't a Party. It's a Playground of Challenges.",
  );
  const attractionsText = getConfiguredValue(
    landingData,
    ["birthdayLandingAttractionsText", "partyLandingAttractionsText"],
    "Interactive, competitive, and insanely fun experiences that keep everyone engaged from start to finish.",
  );
  const attractionsCtaText = getConfiguredValue(
    landingData,
    ["birthdayLandingAttractionsCtaText", "partyLandingAttractionsCtaText"],
    "See Available Slots & Unlock $50 OFF",
  );
  const attractionsCtaButtonText = getConfiguredValue(
    landingData,
    ["birthdayLandingAttractionsCtaButtonText", "partyLandingAttractionsCtaButtonText"],
    "See Available Slots",
  );
  const proofEyebrow = getConfiguredValue(
    landingData,
    ["birthdayLandingProofEyebrow", "partyLandingProofEyebrow"],
    "Why Parents Book",
  );
  const proofTitle = getConfiguredValue(
    landingData,
    ["birthdayLandingProofTitle", "partyLandingProofTitle"],
    "All the birthday energy. None of the party stress.",
  );
  const proofCards = getConfiguredItems(
    landingData,
    ["birthdayLandingProofCards", "partyLandingProofCards"],
    FALLBACK_PROOF_CARDS,
  );
  const packagesEyebrow = getConfiguredValue(
    landingData,
    ["birthdayLandingPackagesEyebrow", "partyLandingPackagesEyebrow"],
    "Birthday Packages",
  );
  const packagesTitle = getConfiguredValue(
    landingData,
    ["birthdayLandingPackagesTitle", "partyLandingPackagesTitle"],
    "Pick your party size and lock in the date.",
  );
  const packageLabel = getConfiguredValue(
    landingData,
    ["birthdayLandingPackageLabel", "partyLandingPackageLabel"],
    "Package",
  );
  const featuredPackageLabel = getConfiguredValue(
    landingData,
    ["birthdayLandingFeaturedPackageLabel", "partyLandingFeaturedPackageLabel"],
    "Most Popular",
  );
  const finalEyebrow = getConfiguredValue(
    landingData,
    ["birthdayLandingFinalEyebrow", "partyLandingFinalEyebrow"],
    "Ready to lock it in?",
  );
  const finalTitle = getConfiguredValue(
    landingData,
    ["birthdayLandingFinalTitle", "partyLandingFinalTitle"],
    "Claim your birthday slot before discounted times are gone.",
  );

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
        <div className="ppp-birthday-balloons" aria-hidden="true">
          <span className="ppp-birthday-balloon ppp-birthday-balloon--one" />
          <span className="ppp-birthday-balloon ppp-birthday-balloon--two" />
          <span className="ppp-birthday-balloon ppp-birthday-balloon--three" />
          <span className="ppp-birthday-balloon ppp-birthday-balloon--four" />
          <span className="ppp-birthday-balloon ppp-birthday-balloon--five" />
        </div>
        <div className="ppp-birthday-shell ppp-birthday-hero__grid">
          <div className="ppp-birthday-hero__copy">
            <p className="ppp-birthday-eyebrow">{eyebrow}</p>
            <h1 id="birthday-landing-title">{headline}</h1>
            <p className="ppp-birthday-hero__text">{subheadline}</p>

            <div className="ppp-birthday-actions">
              <BookingButton title={ctaText} bookingType="party" />
              <a href="#packages" className="ppp-birthday-secondary-link">
                {secondaryCtaText}
              </a>
            </div>

            <div className="ppp-birthday-stats" aria-label="Birthday party highlights">
              {stats.map((item) => (
                <div key={`${item.value || item.number}-${item.label || item.text}`}>
                  <strong>{item.value || item.number}</strong>
                  <span>{item.label || item.text}</span>
                </div>
              ))}
            </div>
          </div>
          <BirthdayHeroContactForm urgency={urgency} />
        </div>
      </section>

      <section className="ppp-birthday-attractions" aria-labelledby="birthday-attractions-title">
        <div className="ppp-birthday-shell">
          <div className="ppp-birthday-section-heading">
            <p className="ppp-birthday-eyebrow">{attractionsEyebrow}</p>
            <h2 id="birthday-attractions-title">{attractionsTitle}</h2>
            <p>{attractionsText}</p>
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
            <p>{attractionsCtaText}</p>
            <div className="ppp-birthday-attraction-cta__actions">
              <BookingButton title={attractionsCtaButtonText} bookingType="party" />
            </div>
          </div>
        </div>
      </section>

      <section className="ppp-birthday-proof">
        <div className="ppp-birthday-shell">
          <div className="ppp-birthday-section-heading">
            <p className="ppp-birthday-eyebrow">{proofEyebrow}</p>
            <h2>{proofTitle}</h2>
          </div>

          <div className="ppp-birthday-card-grid">
            {proofCards.map((item, index) => (
              <article key={item.title || index}>
                <span>{item.number || String(index + 1).padStart(2, "0")}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="ppp-birthday-packages" id="packages">
        <div className="ppp-birthday-shell">
          <div className="ppp-birthday-section-heading">
            <p className="ppp-birthday-eyebrow">{packagesEyebrow}</p>
            <h2>{packagesTitle}</h2>
          </div>

          <div className="ppp-birthday-package-grid">
            {packageHighlights.map((item, index) => (
              <article className={index === 1 ? "is-featured" : ""} key={item.name}>
                <p>{index === 1 ? featuredPackageLabel : packageLabel}</p>
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
            <p className="ppp-birthday-eyebrow">{finalEyebrow}</p>
            <h2>{finalTitle}</h2>
          </div>
          <BookingButton title={ctaText} bookingType="party" />
        </div>
      </section>
    </main>
  );
}
