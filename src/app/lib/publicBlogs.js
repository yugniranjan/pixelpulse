import { unstable_cache } from "next/cache";
import { fetchBlogs } from "./blogs";

// Public cards need only summaries. Keep admin reads fresh and avoid repeated
// database queries from both the homepage and footer on every public request.
export const fetchPublicBlogCards = unstable_cache(async () => {
  const blogs = await fetchBlogs();
  return blogs.slice(0, 4).map(({ id, title, featuredImage }) => ({ id, title: title || "", featuredImage: featuredImage || "" }));
}, ["public-blog-cards-v1"], { revalidate: 300 });
