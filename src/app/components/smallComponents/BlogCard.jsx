import { fetchBlogs, getFallbackBlogs } from '@/lib/blogs';
import { slugify } from '@/utils/slugify';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react'

const BlogCard = async ({ blogsData, location_slug }) => {
  const extractBlogData = await fetchBlogs();
  const blogChildren = Array.isArray(blogsData?.children)
    ? blogsData.children.filter((item) => item?.isactive == 1)
    : [];
  const fallbackCards =
    blogChildren.length > 0
      ? blogChildren.slice(0, 4).map((item, index) => ({
          id: `fallback-${item?.path || index}`,
          title: item?.desc || "Latest Update",
          href: "/blogs",
          featuredImage: getFallbackBlogs()[0].featuredImage,
          order: index + 1,
        }))
      : getFallbackBlogs().map((item, index) => ({
          ...item,
          order: index + 1,
        }));

  const cardsToRender =
    Array.isArray(extractBlogData) && extractBlogData.length > 0
      ? extractBlogData.slice(0, 4).map((item, index) => ({
          id: item.id,
          title: item?.title,
          href: `/blogs/${slugify(item.title)}?uid=${item.id}`,
          featuredImage:
            item?.featuredImage ||
            "https://storage.googleapis.com/aerosports/common/gallery-thummbnail-wall-climbwall.jpg",
          order: index + 1,
        }))
      : fallbackCards;

  return (
    <section className="ppp-groups-grid">
      {cardsToRender.map((item, index) => (
        <article className="ppp-group-card-modern" key={`${item.id || item.href || "blog"}-${index}`}>
          <Link
            href={item.href}
            prefetch
            className="ppp-group-card-modern__media"
          >
            <Image
              src={item.featuredImage}
              width={720}
              height={420}
              alt={item.title || "Blog article image"}
              title={item.title}
              unoptimized
            />
          </Link>

          <div className="ppp-group-card-modern__body">
            <Link href={item.href} prefetch>
              <h2>{item.title}</h2>
              <p>{item.metaDescription || "Helpful updates, planning ideas, and local news from Pixel Pulse."}</p>
            </Link>
            <Link
              href={item.href}
              prefetch
              className="ppp-group-card-modern__link"
            >
              Read Article
            </Link>
          </div>
        </article>
      ))}
    </section>
  );
};

export default BlogCard
