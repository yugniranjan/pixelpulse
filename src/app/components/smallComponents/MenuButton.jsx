"use client";

import Link from "next/link";
import React, { useState } from "react";
import { IoMenu } from "react-icons/io5";

const MenuButton = ({ navList, location_slug }) => {
  const [mobile_nav, setMobile_nav] = useState(false);

  return (
    <>
      <IoMenu
        fontSize={40}
        color="#fff"
        onClick={() => setMobile_nav(!mobile_nav)}
      />
      {mobile_nav && (
        <nav className="d-flex-center aero-list-7-1 navbar">
          {navList &&
            navList.map((item) => {
              return (
                <Link
                  href={`/${location_slug}/${item?.navUrl}`}
                  key={item.navName}
                  className="aero-app-changelocation nav-link"
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
