function normalizePath(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function isMenuItemActive(item = {}) {
  const value = String(item?.isactive ?? item?.active ?? "1")
    .trim()
    .toLowerCase();

  return !["0", "false", "no", "inactive", "hidden"].includes(value);
}

export function getDataByParentId(data, path) {
  const normalizedPath = normalizePath(path);
  return data?.filter((item) => normalizePath(item?.path) === normalizedPath);
}
export function getDataByBlogId(data, slug) {
  const normalizedSlug = normalizePath(slug);
  return data.find((item) => normalizePath(item?.path) === normalizedSlug);
}
