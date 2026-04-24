// 'use client';

import Image from "next/image";
import "../styles/home.css";
import Link from "next/link";
import { fetchBlogs, getFallbackBlogs } from "@/lib/blogs";
import { getConfigValue } from "@/lib/ctaContent";
import { getDataByParentId } from "@/utils/customFunctions";
import { slugify } from "@/utils/slugify";
import facebookicon from "@public/assets/images/social_icon/facebook.png";
import tiktokicon from "@public/assets/images/social_icon/tiktok.png";
import instagramicon from "@public/assets/images/social_icon/instagram.png";
import youtubeicon from "@public/assets/images/social_icon/youtube.svg";
import Script from "next/script";


const Footer = async ({ location_slug, configdata, menudata, reviewdata }) => {
  if (!configdata?.length || !menudata?.length) return null;

  const { chatid } = configdata[0] || {};
  const footerPhone =
    getConfigValue(configdata, ["footerPhone", "contactPhone", "locationPhone"]) ||
    "+1 (905) 760-2922";
  const footerPhoneHref = footerPhone.replace(/[^\d+]/g, "");
  const footerEmail =
    getConfigValue(configdata, ["footerEmail", "contactEmail", "locationEmail"]) ||
    "connect@pixelpulseplay.ca";

  const attractionsData = getDataByParentId(menudata, "attractions");
  const programsData = getDataByParentId(menudata, "programs");
  const groupsData = getDataByParentId(menudata, "group-events");
  const companyData = getDataByParentId(menudata, "about-us");
  const blogsData = getDataByParentId(menudata, "blogs");
  const companyChildren = companyData?.[0]?.children || [];
  const blogChildren = blogsData?.[0]?.children || [];
  const blogFallbacks = getFallbackBlogs();
  const latestBlogData = await fetchBlogs();
  const latestNews =
    Array.isArray(latestBlogData) && latestBlogData.length > 0
      ? latestBlogData.slice(0, 2).map((item, index) => ({
          id: item.id || `latest-${index}`,
          title: item.title || "Latest Update",
          href: `/blogs/${slugify(item.title || "latest-update")}?uid=${item.id}`,
          image: item.featuredImage || blogFallbacks[0].featuredImage,
        }))
      : blogChildren
          .filter((item) => item?.isactive == 1)
          .slice(0, 2)
          .map((item, index) => ({
            id: `menu-${item?.path || index}`,
            title: item?.desc || blogFallbacks[index]?.title || "Latest Update",
            href: item?.parentid && item?.path
              ? `/${location_slug}/${item.parentid}/${item.path}`
              : "/blogs",
            image: blogFallbacks[index]?.featuredImage || blogFallbacks[0].featuredImage,
          }));
  const socialLinks = [
    {
      href: "/facebook",
      icon: facebookicon,
      label: "Facebook",
    },
    {
      href: "/instagram",
      icon: instagramicon,
      label: "Instagram",
    },
    {
      href: "/tiktok",
      icon: tiktokicon,
      label: "TikTok",
    },
    {
      href: "/youtube",
      icon: youtubeicon,
      label: "YouTube",
    },
  ];

  return (
    <footer className="aero_footer_section-bg">
      <section className="aero-max-container aero_footer_inner">
        <section className="aero_footer_col-4-wrapper">
          <ul>
            <li>Attractions</li>
            {attractionsData?.[0]?.children?.map((item, i) => (
              <li key={i}>
                <Link href={`/${location_slug}/${item?.parentid}/${item?.path}`} prefetch>
                  {item?.desc}
                </Link>
              </li>
            ))}
          </ul>
          {/* {
            programsData?.length > 0 && (<ul>
              <li>Programs</li>
              {programsData?.[0]?.children?.map((item, i) => (
                <li key={i}>
                  <Link href={`/${location_slug}/${item?.parentid}/${item?.path}`} prefetch>
                    {item?.desc}
                  </Link>
                </li>
              ))} */}
              <ul>
              {companyData?.[0]?.children?.length > 0 && (
                <>
                  <li>Company</li>
                  {companyData[0].children.map((item, i) => (
                    item?.isactive == 1 &&
                    !["contactus", "contact-us"].includes(item?.path?.toLowerCase()) && (
                      <li key={i}>
                        <Link href={`/${location_slug}/${item?.parentid}/${item?.path}`} prefetch>
                          {item?.desc}
                        </Link>
                      </li>
                    )
                  ))}
                </>
              )}
            </ul>
            {/* )
          } */}

          <ul>
            <li>Groups</li>
            {groupsData?.[0]?.children?.map((item, i) => (
              <li key={i}>
                <Link href={`/${location_slug}/${item?.parentid}/${item?.path}`} prefetch>
                  {item?.desc}
                </Link>
              </li>
            ))}
          </ul>
          <ul>
            <li>Blogs</li>
            <li>
              <Link href="/blogs" prefetch>
                All Blogs
              </Link>
            </li>
            {blogChildren.map((item, i) => (
              item?.isactive == 1 && (
                <li key={i}>
                  <Link href={`/${location_slug}/${item?.parentid}/${item?.path}`} prefetch>
                    {item?.desc}
                  </Link>
                </li>
              )
            ))}
          </ul>
          {latestNews.length > 0 && (
            <ul>
              <li>Latest News</li>
              {latestNews.map((item) => (
                <li key={item.id}>
                  <Link href={item.href} className="aero_footer_article-card" prefetch>
                    <Image
                      src={item.image}
                      alt=""
                      width={40}
                      height={40}
                      unoptimized
                    />
                    <div>
                      <h6>Latest News</h6>
                      <p>{item.title}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <ul>
            <li>Follow Us</li>
            <li>
              <nav className="aero_footer_social_bar" aria-label="Social media links">
                {socialLinks.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    prefetch={false}
                    className="aero_social_icon"
                    aria-label={item.label}
                  >
                    <Image src={item.icon} alt="" height={50} width={50} unoptimized />
                  </Link>
                ))}
              </nav>
              {footerPhone && (
                <a href={`tel:${footerPhoneHref}`} className="aero_footer_phone_link">
                  <span>Call Now</span>
                  <strong>{footerPhone}</strong>
                </a>
              )}
              {footerEmail && (
                <a href={`mailto:${footerEmail}`} className="aero_footer_phone_link aero_footer_email_link">
                  <span>Email Us</span>
                  <strong>{footerEmail}</strong>
                </a>
              )}
            </li>
          </ul>
        </section>
      </section>

      {/* Chat Script */}
      {/* {chatid && (
        <Script
          src="https://widgets.leadconnectorhq.com/loader.js"
          data-resources-url="https://widgets.leadconnectorhq.com/chat-widget/loader.js"
          data-widget-id={chatid}
          strategy="afterInteractive"
        />
      )} */}
      <noscript>
        <iframe
          src="https://www.googletagmanager.com/ns.html?id=GTM-5GQ99ZBR"
          height="0"
          width="0"
          title="Google Tag Manager"
          style={{ display: "none", visibility: "hidden" }}
        />
      </noscript>
    </footer>
  );
};

export default Footer;
