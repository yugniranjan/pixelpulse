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
} from "@/lib/sheets";
// import ImageMarquee from "@/components/ImageMarquee";
// import FaqCard from "@/components/smallComponents/FaqCard";
// import SubCategoryCard from "@/components/smallComponents/SubCategoryCard";
import MotionImage from "@/components/MotionImage";
import SectionHeading from "@/components/home/SectionHeading";

export async function generateMetadata({ params }) {
  const metadata = await generateMetadataLib({
    location: params.location_slug || "vaughan",
    category: "",
    page: "kids-birthday-parties",
  });
  return metadata;
}

const Page = async ({ params }) => {
  const location_slug = params.location_slug || "vaughan";
  const waiverLink = await getWaiverLink(location_slug);
  const [data, birthdaydata, menudata] = await Promise.all([
    fetchPageData(location_slug, "kids-birthday-parties"),
    fetchsheetdata("birthday packages", location_slug),

    fetchMenuData(location_slug),
  ]);
  const attractions = menudata?.filter((item) => item.path == "attractions")[0];

  function serialize(data) {
    return JSON.parse(JSON.stringify(data));
  }

  return (
    <main>
      <MotionImage
        pageData={serialize(data)}
        waiverLink={serialize(waiverLink)}
      />

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
            <SectionHeading mainHeading="true">
              Birthday Party <span>Packages & Pricing</span>
            </SectionHeading>
          </center>

          <p className="birthday_desc">
            At pixelpulseplay {location_slug}, we offer exciting birthday party
            packages designed for fun, games, and unforgettable celebrations.
            Pick the package that fits your party size.
          </p>

          <div className="pricing_compare_wrapper">
            <table className="gaming_pricing_table">
              <thead>
                <tr>
                  <th className="feature_col">Features</th>

                  {birthdaydata.map((item, i) => (
                    <th key={i}>
                      <div className="gaming_package_header">
                        <h3>{item?.plantitle}</h3>

                        <div className="gaming_price">${item?.price}</div>

                        <span className="gaming_category">
                          {item?.category}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {Array.from(
                  new Set(
                    birthdaydata.flatMap((item) => item.includes.split(";")),
                  ),
                ).map((feature, i) => (
                  <tr key={i}>
                    <td className="feature_name">{feature}</td>

                    {birthdaydata.map((pkg, j) => {
                      const includes = pkg.includes.split(";");

                      return (
                        <td key={j} className="feature_value">
                          {includes.includes(feature) ? "🎮" : "—"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
      <section className="aero_home_article_section">
        <section className="aero-max-container aero_home_seo_section">
          <div dangerouslySetInnerHTML={{ __html: data?.seosection || "" }} />
        </section>
      </section>
    </main>
  );
};

export default Page;
