import '../../styles/blogs.css'
import React from "react";
import { getDataByParentId } from '@/utils/customFunctions';
import Link from 'next/link';
import { fetchMenuData, generateMetadataLib } from "@/lib/sheets";
import { fetchData } from '@/utils/fetchData';

export async function generateMetadata({ params }) {
  const metadata = await generateMetadataLib({
    location: params.location_slug || 'st-catharines',
    category: '',
    page: 'blogs'
  });
  return metadata;
}


const page = async ({ params }) => {
  const location_slug = params?.location_slug || 'st-catharines';
  // const data = await fetchMenuData(location_slug);
  const data = await fetchData("http://localhost:3000/api/blogs");
  console.log('data in blogs page', data);

  // const blogsData = getDataByParentId(data, "blogs");
  const extractBlogData = data;
  // // console.log('blogsData');

  return (
    <main className="aero-blog-main-section">
      <section className='aero-max-container'>
        {/* <h1 className="aero-blog-main-heading">{blogsData[0]?.title}</h1> */}
        <section className="aero-blog-main-article-wrapper">
          {extractBlogData?.map((item, i) => {
            const slug = item.title
              .toLowerCase()
              .trim()
              .replace(/[^a-z0-9\s-]/g, "")
              .replace(/\s+/g, "-");

            return (
              <article className="aero-blog-main-article-card" key={i}>
                <div className="aero-blog-img-section">
                  <Link href={`blogs/${slug}`} prefetch>
                    <img src={item.image || "/assets/images/logo.png"} alt="Article Image" />
                  </Link>
                </div>
                <div className="aero-blog-content-section">
                  <span className='aero-blog-updated-time'>{item.pageid}</span>
                  <Link href={`blogs/${slug}`} prefetch><h2 className='aero-blog-second-heading'>{item.title}</h2></Link>
                  <Link href={`blogs/${slug}`} prefetch className='aero-blog-readmore-btn'>READ MORE</Link>
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
