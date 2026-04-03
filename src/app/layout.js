import { Poppins, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import dynamic from "next/dynamic";
const GoogleAnalytics = dynamic(() => import('./components/GoogleAnalytics'));
import { Suspense } from "react";
import Loading from "./loading";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { fetchMenuData, fetchsheetdata } from "./lib/sheets";
import { cookies } from "next/headers";
import { Toaster } from "sonner";
import { LOCATION_NAME } from "./lib/constant";
import Breadcrumbs from "./components/Breadcrumb";


const BASE_URL = process.env.SITE_URL;

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100","200","300","400","500","600","700","800","900"],
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300","400","500","600"],
});

export async function generateMetadata() {
  const location_slug = LOCATION_NAME;
  try {
    const configdata = await fetchsheetdata("config", location_slug);
    const dynamicMeta = Object.fromEntries(
      configdata
        .filter((item) => item.key.startsWith("meta_"))
        .map((item) => [item.key.replace("meta_", ""), item.value])
    );
    return {
      title: "Pixel Pulse Play Vaughan – Ultimate Indoor Arcade & Challenge Rooms",
      description:
        "Visit Pixel Pulse Play in Vaughan, Ontario – an exciting indoor entertainment destination featuring interactive challenge rooms, arcade games, and fun activities for families, kids, and groups.",
      robots: {
        index: true,
      },
      alternates: {
        canonical: BASE_URL + "/",
      },
      other: {
        ...dynamicMeta,
      },
      openGraph: {
        type: "website",
        url: BASE_URL,
        title:
          "Pixel Pulse Play Vaughan – Arcade Games & Interactive Challenge Rooms",
        description:
          "Experience Pixel Pulse Play in Vaughan, Ontario. Enjoy exciting challenge rooms, arcade games, and immersive activities perfect for birthdays, families, and group events.",
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
const token = cookies().get("admin_token")?.value;
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
  // const reviewdata = await getReviewsData(locationid)
  return (
    <html lang="en">
      <body className={`${poppins.className} ${jakarta.className}`}>
        <Toaster position="top-right" />
        <GoogleAnalytics />{" "}
        {/* Render the client-side Google Analytics component */}
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
