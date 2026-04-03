export const dynamic = "force-dynamic";
import { format } from 'date-fns';
import { fetchsheetdata } from "@/lib/sheets";
import { fetchsheetdataNoCache } from "@/lib/sheets";
import { getBlogs } from '@/(location_slug)/blogs/page';
export async function GET() {
  const siteUrl = process.env.SITE_URL;
  const dynamicPaths = new Set();

  try {
    const rows = await fetchsheetdataNoCache("Data");
    const extractBlogData = await getBlogs();

    rows.forEach(row => {
      const { location, parentid, path } = row;
      const locations = location?.split(',').map(l => l.trim().toLowerCase()) || [];

      dynamicPaths.add(`${siteUrl}`);
      locations.forEach(loc => {
        // Homepage for location
        dynamicPaths.add(`${siteUrl}/${loc}`);
        if (path != 'home') {
          // Construct path
          const basePath = (!parentid || parentid.toLowerCase() === path.toLowerCase())
            ? `/${loc}/${path.toLowerCase()}`
            : `/${loc}/${parentid.toLowerCase()}/${path.toLowerCase()}`;


          dynamicPaths.add(`${siteUrl}${basePath}`);
        }
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
