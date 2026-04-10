export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import "../../styles/blogs.css";
import React from "react";
import Link from "next/link";
import { fetchMenuData, generateMetadataLib } from "@/lib/sheets";
import { fetchBlogs, getFallbackBlogs } from "@/lib/blogs";
import { LOCATION_NAME } from "@/lib/constant";
import { slugify } from "@/utils/slugify";
import SectionHeading from "@/components/home/SectionHeading";
import BookingButton from "@/components/smallComponents/BookingButton";

export async function generateMetadata({ params }) {
  await params;
  const location_slug = LOCATION_NAME || "vaughan";
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

function formatBlogDate(createdAt) {
  if (!createdAt?.seconds) return "Latest update";

  return new Date(createdAt.seconds * 1000).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const page = async ({ params }) => {
  await params;
  const location_slug = LOCATION_NAME || "vaughan";
  const extractBlogData = await fetchBlogs();
  const blogsToRender =
    Array.isArray(extractBlogData) && extractBlogData.length > 0
      ? extractBlogData
      : getFallbackBlogs();



const schema = {
  "@context": "https://schema.org",
  "@type": "Blog",
  name: "Pixel Pulse Play Blog",
  description:
    "Read the latest blogs, guides, and updates from Pixel Pulse Play.",
  url: `${process.env.SITE_URL}/${location_slug}/blogs`,
  blogPost: blogsToRender?.map((blog) => {
    const slug = slugify(blog.title);

    return {
      "@type": "BlogPosting",
      headline: blog.title,
      url: blog.href || `${process.env.SITE_URL}/${location_slug}/blogs/${slug}?uid=${blog.id}`,
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
    <main className="aero-blog-main-section ppp-blogs-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema),
        }}
      />
      <section className="ppp-blogs-hero">
        
          

          <div className="ppp-blogs-hero__panel">
            <div className="ppp-about-hero-card">
              <span className="ppp-about-hero-card__label">What you'll find</span>
              <h2>Helpful reads for planning visits, discovering attractions, and making group play even better.</h2>
              <ul>
                <li>Planning tips for families, parties, and group outings</li>
                <li>Highlights from attractions, experiences, and events</li>
                <li>Useful updates that keep your next visit easy to organize</li>
              </ul>
            </div>
          </div>
        
      </section>

      <section className="aero-max-container ppp-blogs-layout">
        <div className="ppp-blogs-section-intro">
          <SectionHeading mainHeading="true">
            All <span>Blogs</span>
          </SectionHeading>
          <p>
            Browse the latest posts and jump into the topics that matter most to your next Pixel Pulse visit.
          </p>
        </div>

        <section className="ppp-blogs-grid">
          {blogsToRender?.map((item) => {
            const slug = slugify(item.title);
            const href = item.href || `blogs/${slug}?uid=${item.id}`;
            return (
              <article className="ppp-blog-card" key={item.id}>
                <div className="ppp-blog-card__media">
                  <Link href={href} prefetch>
                    <img
                      src={item?.featuredImage || "/assets/images/logo.png"}
                      alt={item?.title || "Blog article image"}
                    />
                  </Link>
                </div>
                <div className="ppp-blog-card__body">
                  <span className="ppp-blog-card__meta">{formatBlogDate(item.createdAt || item.updatedAt)}</span>
                  <Link href={href} prefetch>
                    <h2 className="ppp-blog-card__title">{item.title}</h2>
                    {item?.metaDescription && (
                      <p className="ppp-blog-card__excerpt">{item.metaDescription}</p>
                    )}
                  </Link>
                  <Link
                    href={href}
                    prefetch
                    className="ppp-blog-card__link"
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
