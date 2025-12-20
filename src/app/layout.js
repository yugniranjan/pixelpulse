import { Poppins } from "next/font/google";
import "./globals.css";
import dynamic from "next/dynamic";
const GoogleAnalytics = dynamic(() => import('./components/GoogleAnalytics'));
import { Suspense } from "react";
import Loading from "./loading";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { fetchMenuData, fetchsheetdata, getReviewsData } from "./lib/sheets";
import { cookies } from "next/headers";
import { Toaster } from "sonner";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

const inter = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata = {
  title: "Discover Fun-Filled Adventures with ONE PASS in Ontario",
  description: "Explore the thrill of Aero Sports Trampoline Parks in Ontario, offering diverse activities in multiple locations for family-friendly fun and adventure.",
  robots: {
    index: true,
  },
  "google-site-verification": "SJEMRcmJ9QPGTx8rq7FFoeypG8tObUDWFunTqQXgRx8",
  alternates: {
    canonical: BASE_URL + '/',
  },
  openGraph: {
    type: "website",
    url: BASE_URL,
    title: "AeroSports Trampoline Park Locations: St. Catharines, Niagara Falls, Windsor, London, Oakville,scarborough",
    description: "The GTA's ultimate play destination: A huge trampoline park with climbing walls, towering slides, a jungle gym, obstacle courses, dodgeball, and more. Ideal for birthday parties!",
    images: [
      {
        url: "https://storage.googleapis.com/aerosports/logo_white.png",
      },
    ],
  },
};

export default async function RootLayout({ children }) {
const token = cookies().get("admin_token")?.value;
console.log("Admin Token:", token);
  // const location_slug = params?.location_slug;
  const location_slug = "st-catharines";

  const [menudata, configdata, sheetdata] = await Promise.all([
    fetchMenuData(location_slug),
    fetchsheetdata('config', location_slug),
    fetchsheetdata('locations', location_slug),

  ]);

  const locationid = sheetdata?.[0]?.locationid || null;
  const reviewdata = await getReviewsData(locationid)
  return (
    <html lang="en">
      <body className={inter.className}>
        <Toaster position="top-right" />
        <GoogleAnalytics />{" "}
        {/* Render the client-side Google Analytics component */}
        <Header location_slug={location_slug} menudata={menudata} configdata={configdata} token={token} />
        <Suspense fallback={<Loading />}>{children}</Suspense>
        <Footer
          location_slug={location_slug}
          configdata={configdata}
          menudata={menudata}
          reviewdata={reviewdata}
        />
        <div id="modal-root"></div>
      </body>
    </html>
  );
}
