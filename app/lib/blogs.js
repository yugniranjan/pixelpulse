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

function normalizeBlog(doc) {
  const data = doc.data() || {};

  return {
    id: doc.id,
    ...data,
  };
}

export async function fetchBlogs() {
  if (!db) {
    return [];
  }

  try {
    const orderedSnapshot = await db
      .collection("blogs")
      .orderBy("createdAt", "desc")
      .get();

    const orderedBlogs = orderedSnapshot.docs.map(normalizeBlog);

    if (orderedBlogs.length > 0) {
      return orderedBlogs;
    }
  } catch (error) {
    console.error("Firestore ordered blog query failed:", error);
  }

  try {
    const fallbackSnapshot = await db.collection("blogs").get();

    return fallbackSnapshot.docs
      .map(normalizeBlog)
      .sort((a, b) => {
        const aTime = getTimestampValue(a.createdAt) || getTimestampValue(a.updatedAt);
        const bTime = getTimestampValue(b.createdAt) || getTimestampValue(b.updatedAt);
        return bTime - aTime;
      });
  } catch (error) {
    console.error("Firestore fallback blog query failed:", error);
    return [];
  }
}
