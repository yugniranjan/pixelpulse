import { db } from '@/lib/firestore';
import { slugify } from '@/utils/slugify';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react'


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

const BlogCard = async ({ blogsData, location_slug }) => {
   const extractBlogData = await getBlogs();
  //  console.log("Extracted Blog Data:", extractBlogData);
  return (
    <section className="aero_home_article_card-wrapper">
      {extractBlogData &&
        extractBlogData.slice(0, 4).map((item, i) => {
           const slug = slugify(item.title);
          return (
          <Link href={`blogs/${slug}?uid=${item.id}`} prefetch key={item.id}>
              <article className="aero_home_article_card">
                <Image
                  src={item?.featuredImage || 'https://storage.googleapis.com/aerosports/common/gallery-thummbnail-wall-climbwall.jpg'}
                  width={120}
                  height={120}
                  alt="article image"
                  title={item.title}
                  unoptimized
                />
                <div className="aero_home_article_desc">
                  <div>{i + 1}</div>
                  <h3>{item?.title}</h3>
                  <p>Continue Reading...</p>
                </div>
              </article>
            </Link>
          );
        })}
    </section>
  );
};

export default BlogCard