export const dynamic = "force-dynamic";
import { format } from 'date-fns';
import { fetchsheetdataNoCache } from "@/lib/sheets";
import { fetchBlogs } from "@/lib/blogs";
import { LOCATION_NAME } from "@/lib/constant";
export async function GET() {
  const siteUrl =
    process.env.SITE_URL?.replace(/\/$/, "") || "https://www.pixelpulseplay.ca";
  const dynamicPaths = new Set();
  const locationName = (LOCATION_NAME || "vaughan").toLowerCase();
  const getLocationPath = (location = "") => {
    const normalizedLocation = location.trim().toLowerCase();
    return normalizedLocation && normalizedLocation !== locationName ? `/${normalizedLocation}` : "";
  };

  try {
    const rows = await fetchsheetdataNoCache("Data");
    const extractBlogData = await fetchBlogs();

    rows.forEach(row => {
      const location = typeof row?.location === "string" ? row.location : "";
      const parentid = typeof row?.parentid === "string" ? row.parentid.trim().toLowerCase() : "";
      const path = typeof row?.path === "string" ? row.path.trim().toLowerCase() : "";
      const isActive = String(row?.isactive ?? "1").trim();
      const locations = location?.split(',').map(l => l.trim().toLowerCase()) || [];

      if (
        !path ||
        isActive !== "1" ||
        path === "home" ||
        path.startsWith("_") ||
        path === "thank-you" ||
        parentid.startsWith("_")
      ) {
        return;
      }

      locations.forEach(loc => {
        const locationPath = getLocationPath(loc);
        dynamicPaths.add(`${siteUrl}${locationPath}`);
        const basePath = (!parentid || parentid === path)
          ? `${locationPath}/${path}`
          : `${locationPath}/${parentid}/${path}`;

        dynamicPaths.add(`${siteUrl}${basePath}`);
      });
    });


    extractBlogData?.forEach(blog => {

      if (blog?.status === "published") {

        const slug = blog?.title
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-");

        dynamicPaths.add(`${siteUrl}/blogs/${slug}?uid=${blog.id}`);
      }
    });

    dynamicPaths.add(`${siteUrl}/${locationName}/waiver`);
    dynamicPaths.add(`${siteUrl}/birthday-party-landing`);

  } catch (error) {
    console.error("Sitemap generation error:", error);
  }

  const lastmod = format(new Date(), 'yyyy-MM-dd');
  const urls = [...dynamicPaths].map(url => `
    <url>
      <loc>${url}</loc>
      <lastmod>${lastmod}</lastmod>
      <changefreq>daily</changefreq>
      <priority>0.7</priority>
    </url>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
