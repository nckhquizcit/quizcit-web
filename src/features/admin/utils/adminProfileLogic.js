export const DISPLAY_NAME_MAX_LENGTH = 100;
export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_MAX_LENGTH = 255;
export const OTP_LENGTH = 6;
export const OTP_PATTERN = /^\d{6}$/;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateDisplayName(displayName) {
  const trimmed = (displayName || "").trim();
  if (!trimmed) {
    return "Vui lòng nhập tên hiển thị.";
  }
  if (trimmed.length > DISPLAY_NAME_MAX_LENGTH) {
    return `Tên hiển thị không được vượt quá ${DISPLAY_NAME_MAX_LENGTH} ký tự.`;
  }
  return null;
}

export function validateChangePassword({ currentPassword, newPassword, confirmPassword }) {
  if (!currentPassword) {
    return "Vui lòng nhập mật khẩu hiện tại.";
  }
  if (!newPassword || newPassword.length < PASSWORD_MIN_LENGTH) {
    return `Mật khẩu mới phải có ít nhất ${PASSWORD_MIN_LENGTH} ký tự.`;
  }
  if (newPassword.length > PASSWORD_MAX_LENGTH) {
    return `Mật khẩu mới không được vượt quá ${PASSWORD_MAX_LENGTH} ký tự.`;
  }
  if (newPassword === currentPassword) {
    return "Mật khẩu mới không được trùng với mật khẩu hiện tại.";
  }
  if (newPassword !== confirmPassword) {
    return "Mật khẩu xác nhận không khớp.";
  }
  return null;
}

export function validateEmail(email, currentEmail = "") {
  const trimmed = (email || "").trim().toLowerCase();
  if (!trimmed) {
    return "Vui lòng nhập địa chỉ email mới.";
  }
  if (!EMAIL_PATTERN.test(trimmed)) {
    return "Địa chỉ email không đúng định dạng.";
  }
  if (currentEmail && trimmed === currentEmail.trim().toLowerCase()) {
    return "Email mới phải khác email hiện tại.";
  }
  return null;
}

export function validateOtp(otp) {
  const trimmed = (otp || "").trim();
  if (!trimmed) {
    return "Vui lòng nhập mã xác thực OTP.";
  }
  if (!OTP_PATTERN.test(trimmed)) {
    return "Mã xác thực phải gồm đúng 6 chữ số.";
  }
  return null;
}
