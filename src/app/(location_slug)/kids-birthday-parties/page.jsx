export const dynamic = "force-dynamic";

import React from "react";
import Link from "next/link";
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

function stripHtml(html = "") {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function generateMetadata({ params }) {
  const metadata = await generateMetadataLib({
    location: params.location_slug || "vaughan",
    category: "",
    page: "kids-birthday-parties",
  });
  return metadata;
}

const PricingComparison = ({ birthdaydata }) => {
  const parsedData = (() => {
    try {
      if (birthdaydata?.packages) return birthdaydata;

      const raw = birthdaydata?.[0]?.value;
      if (!raw) return null;

      const cleaned = raw.replace(/<br\/>/g, "").replace(/\n/g, "").trim();
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

  const packages = parsedData.packages;
  const features = Object.keys(packages[0]).filter((key) => key !== "name");
  const spotlightIndex = packages.length > 1 ? 1 : 0;

  return (
    <section className="ppp-party-pricing">
      

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
                    {plan[feature] || "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="ppp-party-mobile-cards">
        {packages.map((plan, index) => (
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
                  <span className="ppp-party-mobile-card__value">{plan[feature] || "-"}</span>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>

      {parsedData.standard_rules?.length > 0 && (
        <div className="ppp-party-rules">
          <h3>Standard rules for every package</h3>
          <ul>
            {parsedData.standard_rules.map((rule, index) => (
              <li key={index}>{rule}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};

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

  return (
    <main className="ppp-party-page">
      <section className="ppp-party-hero">
        <div className="aero-max-container ppp-party-hero__inner">
          <div className="ppp-party-hero__panel">
            <div className="ppp-about-hero-card">
              <SectionHeading className="section-heading-white" mainHeading={true}>
              Birthday Party <span>Packages & Pricing</span>
            </SectionHeading>
              <h2>All the energy of an active party, with less planning stress and more memorable moments.</h2> 
              <ul>
                <li>Interactive play that keeps the whole group engaged</li>
                <li>Structured package options that simplify decision-making</li>
                <li>Great fit for birthdays that need movement, excitement, and space</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="subcategory_main_section-bg gaming_bg">
        <section className="aero-max-container ppp-party-layout">
         
          <PricingComparison birthdaydata={birthdayPackages} />

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

      <section className="ppp-party-cta-band">
        <div className="aero-max-container ppp-party-cta-band__inner">
          <div>
            <p className="ppp-party-cta-band__eyebrow">Ready to lock it in?</p>
            <h3>Reserve your date and let the party countdown begin.</h3>
          </div>
          <div className="ppp-party-cta-band__actions">
            <div className="aero-btn-booknow">
              <BookingButton title="Book Now" />
            </div>
          </div>
        </div>
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
