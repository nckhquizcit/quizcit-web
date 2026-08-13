import axios from "axios";
import { clearUserPreview, isUserPreviewActive } from "./userPreviewMode";

const AUTH_CHANGED_EVENT = "quizcit:auth-changed";
export const ACCESS_DENIED_MESSAGE = "Bạn không có quyền thực hiện thao tác này.";
const inFlightGets = new Map();

export class ApiError extends Error {
  constructor({ status = 0, message, data = null, validation = null, originalError = null }) {
    super(message || "Đã có lỗi xảy ra");
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.validation = validation;
    this.originalError = originalError;
    this.isNetworkError = status === 0;
  }
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
});

export function clearAuthSession() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("accessTokenExpiresAt");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  clearUserPreview();
  window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT));
}

const AUTH_TOKEN_FIELDS = [
  "accessToken",
  "refreshToken",
  "refreshTokenExpiresAt",
  "tokenType",
  "expiresAt",
];

// Luu access/refresh token rieng, user object khong duoc chua token.
export function saveAuthSession(auth) {
  if (!auth?.accessToken) return;
  localStorage.setItem("accessToken", auth.accessToken);
  if (auth.expiresAt) {
    localStorage.setItem("accessTokenExpiresAt", auth.expiresAt);
  }
  if (auth.refreshToken) {
    localStorage.setItem("refreshToken", auth.refreshToken);
  }
  const user = { ...auth };
  AUTH_TOKEN_FIELDS.forEach((field) => delete user[field]);
  setStoredUser(user);
}

export function getStoredUser() {
  try {
    const rawUser = localStorage.getItem("user");
    return rawUser ? JSON.parse(rawUser) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  if (user) {
    localStorage.setItem("user", JSON.stringify(user));
  } else {
    localStorage.removeItem("user");
  }

  window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT));
}

export function subscribeToAuthChange(callback) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(AUTH_CHANGED_EVENT, callback);
  return () => window.removeEventListener(AUTH_CHANGED_EVENT, callback);
}

function normalizeValidation(data) {
  if (!data || typeof data !== "object") return null;
  if (data.errors && typeof data.errors === "object") return data.errors;
  if (data.details && typeof data.details === "object") return data.details;
  if (data.data && typeof data.data === "object") return data.data;
  return null;
}

function normalizeApiError(error) {
  if (!error.response) {
    return new ApiError({
      status: 0,
      message: "Không thể kết nối máy chủ. Vui lòng thử lại.",
      originalError: error,
    });
  }

  const { status, data } = error.response;
  const message = data?.message || (status === 403 ? ACCESS_DENIED_MESSAGE : error.message);

  return new ApiError({
    status,
    message,
    data: data?.data ?? data,
    validation: normalizeValidation(data),
    originalError: error,
  });
}

function isAuthEndpointUrl(requestUrl) {
  if (!requestUrl) return false;

  try {
    const pathname = new URL(requestUrl, apiClient.defaults.baseURL).pathname;
    return pathname.startsWith("/api/auth/");
  } catch {
    return requestUrl.startsWith("/api/auth/");
  }
}

function isAuthEndpointRequest(error) {
  return isAuthEndpointUrl(error?.config?.url);
}

// Token con < 30s thi refresh truoc, tranh 401 giua chung voi request khong nen lap lai (OTP...).
const TOKEN_EXPIRY_BUFFER_MS = 30_000;

function isAccessTokenExpiringSoon() {
  const expiresAt = localStorage.getItem("accessTokenExpiresAt");
  if (!expiresAt) return false;
  const expiryTime = Date.parse(expiresAt);
  if (Number.isNaN(expiryTime)) return false;
  return expiryTime - Date.now() < TOKEN_EXPIRY_BUFFER_MS;
}

apiClient.interceptors.request.use(async (config) => {
  const user = getStoredUser();

  if (
    !isAuthEndpointUrl(config.url) &&
    localStorage.getItem("accessToken") &&
    localStorage.getItem("refreshToken") &&
    isAccessTokenExpiringSoon()
  ) {
    try {
      await ensureFreshSession();
    } catch {
      // De request di tiep, 401 se duoc xu ly o response interceptor.
    }
  }

  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (isUserPreviewActive(user)) {
    config.headers["X-QuizCIT-View-As"] = "USER";
  }

  return config;
});

