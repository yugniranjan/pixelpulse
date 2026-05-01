"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

export default function TrackingPageViews() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const didTrackInitialPage = useRef(false);

  useEffect(() => {
    if (!didTrackInitialPage.current) {
      didTrackInitialPage.current = true;
      return;
    }

    const query = searchParams?.toString();
    const pagePath = `${pathname || "/"}${query ? `?${query}` : ""}`;

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "page_view",
      page_path: pagePath,
    });

    if (typeof window.fbq === "function") {
      window.fbq("track", "PageView");
    }
  }, [pathname, searchParams]);

  return null;
}
