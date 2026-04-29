export const dynamic = "force-dynamic";

import "../styles/birthday-landing.css";
import Image from "next/image";
import BirthdayHeroContactForm from "@/components/BirthdayHeroContactForm";
import BookingButton from "@/components/smallComponents/BookingButton";
import { fetchMenuData, fetchsheetdata, fetchsheetdataNoCache } from "@/lib/sheets";
import { getConfiguredValue } from "@/lib/ctaContent";

const LOCATION_SLUG = "vaughan";
const LANDING_PAGES_SHEET = "landing pages";
const HERO_IMAGE = "https://storage.googleapis.com/pixel-pulse-play/web/birthdaylandinghero.png";
const ATTRACTION_FALLBACK_IMAGE =
  "https://storage.googleapis.com/pixel-pulse-play/web/PrivateParty.png";

const FALLBACK_META_TITLE = "Birthday Party Offer | Pixel Pulse Play Vaughan";
const FALLBACK_META_DESCRIPTION =
  "Book a high-energy Pixel Pulse Play birthday party in Vaughan and claim up to $50 off limited discounted slots.";
const FALLBACK_CANONICAL = "https://www.pixelpulseplay.ca/birthday-party-landing";

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
    const freshRows = await fetchsheetdataNoCache(LANDING_PAGES_SHEET);
    const filteredRows = freshRows.filter((row) => {
      const location = String(row.location ?? "");
      return location.includes(LOCATION_SLUG) || location === "";
    });

    if (filteredRows.length) {
      return filteredRows;
    }

    return await fetchsheetdata(LANDING_PAGES_SHEET, LOCATION_SLUG);
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
    ["birthdayLandingHeroImage", "birthdayLandingImage", "partyLandingHeroImage", "partyLandingImage"],
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
    return [];
  }

  return packages.slice(0, 3).map((item) => ({
    name: item.name,
    price: item["Package Price"],
    detail: item["Number of Participants"] || item["Game Time Included"] || "",
  }));
}

