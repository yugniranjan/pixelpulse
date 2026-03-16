export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import "../../styles/blogs.css";
import React from "react";
import Link from "next/link";
import { fetchMenuData, generateMetadataLib } from "@/lib/sheets";
import { db } from "@/lib/firestore";
import { slugify } from "@/utils/slugify";
import SectionHeading from "@/components/home/SectionHeading";
import BookingButton from "@/components/smallComponents/BookingButton";

export async function generateMetadata({ params }) {
  const location_slug = params?.location_slug || "vaughan";
  const BASE_URL = process.env.SITE_URL;

  const title = `Blogs | Pixel Pulse Play ${location_slug}`;
  const description =
    "Read the latest blogs, guides, and updates from Pixel Pulse Play. Discover arcade tips, challenge room experiences, and fun activities for families and groups.";

  const url = `${BASE_URL}/${location_slug}/blogs`;

  return {
    title,
    description,

    alternates: {
      canonical: url,
    },

    robots: {
      index: true,
      follow: true,
    },

    openGraph: {
      type: "website",
      url,
      title,
      description,
      siteName: "Pixel Pulse Play",
      images: [
        {
          url: "https://storage.googleapis.com/pixel-pulse-play/web/h-Logo.png",
          width: 1200,
          height: 630,
          alt: "Pixel Pulse Play Blogs",
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [
        "https://storage.googleapis.com/pixel-pulse-play/web/h-Logo.png",
      ],
    },
  };
}

export async function getBlogs() {
  try {
    const snapshot = await db
      .collection("blogs")
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter((blog) => blog.createdAt);
  } catch (error) {
    console.error("Firestore Error:", error);
    return [];
  }
}


const page = async ({ params }) => {
  const location_slug = params?.location_slug || "vaughan";
  const extractBlogData = await getBlogs();



const schema = {
  "@context": "https://schema.org",
  "@type": "Blog",
  name: "Pixel Pulse Play Blog",
  description:
    "Read the latest blogs, guides, and updates from Pixel Pulse Play.",
  url: `${process.env.SITE_URL}/${location_slug}/blogs`,
  blogPost: extractBlogData?.map((blog) => {
    const slug = slugify(blog.title);

    return {
      "@type": "BlogPosting",
      headline: blog.title,
      url: `${process.env.SITE_URL}/${location_slug}/blogs/${slug}?uid=${blog.id}`,
      image:
        blog.featuredImage ||
        "https://storage.googleapis.com/pixel-pulse-play/web/h-Logo.png",
      datePublished: blog?.createdAt?.seconds
        ? new Date(blog.createdAt.seconds * 1000).toISOString()
        : null,
      author: {
        "@type": "Organization",
        name: "Pixel Pulse Play",
      },
    };
  }),
};

  return (
    <main className="aero-blog-main-section">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema),
        }}
      />
      <section className="aero-max-container">
        {/* <h1 className="aero-blog-main-heading" style={{paddingTop:'80px'}}>All Blogs</h1> */}
        <div style={{ padding: "50px 0 40px 0" }}>
          <SectionHeading mainHeading="true">
            All <span>Blogs</span>
          </SectionHeading>
        </div>
        <section className="aero-blog-main-article-wrapper">
          {extractBlogData?.map((item) => {
            const slug = slugify(item.title);
            return (
              <article className="aero-blog-main-article-card" key={item.id}>
                <div className="aero-blog-img-section">
                  <Link href={`blogs/${slug}?uid=${item.id}`} prefetch>
                    <img
                      src={item?.featuredImage || "/assets/images/logo.png"}
                      alt="Article Image"
                    />
                  </Link>
                </div>
                <div className="aero-blog-content-section">
                  <span className="aero-blog-updated-time">{item.pageid}</span>
                  <Link href={`blogs/${slug}?uid=${item.id}`} prefetch>
                    <h2 className="aero-blog-second-heading">{item.title}</h2>
                  </Link>
                  <Link
                    href={`blogs/${slug}?uid=${item.id}`}
                    prefetch
                    className="aero-blog-readmore-btn"
                  >
                    READ MORE
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      </section>
      <div
        className="d-flex-center aero-btn-booknow"
        style={{ padding: "2em", backgroundColor: "var(--black-color)" }}
      >
        <BookingButton title="Book Now" />
      </div>
    </main>
  );
};

export default page;
