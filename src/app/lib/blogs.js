import { db } from "@/lib/firestore";

const fallbackImage =
  "https://storage.googleapis.com/aerosports/common/gallery-thummbnail-wall-climbwall.jpg";

export function getFallbackBlogs() {
  return [
    {
      id: "fallback-guides",
      title: "Game guides, party tips, and local updates",
      featuredImage: fallbackImage,
      metaDescription:
        "Helpful reads for planning better visits, parties, and active family outings at Pixel Pulse.",
      createdAt: null,
      updatedAt: null,
      href: "/blogs",
    },
    {
      id: "fallback-events",
      title: "See what is new at Pixel Pulse this month",
      featuredImage: fallbackImage,
      metaDescription:
        "Catch current offers, venue highlights, and updates before your next visit.",
      createdAt: null,
      updatedAt: null,
      href: "/blogs",
    },
    {
      id: "fallback-families",
      title: "Plan better visits for birthdays and family days",
      featuredImage: fallbackImage,
      metaDescription:
        "Ideas and planning notes for birthdays, family visits, and group play that runs smoothly.",
      createdAt: null,
      updatedAt: null,
      href: "/blogs",
    },
  ];
}

function withTimeout(promise, label, timeoutMs = 5000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`${label} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    }),
  ]);
}

function getTimestampValue(value) {
  if (!value) return 0;

  if (typeof value?.toMillis === "function") {
    return value.toMillis();
  }

  if (typeof value?.seconds === "number") {
    return value.seconds * 1000;
  }

  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseContent(value) {
  if (!value) return null;

  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  return value;
}

function getFirstImageFromContent(content) {
  const blocks = Array.isArray(content?.blocks) ? content.blocks : [];
  const imageBlock = blocks.find((block) => block?.type === "image");
  return imageBlock?.data?.file?.url || "";
}

function getExcerptFromContent(content) {
  const blocks = Array.isArray(content?.blocks) ? content.blocks : [];
  const paragraphBlock = blocks.find(
    (block) => block?.type === "paragraph" && block?.data?.text
  );

  const rawText = paragraphBlock?.data?.text || "";
  const cleanText = rawText
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleanText;
}

function normalizeBlog(doc) {
  const data = doc.data() || {};
  const content = parseContent(data.content);
  const derivedFeaturedImage = getFirstImageFromContent(content);
  const derivedMetaDescription = getExcerptFromContent(content);

  return {
    id: doc.id,
    ...data,
    content,
    featuredImage:
      data.featuredImage ||
      data.image ||
      data.imageUrl ||
      data.coverImage ||
      data.thumbnail ||
      derivedFeaturedImage ||
      fallbackImage,
    metaDescription:
      data.metaDescription ||
      data.excerpt ||
      data.description ||
      derivedMetaDescription,
  };
}

export async function fetchBlogs() {
  if (!db) {
    return [];
  }

  try {
    const orderedSnapshot = await withTimeout(
      db.collection("blogs").orderBy("createdAt", "desc").get(),
      "Firestore ordered blog query",
    );

    return orderedSnapshot.docs
      .map(normalizeBlog)
      .filter((blog) => blog.createdAt || blog.updatedAt);
  } catch (error) {
    console.error("Firestore ordered blog query failed:", error);
  }

  try {
    const fallbackSnapshot = await withTimeout(
      db.collection("blogs").get(),
      "Firestore fallback blog query",
    );

    return fallbackSnapshot.docs
      .map(normalizeBlog)
      .sort((a, b) => {
        const aTime = getTimestampValue(a.createdAt) || getTimestampValue(a.updatedAt);
        const bTime = getTimestampValue(b.createdAt) || getTimestampValue(b.updatedAt);
        return bTime - aTime;
      })
      .filter((blog) => blog.createdAt || blog.updatedAt);
  } catch (error) {
    console.error("Firestore fallback blog query failed:", error);
    return [];
  }
}
