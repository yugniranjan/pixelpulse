import { cache } from 'react';
import { fetchBlogs } from './blogs';
import { slugify } from '@/utils/slugify';

// Request-scoped memoization shares one read between the layout, metadata and
// article body without hiding newly published posts behind a timed cache.
export const getBlogBySlug = cache(async (slug) => {
  if (!slug) return null;
  const blogs = await fetchBlogs();
  return blogs.find((blog) => slugify(blog?.title || '') === slug) || null;
});