let refreshPromise = null;

async function refreshAuthSession() {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) {
    throw new ApiError({ status: 401, message: "Phiên đăng nhập đã hết hạn." });
  }
  const baseUrl = (apiClient.defaults.baseURL || "").replace(/\/$/, "");
  // Dung axios tran de khong lap vo han qua interceptor.
  const response = await axios.post(`${baseUrl}/api/auth/refresh`, { refreshToken });
  const auth = response.data?.data;
  if (!auth?.accessToken) {
    throw new ApiError({ status: 401, message: "Phiên đăng nhập đã hết hạn." });
  }
  localStorage.setItem("accessToken", auth.accessToken);
  if (auth.expiresAt) {
    localStorage.setItem("accessTokenExpiresAt", auth.expiresAt);
  }
  if (auth.refreshToken) {
    localStorage.setItem("refreshToken", auth.refreshToken);
  }
  return auth;
}

// Single-flight: moi request 401 dong thoi cho chung mot lan refresh.
function ensureFreshSession() {
  if (!refreshPromise) {
    refreshPromise = refreshAuthSession().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

function redirectToLogin() {
  clearAuthSession();
  const currentPath = window.location.pathname;
  if (!currentPath.startsWith("/login")) {
    window.location.assign(`/login?from=${encodeURIComponent(currentPath)}`);
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const apiError = normalizeApiError(error);
    const config = error?.config;

    if (apiError.status !== 401 || isAuthEndpointRequest(error)) {
      return Promise.reject(apiError);
    }

    // Da refresh + retry ma van 401 -> tra loi ve caller.
    // _noAuthRetry: request khong duoc phep gui lai (OTP, mat khau hien tai) vi BE dem so lan thu.
    if (config?._retried || config?._noAuthRetry) {
      return Promise.reject(apiError);
    }

    if (!config || !localStorage.getItem("refreshToken")) {
      redirectToLogin();
      return Promise.reject(apiError);
    }

    try {
      await ensureFreshSession();
    } catch {
      redirectToLogin();
      return Promise.reject(apiError);
    }

    config._retried = true;
    return apiClient(config);
  },
);

async function executeRequest(config) {
  const response = await apiClient(config);
  const body = response.data;

  if (body && typeof body === "object" && "data" in body) {
    return body.data;
  }

  return body;
}

export function request(config) {
  const method = String(config?.method || "GET").toUpperCase();
  if (method !== "GET") return executeRequest(config);

  const key = JSON.stringify([
    config.url,
    config.params || null,
    localStorage.getItem("accessToken") || "",
    isUserPreviewActive(getStoredUser()),
  ]);
  if (!inFlightGets.has(key)) {
    const pending = executeRequest(config).finally(() => inFlightGets.delete(key));
    inFlightGets.set(key, pending);
  }
  return inFlightGets.get(key);
}

// Loi validation cua BE tra message chung "Du lieu khong hop le", chi tiet nam trong .validation.
function joinValidationMessages(validation) {
  if (!validation || typeof validation !== "object") return "";
  return Object.values(validation)
    .filter((message) => typeof message === "string" && message.trim())
    .join(" ");
}

export function getErrorMessage(error, fallback = "Đã có lỗi xảy ra. Vui lòng thử lại.") {
  return (
    joinValidationMessages(error?.validation) ||
    error?.message ||
    error?.response?.data?.message ||
    fallback
  );
}

export function isAccessDenied(error) {
  return error?.status === 403 || error?.response?.status === 403;
}

export function isRateLimited(error) {
  return error?.status === 429 || error?.response?.status === 429;
}

export function isNotFound(error) {
  return error?.status === 404 || error?.response?.status === 404;
}

export function isValidationError(error) {
  const status = error?.status || error?.response?.status;
  return status === 400 || status === 422;
}

export default apiClient;
