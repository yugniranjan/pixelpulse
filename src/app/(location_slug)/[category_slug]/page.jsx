import Link from "next/link";
import React from "react";
import "../../styles/category.css";
import "../../styles/blogs.css";
import { getDataByParentId } from "@/utils/customFunctions";
import {
  fetchMenuData,
  generateMetadataLib,
  fetchPageData,
  getWaiverLink,
  generateSchema,
} from "@/lib/sheets";
import MotionImage from "@/components/MotionImage";
import { LOCATION_NAME } from "@/lib/constant";
import { notFound } from "next/navigation";
import SectionHeading from "@/components/home/SectionHeading";
import BookingButton from "@/components/smallComponents/BookingButton";
export async function generateMetadata({ params }) {
  const { location_slug = LOCATION_NAME, category_slug } = params;

  const metadata = await generateMetadataLib({
    location: location_slug,
    category: "",
    page: category_slug,
  });
  return metadata;
}

const Category = async ({ params }) => {
  const { location_slug = LOCATION_NAME, category_slug } = params;

  if (category_slug === "refresh") {
    await fetchsheetdata("refresh", location_slug);
    return "data refreshed";
  }

  // 1️⃣ Fetch data
  const data = await fetchMenuData(location_slug);
  const pageData = await fetchPageData(location_slug, category_slug);
  // const waiverLink = await getWaiverLink(location_slug);

  // 2️⃣ Derived data
  const attractionsData = data ? getDataByParentId(data, category_slug) : null;

  const jsonLDschema = await generateSchema(
    pageData,
    '',
    "",
    category_slug
  );

  // 3️⃣ ✅ SINGLE SOURCE OF TRUTH for 404
  if (
    location_slug !== LOCATION_NAME ||
    !data ||
    !attractionsData ||
    attractionsData.length === 0
  ) {
    notFound(); // 👉 app/not-found.jsx
  }

  return (
    <main>
      <section>

        <section className="aero_category_section_wrapper">
          {/* <MotionImage
            pageData={safePageData}
            waiverLink={safeWaiverLink}
          /> */}
          <section className="aero-max-container">
            <div style={{ padding: "50px 0 40px 0" }}>
              <SectionHeading mainHeading="true"><span>{attractionsData[0]?.desc}</span></SectionHeading>
            </div>
            {
              pageData?.seosection && (<section className="aero_home_article_section">
                <section className="aero-max-container aero_home_seo_section">
                  <div
                    dangerouslySetInnerHTML={{ __html: pageData?.seosection || "" }}
                  />
                </section>
              </section>)
            }


            <section className="aero-blog-main-article-wrapper">
              {attractionsData[0]?.children?.map((item, i) => {
                return (
                  item?.isactive == 1 && (
                    <article
                      className="aero-blog-main-article-card"
                      key={item.pageid}
                    >
                      <div className="aero-blog-img-section">
                        {/* <Link href={`blogs/${slug}?uid=${item.id}`} prefetch> */}
                        <Link
                          href={`${category_slug}/${item?.path}`}
                          prefetch
                          key={i}
                        >
                          <img
                            src={
                              item?.smallimage || "/assets/images/logo.png"
                            }
                            alt="Article Image"
                          />
                        </Link>
                      </div>
                      <div className="aero-blog-content-section">
                        {/* <span className="aero-blog-updated-time">
                            {item.pageid}
                          </span> */}
                        <Link
                          href={`${category_slug}/${item?.path}`}
                          prefetch
                          key={i}
                        >
                          <h2 className="aero-blog-second-heading">
                            {item.desc}
                          </h2>
                          <p className="aero-blog-second-para">{item.metatitle}</p>
                        </Link>
                        <Link
                          href={`${category_slug}/${item?.path}`}
                          prefetch
                          className="aero-blog-readmore-btn"
                        >
                          READ MORE
                        </Link>
                      </div>
                    </article>
                    // </Link>
                  )
                );
              })}
            </section>
          </section>
        </section>


        {
          pageData?.section1 && (<section className="aero_home_article_section">
            <section className="aero-max-container aero_home_seo_section">
              <div
                dangerouslySetInnerHTML={{ __html: pageData?.section1 || "" }}
              />
            </section>
          </section>)
        }


        <div className="d-flex-center aero-btn-booknow" style={{ padding: "2em", backgroundColor: "var(--black-color)" }}>
          <BookingButton title="Book Now" />
        </div>

        <script
          type="application/ld+json"
          // suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: jsonLDschema || "" }}
        />
      </section>
    </main>
  );
};

export default Category;
