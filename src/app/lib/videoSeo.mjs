// Keep visible players, structured data and the video sitemap on the same assets.
// Dates are the first known publication of these video versions in this repository.
export const SITE_VIDEOS = {
  gameplay: {
    name: "How to Play at Pixel Pulse Play",
    description: "Watch how Pixel Pulse Play wristbands, challenge rooms, scoring, and gameplay work before your Vaughan visit.",
    watchPath: "/how-to-play",
    contentPath: "/assets/videos/pixel-pulse-experience.mp4",
    thumbnailPath: "/assets/images/videos/pixel-pulse-experience.jpg",
    uploadDate: "2026-08-02T15:34:55-04:00",
    duration: "PT1M14S",
    durationSeconds: 74,
  },
  partyRoom: {
    name: "Pixel Pulse Play Birthday Party Room Tour",
    description: "Take a video tour of a dedicated Pixel Pulse Play birthday party room in Vaughan, with space for cake, food, gifts, and your birthday crew.",
    watchPath: "/videos/birthday-party-room",
    contentPath: "/assets/videos/birthday-party-room.mp4",
    thumbnailPath: "/assets/images/videos/birthday-party-room.jpg",
    uploadDate: "2026-10-19T11:40:47-04:00",
    duration: "PT15.1S",
    durationSeconds: 15,
  },
};

export function videoStructuredData(video, siteUrl) {
  const base = siteUrl.replace(/\/$/, "");
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "@id": `${base}${video.watchPath}#video`,
    name: video.name,
    description: video.description,
    url: `${base}${video.watchPath}`,
    thumbnailUrl: [`${base}${video.thumbnailPath}`],
    uploadDate: video.uploadDate,
    duration: video.duration,
    contentUrl: `${base}${video.contentPath}`,
    publisher: { "@type": "Organization", name: "Pixel Pulse Play", url: base },
  };
}

function xmlEscape(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export function videoSitemapTag(video, siteUrl) {
  if (!video) return "";
  const base = siteUrl.replace(/\/$/, "");
  // content_loc is the MP4. A regular page URL is not an embeddable player_loc.
  return `<video:video>
    <video:thumbnail_loc>${xmlEscape(base + video.thumbnailPath)}</video:thumbnail_loc>
    <video:title>${xmlEscape(video.name)}</video:title>
    <video:description>${xmlEscape(video.description)}</video:description>
    <video:content_loc>${xmlEscape(base + video.contentPath)}</video:content_loc>
    <video:duration>${video.durationSeconds}</video:duration>
    <video:publication_date>${xmlEscape(video.uploadDate)}</video:publication_date>
    <video:family_friendly>yes</video:family_friendly>
  </video:video>`;
}
