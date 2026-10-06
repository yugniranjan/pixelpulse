import "./globals.css";
import Script from "next/script";
import { headers } from "next/headers";
import { Suspense } from "react";
import Loading from "./loading";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ChromeVisibility from "./components/ChromeVisibility";
import FloatingWaiverButton from "./components/FloatingWaiverButton";
import TrackingPageViews from "./components/TrackingPageViews";
import TrackingVisibility from "./components/TrackingVisibility";
import { GoogleTagManagerHead, GoogleTagManagerNoScript, GTM_KEYS, DEFAULT_GTM_ID, cleanGtmId } from "./components/GoogleTagManager";
import { fetchMenuData, fetchsheetdata } from "./lib/sheets";
import { Toaster } from "sonner";
import { LOCATION_NAME } from "./lib/constant";
import { getConfiguredValue, getRowValue, normalizeValue } from "./lib/ctaContent";
import Breadcrumbs from "./components/Breadcrumb";
import { canonicalUrl, getCanonicalSiteUrl } from "@/lib/seo";
import { TRACKING_PATH_HEADER, isPublicTrackingPath } from "@/lib/trackingScope";

export const revalidate = 900;

const GOOGLE_TAG_KEYS = [
  "googleTagId",
  "googleTagIds",
  "gtagId",
  "gtagIds",
  "ga4MeasurementId",
  "measurementId",
];
const META_PIXEL_KEYS = [
  "metaPixelId",
  "meta_pixel_id",
  "facebookPixelId",
  "facebook_pixel_id",
  "fbPixelId",
  "pixelId",
];
function cleanGoogleTagId(value = "") {
  const id = String(value || "").trim().toUpperCase();
  return /^[A-Z]{1,3}-[A-Z0-9]+$/.test(id) && !id.startsWith("GTM-")
    ? id
    : "";
}

function cleanMetaPixelId(value = "") {
  const id = String(value || "").trim();
  return /^\d{5,32}$/.test(id) ? id : "";
}

function findTrackingRow(rows = []) {
  const trackingKeys = [...GTM_KEYS, ...GOOGLE_TAG_KEYS, ...META_PIXEL_KEYS];

  return rows.find((row) =>
    trackingKeys.some((key) => getRowValue(row, key)),
  );
}

function getGoogleTagIds(sources = []) {
  const rawValue = getConfiguredValue(sources, GOOGLE_TAG_KEYS, "");

  return rawValue
    .split(/[\n,|]+/)
    .map(cleanGoogleTagId)
    .filter(Boolean);
}

function HeadTrackingScripts({ googleTagIds = [], metaPixelId = "" }) {
  const cleanMetaPixel = cleanMetaPixelId(metaPixelId);
  const cleanGoogleTags = googleTagIds.map(cleanGoogleTagId).filter(Boolean);
  const primaryGoogleTag = cleanGoogleTags[0];

  if (cleanGoogleTags.length === 0 && !cleanMetaPixel) {
    return null;
  }

  return (
    <>
      {primaryGoogleTag ? (
        <>
          <Script
            id="global-google-tag-loader"
            src={`https://www.googletagmanager.com/gtag/js?id=${primaryGoogleTag}`}
            strategy="afterInteractive"
          />
          <Script
            id="global-google-tag-config"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                ${cleanGoogleTags
                  .map((id) => `gtag('config', '${id}');`)
                  .join("\n")}
              `,
            }}
          />
        </>
      ) : null}

      {cleanMetaPixel ? (
        <>
          <Script
            id="meta-pixel"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${cleanMetaPixel}');
                fbq('track', 'PageView');
              `,
            }}
          />
        </>
      ) : null}
    </>
  );
}

function BodyTrackingNoScripts({ metaPixelId = "" }) {
  const cleanMetaPixel = cleanMetaPixelId(metaPixelId);

  if (!cleanMetaPixel) {
    return null;
  }

  return (
    <>
      {cleanMetaPixel ? (
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            alt=""
            src={`https://www.facebook.com/tr?id=${cleanMetaPixel}&ev=PageView&noscript=1`}
          />
        </noscript>
      ) : null}
    </>
  );
}

