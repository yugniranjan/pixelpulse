import '../../styles/blogs.css'
import React from "react";
import { getDataByParentId } from '@/utils/customFunctions';
import Link from 'next/link';
import { fetchMenuData, generateMetadataLib } from "@/lib/sheets";
import { fetchData } from '@/utils/fetchData';
import { m } from 'framer-motion';
import { db } from "@/lib/firestore";
import { slugify } from '@/utils/slugify';
import SectionHeading from '@/components/home/SectionHeading';

export async function generateMetadata({ params }) {
  const metadata = await generateMetadataLib({
    location: params.location_slug || 'st-catharines',
    category: '',
    page: 'blogs'
  });
  return metadata;
}

export async function getBlogs() {
  const snapshot = await db
    .collection("blogs")
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}



const page = async ({ params }) => {
  const location_slug = params?.location_slug || 'st-catharines';

  const extractBlogData = await getBlogs();

  return (
    <main className="aero-blog-main-section">
      <section className='aero-max-container'>
        {/* <h1 className="aero-blog-main-heading" style={{paddingTop:'80px'}}>All Blogs</h1> */}
        <div style={{padding:"50px 0 40px 0"}}>
         <SectionHeading mainHeading="true">All <span>Blogs</span></SectionHeading>
         </div>
        <section className="aero-blog-main-article-wrapper">
          {extractBlogData?.map((item) => {
            const slug = slugify(item.title);
            return (
              <article className="aero-blog-main-article-card" key={item.id}>
                <div className="aero-blog-img-section">
                  <Link href={`blogs/${slug}?uid=${item.id}`} prefetch>
                    <img src={item.image || "/assets/images/logo.png"} alt="Article Image" />
                  </Link>
                </div>
                <div className="aero-blog-content-section">
                  <span className='aero-blog-updated-time'>{item.pageid}</span>
                  <Link href={`blogs/${slug}?uid=${item.id}`} prefetch><h2 className='aero-blog-second-heading'>{item.title}</h2></Link>
                  <Link href={`blogs/${slug}?uid=${item.id}`} prefetch className='aero-blog-readmore-btn'>READ MORE</Link>
                </div>
              </article>
            )
          })}
        </section>

      </section>
    </main>
  );
};

export default page;
