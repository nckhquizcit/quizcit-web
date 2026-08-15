import { clearAuthSession, request } from "./apiClient";
import { mapUser } from "./mappers";

function mapAuthResponse(auth) {
  if (!auth) return null;
  return {
    ...mapUser(auth),
    accessToken: auth.accessToken,
    tokenType: auth.tokenType || "Bearer",
    expiresAt: auth.expiresAt,
    refreshToken: auth.refreshToken,
    refreshTokenExpiresAt: auth.refreshTokenExpiresAt,
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
  return request({
    method: "POST",
    url: "/api/auth/register",
    data: payload,
  });
}

export async function verifyEmail(verificationToken, otp) {
  const auth = await request({
    method: "POST",
    url: "/api/auth/verify",
    data: { verificationToken, otp },
  });
  return mapAuthResponse(auth);
}

export async function resendOtp(email) {
  return request({
    method: "POST",
    url: "/api/auth/resend",
    data: { email },
  });
}

export function logout() {
  const refreshToken = localStorage.getItem("refreshToken");
  clearAuthSession();
  if (refreshToken) {
    // Thu hoi refresh token phia server, that bai cung khong chan logout local.
    request({
      method: "POST",
      url: "/api/auth/logout",
      data: { refreshToken },
    }).catch(() => {});
  }
}

export async function forgotPassword(email) {
  return request({
    method: "POST",
    url: "/api/auth/forgot-password",
    data: { email },
  });
}

export async function verifyResetOtp(resetToken, otp) {
  return request({
    method: "POST",
    url: "/api/auth/verify-reset-otp",
    data: { resetToken, otp },
  });
}

export async function resetPassword(confirmedToken, newPassword) {
  const auth = await request({
    method: "POST",
    url: "/api/auth/reset-password",
    data: { confirmedToken, newPassword },
  });
  return mapAuthResponse(auth);
}
