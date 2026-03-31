export const dynamic = "force-dynamic";
import React, { Children } from "react";
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
// import ImageMarquee from "@/components/ImageMarquee";
// import FaqCard from "@/components/smallComponents/FaqCard";
// import SubCategoryCard from "@/components/smallComponents/SubCategoryCard";
import MotionImage from "@/components/MotionImage";
import SectionHeading from "@/components/home/SectionHeading";
import BookingButton from "@/components/smallComponents/BookingButton";
import Loading from "@/loading";


export async function generateMetadata({ params }) {
  const metadata = await generateMetadataLib({
    location: params.location_slug || "vaughan",
    category: "",
    page: "kids-birthday-parties",
  });
  return metadata;
}

const PricingComparison = ({ birthdaydata }) => {

  // 🔥 Parse sheet data
  const parsedData = (() => {
    try {
      if (birthdaydata?.packages) return birthdaydata;

      const raw = birthdaydata?.[0]?.value;
      if (!raw) return null;

      const cleaned = raw
        .replace(/<br\/>/g, "")
        .replace(/\n/g, "")
        .trim();

      return JSON.parse(cleaned);
    } catch (err) {
      console.error("JSON parse error:", err);
      return null;
    }
  })();

  if (!parsedData || !parsedData.packages) {
    return <Loading message="Loading pricing data..." />;
  }

  // ✅ Dynamic features
  const features = Object.keys(parsedData.packages[0]).filter(
    key => key !== "name"
  );

  return (
    <section className="pricing_section">
      <div className="container">

        {/* TABLE */}
        <div className="table_wrapper">
          <table className="comparison_table">

            {/* HEADER */}
            <thead>
              <tr>
                <th className="feature_col">Features</th>

                {parsedData.packages.map((plan, i) => (
                  <th key={i} className={`plan_col ${i === 1 ? "highlight" : ""}`}>
                    <div className="plan_box">
                      <h3 className="plan_name">{plan.name}</h3>
                      <p className="plan_price">{plan["Package Price"]}</p>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* BODY */}
            <tbody>
              {features.slice(1).map((feature, i) => (
                <tr key={i}>
                  <td className="feature_name">{feature}</td>

                  {parsedData.packages.map((plan, j) => (
                    <td key={j} className="value_cell">
                      {plan[feature] || "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>

          </table>
        </div>

        {/* 🔥 STANDARD RULES */}
        {parsedData.standard_rules && (
          <div className="rules_section">
            <h3 className="rules_title">
              Following standard rules apply to each package:
            </h3>

            <ul className="rules_list">
              {parsedData.standard_rules.map((rule, i) => (
                <li key={i} className="rule_item">
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        )}

      </div>
    </section>
  );
};



const Page = async ({ params }) => {
  const location_slug = params.location_slug || "vaughan";
  const waiverLink = await getWaiverLink(location_slug);
  const [data, dataconfig, menudata] = await Promise.all([
    fetchPageData(location_slug, "kids-birthday-parties"),
    fetchsheetdata("config", location_slug),
    fetchMenuData(location_slug),
  ]);

  const jsonLDschema = await generateSchema(data, '', '', "kids-birthday-parties");

  const attractions = menudata?.filter((item) => item.path == "attractions")[0];

  function serialize(data) {
    return JSON.parse(JSON.stringify(data));
  }

    const fiterBirthdayData = Array.isArray(dataconfig)
    ? dataconfig.filter((item) => item.key === "birthday_packages")
    : [];

  // console.log("Birthday Data:", fiterBirthdayData);
  // return

  return (
    <main>
      {/* <MotionImage
        pageData={serialize(data)}
        waiverLink={serialize(waiverLink)}
      /> */}

      {/* <section className="subcategory_main_section-bg">
        <section className="aero-max-container">
          <center style={{ padding: "20px 0 40px" }}>
            <SectionHeading mainHeading="true">Birthday Party<span>  Packages & Pricing</span></SectionHeading>
          </center>
          <p>
            At pixelpulseplay {location_slug}, we offer competitively priced
            birthday party packages in our private party rooms—perfectly located
            near you. Choose the package that fits your budget and guest list:
          </p>
          <article className="aero_bp_2_main_section">
            {birthdaydata.map((item, i) => {
              const includedata = item.includes.split(";");
              return (
                <div key={i} className="aero_bp_card_wrap">
                  <div className="aero-bp-boxcircle-wrap">
                    <span className="aero-bp-boxcircle">${item?.price}</span>
                  </div>
                  <div className="aero-bp-boxcircle-wrap">{item?.category}</div>
                  <h2 className="d-flex-center aero_bp_card_wrap_heading">
                    {item?.plantitle}
                  </h2>
                  <ul className="aero_bp_card_wrap_list">
                    {includedata?.map((item, i) => {
                      return <li key={i}>{item}</li>;
                    })}
                  </ul>
                </div>
              );
            })}
          </article>
        </section>
      </section> */}

     <section className="subcategory_main_section-bg gaming_bg">
      <section className="aero-max-container">

        <center style={{ padding: "20px 0 40px" }}>
            <SectionHeading mainHeading="true">Birthday Party<span>  Packages & Pricing</span></SectionHeading>
          </center>
          <p className="birthday_desc">
            At pixelpulseplay {location_slug}, we offer competitively priced
            birthday party packages in our private party rooms—perfectly located
            near you. Choose the package that fits your budget and guest list:
          </p>

        {/* <div className="pricing_table_wrapper">

          <table className="pricing_table">
            <thead>
              <tr>
                <th>Package</th>
                <th>Price</th>
                <th>Category</th>
                <th>Includes</th>
              </tr>
            </thead>

            <tbody>
              {birthdaydata.map((item, i) => {
                const includedata = item.includes.split(";");

                return (
                  <tr key={i}>
                    <td data-label="Package" className="package_title">
                      {item?.plantitle}
                    </td>

                    <td data-label="Price" className="price">
                      ${item?.price}
                    </td>

                    <td data-label="Category">
                      <span className="category">{item?.category}</span>
                    </td>

                    <td data-label="Includes">
                      <ul className="feature_list">
                        {includedata.map((feature, j) => (
                          <li key={j}>🎮 {feature}</li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

        </div> */}
         <PricingComparison birthdaydata={fiterBirthdayData} />

      </section>
      </section>
     

      {/* <SubCategoryCard attractionsData={attractions.children} location_slug={location_slug} theme={'default'} title={`Activities & Attractions`} text={[attractions.metadescription]} />

        <FaqCard page={'kids-birthday-parties'} location_slug={location_slug} />
      
     */}

      {/* <section className="aero_home_article_section">
        <section className="aero-max-container">
          <div
            className="subcategory_main_section"
            dangerouslySetInnerHTML={{ __html: data?.section1 || "" }}
          />
        </section>
      </section> */}

      {
        data?.seosection && (<section className="aero_home_article_section">
          <section className="aero-max-container aero_home_seo_section">
            <div dangerouslySetInnerHTML={{ __html: data?.seosection || "" }} />
          </section>
        </section>)
      }


      <div className="d-flex-center aero-btn-booknow" style={{ padding: "2em", backgroundColor: "var(--black-color)" }}>
        <BookingButton title="Book Now" />
      </div>


      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: jsonLDschema || "" }}
      />
    </main>
  );
};

export default Page;
