import * as XLSX from "xlsx";
import { getConfigValue } from "@/lib/ctaContent";
import { DEFAULT_SEO_IMAGE, canonicalUrl, getCanonicalSiteUrl, safeImageUrl } from "@/lib/seo";
import { isMenuItemActive } from "@/utils/customFunctions";

const SHEET_URL = `https://docs.google.com/spreadsheets/d/1NEovNJVBVY4LyXWg3nHFh5-LekMt8GfL4y4eaNz7X1I/export?format=xlsx`;
const sheetCache = new Map();
const CACHE_TTL = 1000 * 60 * 15; // 15 min
const waiverLinkCache = new Map();
const reviewesData = new Map();
let workbookLoadPromise = null;

function normalizeSheetData(name, sheetData) {
  if (name !== 'config') {
    return sheetData;
  }

  return sheetData.map((m) => {
    const shiftedSummerPassRow =
      /^(showSummerPlayPass|summerPlayPass|summerPass)/i.test(
        String(m.location || "").trim()
      ) &&
      !String(m.value || "").trim() &&
      String(m.key || "").trim();
    const value = shiftedSummerPassRow ? m.key : m.value;

    return {
      ...m,
      location: shiftedSummerPassRow ? "" : m.location,
      key: shiftedSummerPassRow ? m.location : m.key,
      value:
        typeof value === 'string'
          ? value.replace(/\r?\n|\r/g, "<br/>")
          : value || "",
    };
  });
}

function filterSheetDataByLocation(sheetData, location) {
  if (!location || location === 'all') {
    return sheetData;
  }

  return sheetData.filter((m) => {
    const rowLocation = String(m.location ?? "");
    return rowLocation.includes(location) || rowLocation === "";
  });
}

async function populateSheetCache() {
  const now = Date.now();
  const response = await fetch(SHEET_URL, {
    next: { revalidate: CACHE_TTL / 1000 },
  });

  if (!response.ok) {
    throw new Error(`Google Sheet workbook request failed: ${response.status}`);
  }

  const workbookBuffer = Buffer.from(await response.arrayBuffer());
  const workbook = XLSX.read(workbookBuffer, { type: 'buffer' });

  const worksheetLocationsData = workbook.Sheets['locations'];
  const jsonLocationsData = XLSX.utils.sheet_to_json(worksheetLocationsData, { defval: '' });
  sheetCache.set('locations:all', {
    data: jsonLocationsData,
    timestamp: now,
  });

  const locationSet = new Set();
  jsonLocationsData.forEach((row) => {
    if (row.location) {
      locationSet.add(row.location);
    }
  });
  const distinctLocations = Array.from(locationSet);

  workbook.SheetNames.forEach((name) => {
    const worksheet = workbook.Sheets[name];
    const sheetData = normalizeSheetData(
      name,
      XLSX.utils.sheet_to_json(worksheet, { defval: '' }),
    );

    distinctLocations.forEach((loc) => {
      const filteredData = filterSheetDataByLocation(sheetData, loc);
      const cacheKeyLocal = `${name}:${loc}`;
      sheetCache.set(cacheKeyLocal, {
        data: filteredData,
        timestamp: now,
      });
    });
  });
}

async function ensureSheetCache(cacheKey) {
  const now = Date.now();
  const cached = sheetCache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  if (!workbookLoadPromise) {
    workbookLoadPromise = populateSheetCache().finally(() => {
      workbookLoadPromise = null;
    });
  }

  await workbookLoadPromise;
  return sheetCache.get(cacheKey)?.data || [];
}

export async function fetchsheetdata(sheetName, location) {
  const cacheKey = `${sheetName}:${location || 'all'}`;
  if(sheetName === 'refresh'){
    console.log('refreshing data');
    sheetCache.clear();
    waiverLinkCache.clear();
    workbookLoadPromise = null;
  }
  if(location=='.well-known')
  {
    // console.log('unknown location', location);
    return [];
  }

  try {
    return await ensureSheetCache(cacheKey);
  } catch (error) {
    console.warn(`Sheet data unavailable for "${sheetName}": ${error.message}`);
    return sheetCache.get(cacheKey)?.data || [];
  }
}

export async function fetchsheetdataNoCache(sheetName, location) {
  try {
    const response = await fetch(SHEET_URL, { cache: 'no-store' });

    if (!response.ok) {
      throw new Error(`Google Sheet workbook request failed: ${response.status}`);
    }

    const workbookBuffer = Buffer.from(await response.arrayBuffer());
    const workbook = XLSX.read(workbookBuffer, { type: 'buffer' });

    const worksheetLocationsData = workbook.Sheets[sheetName];
    if (!worksheetLocationsData) {
      return [];
    }

    const jsonLocationsData = normalizeSheetData(
      sheetName,
      XLSX.utils.sheet_to_json(worksheetLocationsData, { defval: '' }),
    );
    return filterSheetDataByLocation(jsonLocationsData, location);
  } catch (error) {
    console.warn(`Sheet data unavailable for "${sheetName}": ${error.message}`);
    return [];
  }
}

/**
 * Builds menu data with nested children from "Data" sheet
 */
