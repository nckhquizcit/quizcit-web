import axios from "axios";

const AUTH_CHANGED_EVENT = "quizcit:auth-changed";
export const ACCESS_DENIED_MESSAGE = "Bạn không có quyền thực hiện thao tác này.";

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
  localStorage.removeItem("user");
  window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT));
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
  const message = status === 403 ? ACCESS_DENIED_MESSAGE : data?.message || error.message;

  return new ApiError({
    status,
    message,
    data: data?.data ?? data,
    validation: normalizeValidation(data),
    originalError: error,
  });
}

function isAuthEndpointRequest(error) {
  const requestUrl = error?.config?.url;
  if (!requestUrl) return false;

  try {
    const pathname = new URL(requestUrl, apiClient.defaults.baseURL).pathname;
    return pathname.startsWith("/api/auth/");
  } catch {
    return requestUrl.startsWith("/api/auth/");
  }
}

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError = normalizeApiError(error);

    if (apiError.status === 401 && !isAuthEndpointRequest(error)) {
      clearAuthSession();
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith("/login")) {
        window.location.assign(`/login?from=${encodeURIComponent(currentPath)}`);
      }
    }

    return Promise.reject(apiError);
  },
);

export async function request(config) {
  const response = await apiClient(config);
  const body = response.data;

  if (body && typeof body === "object" && "data" in body) {
    return body.data;
  }

  return body;
}

export function getErrorMessage(error, fallback = "Đã có lỗi xảy ra. Vui lòng thử lại.") {
  if (isAccessDenied(error)) return ACCESS_DENIED_MESSAGE;
  return error?.message || error?.response?.data?.message || fallback;
}

export function isAccessDenied(error) {
  return error?.status === 403 || error?.response?.status === 403;
}

export function isNotFound(error) {
  return error?.status === 404 || error?.response?.status === 404;
}

export function isValidationError(error) {
  const status = error?.status || error?.response?.status;
  return status === 400 || status === 422;
}

export default apiClient;
