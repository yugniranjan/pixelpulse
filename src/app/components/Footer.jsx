// 'use client';

import Image from "next/image";
import "../styles/home.css";
import Link from "next/link";
import { fetchBlogs, getFallbackBlogs } from "@/lib/blogs";
import { getConfiguredValue } from "@/lib/ctaContent";
import BookingButton from "@/components/smallComponents/BookingButton";
import { getDataByParentId, isMenuItemActive } from "@/utils/customFunctions";
import { slugify } from "@/utils/slugify";
import facebookicon from "@public/assets/images/social_icon/facebook.png";
import tiktokicon from "@public/assets/images/social_icon/tiktok.png";
import instagramicon from "@public/assets/images/social_icon/instagram.png";
import youtubeicon from "@public/assets/images/social_icon/youtube.svg";
import Script from "next/script";

const TIKTOK_URL = "https://www.tiktok.com/@pixelpulseplay";
const GROUP_EVENT_FOOTER_LINKS = [
  { path: "private-party", label: "Private Party" },
  { path: "corporate-parties-events-groups", label: "Corporate Parties" },
  { path: "school-groups", label: "School / Groups" },
  { path: "fund-raising", label: "Fund Raising" },
];

function footerHrefForItem(item = {}, locationSlug = "") {
  const path = String(item?.path || "").trim().toLowerCase();
  const parentid = String(item?.parentid || "").trim().toLowerCase();

  if (!path) return "";
  if (!parentid || parentid === path) return `/${path}`;

  return `/${locationSlug}/${parentid}/${path}`;
}

const Footer = async ({ location_slug, configdata, menudata, reviewdata }) => {
  if (!configdata?.length || !menudata?.length) return null;

  const { chatid } = configdata[0] || {};
  const footerPhone = getConfiguredValue(
    configdata,
    ["footerPhone", "contactPhone", "locationPhone"],
    "+1 (905) 760-2922",
  );
  const footerPhoneHref = footerPhone?.replace(/[^\d+]/g, "");
  const footerEmail = getConfiguredValue(
    configdata,
    ["footerEmail", "contactEmail", "locationEmail"],
    "connect@pixelpulseplay.ca",
  );

  const attractionsData = getDataByParentId(menudata, "attractions");
  const programsData = getDataByParentId(menudata, "programs");
  const groupsData = getDataByParentId(menudata, "group-events");
  const companyData = getDataByParentId(menudata, "about-us");
  const blogsData = getDataByParentId(menudata, "blogs");
  const hiddenCompanySlugs = new Set(["safety-information", "safety-info"]);
  const companyStaticLinks = [
    { label: "About Us", href: "/about-us" },
    { label: "Attractions", href: "/attractions" },
    { label: "Birthday Parties", href: "/kids-birthday-parties" },
    { label: "Pricing Promos", href: "/pricing-promos" },
  ];
  const staticCompanyHrefs = new Set(companyStaticLinks.map((item) => item.href));
  const footerExcludedTopLevelPaths = new Set([
    "home",
    "contactus",
    "contact-us",
    "group-events",
    "blogs",
    "about-us",
  ]);
  const sheetCompanyLinks = (Array.isArray(menudata) ? menudata : [])
    .filter((item) => {
      const path = String(item?.path || "").trim().toLowerCase();
      const parentid = String(item?.parentid || "").trim().toLowerCase();
      const href = footerHrefForItem(item, location_slug);

      return (
        isMenuItemActive(item) &&
        path &&
        (!parentid || parentid === path) &&
        !footerExcludedTopLevelPaths.has(path) &&
        !staticCompanyHrefs.has(href)
      );
    })
    .map((item) => ({
      label: item?.desc || item?.title || item?.path,
      href: footerHrefForItem(item, location_slug),
    }));
  const companyLinks = [...companyStaticLinks, ...sheetCompanyLinks];
  const groupSheetChildren = groupsData?.[0]?.children || [];
  const groupLinks = GROUP_EVENT_FOOTER_LINKS.map((fallback) => {
    const sheetItem = groupSheetChildren.find(
      (item) => String(item?.path || "").trim().toLowerCase() === fallback.path,
    );
    return {
      label: sheetItem?.desc || fallback.label,
      href: "/group-events",
    };
  });
  const companyChildren = companyData?.[0]?.children || [];
  const blogChildren = blogsData?.[0]?.children || [];
  const blogFallbacks = getFallbackBlogs();
  const latestBlogData = await fetchBlogs();
  const latestNews =
    Array.isArray(latestBlogData) && latestBlogData.length > 0
      ? latestBlogData.slice(0, 2).map((item, index) => ({
        id: item.id || `latest-${index}`,
        title: item.title || "Latest Update",
        href: `/blogs/${slugify(item.title || "latest-update")}`,
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
      href: TIKTOK_URL,
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
            <li>Company</li>
            {companyLinks.map((item) => (
              <li key={item.href}>
                <Link href={item.href} prefetch>
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <a href="https://squad.pixelpulseplay.ca/" target="_blank" rel="noopener noreferrer">
                Join the squad
              </a>
            </li>
            <li>
              <BookingButton title="Book Now" className="aero_footer_link_button" />
            </li>
            {companyData?.[0]?.children?.length > 0 && (
              <>
                {companyData[0].children.map((item, i) => {
                  const itemPath = String(item?.path || "").toLowerCase();
                  const itemTitle = String(item?.desc || "").toLowerCase();
                  return (
                  item?.isactive == 1 &&
                  !["contactus", "contact-us"].includes(itemPath) &&
                  !hiddenCompanySlugs.has(itemPath) &&
                  !itemTitle.includes("safety information") && (
                    <li key={i}>
                      <Link href={`/${location_slug}/${item?.parentid}/${item?.path}`} prefetch>
                        {item?.desc}
                      </Link>
                    </li>
                  )
                  );
                })}
              </>
            )}
          </ul>
          {/* )
          } */}

          <ul>
            <li>Groups</li>
            {groupLinks.map((item) => (
              <li key={item.label}>
                <Link href={item.href} prefetch>
                  {item.label}
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
            {latestNews.length > 0 && (
              <ul style={{ padding: "0", border: "none" , paddingTop: "1em"}}>
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
          </ul>

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
    </footer>
  );
};

export default Footer;
