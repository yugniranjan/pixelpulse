import React from "react";
import "../../../styles/subcategory.css";
import "../../../styles/category.css";
import "../../../styles/kidsparty.css";
import { getDataByParentId } from "@/utils/customFunctions";
import MotionImage from "@/components/MotionImage";
import ImageMarquee from "@/components/ImageMarquee";
import SubCategoryCard from "@/components/smallComponents/SubCategoryCard";
import {
  fetchsheetdata,
  fetchMenuData,
  generateMetadataLib,
  getWaiverLink,
} from "@/lib/sheets";
import Link from "next/link";
import { LOCATION_NAME } from "@/lib/constant";

export async function generateMetadata({ params }) {
  const {
    location_slug = LOCATION_NAME || 'st-catharines',
    subcategory_slug,
    category_slug,
  } = params;
  const metadata = await generateMetadataLib({
    location: location_slug,
    category: category_slug,
    page: subcategory_slug,
  });
  return metadata;
}

const Subcategory = async ({ params }) => {
  // console.log("console", params);
  const {
    location_slug = LOCATION_NAME,
    subcategory_slug,
    category_slug,
  } = params;
  const [data, dataconfig, menudata] = await Promise.all([
    fetchsheetdata("Data", location_slug),
    fetchsheetdata("config", location_slug),
    fetchMenuData(location_slug),
  ]);

  const waiverLink = await getWaiverLink(location_slug);

  const categoryData = (
    await getDataByParentId(menudata, category_slug)
  )[0]?.children?.filter(
    (child) => child.path !== subcategory_slug && child.isactive == 1
  );

  const attractionsData = Array.isArray(data)
    ? getDataByParentId(data, subcategory_slug)
    : [];

    const safePageData = JSON.parse(JSON.stringify(attractionsData));
  const safeWaiverLink = JSON.parse(JSON.stringify(waiverLink));

  const pagedata = attractionsData?.[0];
  if (!pagedata) return;

  return (
    <main>
      <section>
        <MotionImage pageData={safePageData} waiverLink={safeWaiverLink} />
      </section>

      <section className="subcategory_main_section-bg">
        <section className="aero-max-container">
          <div
            className="subcategory_main_section"
            dangerouslySetInnerHTML={{
              __html: pagedata.section1 || "",
            }}
          />
        </section>
        <SubCategoryCard
          attractionsData={categoryData}
          location_slug={location_slug}
          theme={"default"}
          title={`Other ${pagedata.parentid}`}
          text={[pagedata.metadescription]}
        />
      </section>

      {/* <ImageMarquee imagesString={pagedata.headerimage} /> */}

      <section className="aero_home_article_section">
        <section className="aero-max-container aero_home_seo_section">
          <div
            dangerouslySetInnerHTML={{
              __html: pagedata.seosection || "",
            }}
          />
        </section>
      </section>
    </main>
  );
};

export default Subcategory;
