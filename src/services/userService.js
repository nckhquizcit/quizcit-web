import { request } from "./apiClient";
import { mapUser } from "./mappers";

export async function getCurrentUser() {
  return mapUser(await request({ method: "GET", url: "/api/users/me" }));
}

// BE chi cho phep doi displayName; email phai qua luong OTP rieng.
export async function updateCurrentUserProfile({ displayName }) {
  const result = await request({
    method: "PUT",
    url: "/api/users/me",
    data: { displayName },
  });
  return mapUser(result);
}

export async function changeCurrentUserPassword(currentPassword, newPassword) {
  return request({
    method: "PATCH",
    url: "/api/users/me/password",
    data: { currentPassword, newPassword },
    // 401 = sai mat khau hien tai, khong auto-refresh-retry.
    _noAuthRetry: true,
  });
}

export async function getUsers({ page = 0, size = 20, sort = "createdAt,desc" } = {}) {
  const data = await request({
    method: "GET",
    url: "/api/users",
    params: { page, size, sort },
  });
  return {
    items: (data?.content || []).map(mapUser),
    page: data?.number ?? 0,
    size: data?.size ?? size,
    totalElements: data?.totalElements ?? 0,
    totalPages: data?.totalPages ?? 0,
    first: data?.first ?? true,
    last: data?.last ?? true,
  };
}

export async function getUserById(userId) {
  return mapUser(await request({ method: "GET", url: `/api/users/${userId}` }));
}

export async function updateUserProfile(userId, { displayName }) {
  const result = await request({
    method: "PUT",
    url: `/api/users/${userId}`,
    data: { displayName },
  });
  return result ? mapUser(result) : mapUser({ userId, displayName });
}

export async function changePassword(userId, newPassword) {
  return request({
    method: "PATCH",
    url: `/api/users/${userId}/password`,
    data: { newPassword },
  });
}

export async function updateUserStatus(userId, status) {
  const result = await request({
    method: "PATCH",
    url: `/api/users/${userId}/status`,
    data: { status },
  });
  return result ? mapUser(result) : mapUser({ userId, status });
}

export async function changeUserRole(userId, role) {
  const result = await request({
    method: "PATCH",
    url: `/api/users/${userId}/role`,
    data: { role },
  });
  return result ? mapUser(result) : mapUser({ userId, role });
}

export async function deleteUser(userId) {
  return request({ method: "DELETE", url: `/api/users/${userId}` });
}
