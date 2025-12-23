import React, { Children } from "react";
import "../../styles/kidsparty.css";
import "../../styles/subcategory.css";

import ImageMarquee from "@/components/ImageMarquee";
import {
  fetchsheetdata,
  fetchPageData,
  generateMetadataLib,
  fetchMenuData,
  getWaiverLink,
} from "@/lib/sheets";
import FaqCard from "@/components/smallComponents/FaqCard";
import SubCategoryCard from "@/components/smallComponents/SubCategoryCard";
import MotionImage from "@/components/MotionImage";
export async function generateMetadata({ params }) {
  const metadata = await generateMetadataLib({
    location: params.location_slug || "st-catharines",
    category: "",
    page: "kids-birthday-parties",
  });
  return metadata;
}

const Page = async ({ params }) => {
  const location_slug = params.location_slug || "st-catharines";
  const waiverLink = await getWaiverLink(location_slug);
  const [data, birthdaydata, menudata] = await Promise.all([
    fetchPageData(location_slug, "kids-birthday-parties"),
    fetchsheetdata("birthday packages", location_slug),

    fetchMenuData(location_slug),
  ]);
  const attractions = menudata?.filter((item) => item.path == "attractions")[0];

  return (
    <main>
      <MotionImage pageData={data} waiverLink={waiverLink} />

      <section className="subcategory_main_section-bg">
        <section className="aero-max-container">
          <center>
            <h2 style={{ paddingTop: "60px" }}>
              Birthday Party Packages & Pricing
            </h2>
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
      </section>

      {/* <SubCategoryCard attractionsData={attractions.children} location_slug={location_slug} theme={'default'} title={`Activities & Attractions`} text={[attractions.metadescription]} />

        <FaqCard page={'kids-birthday-parties'} location_slug={location_slug} />
      
     */}

      <section className="aero_home_article_section">
        {/* <section className="aero-max-container">
          <div
            className="subcategory_main_section"
            dangerouslySetInnerHTML={{ __html: data?.section1 || "" }}
          />
        </section> */}
      </section>
      <section className="aero_home_article_section">
        <section className="aero-max-container aero_home_seo_section">
          <div dangerouslySetInnerHTML={{ __html: data?.seosection || "" }} />
        </section>
      </section>
    </main>
  );
};

export default Page;
