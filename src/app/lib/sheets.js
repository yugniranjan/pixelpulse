// lib/sheet.js
const axios = require('axios');
const XLSX = require('xlsx');

const SHEET_URL = `https://docs.google.com/spreadsheets/d/1PRq9W16-0HAVHb2zsexYCm8rD4XNb3cg/export?format=xlsx`;
const sheetCache = new Map();
const CACHE_TTL = 1000 * 60 * 15; // 15 min
const waiverLinkCache = new Map();
const reviewesData = new Map();
async function fetchsheetdata(sheetName, location) {
  const cacheKey = `${sheetName}:${location || 'all'}`;
  
  const now = Date.now();

  const cached = sheetCache.get(cacheKey);
  if(cached)
  {
    // console.log('cache found');
    
   
  }
    if(location=='.well-known')
    {
      // console.log('unknown location', location);
      return [];
    }
  if (cached && now - cached.timestamp < CACHE_TTL) {
    // console.log("✅ from cache " + cacheKey);
    return cached.data;
  }

  // console.log("🚀 fetching fresh sheet data " + cacheKey);

  try {
    const response = await axios.get(SHEET_URL, { responseType: 'arraybuffer' });
    const workbook = XLSX.read(response.data, { type: 'buffer' });

    const worksheetLocationsData = workbook.Sheets['locations'];
    const jsonLocationsData = XLSX.utils.sheet_to_json(worksheetLocationsData, { defval: '' });
    sheetCache.set('locations:all', {
      data: jsonLocationsData,
      timestamp: now,
    });
    const locationSet = new Set();
    jsonLocationsData.forEach(row => {
      if (row.location) {
        locationSet.add(row.location);
      }
    });
    const distinctLocations = Array.from(locationSet);
    //// console.log("Distinct Locations:", distinctLocations);
    // Cache per sheet and location
    workbook.SheetNames.forEach((name) => {
      const worksheet = workbook.Sheets[name];
      let sheetData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (name === 'config') {
        sheetData = sheetData.map(m => ({
          ...m,
          value: m.value.replace(/\r?\n|\r/g, "<br/>"),
        }));
      }


      
      distinctLocations.forEach((loc) => {
        const filteredData = sheetData.filter(
          m => m.location?.includes(loc) || m.location === ""
        );
        const cacheKeyLocal = `${name}:${loc}`;
      //  // console.log('setting cache for: ',cacheKeyLocal)
        sheetCache.set(cacheKeyLocal, {
          data: filteredData,
          timestamp: now,
        });
      });
    });
      const result = sheetCache.get(cacheKey);
      return result ? result.data : [];
    
  } catch (error) {
    console.error(`❌ Error in fetchsheetdata("${sheetName}"):`, error.message);
    throw error;
  }
}

async function fetchsheetdataNoCache(sheetName) {
   
    const response = await axios.get(SHEET_URL, { responseType: 'arraybuffer' });
    const workbook = XLSX.read(response.data, { type: 'buffer' });

    const worksheetLocationsData = workbook.Sheets[sheetName];
    const jsonLocationsData = XLSX.utils.sheet_to_json(worksheetLocationsData, { defval: '' });
    return jsonLocationsData;
}

/**
 * Builds menu data with nested children from "Data" sheet
 */
async function fetchMenuData(location) {
  const jsonData = await fetchsheetdata("Data", location);
  const hierarchy = {};

  jsonData.forEach(item => {
    const { section1, section2, ruleyes, ruleno, ...rest } = item;
    hierarchy[item.path] = { ...rest, children: [] };
  });

  jsonData.forEach(item => {
    if (item.parentid && hierarchy[item.parentid]) {
      hierarchy[item.parentid].children.push(hierarchy[item.path]);
    }
  });

  return Object.values(hierarchy).filter(item => !item.parentid || !hierarchy[item.parentid]);
}

/**
 * Filter page-specific data
 */
async function fetchPageData(location, page) {
  const jsonData = await fetchsheetdata("Data", location);
  const filtered= jsonData.filter(m => m.path?.toUpperCase().includes(page.toUpperCase()));
  return filtered[0];
}
async function fetchFaqData(location, page) {
  const jsonData = await fetchsheetdata("faq", location);
  return jsonData.filter(m => m.path?.toUpperCase().includes(page.toUpperCase()));
}

async function getWaiverLink(location){
  // console.log('yoyo',location);
  const cacheKey = `waiver:${location}`;
  const cached = waiverLinkCache.get(cacheKey);
  // console.log(cacheKey, cached);
  if(cached)
  {
       return cached;
  }
  const dataconfig = await fetchsheetdata('config', location);  
  const waiver1 = Array.isArray(dataconfig) ? dataconfig.find((item) => item.key === "waiver") : null;
  const waiver=waiver1?.value;
  waiverLinkCache.set(cacheKey,waiver);
  return waiver;
}
 

async function generateMetadataLib({ location, category, page }) {
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
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

  const fullUrl = `${BASE_URL}/${canonicalPath}`;
  const imageUrl = metadataItem?.headerimage?.startsWith("http")
    ? metadataItem.headerimage
    : `${BASE_URL}${metadataItem?.headerimage || ""}`;

  return {
    title: metadataItem?.metatitle || "pixelpulseplay Trampoline Park",
    description: metadataItem?.metadescription || "Fun for all ages at pixelpulseplay!",
    alternates: {
      canonical: fullUrl,
    },
    openGraph: {
      title: metadataItem?.metatitle || "pixelpulseplay Trampoline Park",
      description: metadataItem?.metadescription || "Fun for all ages at pixelpulseplay!",
      url: fullUrl,
      siteName: "pixelpulseplay Trampoline Park",
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

async function getReviewsData(locationid){
  // console.log(locationid);
  const cacheKey = `reviews:${locationid}`;
  const cached = reviewesData.get(cacheKey);
  
  if(cached)
  {
       return cached;
  }
  const url = `${process.env.NEXT_PUBLIC_API_URL}/getreviews?locationid=${locationid}`;
   const response = await fetch(url, {next: {revalidate: 3600*24*5}}); 
   const data = await response.json();
  reviewesData.set(cacheKey,data);
  return data;
}
   


module.exports = {
  fetchsheetdata,
  fetchMenuData,
  fetchPageData,
  generateMetadataLib,
  fetchFaqData,
  getWaiverLink,
  getReviewsData,
  fetchsheetdataNoCache
};
