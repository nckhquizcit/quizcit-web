import { request } from "./apiClient";

export async function requestEmailChange() {
  return request({ method: "POST", url: "/api/users/me/email-change" });
}

export async function verifyOldEmail({ challengeId, otp, newEmail }) {
  return request({
    method: "POST",
    url: "/api/users/me/email-change/verify-old",
    data: { challengeId, otp, newEmail },
    // 401 = sai OTP, khong duoc auto-retry vi BE dem so lan thu.
    _noAuthRetry: true,
  });
}

export async function confirmEmailChange({ challengeId, otp }) {
  return request({
    method: "POST",
    url: "/api/users/me/email-change/confirm",
    data: { challengeId, otp },
    _noAuthRetry: true,
  });
}