export async function generateMetadata() {
  const location_slug = LOCATION_NAME;
  try {
    const configdata = await fetchsheetdata("config", location_slug);
    const dynamicMeta = Object.fromEntries(
      configdata
        .filter(
          (item) =>
            typeof item.key === "string" &&
            item.key.startsWith("meta_") &&
            !["meta_robots", "meta_googlebot"].includes(item.key)
        )
        .map((item) => [item.key?.replace("meta_", ""), normalizeValue(item.value)])
    );
    const siteUrl = getCanonicalSiteUrl();

    return {
      title: "Pixel Pulse Play Vaughan – Ultimate Indoor Arcade & Challenge Rooms",
      description:
        "Visit Pixel Pulse Play in Vaughan, Ontario – an exciting indoor entertainment destination featuring interactive challenge rooms, arcade games, and fun activities for families, kids, and groups.",
      robots: {
        index: true,
        follow: true,
      },
      alternates: {
        canonical: canonicalUrl(),
      },
      other: {
        ...dynamicMeta,
      },
      openGraph: {
        type: "website",
        url: siteUrl,
        title:
          "Pixel Pulse Play Vaughan – Arcade Games & Interactive Challenge Rooms",
        description:
          "Plan a visit to Pixel Pulse Play in Vaughan, Ontario. Book game rooms, arcade time, birthday parties, and group events for kids, families, and teams.",
        images: [
          {
            url: "https://storage.googleapis.com/pixel-pulse-play/web/h-Logo.png",
          },
        ],
      },
    };
  } catch (error) {
    console.error("layout metadata failed:", error);
    return {
      title: "Pixel Pulse Play Vaughan",
      description: "Indoor arcade games, challenge rooms, and family fun in Vaughan.",
    };
  }
}

export default async function RootLayout({ children }) {
  const trackingAllowed = isPublicTrackingPath(headers().get(TRACKING_PATH_HEADER));
  // const location_slug = params?.location_slug;
  const location_slug = LOCATION_NAME;

  let menudata = [];
  let configdata = [];
  let sheetdata = [];
  try {
    [menudata, configdata, sheetdata] = await Promise.all([
      fetchMenuData(location_slug),
      fetchsheetdata('config', location_slug),
      fetchsheetdata('locations', location_slug),
    ]);
  } catch (error) {
    console.error("layout data failed:", error);
  }
  const trackingRow = findTrackingRow(sheetdata) || {};
  const trackingSources = [trackingRow, configdata];
  const gtmId = cleanGtmId(getConfiguredValue([configdata, trackingRow], GTM_KEYS, "")) || DEFAULT_GTM_ID;
  const googleTagIds = getGoogleTagIds(trackingSources);
  const metaPixelId = cleanMetaPixelId(
    getConfiguredValue(trackingSources, META_PIXEL_KEYS, ""),
  );

  return (
    <html lang="en">
      <head>
        {trackingAllowed ? <GoogleTagManagerHead gtmId={gtmId} /> : null}
        <link rel="dns-prefetch" href="//events.pixelpulseplay.ca" />
        <link rel="preconnect" href="https://events.pixelpulseplay.ca" />
      </head>
      <body suppressHydrationWarning>
        {trackingAllowed ? <GoogleTagManagerNoScript gtmId={gtmId} /> : null}
        <TrackingVisibility>
          <>
            <HeadTrackingScripts
              googleTagIds={googleTagIds}
              metaPixelId={metaPixelId}
            />
            <BodyTrackingNoScripts
              metaPixelId={metaPixelId}
            />
            <Suspense fallback={null}>
              <TrackingPageViews />
            </Suspense>
          </>
        </TrackingVisibility>
        <Toaster position="top-right" />
        <div className="ppp-site-shell">
          <ChromeVisibility>
            <Header location_slug={location_slug} menudata={menudata} configdata={configdata} />
            <Breadcrumbs />
            <FloatingWaiverButton />
          </ChromeVisibility>
          <div className="ppp-site-content">
            <Suspense fallback={<Loading />}>{children}</Suspense>
          </div>
          <ChromeVisibility>
            <Footer
              location_slug={location_slug}
              configdata={configdata}
              menudata={menudata}
            />
          </ChromeVisibility>
        </div>
        <div id="modal-root"></div>
      </body>
    </html>
  );
}
