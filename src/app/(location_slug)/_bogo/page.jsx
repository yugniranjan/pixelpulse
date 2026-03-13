export const dynamic = "force-dynamic";
import React from "react";
import "../../styles/kidsparty.css";
import "../../styles/subcategory.css";
import MotionImage from "@/components/MotionImage";
import { getDataByParentId } from "@/utils/customFunctions";
import { fetchsheetdata,fetchPageData, generateMetadataLib,getWaiverLink } from "@/lib/sheets";

export async function generateMetadata({ params }) {
  const metadata = await generateMetadataLib({
    location: params.location_slug || 'vaughan',
    category: '',
    page: 'bogo'
  });
  return metadata;
}

const page = async ({ params }) => {
  // const { location_slug = 'vaughan' } = params;
  const location_slug = 'vaughan';
  
  const waiverLink = await getWaiverLink(location_slug);
  const [data, dataconfig] = await Promise.all([
    fetchPageData(location_slug,'bogo'),
    fetchsheetdata('config',location_slug),
   
  ]);

  
  const pageData = getDataByParentId(data, "bogo") || [];
  
  return (
    <main>
      <section>
        <MotionImage pageData={pageData} waiverLink={waiverLink} />
      </section>
      <section className="subcategory_main_section-bg">
        <section className="aero-max-container">
          <div
            className="bogo_main_section"
            dangerouslySetInnerHTML={{ __html: pageData[0]?.section1 || "" }}
          ></div>
        </section>
      </section>
    </main>
  );
};

export default page;
