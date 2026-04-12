"use client";

import "../styles/home.css";
import Link from "next/link";
import Image from "next/image";
import logo_desktop from "@public/assets/images/logoD.png";
import logo_mobile from "@public/assets/images/logo.png";
import MenuButton from "./smallComponents/MenuButton";
import LogoutButton from "./LogoutButton";
import BookingButton from "./smallComponents/BookingButton";
import { usePathname } from "next/navigation";

function normalizePath(path = "/") {
  if (!path) return "/";
  return path !== "/" && path.endsWith("/") ? path.slice(0, -1) : path;
}

const Header = ({ location_slug, menudata, configdata, token }) => {
  const pathname = usePathname();

  const navItems = [
    { navName: "Home", navUrl: "", href: "/" },
    ...(Array.isArray(menudata) ? menudata : [])
    .filter(
      (item) =>
        item.isactive === 1 &&
        !["contactus", "contact-us"].includes(item.path?.toLowerCase()),
    )
    .map((item) => ({
      navName: item.desc,
      navUrl: item.path.toLowerCase(),
      href: `/${item.path.toLowerCase()}`,
    })),
  ];

  return (
    <>
      <header className="aero-header-shell">
        <div>
        <section className="d-flex aero-col-3 aero-header-top">
          <div className="aero-menu-location app-container">
            <div
              className="d-flex-center aero_menu_location_icon"
              style={{ justifyContent: "flex-start" }}
            >
              <MenuButton navList={navItems} location_slug={location_slug} />
            </div>
          </div>

          <div className="desktop-container aero-header-logo">
            <div className="aero_main_logo_wrap">
              <Link
                href="/"
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
                    width={140}
                    height={140}
                    alt="logo"
                    unoptimized
                  />
                </picture>
              </Link>
            </div>
          </div>

          <div
            className="aero-btn-booknow aero-header-booking app-container"
            style={{ textAlign: "right" }}
          >
            <BookingButton title="Book Now" />
          </div>

          <div className="aero-btn-booknow-1 aero-btn-booknow desktop-container">
            {token && <LogoutButton />}
            <Link
              href={`/${location_slug}/contactus`}
              prefetch
              className="aero-header-contactus-btn aero-header-cta aero-header-cta--solid aero-d-changelocation"
            >
              <span>Inquire</span>
            </Link>

            <div className="aero-header-booking">
              <BookingButton title="Book Now" />
            </div>
          </div>
        </section>

        <section className="aero_changelocation_height">
          <nav className="d-flex-center aero-list-7 aero_changelocation_height aero-header-nav">
            <div className="desktop-container navbar">
              {Array.isArray(navItems) &&
                navItems.map((item) => {
                  const normalizedPathname = normalizePath(pathname);
                  const normalizedHref = normalizePath(item.href);
                  const isActive =
                    normalizedHref === "/"
                      ? normalizedPathname === normalizedHref
                      : normalizedPathname === normalizedHref ||
                        normalizedPathname.startsWith(`${normalizedHref}/`);

                  return (
                  <Link
                    href={item.href}
                    prefetch
                    key={item.navName}
                    className={`nav-link ${isActive ? "active" : ""}`}
                  >
                    {item.navName}
                  </Link>
                )})}
            </div>
            <div
              style={{ position: "relative" }}
              className="aero-header-changelocation-wrap"
            >
              <div className="aero-header-mobile-actions app-container">
                <Link
                  href={`/${location_slug}/contactus`}
                  prefetch
                  className="aero-header-contactus-btn aero-header-cta aero-header-cta--solid"
                >
                  <span>Inquire</span>
                </Link>
                <div className="aero-header-booking">
                  <BookingButton title="Book Now" />
                </div>
              </div>
              <div className="app-container">
                {token && <LogoutButton />}
              </div>
            </div>
          </nav>
        </section>
        </div>
      </header>
      <div className="aero-header-spacer" aria-hidden="true" />
    </>
  );
};

export default Header;
