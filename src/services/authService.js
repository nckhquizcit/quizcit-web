import { request } from "./apiClient";
import { clearAuthSession } from "./apiClient";
import { mapUser } from "./mappers";

function mapAuthResponse(auth) {
  if (!auth) return null;
  return {
    ...mapUser(auth),
    accessToken: auth.accessToken,
    tokenType: auth.tokenType || "Bearer",
    expiresAt: auth.expiresAt,
  };
}

export async function login(identifier, password) {
  const auth = await request({
    method: "POST",
    url: "/api/auth/login",
    data: { identifier, password },
  });
  return mapAuthResponse(auth);
}

export async function register(payload) {
  const auth = await request({
    method: "POST",
    url: "/api/auth/register",
    data: payload,
  });
  return mapAuthResponse(auth);
}

export function logout() {
  clearAuthSession();
}
