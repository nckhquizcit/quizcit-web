import { request } from "./apiClient";
import { buildProfilePayload, getDeleteParams } from "./apiContracts";
import { mapUser } from "./mappers";

export async function getCurrentUser() {
  return mapUser(await request({ method: "GET", url: "/api/users/me" }));
}

// Email phải qua luồng OTP riêng.
export async function updateCurrentUserProfile(payload) {
  const result = await request({
    method: "PUT",
    url: "/api/users/me",
    data: buildProfilePayload(payload),
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

export async function getUsers({
  page = 0,
  size = 20,
  sort = "createdAt,desc",
  search = "",
  role = "",
  status = "",
} = {}) {
  const params = { page, size, sort };
  if (search && search.trim()) params.search = search.trim();
  if (role && role !== "ALL") params.role = role;
  if (status && status !== "ALL") params.status = status;

  const data = await request({
    method: "GET",
    url: "/api/users",
    params,
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
  return request({
    method: "DELETE",
    url: `/api/users/${userId}`,
    params: getDeleteParams(),
  });
}
