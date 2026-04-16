export const dynamic = "force-dynamic";
import { format } from 'date-fns';
import { fetchsheetdataNoCache } from "@/lib/sheets";
import { fetchBlogs, getBlogHref } from "@/lib/blogs";

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const siteUrl = (
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://www.pixelpulseplay.ca"
  ).replace(/\/$/, "");
  const dynamicPaths = new Set();

  try {
    const rows = await fetchsheetdataNoCache("Data");
    const extractBlogData = await fetchBlogs();

    dynamicPaths.add(siteUrl);
    dynamicPaths.add(`${siteUrl}/blogs`);

    rows.forEach(row => {
      const parentid = typeof row?.parentid === "string" ? row.parentid.trim().toLowerCase() : "";
      const path = typeof row?.path === "string" ? row.path.trim().toLowerCase() : "";
      const isActive = String(row?.isactive ?? "1") === "1";

      if (!path || path === "home" || !isActive) {
        return;
      }

      const basePath = (!parentid || parentid === path)
        ? `/${path}`
        : `/${parentid}/${path}`;

      dynamicPaths.add(`${siteUrl}${basePath}`);
    });


    extractBlogData?.forEach(blog => {
      const status = typeof blog?.status === "string" ? blog.status.toLowerCase() : "";

      if (status !== "draft") {
        dynamicPaths.add(`${siteUrl}${getBlogHref(blog)}`);
      }
    });


  } catch (error) {
    console.error("Sitemap generation error:", error);
  }

  const lastmod = format(new Date(), 'yyyy-MM-dd');
  const urls = [...dynamicPaths].map(url => `
    <url>
      <loc>${escapeXml(url)}</loc>
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
