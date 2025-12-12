import Link from "next/link";
import React from "react";
import "../../styles/category.css";
import { getDataByParentId } from "@/utils/customFunctions";
import {
  fetchMenuData,
  generateMetadataLib,
  fetchPageData,
  getWaiverLink,
} from "@/lib/sheets";
import MotionImage from "@/components/MotionImage";
export async function generateMetadata({ params }) {
  const { location_slug = "st-catharines", category_slug } = params;

  const metadata = await generateMetadataLib({
    location: location_slug,
    category: "",
    page: category_slug,
  });
  return metadata;
}

const Category = async ({ params }) => {
  console.log("params", params);
  const { location_slug = "st-catharines", category_slug } = params;

  const data = await fetchMenuData(location_slug);
  const pageData = await fetchPageData(location_slug, category_slug);
  const waiverLink = await getWaiverLink(location_slug);
  //console.log('pagedata',pageData);
  const attractionsData = getDataByParentId(data, category_slug);
  console.log("waiverLink", waiverLink);
  return (
    <main>
      <section>
        <section className="aero_category_section_wrapper">
          <section className="aero-max-container">
            <MotionImage pageData={JSON.parse(JSON.stringify(pageData))} waiverLink={waiverLink} />

            <section className="aero_category_section_card_wrapper">
              {attractionsData[0]?.children?.map((item, i) => {
                return (
                  item?.isactive == 1 && (
                    <Link
                      href={`${category_slug}/${item?.path}`}
                      prefetch
                      key={i}
                    >
                      <article className="aero_category_section_card_wrap">
                        <img
                          src={item?.smallimage}
                          width={150}
                          height={150}
                          alt={item?.title}
                          title={item?.title}
                          className="aero_category_section_card_img"
                        />
                        
                        <div className="aero_category_section_card_desc">
                          <h2>{item?.desc}</h2>
                          <p>
                            {item?.smalltext?.slice(0, 50) + "..."}{" "}
                            <span>READ MORE</span>
                          </p>
                        </div>
                      </article>
                    </Link>
                  )
                );
              })}
            </section>
          </section>
        </section>
        <section className="aero_home_article_section">
          <section className="aero-max-container aero_home_seo_section">
            <div
              dangerouslySetInnerHTML={{ __html: pageData?.section1 || "" }}
            />
            <div
              dangerouslySetInnerHTML={{ __html: pageData?.seosection || "" }}
            />
          </section>
        </section>
      </section>
    </main>
  );
};

export default Category;
