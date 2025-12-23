import { format } from 'date-fns';
import { fetchsheetdata } from "@/lib/sheets";
import { fetchsheetdataNoCache  } from "@/lib/sheets";
export async function GET() {
  const siteUrl = 'https://www.pixelpulseplayparks.ca';
  const dynamicPaths = new Set();

  try {
    const rows = await fetchsheetdataNoCache("Data");
    
    rows.forEach(row => {
      const { location, parentid, path } = row;
      const locations = location?.split(',').map(l => l.trim().toLowerCase()) || [];
      dynamicPaths.add(`${siteUrl}`);
      locations.forEach(loc => {
        // Homepage for location
        dynamicPaths.add(`${siteUrl}/${loc}`);
        if(path!='home'){
              // Construct path
              const basePath = (!parentid || parentid.toLowerCase() === path.toLowerCase())
                ? `/${loc}/${path.toLowerCase()}`
                : `/${loc}/${parentid.toLowerCase()}/${path.toLowerCase()}`;

            
              dynamicPaths.add(`${siteUrl}${basePath}`);
        }
      });
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