function getAttractions(menuData = []) {
  const attractions = menuData.find((item) => item.path === "attractions");
  const children = Array.isArray(attractions?.children) ? attractions.children : [];

  return children
    .filter((item) => item?.isactive == 1)
    .map((item) => ({
      title: item.title || item.desc,
      text: item.smalltext || item.metadescription || "",
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
    ["birthdayLandingHeroImage", "birthdayLandingImage", "partyLandingHeroImage", "partyLandingImage"],
    HERO_IMAGE,
  );
  const headline = getConfiguredValue(
    landingData,
    ["birthdayLandingHeadline", "partyLandingHeadline"],
    "",
  );
  const eyebrow = getConfiguredValue(
    landingData,
    ["birthdayLandingEyebrow", "partyLandingEyebrow"],
    "",
  );
  const subheadline = getConfiguredValue(
    landingData,
    ["birthdayLandingSubheadline", "partyLandingSubheadline"],
    "",
  );
  const ctaText = getConfiguredValue(
    landingData,
    ["birthdayLandingCtaText", "partyLandingCtaText"],
    "",
  );
  const urgency = getConfiguredValue(
    landingData,
    ["birthdayLandingUrgency", "partyLandingUrgency"],
    "",
  );
  const secondaryCtaText = getConfiguredValue(
    landingData,
    ["birthdayLandingSecondaryCtaText", "partyLandingSecondaryCtaText"],
    "",
  );
  const stats = getConfiguredItems(
    landingData,
    ["birthdayLandingStats", "partyLandingStats"],
    [],
  );
  const attractionsEyebrow = getConfiguredValue(
    landingData,
    ["birthdayLandingAttractionsEyebrow", "partyLandingAttractionsEyebrow"],
    "",
  );
  const attractionsTitle = getConfiguredValue(
    landingData,
    ["birthdayLandingAttractionsTitle", "partyLandingAttractionsTitle"],
    "",
  );
  const attractionsText = getConfiguredValue(
    landingData,
    ["birthdayLandingAttractionsText", "partyLandingAttractionsText"],
    "",
  );
  const attractionsCtaText = getConfiguredValue(
    landingData,
    ["birthdayLandingAttractionsCtaText", "partyLandingAttractionsCtaText"],
    "",
  );
  const attractionsCtaButtonText = getConfiguredValue(
    landingData,
    ["birthdayLandingAttractionsCtaButtonText", "partyLandingAttractionsCtaButtonText"],
    "",
  );
  const proofEyebrow = getConfiguredValue(
    landingData,
    ["birthdayLandingProofEyebrow", "partyLandingProofEyebrow"],
    "",
  );
  const proofTitle = getConfiguredValue(
    landingData,
    ["birthdayLandingProofTitle", "partyLandingProofTitle"],
    "",
  );
  const proofCards = getConfiguredItems(
    landingData,
    ["birthdayLandingProofCards", "partyLandingProofCards"],
    [],
  );
  const packagesEyebrow = getConfiguredValue(
    landingData,
    ["birthdayLandingPackagesEyebrow", "partyLandingPackagesEyebrow"],
    "",
  );
  const packagesTitle = getConfiguredValue(
    landingData,
    ["birthdayLandingPackagesTitle", "partyLandingPackagesTitle"],
    "",
  );
  const packageLabel = getConfiguredValue(
    landingData,
    ["birthdayLandingPackageLabel", "partyLandingPackageLabel"],
    "",
  );
  const featuredPackageLabel = getConfiguredValue(
    landingData,
    ["birthdayLandingFeaturedPackageLabel", "partyLandingFeaturedPackageLabel"],
    "",
  );
  const finalEyebrow = getConfiguredValue(
    landingData,
    ["birthdayLandingFinalEyebrow", "partyLandingFinalEyebrow"],
    "",
  );
  const finalTitle = getConfiguredValue(
    landingData,
    ["birthdayLandingFinalTitle", "partyLandingFinalTitle"],
    "",
  );
  const finalButtonText = getConfiguredValue(
    landingData,
    ["birthdayLandingFinalButtonText", "partyLandingFinalAnchorText", "partyLandingFinalButtonText"],
    "",
  );
  const hasFinalSection = finalEyebrow || finalTitle || finalButtonText;

  return (
    <main className="ppp-birthday-landing">
      <section
        className="ppp-birthday-hero"
        aria-labelledby={headline ? "birthday-landing-title" : undefined}
      >
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
            <Image
              className="ppp-birthday-hero__logo"
              src="/assets/images/logoD.png"
              alt="Pixel Pulse Play"
              width={220}
              height={82}
              style={{ height: "auto" }}
              priority
            />
            {eyebrow ? <p className="ppp-birthday-eyebrow">{eyebrow}</p> : null}
            {headline ? <h1 id="birthday-landing-title">{headline}</h1> : null}
            {subheadline ? <p className="ppp-birthday-hero__text">{subheadline}</p> : null}

            {ctaText || secondaryCtaText ? (
              <div className="ppp-birthday-actions">
                {ctaText ? <BookingButton title={ctaText} bookingType="party" /> : null}
                {secondaryCtaText ? (
                  <a href="#packages" className="ppp-birthday-secondary-link">
                    {secondaryCtaText}
                  </a>
                ) : null}
              </div>
            ) : null}

            {stats.length ? (
              <div className="ppp-birthday-stats" aria-label="Birthday party highlights">
                {stats.map((item) => (
                  <div key={`${item.value || item.number}-${item.label || item.text}`}>
                    {item.value || item.number ? <strong>{item.value || item.number}</strong> : null}
                    {item.label || item.text ? <span>{item.label || item.text}</span> : null}
                  </div>
                ))}
              </div>
            ) : null}
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
              {attractionsCtaButtonText ? (
                <a href="#birthday-party-form">{attractionsCtaButtonText}</a>
              ) : null}
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

      {hasFinalSection ? (
        <section className="ppp-birthday-final">
          <div className="ppp-birthday-shell ppp-birthday-final__inner">
            <div>
              {finalEyebrow ? <p className="ppp-birthday-eyebrow">{finalEyebrow}</p> : null}
              {finalTitle ? <h2>{finalTitle}</h2> : null}
            </div>
            {finalButtonText ? (
              <a className="ppp-birthday-final__button" href="#birthday-party-form">
                {finalButtonText}
              </a>
            ) : null}
          </div>
        </section>
      ) : null}
    </main>
  );
}
