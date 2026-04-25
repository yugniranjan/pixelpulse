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
import { getCtaContent } from "@/lib/ctaContent";


function normalizePath(path = "/") {
  if (!path) return "/";
  return path !== "/" && path.endsWith("/") ? path.slice(0, -1) : path;
}

const Header = ({ location_slug, menudata, configdata, token }) => {
  const pathname = usePathname();
  const normalizedPathname = normalizePath(pathname || "/");
  const ctaContent = getCtaContent(configdata);
  const contactHref = ctaContent.contactHref || `/${location_slug}/contactus`;

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
  const visibleNavItems =
    normalizedPathname === "/"
      ? navItems.filter((item) => normalizePath(item.href) !== "/")
      : navItems;

  return (
    <>
      <header className="aero-header-shell">
        <div className="aero-header-inner">
          <section className="aero-header-bar" aria-label="Primary navigation">
            <div className="aero-header-menu-slot">
              <MenuButton navList={visibleNavItems} location_slug={location_slug} />
            </div>

            <Link
              href="/"
              className="aero_main_logo aero-header-brand"
              prefetch
            >
              <picture>
                <source media="(max-width:768px)" srcSet={logo_mobile.src} />
                <Image
                  src={logo_desktop.src}
                  width={98}
                  height={98}
                  alt="Pixel Pulse Play"
                  unoptimized
                />
              </picture>
            </Link>

            <nav className="aero-header-nav" aria-label="Main menu">
              {Array.isArray(visibleNavItems) &&
                visibleNavItems.map((item) => {
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
                  );
                })}
            </nav>

            <div className="aero-header-actions">
              {token && <LogoutButton />}
              {ctaContent.inquireText && (
                <Link
                  href={contactHref}
                  prefetch
                  className="aero-header-contactus-btn aero-header-cta aero-header-inquire-btn"
                >
                  <span>{ctaContent.inquireText}</span>
                </Link>
              )}

              {ctaContent.bookNowText && (
                <div className="aero-header-booking">
                  <BookingButton title={ctaContent.bookNowText} />
                </div>
              )}
            </div>
          </section>

          <section className="aero-header-mobile-actions" aria-label="Quick actions">
            {ctaContent.inquireText && (
              <Link
                href={contactHref}
                prefetch
                className="aero-header-contactus-btn aero-header-cta aero-header-inquire-btn"
                style={{zIndex:"-1"}}
              >
                <span>{ctaContent.inquireText}</span>
              </Link>
            )}

            {ctaContent.bookNowText && (
              <div className="aero-header-booking">
                <BookingButton title={ctaContent.bookNowText} />
              </div>
            )}
            {token && <LogoutButton />}
          </section>
        </div>
        
      </header>
      <div className="aero-header-spacer" aria-hidden="true" />
            
    </>
    
  );
};

export default Header;
