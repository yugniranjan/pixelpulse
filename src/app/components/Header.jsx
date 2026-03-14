"use client";

import "../styles/home.css";
import Link from "next/link";
import { GrLocation } from "react-icons/gr";
import Image from "next/image";
import logo_desktop from "@public/assets/images/logoD.png";
import logo_mobile from "@public/assets/images/logo.png";
import MenuButton from "./smallComponents/MenuButton";
import TopHeader from "./smallComponents/TopHeader";
import { MdOutlinePermContactCalendar } from "react-icons/md";
import logo from "@public/assets/images/logo.png";
import LogoutButton from "./LogoutButton";
import BookingModal from "./model/BookingModal";
import { useState } from "react";
import BookingButton from "./smallComponents/BookingButton";
import { usePathname } from "next/navigation";

const Header = ({ location_slug, menudata, configdata, token }) => {

  const pathname = usePathname();

  const navList = (Array.isArray(menudata) ? menudata : [])
    .filter((item) => item.isactive === 1)
    .map((item) => ({ navName: item.desc, navUrl: item.path.toLowerCase() }))
  // .sort((a, b) => a.navName.localeCompare(b.navName));

  // console.log(configdata.length);
  const estoreConfig = Array.isArray(configdata)
    ? configdata.find((item) => item.key === "estorebase")
    : null;

  // const topHeaderConfig = Array.isArray(configdata)
  //   ? configdata.find((item) => item.key === "top-header")
  //   : null;
  return (
    <header>
      <div>
        <section className="d-flex aero-col-3">
          <div className="aero-menu-location app-container">
            <div
              className="d-flex-center aero_menu_location_icon"
              style={{ justifyContent: "flex-start" }}
            >
              <MenuButton navList={navList} location_slug={location_slug} />
              {/* <Link href="/" className="d-flex-center" prefetch>
              <GrLocation fontSize={30} color="#fff" />
            </Link> */}
            </div>
          </div>

          <div className="desktop-container aero-header-logo">
            <div className="aero_main_logo_wrap">
              <Link
                href={`/${location_slug}`}
                className="aero_main_logo"
                prefetch
              >
                {/* <Image
                  src="https://storage.googleapis.com/pixel-pulse-play/web/h-Logo.png"
                  height="71"
                  width="71"
                  alt="logo"
                  title="logo"
                  unoptimized
                /> */}
                <picture>
                  <source media="(max-width:768px)" srcSet={logo_mobile.src} />
                  <Image
                    src={logo_desktop.src}
                    width={71}
                    height={71}
                    alt="logo"
                    unoptimized
                  />
                </picture>
              </Link>
            </div>
            <div className="aero-menu-location">
              {/* <Link href="/" className="aero-d-changelocation" prefetch>
              <GrLocation />
              {location_slug}
            </Link> */}
              {/* <Link
              href={`/${location_slug}/about-us/faq`}
              className="desktop-container"
              prefetch
            >
              <div className="aero-faq">FAQ&apos;s</div>
            </Link> */}
            </div>
          </div>

          <div
            className="aero-btn-booknow app-container"
            style={{ textAlign: "right" }}
          >
            <BookingButton title="Book" />
          </div>

          <div className="aero-btn-booknow-1 aero-btn-booknow desktop-container">
            {token && <LogoutButton />}
            <Link
              href={`/${location_slug}/contactus`}
              prefetch
              className="aero-header-contactus-btn aero-d-changelocation"
              style={{ color: "white" }}
            >
              <MdOutlinePermContactCalendar />
              <span>Inquire Now</span>
            </Link>

            {/* {estoreConfig?.value && (
            <Link href={estoreConfig.value} target="_blank" prefetch>
              <button>book now</button>
            </Link>
          )} */}

            <BookingButton />
          </div>
        </section>

        <section className="aero_changelocation_height">
          <nav className="d-flex-center aero-list-7 aero_changelocation_height">
            <div className="desktop-container navbar">
              {Array.isArray(navList) &&
                navList.map((item) => (
                  <Link
                    href={`/${location_slug}/${item?.navUrl}`}
                    prefetch
                    key={item.navName}
                    className={`nav-link ${pathname === `/${item?.navUrl}` ? "active" : ""}`}
                  >
                    {item.navName}
                  </Link>
                ))}
            </div>
            <div
              style={{ position: "relative" }}
              className="aero-header-changelocation-wrap"
            >
              <Link
                href="/"
                prefetch
                className="aero-app-changelocation app-container"
              >
                {location_slug}
              </Link>
              <Link
                href={`/${location_slug}/contactus`}
                prefetch
                className="aero-header-contactus-btn aero-app-changelocation app-container"
                style={{ marginRight: "0" }}
              >
                <MdOutlinePermContactCalendar />
                <span>Inquiry</span>
              </Link>
              <div className="app-container">
                {token && <LogoutButton />}
              </div>
            </div>
          </nav>
        </section>
      </div>
    </header>
  );
};

export default Header;
