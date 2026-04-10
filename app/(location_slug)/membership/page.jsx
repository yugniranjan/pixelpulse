import React from "react";
import "../../styles/subcategory.css";
import MotionImage from "@/components/MotionImage";
import { getDataByParentId } from "@/utils/customFunctions";
import { fetchsheetdata, generateMetadataLib,getWaiverLink } from "@/lib/sheets";

export async function generateMetadata({ params }) {
  const metadata = await generateMetadataLib({
    location: params.location_slug || 'st-catharines',
    category: '',
    page: 'membership'
  });
  return metadata;
}



const page = async ({ params }) => {
  // const { location_slug = 'st-catharines' } = params;
  const location_slug = 'st-catharines';

  const [data] = await Promise.all([
    fetchsheetdata('Data',location_slug),
  ]);
 
  const waiverLink = await getWaiverLink(location_slug);
  
  
  const memberData = getDataByParentId(data, "membership");

  return (
    <main>
      <section>
        <MotionImage pageData={memberData}  waiverLink={waiverLink} />
      </section>
      <section className="subcategory_main_section-bg">
        <section className="aero-max-container">
          <div
            className="subcategory_main_section"
            dangerouslySetInnerHTML={{ __html: memberData[0]?.section1 || "" }}
          ></div>
        </section>
      </section>
    </main>
  );
};

export default page;
