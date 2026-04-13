function normalizePath(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function getDataByParentId(data, path) {
  const normalizedPath = normalizePath(path);
  return data?.filter((item) => normalizePath(item?.path) === normalizedPath);
}
export function getDataByBlogId(data, slug) {
  const normalizedSlug = normalizePath(slug);
  return data.find((item) => normalizePath(item?.path) === normalizedSlug);
}
