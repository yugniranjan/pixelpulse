export const dynamic = "force-dynamic";

import React from "react";
import Link from "next/link";
import { FaArrowRight, FaGamepad, FaLock, FaPeopleGroup, FaStar } from "react-icons/fa6";
import "../../styles/kidsparty.css";
import "../../styles/subcategory.css";
import {
  fetchsheetdata,
  fetchPageData,
  generateMetadataLib,
  fetchMenuData,
  getWaiverLink,
  generateSchema,
} from "@/lib/sheets";
import SectionHeading from "@/components/home/SectionHeading";
import BookingButton from "@/components/smallComponents/BookingButton";
import Loading from "@/loading";
import { getConfigValue, getConfiguredValue, getCtaContent, getRowValue } from "@/lib/ctaContent";

const onlineBirthdayBookingUrl =
  "https://pixelpulseplayzone.lilypadpos.app/public/onlinebooking/step1.php?ptid=21";
const birthdayInquiryPageUrl = "https://birthdays.pixelpulseplay.ca/";
const onlineBirthdayPackages = new Set(["pixel punch", "pixel ultra"]);
const partyRoomAccessByPackage = {
  "pixel punch": "45 minutes",
  "pixel ultra": "45 minutes",
  "pixel jumbo": "2.5 hours",
  "pulse max": "3 hours",
};

function getPartyRoomAccess(packageName = "") {
  return partyRoomAccessByPackage[String(packageName).trim().toLowerCase()] || "-";
}

function addPartyRoomAccessFeature(features = []) {
  if (features.includes("Party Room Access")) return features;

  const durationIndex = features.indexOf("Total Party Duration");
  if (durationIndex < 0) return [...features, "Party Room Access"];

  return [
    ...features.slice(0, durationIndex + 1),
    "Party Room Access",
    ...features.slice(durationIndex + 1),
  ];
}

function getPackageFeatureValue(plan, feature) {
  return feature === "Party Room Access"
    ? getPartyRoomAccess(plan.name)
    : plan[feature] || "-";
}

function getBirthdayPackageCta(packageName = "") {
  const canBookOnline = onlineBirthdayPackages.has(
    String(packageName).trim().toLowerCase(),
  );

  return canBookOnline
    ? { href: onlineBirthdayBookingUrl, label: "Book Now" }
    : {
        href: `${birthdayInquiryPageUrl}?package=${encodeURIComponent(packageName)}#birthday-party-form`,
        label: "Inquire",
      };
}

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
    ?.replace(/\r/g, "")
    ?.split("\n")
    ?.map((line) => line.replace(/^[\-\*\u2022]\s*/, "").trim())
    ?.filter(Boolean);

  return {
    heading: lines[0] || "",
    bullets: lines.slice(1),
  };
}

export async function generateMetadata({ params }) {
  const metadata = await generateMetadataLib({
    location: params.location_slug || "vaughan",
    category: "",
    page: "kids-birthday-parties",
  });
  return metadata;
}

