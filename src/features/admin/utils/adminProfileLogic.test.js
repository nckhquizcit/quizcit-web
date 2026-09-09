import assert from "node:assert/strict";
import test from "node:test";
import {
  validateDisplayName,
  validateChangePassword,
  validateEmail,
  validateOtp,
} from "./adminProfileLogic.js";

test("validateDisplayName validates required and max length properly", () => {
  assert.equal(validateDisplayName(""), "Vui lòng nhập tên hiển thị.");
  assert.equal(validateDisplayName("   "), "Vui lòng nhập tên hiển thị.");
  assert.equal(validateDisplayName(null), "Vui lòng nhập tên hiển thị.");
  assert.equal(validateDisplayName("a".repeat(101)), "Tên hiển thị không được vượt quá 100 ký tự.");
  assert.equal(validateDisplayName("Admin Hệ Thống"), null);
  assert.equal(validateDisplayName("a".repeat(100)), null);
});

test("validateChangePassword validates password rules comprehensively", () => {
  assert.equal(
    validateChangePassword({ currentPassword: "", newPassword: "password123", confirmPassword: "password123" }),
    "Vui lòng nhập mật khẩu hiện tại."
  );

  assert.equal(
    validateChangePassword({ currentPassword: "oldPass", newPassword: "123", confirmPassword: "123" }),
    "Mật khẩu mới phải có ít nhất 6 ký tự."
  );

  assert.equal(
    validateChangePassword({ currentPassword: "oldPass", newPassword: "a".repeat(256), confirmPassword: "a".repeat(256) }),
    "Mật khẩu mới không được vượt quá 255 ký tự."
  );

  assert.equal(
    validateChangePassword({ currentPassword: "samePassword123", newPassword: "samePassword123", confirmPassword: "samePassword123" }),
    "Mật khẩu mới không được trùng với mật khẩu hiện tại."
  );

  assert.equal(
    validateChangePassword({ currentPassword: "oldPass", newPassword: "newPass123", confirmPassword: "wrongPass" }),
    "Mật khẩu xác nhận không khớp."
  );

  assert.equal(
    validateChangePassword({ currentPassword: "oldPass", newPassword: "newPass123", confirmPassword: "newPass123" }),
    null
  );
});

test("validateEmail checks format and difference from current email", () => {
  assert.equal(validateEmail(""), "Vui lòng nhập địa chỉ email mới.");
  assert.equal(validateEmail("notanemail"), "Địa chỉ email không đúng định dạng.");
  assert.equal(validateEmail("admin@quizcit.vn", "admin@quizcit.vn"), "Email mới phải khác email hiện tại.");
  assert.equal(validateEmail("ADMIN@quizcit.vn", "admin@quizcit.vn"), "Email mới phải khác email hiện tại.");
  assert.equal(validateEmail("newadmin@quizcit.vn", "admin@quizcit.vn"), null);
});

test("validateOtp checks 6-digit pattern", () => {
  assert.equal(validateOtp(""), "Vui lòng nhập mã xác thực OTP.");
  assert.equal(validateOtp("12345"), "Mã xác thực phải gồm đúng 6 chữ số.");
  assert.equal(validateOtp("abcdef"), "Mã xác thực phải gồm đúng 6 chữ số.");
  assert.equal(validateOtp("1234567"), "Mã xác thực phải gồm đúng 6 chữ số.");
  assert.equal(validateOtp("123456"), null);
});
