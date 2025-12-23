"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import Script from "next/script";

const globalTrackingId = "G-1TETQERPZN";

const locationTrackingIds = {
  london: "G-L59BND7FS0",
  windsor: "G-KWJLE4VJRW",
  LOCATION_NAME: "G-CJJLRQ2Q2Y",
  oakville: "G-D5W5H2N64H",
  scarborough: "G-D5W5H2N64H",
};

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const initialized = useRef(false);

  const locationSlug = pathname?.split("/")[1] || "";
  const locationTrackingId = locationTrackingIds[locationSlug];

  useEffect(() => {
    if (!initialized.current && window.gtag) {
      initialized.current = true;
    }

    if (window.gtag) {
      window.gtag("config", globalTrackingId, { page_path: pathname });

      if (locationTrackingId) {
        window.gtag("config", locationTrackingId, { page_path: pathname });
      }
    }
  }, [pathname, locationTrackingId]);

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${globalTrackingId}`}
        strategy="afterInteractive"
        async
      />
      <Script
        id="google-analytics-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${globalTrackingId}', { page_path: window.location.pathname });
        `,
        }}
      />
    </>
  );
}
