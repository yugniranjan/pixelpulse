import React from "react";
import "../../styles/subcategory.css";
import MotionImage from "@/components/MotionImage";
import { getDataByParentId } from "@/utils/customFunctions";

import { fetchsheetdata, getWaiverLink, fetchPageData,generateMetadataLib } from "@/lib/sheets";

export async function generateMetadata({ params }) {
  const metadata = await generateMetadataLib({
    location: params.location_slug || 'st-catharines',
    category: '',
    page: 'pricing-promos'
  });
  return metadata;
}



const page = async ({ params }) => {
  // const { location_slug = 'st-catharines' } = params;
  const location_slug = 'st-catharines'
  
  const [memberData, dataconfig] = await Promise.all([
    await fetchPageData(location_slug, 'pricing-promos'),
    await fetchsheetdata('config',location_slug),
 
  ]);
  const waiverLink = await getWaiverLink(location_slug);
  
  
    const pricingheader = dataconfig?.filter(
    (item) => item.key === "pricingheader"
  );
  const filterheadervalue = pricingheader
    .map((item) => item?.value)
    ?.map((value) => value?.split(";"))
    ?.map((splitvalue) => {
      let obj = {};
      splitvalue.forEach((value, index) => {
        obj[`value${index + 1}`] = value;
      });
      return obj;
    });

  const pricing = dataconfig?.filter((item) => item.key === "pricing");
  const filtervalue = pricing
    .map((item) => item?.value)
    ?.map((value) => value?.split(";"))
    ?.map((splitvalue) => {
      let obj = {};
      splitvalue.forEach((value, index) => {
        obj[`value${index + 1}`] = value;
      });
      return obj;
    });

  const mergedArray = filtervalue.map((fv) => {
    const header = filterheadervalue[0];
    return {
      value1: fv.value1,
      [header.value2]: fv.value2,
      [header.value3]: fv.value3,
      [header.value4]: fv.value4,
    };
  });

  return (
    <main>
      <section>
        <MotionImage pageData={memberData} waiverLink={waiverLink} />
      </section>
      <section className="subcategory_main_section-bg">
        <section className="aero-max-container">
          <section className="subcategory_main_section">
            <div
              className="pricing_promo_main_section"
              dangerouslySetInnerHTML={{
                __html: memberData?.section1 || "",
              }}
            ></div>

            <section className="aero_pricingpromo_card_wrapper">
              {mergedArray?.map((item, index) => (
                <div className="aero_pricingpromo_card" key={index}>
                  <h3 className="aero_pricingpromo_card-heading">Age</h3>
                  <p className="aero_pricingpromo_card-para">{item?.value1}</p>

                  <div className="aero_pricingpromo_card-1 d-flex">
                    <div className="aero_pricingpromo_card-2 aero_pricingpromo_card-21">
                      {Object.keys(filterheadervalue[0])
                        .slice(1)
                        .map((key, keyIndex) => (
                          <h4 key={keyIndex}>{filterheadervalue[0][key]}</h4>
                        ))}
                    </div>

                    <div className="aero_pricingpromo_card-2 aero_pricingpromo_card-22">
                      {Object.keys(filterheadervalue[0])
                        .slice(1)
                        .map((key, keyIndex) => (
                          <p key={keyIndex}>
                            {item[filterheadervalue[0][key]] || "N/A"}
                          </p>
                        ))}
                    </div>
                  </div>
                  {/* <Link
                  href={`/${location_slug}/attractions`}
                  className="aero-btn-booknow"
                >
                  <div>
                    <button>ATTRACTIONS</button>
                  </div>
                </Link> */}
                </div>
              ))}
            </section>

            <div
              className="pricing_promo_main_section"
              dangerouslySetInnerHTML={{
                __html: memberData?.section2 || "",
              }}
            ></div>
          </section>
        </section>
      </section>
    </main>
  );
};

export default page;
