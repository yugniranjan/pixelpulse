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
    <section className="aero_home_article_card-wrapper">
      {cardsToRender.map((item) => (
        <Link href={item.href} prefetch key={item.id}>
          <article className="aero_home_article_card">
            <Image
              src={item.featuredImage}
              width={120}
              height={120}
              alt="article image"
              title={item.title}
              unoptimized
            />
            <div className="aero_home_article_desc">
              <div>{item.order}</div>
              <h3>{item.title}</h3>
              <span className="aero_home_article_cta">Continue Reading</span>
            </div>
          </article>
        </Link>
      ))}
    </section>
  );
};

export default BlogCard
