/** @type {import('next').NextConfig} */
import { readFile } from "node:fs/promises";

const SHEET_ID = "1NEovNJVBVY4LyXWg3nHFh5-LekMt8GfL4y4eaNz7X1I";
const REDIRECT_SHEET_NAMES = ["redirects"];
const SOCIAL_REDIRECT_FALLBACKS = {
  "/facebook": "https://www.facebook.com/pixelpulseplay",
  "/instagram": "https://www.instagram.com/pixelpulseplayzone",
  "/tiktok": "https://www.tiktok.com/@pixelpulseplay",
  "/youtube": "https://youtube.com/@pixelpulseplayzone?si=sUJmrZ-1n5F973Hr",
};

function parseCsv(csv) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < csv.length; i += 1) {
    const char = csv[i];
    const nextChar = csv[i + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      value += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") i += 1;
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }

  const [headers = [], ...dataRows] = rows.filter((csvRow) =>
    csvRow.some((cell) => String(cell).trim()),
  );

  return dataRows.map((csvRow) =>
    headers.reduce((acc, header, index) => {
      acc[String(header).trim()] = csvRow[index] ?? "";
      return acc;
    }, {}),
  );
}

function normalizeRedirect(row) {
  const source = String(row?.source || "").trim();
  const destination = String(row?.destination || "").trim();

  if (!source || !destination) {
    return null;
  }

  const normalizedSource = source.startsWith("/") ? source : `/${source}`;
  if (normalizedSource.startsWith("/admin") || normalizedSource.startsWith("/api")) {
    return null;
  }

  return {
    source: normalizedSource,
    destination: normalizeRedirectDestination(normalizedSource, destination),
    permanent: ["true", "yes", "1"].includes(
      String(row?.permanent ?? "true").trim().toLowerCase(),
    ),
  };
}

function normalizeRedirectDestination(source, destination) {
  const fallback = SOCIAL_REDIRECT_FALLBACKS[source];

  if (source !== "/tiktok") {
    if (destination.startsWith("/")) {
      return destination;
    }

    try {
      return new URL(destination).toString();
    } catch (error) {
      return fallback || destination;
    }
  }

  try {
    const url = new URL(destination);
    if (!/(^|\.)tiktok\.com$/i.test(url.hostname)) {
      return destination;
    }

    url.search = "";
    url.hash = "";
    return url.toString();
  } catch (error) {
    return fallback || "https://www.tiktok.com/@pixelpulseplay";
  }
}

async function fetchSheetRedirects() {
  const redirectRows = await Promise.all(
    REDIRECT_SHEET_NAMES.map(async (sheetName) => {
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;

      try {
        const response = await fetch(url);
        if (!response.ok) {
          console.warn(`Redirect sheet unavailable: ${sheetName}`);
          return [];
        }

        return parseCsv(await response.text());
      } catch (error) {
        console.warn(`Redirect sheet unavailable: ${sheetName} (${error.message})`);
        return [];
      }
    }),
  );

  return redirectRows.flat().map(normalizeRedirect).filter(Boolean);
}

async function readLocalRedirects() {
  try {
    const csv = await readFile(new URL("./social_redirects.csv", import.meta.url), "utf8");
    return parseCsv(csv).map(normalizeRedirect).filter(Boolean);
  } catch (error) {
    console.warn(`Local redirects unavailable: ${error.message}`);
    return [];
  }
}

const nextConfig = {
  output: "standalone",
  staticPageGenerationTimeout: 180,
  // ← removed eslint block
  async redirects() {
    const sheetRedirects = await fetchSheetRedirects();
    const socialRedirects = sheetRedirects.length > 0
      ? sheetRedirects
      : await readLocalRedirects();

    return [
      { source: "/vaughan", destination: "/", permanent: true },
      { source: "/vaughan/:path*", destination: "/:path*", permanent: true },
      { source: "/contact-us", destination: "/contactus", permanent: true },
      ...socialRedirects,
    ];
  },
  async headers() {
    return [
      {
        source: "/assets/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "storage.googleapis.com", port: "" },
      { protocol: "https", hostname: "www.pixelpulseplay.ca", port: "" },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NODE_ENV === "development"
      ? "http://localhost:3000"           // ← local in dev
      : "https://websitebackend-439220.ue.r.appspot.com",
    NEXT_PUBLIC_BASE_URL: process.env.NODE_ENV === "development"
      ? "http://localhost:3000"           // ← local in dev
      : "https://pixelpulseplay.ca",
  },
};

export default nextConfig;
