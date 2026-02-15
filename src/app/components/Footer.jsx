'use client';

import { useEffect, useState } from "react";
import Image from "next/image";
import "../styles/home.css";
import event_icon from "@public/assets/images/home/event_icon.svg";
import park_feature_icon from "@public/assets/images/home/park_feature_icon.svg";
import jump_icon from "@public/assets/images/home/jump_icon.svg";
import Link from "next/link";
import { getDataByParentId } from "@/utils/customFunctions";
import RatingComponent from "./smallComponents/RatingComponent";
import facebookicon from "@public/assets/images/social_icon/facebook.png";
import twittericon from "@public/assets/images/social_icon/twitter.png";
import tiktokicon from "@public/assets/images/social_icon/tiktok.png";
import instagramicon from "@public/assets/images/social_icon/instagram.png";
import logo from '@public/assets/images/logo.png'
import Script from "next/script";


const Footer = ({ location_slug, configdata, menudata, reviewdata }) => {
  


  if (!configdata?.length || !menudata?.length) return null;

  const {
    facebook,
    insta,
    twitter,
    tiktok,
    chatid,
  } = configdata[0] || {};

  const attractionsData = getDataByParentId(menudata, "attractions");
  const programsData = getDataByParentId(menudata, "programs");
  const groupsData = getDataByParentId(menudata, "groups-events");
  const companyData = getDataByParentId(menudata, "aboutus");
  const blogsData = getDataByParentId(menudata, "blogs");
  const birthDaypartyData = getDataByParentId(menudata, "kids-birthday-parties");
  return (
    <footer className="aero_footer_section-bg">
      {/* Hero Section */}
      {attractionsData?.[0]?.children?.length > 0 && (
        <section className="aero_home-headerimg-wrapper">
          <Image
            src="https://storage.googleapis.com/aerosports/windsor-new/kids-activity-glow-in-the-dark.webp"
            alt="Glow Night Event"
            width={1200}
            height={600}
            title="Glow Night Event"
            unoptimized
          />
          <article className="aero-max-container aero_home_BPJ_wrapper">
            {[
              { icon: event_icon, text: "Birthday Parties", url:`/${location_slug}/${birthDaypartyData?.[0]?.path}`  },
              { icon: park_feature_icon, text: "Park Features", url:`/${location_slug}/${attractionsData?.[0]?.path}` },
              { icon: jump_icon, text: "Group Events" , url:`/${location_slug}/${groupsData?.[0]?.path}`},
            ].map((item, index) => (
              <div className="d-flex-center" key={index}>
              <a href={item.url} >  <Image src={item.icon} width={90} height={80} alt={item.text} unoptimized /></a>
                <span>{item.text}</span>
              </div>
            ))}
          </article>
        </section>
      )}

      <section className="aero-max-container">
        {/* Rating */}
        {reviewdata && <RatingComponent ratingdata={reviewdata} />}

        {/* Logo + Socials */}
        <div className="d-flex-center aero_logo_social_wrap">
          <Link href={`/${location_slug}`} prefetch>
            <Image
              src={logo}
              alt="pixelpulseplay Logo"
              width={100}
              height={93.42}
              unoptimized
            />
          </Link>
          <div className="aero_social_icon_wrap">
            {facebook && (
              <Link href={`https://www.facebook.com/${facebook}`} target="_blank" prefetch className="aero_social_icon">
                <Image src={facebookicon} alt="Facebook" height={50} width={50} unoptimized />
              </Link>
            )}
            {twitter && (
              <Link href={`https://x.com/${twitter}`} target="_blank" prefetch className="aero_social_icon">
                <Image src={twittericon} alt="Twitter" height={50} width={50} unoptimized />
              </Link>
            )}
            {insta && (
              <Link href={`https://www.instagram.com/${insta}`} target="_blank" prefetch className="aero_social_icon">
                <Image src={instagramicon} alt="Instagram" height={50} width={50} unoptimized />
              </Link>
            )}
            {tiktok && (
              <Link href={`https://www.tiktok.com/${tiktok}`} target="_blank" prefetch className="aero_social_icon">
                <Image src={tiktokicon} alt="TikTok" height={50} width={50} unoptimized />
              </Link>
            )}
          </div>
        </div>

        {/* Footer Menus */}
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
          <ul>
            <li>Programs</li>
            {programsData?.[0]?.children?.map((item, i) => (
              <li key={i}>
                <Link href={`/${location_slug}/${item?.parentid}/${item?.path}`} prefetch>
                  {item?.desc}
                </Link>
              </li>
            ))}
            {companyData?.[0]?.children?.length > 0 && (
              <>
                <li>Company</li>
                {companyData[0].children.map((item, i) => (
                  item?.isactive == 1 && (
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
            <li>Latest News</li>
            {blogsData?.[0]?.children?.slice(0, 4).map((item, i) => (
              <li key={i}>
                <Link href={`/${location_slug}/${item?.parentid}/${item?.path}`} prefetch>
                  <article className="d-flex-center aero_footer_article-card">
                    <Image
                      src={item?.smallimage}
                      alt={item?.title}
                      title={item?.title}
                      width={50}
                      height={50}
                      unoptimized
                    />
                    <div>
                      <h6>{item?.pageid}</h6>
                      <p>{item?.title}</p>
                    </div>
                  </article>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </section>

      {/* Chat Script */}
      {chatid && (
        <Script
          src="https://widgets.leadconnectorhq.com/loader.js"
          data-resources-url="https://widgets.leadconnectorhq.com/chat-widget/loader.js"
          data-widget-id={chatid}
          strategy="afterInteractive"
        />
      )}
    </footer>
  );
};

export default Footer;