export async function fetchMenuData(location) {
  const jsonData = await fetchsheetdata("Data", location);
  const hierarchy = {};
  const allPaths = new Set(jsonData.map((item) => item.path).filter(Boolean));

  jsonData.forEach(item => {
    const { section1, section2, ruleyes, ruleno, ...rest } = item;
    if (isMenuItemActive(rest)) {
      hierarchy[item.path] = { ...rest, children: [] };
    }
  });

  jsonData.forEach(item => {
    if (item.parentid && item.parentid !== item.path && hierarchy[item.parentid]) {
      const child = hierarchy[item.path];
      if (child) {
        hierarchy[item.parentid].children.push(child);
      }
    }
  });

  return Object.values(hierarchy).filter(
    item => !item.parentid || item.parentid === item.path || !allPaths.has(item.parentid)
  );
}

/**
 * Filter page-specific data
 */
export async function fetchPageData(location, page) {
  const jsonData = await fetchsheetdata("Data", location);
  const normalizedPage = typeof page === "string" ? page.toUpperCase() : "";
  if (!normalizedPage) {
    return null;
  }
  const exactMatch = jsonData.find(
    (m) => typeof m.path === "string" && m.path.toUpperCase() === normalizedPage
  );
  if (exactMatch) {
    return exactMatch;
  }

  const partialMatch = jsonData.find(
    (m) => typeof m.path === "string" && m.path.toUpperCase().includes(normalizedPage)
  );
  return partialMatch || null;
}
export async function fetchFaqData(location, page) {
  const jsonData = await fetchsheetdata("faq", location);
  const normalizedPage = typeof page === "string" ? page.toUpperCase() : "";
  if (!normalizedPage) {
    return [];
  }
  return jsonData.filter(
    (m) => typeof m.path === "string" && m.path.toUpperCase().includes(normalizedPage)
  );
}

export async function getWaiverLink(location){

  const cacheKey = `waiver:${location}`;
  const cached = waiverLinkCache.get(cacheKey);
  // console.log(cacheKey, cached);
  if(cached)
  {
       return cached;
  }
  const dataconfig = await fetchsheetdata('config', location);  
  const waiver = getConfigValue(dataconfig, ["waiver"]);
  waiverLinkCache.set(cacheKey,waiver);
  return waiver;
}
 
function challengeRoomTitle(value = "") {
  return String(value || "").replace(/trampoline/gi, "challenge rooms");
}


export async function generateMetadataLib({ location, category, page }) {
  const BASE_URL = getCanonicalSiteUrl();
  const pagefordata = page?page:'home';
  const data = await fetchPageData(location, pagefordata);

  const metadataItem = data;//?.find((item) => item.path === pagefordata);
//// console.log(pagefordata);
  // Construct canonical path
  let canonicalPath = location;
  if (category && page) {
    canonicalPath += `/${category}/${page}`;
  } else if (page) {
     canonicalPath += `/${page}`;
  } else if (category) {
    canonicalPath += `/${category}`;
  }

  const fullUrl = canonicalUrl(canonicalPath);
  const rawImageUrl = metadataItem?.headerimage?.startsWith("http")
    ? metadataItem.headerimage
    : `${BASE_URL}${metadataItem?.headerimage || ""}`;
  const imageUrl = safeImageUrl(rawImageUrl, DEFAULT_SEO_IMAGE);
  const metaTitle = challengeRoomTitle(metadataItem?.metatitle || "pixelpulseplay Challenge Rooms");

  return {
    title: metaTitle,
    description: metadataItem?.metadescription || "Fun for all ages at pixelpulseplay!",
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: fullUrl,
    },
    openGraph: {
      title: metaTitle,
      description: metadataItem?.metadescription || "Fun for all ages at pixelpulseplay!",
      url: fullUrl,
      siteName: "pixelpulseplay Challenge Rooms",
      images: imageUrl
        ? [
            {
              url: imageUrl,
              width: 1200,
              height: 630,
              alt: `pixelpulseplay – ${location}`,
            },
          ]
        : [],
      locale: "en_CA",
      type: "website",
    },
  };
}

// async function getReviewsData(locationid){
//   const cacheKey = `reviews:${locationid}`;
//   const cached = reviewesData.get(cacheKey);
  
//   if(cached)
//   {
//        return cached;
//   }
//   const url = `${process.env.NEXT_PUBLIC_API_URL}/getreviews?locationid=${locationid}`;
//    const response = await fetch(url, {next: {revalidate: 3600*24*5}}); 
//    const data = await response.json();
//   reviewesData.set(cacheKey,data);
//   return data;
// }
   
export async function generateSchema(pagedata, locationData, category, page ) {
  const BASE_URL = getCanonicalSiteUrl();

  const metadataItem = pagedata;//?.find((item) => item.path === pagefordata);
//console.log('pagedata', pagedata);
  let canonicalPath = pagedata?.location;
  if (category && page) {
    canonicalPath += `/${category}/${page}`;
  } else if (page) {
     canonicalPath += `/${page}`;
  } else if (category) {
    canonicalPath += `/${category}`;
  }


  const fullUrl = canonicalUrl(canonicalPath);
  const rawImageUrl = metadataItem?.headerimage?.startsWith("http")
    ? metadataItem.headerimage
    : `${BASE_URL}${metadataItem?.headerimage || ""}`;
  const imageUrl = safeImageUrl(rawImageUrl, DEFAULT_SEO_IMAGE);

  const filled = locationData?.[0]?.schema
  .replace('"{{metadesc}}"', JSON.stringify(metadataItem?.metadescription || "Fun for all ages at pixelpulseplay!"))
  .replace('"{{image}}"', JSON.stringify(imageUrl))
  .replace('"{{url}}"', JSON.stringify(fullUrl));

  return     filled;

}
