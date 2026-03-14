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

  const jsonLDschema = await generateSchema(data, '', '', "kids-birthday-parties");

  const attractions = menudata?.filter((item) => item.path == "attractions")[0];

  function serialize(data) {
    return JSON.parse(JSON.stringify(data));
  }

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

          <center className="birthday_heading" style={{ marginBottom: "20px" }}>
            <SectionHeading mainHeading="true">
              Birthday Party <span>Packages & Pricing</span>
            </SectionHeading>
          </center>

          <p className="birthday_desc">
            At pixelpulseplay {location_slug}, we offer exciting birthday party
            packages designed for fun, games, and unforgettable celebrations.
            Pick the package that fits your party size.
          </p>

          <div className="pricing_horizontal_container">

            {birthdaydata.map((item, i) => {

              const includedata = item.includes.split(";");

              return (
                <div key={i} className="pricing_horizontal_card">

                  <div className="package_price_box">
                    <div className="price">${item?.price}</div>
                    <span className="category">{item?.category}</span>
                  </div>

                  <div className="package_details">

                    <h3 className="package_title">
                      {item?.plantitle}
                    </h3>

                    <ul className="package_features">

                      {includedata.map((feature, j) => (
                        <li key={j}>🎮 {feature}</li>
                      ))}

                    </ul>

                  </div>

                </div>
              );

            })}

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
