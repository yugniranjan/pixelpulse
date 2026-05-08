import React from "react";
import "../../styles/kidsparty.css";
import "../../styles/subcategory.css";
import Image from "next/image";
import Link from "next/link";
import { fetchPageData, fetchsheetdata, generateMetadataLib } from "@/lib/sheets";
import { LOCATION_NAME } from "@/lib/constant";
import SectionHeading from "@/components/home/SectionHeading";
import BookingButton from "@/components/smallComponents/BookingButton";
import { getCtaContent } from "@/lib/ctaContent";
import { safeImageUrl } from "@/lib/seo";

function stripHtml(html = "") {
  return html
    ?.replace(/<br\s*\/?>/gi, " ")
    ?.replace(/<[^>]*>/g, " ")
    ?.replace(/\s+/g, " ")
    ?.trim();
}

function getPreferredImage(pageData) {
  return safeImageUrl(pageData?.smallimage || pageData?.headerimage);
}

export async function generateMetadata({ params }) {
  await params;
  const metadata = await generateMetadataLib({
    location: LOCATION_NAME || "vaughan",
    category: '',
    page: 'bogo'
  });
  return metadata;
}

const page = async ({ params }) => {
  await params;
  const location_slug = LOCATION_NAME || "vaughan";
  const [pageData, configData] = await Promise.all([
    fetchPageData(location_slug, "bogo"),
    fetchsheetdata("config", location_slug),
  ]);
  const configCta = getCtaContent(configData);
  const pageCta = getCtaContent(pageData || {});
  const ctaContent = {
    ...configCta,
    ...Object.fromEntries(
      Object.entries(pageCta).filter(([, value]) => Boolean(value)),
    ),
  };
  const contactHref = ctaContent.contactHref || "/contactus";
  const heroImage = getPreferredImage(pageData);
  const introText =
    pageData?.metadescription ||
    stripHtml(pageData?.section1 || "") ||
    "Grab the latest Pixel Pulse Play offer before your next visit.";
  
  return (
    <main className="ppp-detail-page">
      <section className="ppp-detail-hero">
        <div className="aero-max-container ppp-detail-hero__inner">
          <div className="ppp-detail-hero__copy">
            <SectionHeading className="section-heading-white" mainHeading="true">
              <span>{pageData?.title || pageData?.desc || "BOGO"}</span>
            </SectionHeading>
            {pageData?.metatitle && <h2>{pageData.metatitle}</h2>}
            <p>{introText}</p>
            {(ctaContent.bookNowText || ctaContent.inquireText) && (
              <div className="ppp-detail-hero__actions">
                {ctaContent.bookNowText && <BookingButton title={ctaContent.bookNowText} />}
                {ctaContent.inquireText && (
                  <Link href={contactHref} className="ppp-detail-btn ppp-detail-btn--outline" prefetch>
                    {ctaContent.inquireText}
                  </Link>
                )}
              </div>
            )}
          </div>

          <div className="ppp-detail-hero__media">
            <Image
              src={heroImage}
              alt={pageData?.imagetitle || "Pixel Pulse Play promotion"}
              width={1200}
              height={800}
              style={{ width: "100%", height: "auto" }}
            />
          </div>
        </div>
      </section>

      <section className="ppp-detail-body">
        <section className="aero-max-container ppp-detail-body__inner">
          <article
            className="ppp-detail-richtext"
            dangerouslySetInnerHTML={{ __html: pageData?.section1 || pageData?.seosection || "" }}
          />
        </section>
      </section>
    </main>
  );
};

export default page;
