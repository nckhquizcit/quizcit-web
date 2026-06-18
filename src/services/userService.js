import { request } from "./apiClient";

export async function getUsers() {
  return request({ method: "GET", url: "/api/users" });
}

export async function getUserById(userId) {
  return request({ method: "GET", url: `/api/users/${userId}` });
}

export async function updateDisplayName(userId, displayName) {
  return request({
    method: "PUT",
    url: `/api/users/${userId}`,
    data: { displayName },
  });
}

export async function changePassword(userId, password) {
  return request({
    method: "PATCH",
    url: `/api/users/${userId}/password`,
    data: { password },
  });
}

export async function deleteUser(userId) {
  return request({ method: "DELETE", url: `/api/users/${userId}` });
}
