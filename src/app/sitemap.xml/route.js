export const dynamic = "force-dynamic";
import { format } from 'date-fns';
import { fetchsheetdataNoCache } from "@/lib/sheets";
import { fetchBlogs } from "@/lib/blogs";
import { LOCATION_NAME } from "@/lib/constant";
import { DEFAULT_SEO_IMAGE, canonicalUrl } from "@/lib/seo";
import { slugify } from "@/utils/slugify";

const videoEntries = new Map([
  [
    canonicalUrl(),
    {
      thumbnail: DEFAULT_SEO_IMAGE,
      title: "Pixel Pulse Play Gameplay Experience",
      description:
        "See how Pixel Pulse Play challenge rooms work with wristband activation, interactive games, live scoring, and replayable family fun.",
      contentUrl: canonicalUrl("/assets/videos/pixel-pulse-experience.mp4"),
      playerUrl: canonicalUrl(),
      publicationDate: "2026-08-01T09:00:00-04:00",
    },
  ],
  [
    canonicalUrl("/how-to-play"),
    {
      thumbnail: DEFAULT_SEO_IMAGE,
      title: "How to Play at Pixel Pulse Play",
      description:
        "Watch how Pixel Pulse Play wristbands, challenge rooms, scoring, and gameplay work before your Vaughan visit.",
      contentUrl: canonicalUrl("/assets/videos/pixel-pulse-experience.mp4"),
      playerUrl: canonicalUrl("/how-to-play"),
      publicationDate: "2026-08-01T09:00:00-04:00",
    },
  ],
]);

function xmlEscape(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function videoSitemapTag(video = {}) {
  if (!video.contentUrl || !video.thumbnail || !video.title || !video.description) {
    return "";
  }

  return `
      <video:video>
        <video:thumbnail_loc>${xmlEscape(video.thumbnail)}</video:thumbnail_loc>
        <video:title>${xmlEscape(video.title)}</video:title>
        <video:description>${xmlEscape(video.description)}</video:description>
        <video:content_loc>${xmlEscape(video.contentUrl)}</video:content_loc>
        <video:player_loc>${xmlEscape(video.playerUrl || video.contentUrl)}</video:player_loc>
        <video:publication_date>${xmlEscape(video.publicationDate)}</video:publication_date>
        <video:family_friendly>yes</video:family_friendly>
      </video:video>`;
}

export async function GET() {
  const dynamicPaths = new Set();
  const locationName = (LOCATION_NAME || "vaughan").toLowerCase();
  dynamicPaths.add(canonicalUrl());
  dynamicPaths.add(canonicalUrl("/blogs"));
  dynamicPaths.add(canonicalUrl("/booking"));
  dynamicPaths.add(canonicalUrl("/how-to-play"));

  const getLocationPath = (location = "") => {
    const normalizedLocation = location.trim().toLowerCase();
    if (
      !normalizedLocation ||
      normalizedLocation === "undefined" ||
      normalizedLocation === "null"
    ) {
      return "";
    }

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
      const invalidSegments = new Set(["undefined", "null", "$"]);

      if (
        !path ||
        invalidSegments.has(path) ||
        invalidSegments.has(parentid) ||
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
        dynamicPaths.add(canonicalUrl(locationPath));
        const basePath = (!parentid || parentid === path)
          ? `${locationPath}/${path}`
          : `${locationPath}/${parentid}/${path}`;

        dynamicPaths.add(canonicalUrl(basePath));
      });
    });


    extractBlogData?.forEach(blog => {

      if (blog?.status === "published") {
        const slug = slugify(blog?.title || "");
        if (slug) {
          dynamicPaths.add(canonicalUrl(`/blogs/${slug}`));
        }
      }
    });

    dynamicPaths.add(canonicalUrl("/birthday-party-landing"));
    dynamicPaths.add(canonicalUrl("/private-party"));

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
      ${videoSitemapTag(videoEntries.get(url))}
    </url>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
