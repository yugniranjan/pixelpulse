// Retired articles with current, topic-matched replacements verified on the site.
const BLOG_REPLACEMENTS = new Map([
  ['4-fun-corporate-team-building-activities-everyone-will-enjoy', 'best-team-building-activities-in-vaughan-for-corporate-groups'],
  ['benefits-of-indoor-playgrounds-pixelpulseplay', 'why-active-play-is-more-important-than-ever-for-kids-in-2026'],
]);
const INVALID_SEGMENTS = new Set(['undefined', 'null', '$']);
const PRIVATE_PREFIXES = new Set(['admin', 'api', '_next', 'assets', 'visit', 'invite', 'waiver', 'waiver-data']);
function segments(value = '') {
  return String(value || '').trim().toLowerCase().split('/').filter(Boolean);
}

export function canonicalBlogPath(pathname) {
  const parts = segments(pathname);
  if (PRIVATE_PREFIXES.has(parts[0])) return null;
  const blogIndex = parts.indexOf('blogs');
  if (blogIndex < 0) return null;
  const slug = parts.slice(blogIndex + 1)
    .filter((part) => part !== 'blogs' && !INVALID_SEGMENTS.has(part)).join('/');
  return slug ? `/blogs/${BLOG_REPLACEMENTS.get(slug) || slug}` : '/blogs';
}

export function menuItemPath(item = {}, parentFallback = '') {
  const path = segments(item?.path).filter((part) => !INVALID_SEGMENTS.has(part));
  let parent = segments(item?.parentid).filter((part) => !INVALID_SEGMENTS.has(part));
  if (!parent.length) parent = segments(parentFallback).filter((part) => !INVALID_SEGMENTS.has(part));
  const alreadyPrefixed = parent.length && parent.every((part, index) => path[index] === part);
  const joined = `/${[...(alreadyPrefixed ? [] : parent), ...path].join('/')}`;
  return canonicalBlogPath(joined) || joined;
}
