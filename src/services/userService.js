import { request } from "./apiClient";
import { mapUser } from "./mappers";

export async function getCurrentUser() {
  return mapUser(await request({ method: "GET", url: "/api/users/me" }));
}

export async function updateCurrentUserProfile(payload) {
  const result = await request({ method: "PUT", url: "/api/users/me", data: payload });
  return mapUser(result);
}

export async function changeCurrentUserPassword(password) {
  return request({
    method: "PATCH",
    url: "/api/users/me/password",
    data: { password },
  });
}

export async function getUsers() {
  const users = await request({ method: "GET", url: "/api/users" });
  return (users || []).map(mapUser);
}

export async function getUserById(userId) {
  return mapUser(await request({ method: "GET", url: `/api/users/${userId}` }));
}

export async function updateUserProfile(userId, payload) {
  const result = await request({ method: "PUT", url: `/api/users/${userId}`, data: payload });
  return result ? mapUser(result) : mapUser({ userId, ...payload });
}

export async function updateDisplayName(userId, displayName) {
  return updateUserProfile(userId, { displayName });
}

export async function changePassword(userId, password) {
  return request({
    method: "PATCH",
    url: `/api/users/${userId}/password`,
    data: { password },
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
