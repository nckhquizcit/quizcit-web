export const ADMIN_CRUMB_ROUTES = {
  "Tổng quan": "/admin/dashboard",
  Dashboard: "/admin/dashboard",
  "Bảng điều khiển": "/admin/dashboard",
  "Môn học": "/admin/subjects",
  "Học phần": "/admin/subjects",
  "Danh sách môn": "/admin/subjects",
  "Đề thi": "/admin/quizzes",
  "Danh sách đề": "/admin/quizzes",
  "Ngân hàng câu hỏi": "/admin/questions",
  "Câu hỏi": "/admin/questions",
  "Kỹ năng": "/admin/skills",
  "Quản lý kỹ năng": "/admin/skills",
  "Người dùng": "/admin/users",
  "Quản lý người dùng": "/admin/users",
  "Hồ sơ": "/admin/profile",
  "Hồ sơ quản trị": "/admin/profile",
  "Phân quyền": "/admin/access",
};

/**
 * Resolves a single breadcrumb item into { label, href, isCurrent }.
 * @param {string | object} item
 * @param {number} index
 * @param {number} totalLength
 * @returns {{ label: string, href: string, isCurrent: boolean }}
 */
export function resolveAdminBreadcrumb(item, index, totalLength) {
  const isCurrent = index === totalLength - 1;
  if (!item) {
    return { label: "", href: "", isCurrent };
  }

  if (typeof item === "string") {
    const label = item.trim();
    const href = !isCurrent ? (ADMIN_CRUMB_ROUTES[label] || "") : "";
    return { label, href, isCurrent };
  }

  const label = (item.label || item.name || item.title || "").trim();
  if (item.disabled) {
    return { label, href: "", isCurrent };
  }

  const explicitHref = item.href ?? item.to ?? item.path;
  const resolvedHref =
    explicitHref !== undefined
      ? explicitHref || ""
      : !isCurrent
        ? ADMIN_CRUMB_ROUTES[label] || ""
        : "";

  return {
    label,
    href: isCurrent ? "" : resolvedHref,
    isCurrent,
  };
}

/**
 * Resolves an array of breadcrumb items.
 * @param {Array} breadcrumb
 * @returns {Array<{ label: string, href: string, isCurrent: boolean }>}
 */
export function resolveAdminBreadcrumbs(breadcrumb = []) {
  if (!Array.isArray(breadcrumb)) return [];
  const validItems = breadcrumb.filter((item) => {
    if (!item) return false;
    if (typeof item === "string") return Boolean(item.trim());
    return Boolean(item.label || item.name || item.title);
  });
  return validItems.map((item, index) =>
    resolveAdminBreadcrumb(item, index, validItems.length),
  );
}
