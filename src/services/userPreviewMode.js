const USER_PREVIEW_KEY = "quizcit:user-preview";
const ADMIN_RETURN_PATH_KEY = "quizcit:admin-return-path";
const USER_PREVIEW_CHANGED_EVENT = "quizcit:user-preview-changed";

function getSessionStorage() {
  return typeof window === "undefined" ? null : window.sessionStorage;
}

function notifyPreviewChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(USER_PREVIEW_CHANGED_EVENT));
  }
}

export function isUserPreviewActive(user) {
  if (user?.role !== "ADMINISTRATOR") return false;

  try {
    return getSessionStorage()?.getItem(USER_PREVIEW_KEY) === "true";
  } catch {
    return false;
  }
}

export function enterUserPreview(adminReturnPath = "/admin/dashboard") {
  try {
    const storage = getSessionStorage();
    storage?.setItem(USER_PREVIEW_KEY, "true");
    storage?.setItem(
      ADMIN_RETURN_PATH_KEY,
      adminReturnPath.startsWith("/admin") ? adminReturnPath : "/admin/dashboard",
    );
  } finally {
    notifyPreviewChanged();
  }
}

export function exitUserPreview() {
  let returnPath = "/admin/dashboard";

  try {
    const storage = getSessionStorage();
    const storedPath = storage?.getItem(ADMIN_RETURN_PATH_KEY);
    if (storedPath?.startsWith("/admin")) returnPath = storedPath;
    storage?.removeItem(USER_PREVIEW_KEY);
    storage?.removeItem(ADMIN_RETURN_PATH_KEY);
  } finally {
    notifyPreviewChanged();
  }

  return returnPath;
}

export function clearUserPreview() {
  try {
    const storage = getSessionStorage();
    storage?.removeItem(USER_PREVIEW_KEY);
    storage?.removeItem(ADMIN_RETURN_PATH_KEY);
  } finally {
    notifyPreviewChanged();
  }
}

export function subscribeToUserPreview(callback) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(USER_PREVIEW_CHANGED_EVENT, callback);
  return () => window.removeEventListener(USER_PREVIEW_CHANGED_EVENT, callback);
}

