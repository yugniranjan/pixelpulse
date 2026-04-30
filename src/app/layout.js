import "./globals.css";
import Script from "next/script";
import { Suspense } from "react";
import Loading from "./loading";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ChromeVisibility from "./components/ChromeVisibility";
import { fetchMenuData, fetchsheetdata, getWaiverLink } from "./lib/sheets";
import { cookies } from "next/headers";
import { Toaster } from "sonner";
import { LOCATION_NAME } from "./lib/constant";
import { getConfiguredValue, normalizeValue } from "./lib/ctaContent";
import Breadcrumbs from "./components/Breadcrumb";


const BASE_URL = process.env.SITE_URL;
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
  "googleTag",
  "gtagId",
  "gtagIds",
  "ga4MeasurementId",
  "measurementId",
];

function cleanGtmId(value = "") {
  const id = String(value || "").trim().toUpperCase();
  return /^GTM-[A-Z0-9]+$/.test(id) ? id : "";
}

function cleanGoogleTagId(value = "") {
  const id = String(value || "").trim().toUpperCase();
  return /^[A-Z]{1,3}-[A-Z0-9]+$/.test(id) && !id.startsWith("GTM-") ? id : "";
}

function getConfiguredTagIds(sources = [], keys = []) {
  const raw = getConfiguredValue(sources, keys, "");
  return String(raw || "")
    .split(/[\n,|]+/)
    .map(cleanGoogleTagId)
    .filter(Boolean);
}

function findTagRow(rows = []) {
  return rows.find((row) => {
    const values = [...GTM_KEYS, ...GOOGLE_TAG_KEYS].map((key) => row?.[key]);
    return values.some((value) => String(value || "").trim());
  });
}

function GlobalGoogleTags({ gtmId = "", googleTagIds = [] }) {
  const cleanId = cleanGtmId(gtmId);
  const tagIds = googleTagIds.map(cleanGoogleTagId).filter(Boolean);
  const primaryGoogleTagId = tagIds[0] || "";

  if (!cleanId && !tagIds.length) {
    return null;
  }

  return (
    <>
      {cleanId ? (
        <>
          <Script
            id="google-tag-manager"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${cleanId}');
              `,
            }}
          />
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${cleanId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
              title="Google Tag Manager"
            />
          </noscript>
        </>
      ) : null}

      {primaryGoogleTagId ? (
        <>
          <Script
            id="global-google-tag-loader"
            src={`https://www.googletagmanager.com/gtag/js?id=${primaryGoogleTagId}`}
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
                ${tagIds.map((id) => `gtag('config', '${id}');`).join("\n")}
              `,
            }}
          />
        </>
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
    const siteUrl = BASE_URL || "https://www.pixelpulseplay.ca";

    return {
      title: "Pixel Pulse Play Vaughan – Ultimate Indoor Arcade & Challenge Rooms",
      description:
        "Visit Pixel Pulse Play in Vaughan, Ontario – an exciting indoor entertainment destination featuring interactive challenge rooms, arcade games, and fun activities for families, kids, and groups.",
      robots: {
        index: true,
        follow: true,
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
  const token = cookieStore.get("admin_token")?.value;
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
  const locationid = sheetdata?.[0]?.locationid || null;
  const tagRow = findTagRow(sheetdata);
  const tagSources = [tagRow || {}, configdata];
  const gtmId = cleanGtmId(getConfiguredValue(tagSources, GTM_KEYS, ""));
  const googleTagIds = getConfiguredTagIds(tagSources, GOOGLE_TAG_KEYS);
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <GlobalGoogleTags gtmId={gtmId} googleTagIds={googleTagIds} />
        <Toaster position="top-right" />
        <ChromeVisibility>
          <Header location_slug={location_slug} menudata={menudata} configdata={configdata} token={token} />
          <Breadcrumbs />
        </ChromeVisibility>
        <Suspense fallback={<Loading />}>{children}</Suspense>
        <ChromeVisibility>
          <Footer
            location_slug={location_slug}
            configdata={configdata}
            menudata={menudata}
          />
        </ChromeVisibility>
        <div id="modal-root"></div>
      </body>
    </html>
  );
}
