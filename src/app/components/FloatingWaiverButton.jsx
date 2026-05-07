"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const WAIVER_URL = "https://www.pixelpulseplay.ca/waiver";

const FloatingWaiverButton = () => {
  const pathname = usePathname();

  if (pathname === "/waiver") {
    return null;
  }

  return (
    <Link
      href={WAIVER_URL}
      className="ppp-floating-waiver"
      prefetch
      target="_blank"
      rel="noopener noreferrer"
    >
      <span className="ppp-floating-waiver__eyebrow">Required</span>
      <span className="ppp-floating-waiver__label">Sign Waiver</span>
    </Link>
  );
};

export default FloatingWaiverButton;
