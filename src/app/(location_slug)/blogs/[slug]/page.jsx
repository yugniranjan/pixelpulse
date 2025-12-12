import "../../../styles/blogs.css";
import { getDataByBlogId,getDataByParentId } from "@/utils/customFunctions";
import { fetchPageData,fetchMenuData, generateMetadataLib } from "@/lib/sheets";
import Link from 'next/link';
export async function generateMetadata({ params }) {
   const location_slug = params?.location_slug || 'st-catharines';
  const { slug } = params;
  const metadata = await generateMetadataLib({
    location: location_slug,
    category: 'blogs',
    page: slug
  });
  return metadata;
}

export default async function BlogDetail({ params }) {
  const location_slug = params?.location_slug || 'st-catharines';
  const {  slug } = params;


  const [blogData, menuData] = await Promise.all([
    fetchPageData(location_slug,slug),
    fetchMenuData(location_slug),
    
  ]);

const extractBlogData = (await getDataByParentId(menuData, "blogs"))[0]?.children?.filter(child => child.path !== slug);

//const  blogData=  extractBlogData.find((item) => item.path === slug);

   let images = [];
const imagesString=blogData?.headerimage;
if (imagesString) {
  const imageItems = imagesString.includes(';')
    ? imagesString.split(';')
    : [imagesString]; // Handle single image too

  images = imageItems.map((item) => {
    const [src, title] = item.split('|');
    return { src: src?.trim(), title: title?.trim() || '' };
  });
}
  return (
    <main className="aero_home-actionbtn-bg">
      <section className="aero-max-container">
        <div className="aero-blog-detail-main-section">
          <div className="aero-blog-img-section aero-blog-detail-img-section">
          <img src={images?.[0]?.src} title={images?.[0]?.title} width="100%" />
          </div>
          <h1>{ blogData?.title }</h1>
          <div
            className="aero-blog-detail-content-section"
            dangerouslySetInnerHTML={{ __html: blogData?.section1 || "" }}
          ></div>
        </div>
        <section className="aero-blog-main-article-wrapper">
        {extractBlogData?.map((item,i) => (
          <article className="aero-blog-main-article-card" key={i}>
            <div className="aero-blog-img-section">
              <Link href={`${item?.path}`} prefetch>
              <img src={item.smallimage} alt="Article Image" />
              </Link>
            </div>
            <div className="aero-blog-content-section">
              <span className='aero-blog-updated-time'>{item.pageid}</span>
              <Link href={`${item?.path}`} prefetch><h2 className='aero-blog-second-heading'>{item.title}</h2></Link>
              <Link href={`${item?.path}`} prefetch className='aero-blog-readmore-btn'>READ MORE</Link>
            </div>
          </article>
        ))}
      </section>
      </section>
     
    </main>
  );
}
