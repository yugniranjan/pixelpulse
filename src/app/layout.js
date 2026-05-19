import "./globals.css";
import Script from "next/script";
import { Suspense } from "react";
import Loading from "./loading";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ChromeVisibility from "./components/ChromeVisibility";
import FloatingWaiverButton from "./components/FloatingWaiverButton";
import TrackingPageViews from "./components/TrackingPageViews";
import { fetchMenuData, fetchsheetdata } from "./lib/sheets";
import { cookies } from "next/headers";
import { headers } from "next/headers";
import { Toaster } from "sonner";
import { LOCATION_NAME } from "./lib/constant";
import { getConfiguredValue, getRowValue, normalizeValue } from "./lib/ctaContent";
import Breadcrumbs from "./components/Breadcrumb";
import { canonicalUrl, getCanonicalSiteUrl } from "@/lib/seo";


const DEFAULT_GTM_ID = "GTM-53N567VP";
const GTM_KEYS = [
  "gtm_id",
  "gtmId",
  "gtm",
  "googleTagManagerId",
  "googleTagManager",
  "googleTagManagerContainerId",
];
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

function cleanGtmId(value = "") {
  const id = String(value || "").trim().toUpperCase();
  return /^GTM-[A-Z0-9]+$/.test(id) ? id : "";
}

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

function normalizePath(path = "/") {
  if (!path) return "/";
  return path !== "/" && path.endsWith("/") ? path.slice(0, -1) : path;
}

function isTrackingExcludedPath(path = "/") {
  const pathname = normalizePath(path);

  return (
    pathname === "/concessions-tv" ||
    pathname === "/waiver" ||
    pathname.startsWith("/waiver/") ||
    pathname === "/waiver-data" ||
    pathname.startsWith("/invite") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/")
  );
}

function isChromeExcludedPath(path = "/") {
  const pathname = normalizePath(path);

  return (
    pathname === "/birthday-party-landing" ||
    pathname === "/concessions-tv" ||
    pathname === "/squad" ||
    pathname === "/summer-play-pass" ||
    pathname === "/waiver" ||
    pathname.startsWith("/invite") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/")
  );
}

function HeadTrackingScripts({ gtmId = "", googleTagIds = [], metaPixelId = "" }) {
  const cleanGtm = cleanGtmId(gtmId);
  const cleanMetaPixel = cleanMetaPixelId(metaPixelId);
  const cleanGoogleTags = googleTagIds.map(cleanGoogleTagId).filter(Boolean);
  const primaryGoogleTag = cleanGoogleTags[0];

  if (!cleanGtm && cleanGoogleTags.length === 0 && !cleanMetaPixel) {
    return null;
  }

  return (
    <>
      {cleanGtm ? (
        <>
          <Script
            id="google-tag-manager"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${cleanGtm}');
              `,
            }}
          />
        </>
      ) : null}

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

function BodyTrackingNoScripts({ gtmId = "", metaPixelId = "" }) {
  const cleanGtm = cleanGtmId(gtmId);
  const cleanMetaPixel = cleanMetaPixelId(metaPixelId);

  if (!cleanGtm && !cleanMetaPixel) {
    return null;
  }

  return (
    <>
      {cleanGtm ? (
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${cleanGtm}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
            title="Google Tag Manager"
          />
        </noscript>
      ) : null}
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
  const cookieStore = await cookies();
  const headerStore = await headers();
  const token = cookieStore.get("admin_token")?.value;
  const pathname = headerStore.get("x-pathname") || "/";
  const showTracking = !isTrackingExcludedPath(pathname);
  const showChrome = !isChromeExcludedPath(pathname);
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
  const gtmId =
    cleanGtmId(getConfiguredValue(trackingSources, GTM_KEYS, "")) ||
    DEFAULT_GTM_ID;
  const googleTagIds = getGoogleTagIds(trackingSources);
  const metaPixelId = cleanMetaPixelId(
    getConfiguredValue(trackingSources, META_PIXEL_KEYS, ""),
  );

  return (
    <html lang="en">
      {showTracking ? (
        <head>
          <HeadTrackingScripts
            gtmId={gtmId}
            googleTagIds={googleTagIds}
            metaPixelId={metaPixelId}
          />
        </head>
      ) : null}
      <body suppressHydrationWarning>
        {showTracking ? (
          <>
            <BodyTrackingNoScripts
              gtmId={gtmId}
              metaPixelId={metaPixelId}
            />
            <Suspense fallback={null}>
              <TrackingPageViews />
            </Suspense>
          </>
        ) : null}
        <Toaster position="top-right" />
        {showChrome ? (
          <ChromeVisibility>
            <Header location_slug={location_slug} menudata={menudata} configdata={configdata} token={token} />
            <Breadcrumbs />
            <FloatingWaiverButton />
          </ChromeVisibility>
        ) : null}
        <Suspense fallback={<Loading />}>{children}</Suspense>
        {showChrome ? (
          <ChromeVisibility>
            <Footer
              location_slug={location_slug}
              configdata={configdata}
              menudata={menudata}
            />
          </ChromeVisibility>
        ) : null}
        <div id="modal-root"></div>
      </body>
    </html>
  );
}
