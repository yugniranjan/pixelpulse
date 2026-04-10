"use client";

import { setCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import React from "react";

const LocationButton = ({ location }) => {
  const router = useRouter();
  const handleClick = () => {
    setCookie("location", location);
    router.push(`/${location}`);
  };
  return (
    <button onClick={handleClick}>
      <span>SELECT THIS PARK</span>
    </button>
  );
};

export default LocationButton;
