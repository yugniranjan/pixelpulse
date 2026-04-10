"use client";

import Link from "next/link";
import React, { useState } from "react";
import { IoClose, IoMenu } from "react-icons/io5";
import { usePathname } from "next/navigation";

function normalizePath(path = "/") {
  if (!path) return "/";
  return path !== "/" && path.endsWith("/") ? path.slice(0, -1) : path;
}

const MenuButton = ({ navList, location_slug }) => {
  const [mobile_nav, setMobile_nav] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <button
        type="button"
        className="aero-mobile-menu-btn"
        aria-expanded={mobile_nav}
        aria-label={mobile_nav ? "Close menu" : "Open menu"}
        onClick={() => setMobile_nav(!mobile_nav)}
      >
        {mobile_nav ? <IoClose fontSize={30} color="#fff" /> : <IoMenu fontSize={30} color="#fff" />}
      </button>
      {mobile_nav && (
        <nav className="d-flex-center aero-list-7-1 navbar">
          {navList &&
            navList.map((item) => {
              const href =
                item?.href ||
                (item?.navUrl ? `/${item.navUrl}` : "/");
              const normalizedPathname = normalizePath(pathname);
              const normalizedHref = normalizePath(href);
              const isActive =
                normalizedHref === "/"
                  ? normalizedPathname === normalizedHref
                  : normalizedPathname === normalizedHref ||
                    normalizedPathname.startsWith(`${normalizedHref}/`);

              return (
                <Link
                  href={href}
                  key={item.navName}
                  className={`aero-app-changelocation nav-link ${isActive ? "active" : ""}`}
                  onClick={() => setMobile_nav(!mobile_nav)}
                >
                  {item.navName}
                </Link>
              );
            })}
        </nav>
      )}
    </>
  );
};

export default MenuButton;
