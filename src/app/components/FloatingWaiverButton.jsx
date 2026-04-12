"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const FloatingWaiverButton = ({ waiverLink }) => {
  const pathname = usePathname();

  if (!waiverLink) {
    return null;
  }

  if (pathname === "/waiver") {
    return null;
  }

  return (
    <Link
      href="/waiver"
      className="ppp-floating-waiver"
      prefetch
    >
      <span className="ppp-floating-waiver__eyebrow">Required</span>
      <span className="ppp-floating-waiver__label">Sign Waiver</span>
    </Link>
  );
};

export default FloatingWaiverButton;