const PricingComparison = ({ birthdaydata, ctaContent }) => {
  const parsedData = (() => {
    try {
      if (birthdaydata?.packages) return birthdaydata;

      const raw = birthdaydata?.[0]?.value;
      if (!raw) return null;

      const cleaned = raw
        ?.replace(/<br\/>/g, "")
        ?.replace(/\n/g, "")
        ?.replace(/,\s*([}\]])/g, "$1")
        ?.trim();
      return JSON.parse(cleaned);
    } catch (err) {
      console.error("JSON parse error:", err);
      return null;
    }
  })();

  if (!parsedData || !parsedData.packages?.length) {
    return (
      <div className="ppp-party-loading">
        <Loading message="Loading pricing data..." />
      </div>
    );
  }

  const ctaSources = ctaContent?._sources || [];
  const ctaTitle = getConfiguredValue(
    ctaSources,
    ["birthdayFinalCtaTitle", "partyFinalCtaTitle"],
  );
  const ctaSubtitle = getConfiguredValue(
    ctaSources,
    ["birthdayFinalCtaSubtitle", "partyFinalCtaSubtitle"],
  );
  const ctaPrimaryText = getConfiguredValue(
    ctaSources,
    ["birthdayFinalCtaPrimaryText", "partyFinalCtaPrimaryText"],
  );
  const ctaSecondaryText = getConfiguredValue(
    ctaSources,
    ["birthdayFinalCtaSecondaryText", "partyFinalCtaSecondaryText"],
    "Book Your Date",
  );
  const ctaSecondaryHref = getConfiguredValue(
    ctaSources,
    ["birthdayFinalCtaSecondaryHref", "partyFinalCtaSecondaryHref"],
  );
  const isCtaSecondaryHrefExternal = /^https?:\/\//i.test(ctaSecondaryHref || "");

  const packages = parsedData.packages;
  const features = addPartyRoomAccessFeature(
    Object.keys(packages[0]).filter((key) => key !== "name"),
  );
  const spotlightIndex = packages.length > 1 ? 1 : 0;

  return (
    <section className="ppp-party-pricing" id="party-packages">
      

      <div className="ppp-party-table-wrap">
        <table className="ppp-party-table">
          <thead>
            <tr>
              <th className="ppp-party-table__feature-col">Features</th>
              {packages.map((plan, index) => (
                <th
                  key={index}
                  className={`ppp-party-table__plan-col${index === spotlightIndex ? " is-featured" : ""}`}
                >
                  <div className="ppp-party-plan">
                    <span className="ppp-party-plan__eyebrow">
                      {index === spotlightIndex ? "Most Popular" : "Package"}
                    </span>
                    <h3>{plan.name}</h3>
                    <p>{plan["Package Price"]}</p>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {features.slice(1).map((feature, index) => (
              <tr key={index}>
                <td className="ppp-party-feature" data-label="Feature">
                  {feature}
                </td>
                {packages.map((plan, planIndex) => (
                  <td
                    key={planIndex}
                    className="ppp-party-value"
                    data-label={plan.name}
                  >
                    {getPackageFeatureValue(plan, feature)}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="ppp-party-table__cta-row">
              <td className="ppp-party-feature">Booking</td>
              {packages.map((plan) => {
                const cta = getBirthdayPackageCta(plan.name);

                return (
                  <td className="ppp-party-value" key={plan.name}>
                    <a
                      className="ppp-party-package-cta"
                      href={cta.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {cta.label}
                    </a>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="ppp-party-mobile-cards">
        {packages.map((plan, index) => {
          const cta = getBirthdayPackageCta(plan.name);

          return (
            <article
              key={index}
              className={`ppp-party-mobile-card${index === spotlightIndex ? " is-featured" : ""}`}
            >
              <div className="ppp-party-mobile-card__head">
                <span className="ppp-party-mobile-card__eyebrow">
                  {index === spotlightIndex ? "Most Popular" : "Package"}
                </span>
                <h3>{plan.name}</h3>
                <p>{plan["Package Price"]}</p>
              </div>

              <div className="ppp-party-mobile-card__body">
                {features.slice(1).map((feature, featureIndex) => (
                  <div className="ppp-party-mobile-card__row" key={featureIndex}>
                    <span className="ppp-party-mobile-card__label">{feature}</span>
                    <span className="ppp-party-mobile-card__value">
                      {getPackageFeatureValue(plan, feature)}
                    </span>
                  </div>
                ))}
              </div>
              <a
                className="ppp-party-package-cta ppp-party-mobile-card__cta"
                href={cta.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {cta.label}
              </a>
            </article>
          );
        })}
      </div>

      <PrivatePartyRoomSection />

      <div className="ppp-party-private-disclaimer">
        <strong>Note:-</strong>
        <span>
          For a private celebration or add ons, please contact us to discuss availability and details.
        </span>
      </div>

      {parsedData.standard_rules?.length > 0 && (
        <>
        <section className="ppp-party-cta-band">
          <div className="aero-max-container ppp-party-cta-band__inner">
            <div className="ppp-party-cta-band__content">
              {ctaTitle && (
                <p className="ppp-party-cta-band__text">
                  {ctaTitle}
                </p>
              )}
              {ctaSubtitle && (
                <p className="ppp-party-cta-band__subtext">{ctaSubtitle}</p>
              )}
            </div>
            <div className="ppp-party-cta-band__actions">
              {ctaPrimaryText && (
                <Link href="#party-packages" className="ppp-party-cta-band__btn" prefetch={false}>
                  {ctaPrimaryText}
                </Link>
              )}
              {ctaSecondaryText && ctaSecondaryHref ? (
                <Link
                  href={ctaSecondaryHref}
                  className="ppp-party-cta-band__btn"
                  prefetch={!isCtaSecondaryHrefExternal}
                  target={isCtaSecondaryHrefExternal ? "_blank" : undefined}
                  rel={isCtaSecondaryHrefExternal ? "noopener noreferrer" : undefined}
                >
                  {ctaSecondaryText}
                </Link>
              ) : ctaSecondaryText ? (
                <div className="aero-btn-booknow">
                  <BookingButton
                    title={ctaSecondaryText}
                    className="ppp-party-cta-band__btn"
                    bookingType={ctaContent?.birthdayFinalCtaSecondaryBookingType || "party"}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </section>
        <div className="ppp-party-rules">
          <h3>Standard rules for every package</h3>
          <ul>
            {parsedData.standard_rules.map((rule, index) => (
              <li key={index}>{rule}</li>
            ))}
          </ul>
        </div>
        </>
      )}
    </section>
  );
};

const privateRoomFeatures = [
  {
    icon: FaLock,
    title: "Dedicated Party Room",
    lead: "No shared tables. No shared party room.",
    text: "Your assigned room belongs to your group throughout your reserved party time.",
  },
  {
    icon: FaPeopleGroup,
    title: "Private Space for Your Group",
    lead: "Cake. Food. Gifts. Birthday moments.",
    text: "Bring everyone together in your own dedicated space between the games and celebrations.",
  },
  {
    icon: FaGamepad,
    title: "Staggered Party Arrivals",
    lead: "More availability without a shared-party-hall feel.",
    text: "Separate room schedules help each party arrive, celebrate, and transition through the venue smoothly.",
  },
  {
    icon: FaStar,
    title: "More Than a Party",
    lead: "Play. Challenge. Celebrate.",
    text: "Take on immersive challenge rooms, enjoy the arcade, then bring everyone together in your dedicated party room.",
  },
];

function PrivatePartyRoomSection() {
  const bookingHref = "https://birthdays.pixelpulseplay.ca/";
  const bookingText = "Book Now";
  const isBookingHrefExternal = /^https?:\/\//i.test(bookingHref || "");

  return (
    <section className="ppp-party-room" aria-labelledby="party-room-title">
      <div className="ppp-party-room__story-grid">
        <div className="ppp-party-room__copy">
          <div className="ppp-party-room__intro">
            <p className="ppp-party-room__eyebrow">Private party rooms</p>
            <h2 id="party-room-title">Your Party. Your Room.</h2>
          </div>
          <p className="ppp-party-room__subhead">
            No shared tables. No shared party room.
          </p>
          <p className="ppp-party-room__body-copy">
            Cake, food, gifts, and birthday moments all come together in <strong>your
            group&apos;s dedicated party room</strong>, giving you a comfortable space to
            celebrate, recharge, and enjoy the day between the action.
          </p>
        </div>

      </div>

      <div className="ppp-party-room__features">
        {privateRoomFeatures.map((feature) => {
          const Icon = feature.icon;
          return (
            <article className="ppp-party-room__feature" key={feature.title}>
              <span className="ppp-party-room__feature-icon">
                <Icon aria-hidden="true" />
              </span>
              <h3>{feature.title}</h3>
              <p className="ppp-party-room__feature-lead">{feature.lead}</p>
              <p>{feature.text}</p>
            </article>
          );
        })}
      </div>

      <div className="ppp-party-room__cta-row">
        <p className="ppp-party-room__note">
          More ways to celebrate. Your own space, every time.
        </p>

        {bookingHref && (
          <Link
            href={bookingHref}
            className="ppp-party-room__btn"
            prefetch={!isBookingHrefExternal}
            target={isBookingHrefExternal ? "_blank" : undefined}
            rel={isBookingHrefExternal ? "noopener noreferrer" : undefined}
            data-gtm-event="birthday_party_room_cta_click"
            data-gtm-category="Birthday Parties"
            data-gtm-label="Private party rooms Book Now"
          >
            {bookingText}
            <FaArrowRight aria-hidden="true" />
          </Link>
        )}
      </div>
    </section>
  );
}

const Page = async ({ params }) => {
  const location_slug = params.location_slug || "vaughan";

  let waiverLink = "";
  let data = null;
  let dataconfig = [];
  let menudata = [];
  let jsonLDschema = "";

  try {
    [waiverLink, data, dataconfig, menudata] = await Promise.all([
      getWaiverLink(location_slug),
      fetchPageData(location_slug, "kids-birthday-parties"),
      fetchsheetdata("config", location_slug),
      fetchMenuData(location_slug),
    ]);
  } catch (error) {
    console.error("kids birthday parties data failed:", error);
  }

  try {
    jsonLDschema = await generateSchema(data, "", "", "kids-birthday-parties");
  } catch (error) {
    console.error("kids birthday parties schema failed:", error);
  }

  const birthdayPackages = Array.isArray(dataconfig)
    ? dataconfig.filter((item) => item.key === "birthday_packages")
    : [];

  const attractions = menudata?.find((item) => item.path === "attractions");
  const attractionCount = attractions?.children?.filter((item) => item?.isactive == 1)?.length || 0;

  const introText =
    stripHtml(data?.seosection || "") ||
    "Plan a high-energy birthday party packed with digital games, active play, and a celebration setup that feels easy from booking to cake time.";
  const partyHeroContent = parseHeroTextBlock(data?.section2 || "");
  const partyHeroLabelHtml = data?.section3 || "";
  const partyHeroHeading = partyHeroContent.heading;
  const partyHeroBullets = partyHeroContent.bullets;
  const configCta = getCtaContent(dataconfig);
  const pageCta = getCtaContent(data || {});
  const ctaContent = {
    ...configCta,
    ...Object.fromEntries(
      Object.entries(pageCta).filter(([, value]) => Boolean(value)),
    ),
    _sources: [data || {}, dataconfig || []],
  };
  const birthdayHeroCtaText = getConfiguredValue(
    ctaContent._sources,
    ["birthdayHeroCtaText", "kidsBirthdayHeroCtaText", "partyHeroCtaText"],
  );
  const birthdayHeroCtaHref = getConfiguredValue(
    ctaContent._sources,
    ["birthdayHeroCtaHref", "kidsBirthdayHeroCtaHref", "partyHeroCtaHref"],
  );
  const hasBirthdayHeroCta = Boolean(birthdayHeroCtaText && birthdayHeroCtaHref);
  const isBirthdayHeroCtaExternal = /^https?:\/\//i.test(birthdayHeroCtaHref);
  const partyHeroTrustBullets = Array.from(
    new Set([
      ...partyHeroBullets,
      "Hosted & fully managed",
      "High-energy group experience",
    ].filter(Boolean)),
  );

  return (
    <main className="ppp-party-page">
      <section className="ppp-party-hero">
        <div className="aero-max-container ppp-party-hero__inner">
          <div className="ppp-party-hero__panel">
            <div className="ppp-about-hero-card">
              {partyHeroLabelHtml && (
                <div
                  className="ppp-party-hero__mobile-hidden-label"
                  dangerouslySetInnerHTML={{ __html: partyHeroLabelHtml }}
                />
              )}
              {partyHeroHeading && <h2>{partyHeroHeading}</h2>}
              {partyHeroTrustBullets.length > 0 && (
                <ul>
                  {partyHeroTrustBullets.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
              )}
              {hasBirthdayHeroCta && (
                <a
                  href={birthdayHeroCtaHref}
                  className="ppp-party-hero__btn"
                  target={isBirthdayHeroCtaExternal ? "_blank" : undefined}
                  rel={isBirthdayHeroCtaExternal ? "noopener noreferrer" : undefined}
                >
                  {birthdayHeroCtaText}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="subcategory_main_section-bg gaming_bg">
        <section className="aero-max-container ppp-party-layout">
          <PricingComparison birthdaydata={birthdayPackages} ctaContent={ctaContent} />

          {data?.seosection && (
            <article className="ppp-party-content">
              <SectionHeading className="section-heading-white">
                Plan The <span>Celebration</span>
              </SectionHeading>
              <div dangerouslySetInnerHTML={{ __html: data?.seosection || "" }} />
            </article>
          )}
        </section>
      </section>

      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: jsonLDschema || "" }}
      />
    </main>
  );
};

export default Page;
