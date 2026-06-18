import { request } from "./apiClient";

export async function login(identifier, password) {
  return request({
    method: "POST",
    url: "/api/auth/login",
    data: { identifier, password },
  });
}

export async function register(payload) {
  return request({
    method: "POST",
    url: "/api/auth/register",
    data: payload,
  });
}
