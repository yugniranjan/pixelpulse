"use client";

import Link from "next/link";
import React from "react";
import { IoClose, IoMenu } from "react-icons/io5";
import { usePathname } from "next/navigation";

function normalizePath(path = "/") {
  if (!path) return "/";
  return path !== "/" && path.endsWith("/") ? path.slice(0, -1) : path;
}

const MenuButton = ({ navList, location_slug, isOpen, onToggle, onClose }) => {
  const pathname = usePathname();
  const menuId = `mobile-nav-${location_slug || "site"}`;

  return (
    <>
      <button
        type="button"
        className="aero-mobile-menu-btn"
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-label={isOpen ? "Close menu" : "Open menu"}
        onClick={onToggle}
      >
        {isOpen ? <IoClose fontSize={30} color="#fff" aria-hidden="true" /> : <IoMenu fontSize={30} color="#fff" aria-hidden="true" />}
      </button>
      {isOpen && (
        <nav
          id={menuId}
          className="d-flex-center aero-list-7-1 navbar"
          aria-label="Mobile menu"
        >
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
                  onClick={onClose}
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
