export const ROLE_LABELS = {
  ADMINISTRATOR: "Quản trị viên",
  USER: "Người dùng",
};

export const STATUS_LABELS = {
  VERIFIED: "Đã xác thực",
  UNVERIFIED: "Chưa xác thực",
  BANNED: "Đã khóa",
};

export const STATUS_BADGE_TONE = {
  VERIFIED: "emerald",
  UNVERIFIED: "amber",
  BANNED: "red",
};

export const formatRole = (role) => ROLE_LABELS[role] || role || "Chưa có";
export const formatStatus = (status) => STATUS_LABELS[status] || status || "Chưa có";

export const getInitials = (name) => {
  const trimmed = (name || "").trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

export const getBackendSortParam = (sortOption) => {
  switch (sortOption) {
    case "ROLE_ADMIN_FIRST":
      return "role,asc";
    case "ROLE_USER_FIRST":
      return "role,desc";
    case "NAME_ASC":
      return "displayName,asc";
    case "NAME_DESC":
      return "displayName,desc";
    case "NEWEST":
      return "createdAt,desc";
    case "OLDEST":
      return "createdAt,asc";
    default:
      return "createdAt,desc";
  }
};

export const matchesSearch = (user, query) => {
  if (!query || !query.trim()) return true;
  const q = query.trim().toLowerCase();
  const name = (user.displayName || "").toLowerCase();
  const username = (user.username || "").toLowerCase();
  const email = (user.email || "").toLowerCase();
  return name.includes(q) || username.includes(q) || email.includes(q);
};

export const isBackendUnfiltered = (items, query, role, status) => {
  if (!items || items.length === 0) return false;
  if (query && query.trim()) {
    const q = query.trim().toLowerCase();
    if (items.some((u) => !matchesSearch(u, q))) return true;
  }
  if (role && role !== "ALL") {
    if (items.some((u) => u.role !== role)) return true;
  }
  if (status && status !== "ALL") {
    if (items.some((u) => u.status !== status)) return true;
  }
  return false;
};

export const sortUsersList = (list, sortOption, currentUserId) => {
  const cloned = [...list];
  cloned.sort((a, b) => {
    if (sortOption === "ROLE_ADMIN_FIRST") {
      if (a.role === b.role) return 0;
      return a.role === "ADMINISTRATOR" ? -1 : 1;
    }
    if (sortOption === "ROLE_USER_FIRST") {
      if (a.role === b.role) return 0;
      return a.role === "USER" ? -1 : 1;
    }
    if (sortOption === "NAME_ASC") {
      const nameA = a.displayName || a.username || "";
      const nameB = b.displayName || b.username || "";
      return nameA.localeCompare(nameB, "vi");
    }
    if (sortOption === "NAME_DESC") {
      const nameA = a.displayName || a.username || "";
      const nameB = b.displayName || b.username || "";
      return nameB.localeCompare(nameA, "vi");
    }
    if (sortOption === "OLDEST") {
      return (new Date(a.createdAt || 0)) - (new Date(b.createdAt || 0));
    }
    return (new Date(b.createdAt || 0)) - (new Date(a.createdAt || 0));
  });

  if (currentUserId) {
    const selfIdx = cloned.findIndex((u) => String(u.userId) === currentUserId);
    if (selfIdx > 0) {
      const selfUser = cloned.splice(selfIdx, 1)[0];
      cloned.unshift(selfUser);
    }
  }

  return cloned;
};
