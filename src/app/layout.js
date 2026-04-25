import "./globals.css";
import { Suspense } from "react";
import Loading from "./loading";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ChromeVisibility from "./components/ChromeVisibility";
import { GoogleTagManager } from "@next/third-parties/google";
import { fetchMenuData, fetchsheetdata, getWaiverLink } from "./lib/sheets";
import { cookies } from "next/headers";
import { Toaster } from "sonner";
import { LOCATION_NAME } from "./lib/constant";
import { normalizeValue } from "./lib/ctaContent";
import Breadcrumbs from "./components/Breadcrumb";


const BASE_URL = process.env.SITE_URL;
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
  const gtmId = sheetdata?.find((item) => item?.gtm_id)?.gtm_id || "GTM-99ZBR";
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <GoogleTagManager gtmId={gtmId} />
        <Toaster position="top-right" />
        <Header location_slug={location_slug} menudata={menudata} configdata={configdata} token={token} />
        <Breadcrumbs/>
        <Suspense fallback={<Loading />}>{children}</Suspense>
        <Footer
          location_slug={location_slug}
          configdata={configdata}
          menudata={menudata}
          // reviewdata={reviewdata}
        />
        <div id="modal-root"></div>
      </body>
    </html>
  );
}
