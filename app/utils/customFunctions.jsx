export function getDataByParentId(data, path) {
  return data?.filter((item) => item.path === path);
}
export function getDataByBlogId(data, slug) {
  return data.find((item) => item.path === slug);
}
