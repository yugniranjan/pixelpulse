import '../../styles/blogs.css'
import React from "react";
import { getDataByParentId } from '@/utils/customFunctions';
import Link from 'next/link';
import { fetchMenuData, generateMetadataLib } from "@/lib/sheets";

export async function generateMetadata({ params }) {
  const metadata = await generateMetadataLib({
    location: params.location_slug || 'st-catharines',
    category: '',
    page: 'blogs'
  });
  return metadata;
}


const page = async({params}) => {
  const location_slug = params?.location_slug || 'st-catharines';
  const data = await fetchMenuData(location_slug);
 
  const blogsData = getDataByParentId(data, "blogs");
  const extractBlogData = blogsData[0]?.children
  // // console.log('blogsData');
  return (
    <main className="aero-blog-main-section">
      <section className='aero-max-container'>
      <h1 className="aero-blog-main-heading">{blogsData[0]?.title}</h1>
      <section className="aero-blog-main-article-wrapper">
        {extractBlogData?.map((item,i) => (
          <article className="aero-blog-main-article-card" key={i}>
            <div className="aero-blog-img-section">
              <Link href={`blogs/${item?.path}`} prefetch>
              <img src={item.smallimage} alt="Article Image" />
              </Link>
            </div>
            <div className="aero-blog-content-section">
              <span className='aero-blog-updated-time'>{item.pageid}</span>
              <Link href={`blogs/${item?.path}`} prefetch><h2 className='aero-blog-second-heading'>{item.title}</h2></Link>
              <Link href={`blogs/${item?.path}`} prefetch className='aero-blog-readmore-btn'>READ MORE</Link>
            </div>
          </article>
        ))}
      </section>

      </section>
    </main>
  );
};

export default page;
