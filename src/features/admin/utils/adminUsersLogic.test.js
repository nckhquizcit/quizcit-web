import assert from "node:assert/strict";
import test from "node:test";
import {
  formatRole,
  formatStatus,
  getInitials,
  getBackendSortParam,
  matchesSearch,
  isBackendUnfiltered,
  sortUsersList,
} from "./adminUsersLogic.js";

test("formatRole and formatStatus provide readable Vietnamese labels", () => {
  assert.equal(formatRole("ADMINISTRATOR"), "Quản trị viên");
  assert.equal(formatRole("USER"), "Người dùng");
  assert.equal(formatRole("OTHER"), "OTHER");

  assert.equal(formatStatus("VERIFIED"), "Đã xác thực");
  assert.equal(formatStatus("UNVERIFIED"), "Chưa xác thực");
  assert.equal(formatStatus("BANNED"), "Đã khóa");
  assert.equal(formatStatus("UNKNOWN"), "UNKNOWN");
});

test("getInitials extracts initials properly", () => {
  assert.equal(getInitials("Nguyen Van A"), "NA");
  assert.equal(getInitials("Admin"), "AD");
  assert.equal(getInitials(""), "?");
});

test("getBackendSortParam maps sortOption to spring sort string", () => {
  assert.equal(getBackendSortParam("ROLE_ADMIN_FIRST"), "role,asc");
  assert.equal(getBackendSortParam("ROLE_USER_FIRST"), "role,desc");
  assert.equal(getBackendSortParam("NAME_ASC"), "displayName,asc");
  assert.equal(getBackendSortParam("NAME_DESC"), "displayName,desc");
  assert.equal(getBackendSortParam("NEWEST"), "createdAt,desc");
  assert.equal(getBackendSortParam("OLDEST"), "createdAt,asc");
  assert.equal(getBackendSortParam("DEFAULT"), "createdAt,desc");
});

test("matchesSearch matches displayName, username, or email case-insensitively", () => {
  const user = {
    displayName: "Nguyễn Văn An",
    username: "vanan01",
    email: "vanan@example.com",
  };

  assert.equal(matchesSearch(user, "văn an"), true);
  assert.equal(matchesSearch(user, "VANAN01"), true);
  assert.equal(matchesSearch(user, "example.com"), true);
  assert.equal(matchesSearch(user, "unknown"), false);
  assert.equal(matchesSearch(user, ""), true);
  assert.equal(matchesSearch(user, null), true);
});

test("isBackendUnfiltered detects when backend ignored search or filter params", () => {
  const items = [
    { displayName: "User A", username: "usera", email: "a@ex.com", role: "USER", status: "VERIFIED" },
    { displayName: "Admin B", username: "adminb", email: "b@ex.com", role: "ADMINISTRATOR", status: "BANNED" },
  ];

  // Khong truyen filter gi -> backend khong bi coi la unfiltered
  assert.equal(isBackendUnfiltered(items, "", "ALL", "ALL"), false);

  // Truyen search "User A" nhung van tra ve ca Admin B -> backend cu chua loc!
  assert.equal(isBackendUnfiltered(items, "User A", "ALL", "ALL"), true);

  // Truyen role "USER" nhung van tra ve ca ADMINISTRATOR -> backend cu chua loc!
  assert.equal(isBackendUnfiltered(items, "", "USER", "ALL"), true);

  // Truyen status "VERIFIED" nhung van tra ve ca BANNED -> backend cu chua loc!
  assert.equal(isBackendUnfiltered(items, "", "ALL", "VERIFIED"), true);
});

test("sortUsersList prioritizes current user on top of list", () => {
  const users = [
    { userId: "u1", username: "user1", role: "USER" },
    { userId: "u2", username: "user2", role: "ADMINISTRATOR" },
    { userId: "admin-self", username: "admin_self", role: "ADMINISTRATOR" },
  ];

  const sorted = sortUsersList(users, "DEFAULT", "admin-self");

  // Nguoi dang xem trang (admin-self) luon duoc uu tien len dau tien
  assert.equal(sorted[0].userId, "admin-self");
  assert.equal(sorted.length, 3);
});

test("sortUsersList sorts by role with administrator first or user first", () => {
  const users = [
    { userId: "u1", username: "user1", role: "USER", displayName: "A" },
    { userId: "u2", username: "user2", role: "ADMINISTRATOR", displayName: "B" },
    { userId: "u3", username: "user3", role: "USER", displayName: "C" },
    { userId: "u4", username: "user4", role: "ADMINISTRATOR", displayName: "D" },
  ];

  const adminFirst = sortUsersList(users, "ROLE_ADMIN_FIRST", null);
  assert.equal(adminFirst[0].role, "ADMINISTRATOR");
  assert.equal(adminFirst[1].role, "ADMINISTRATOR");
  assert.equal(adminFirst[2].role, "USER");
  assert.equal(adminFirst[3].role, "USER");

  const userFirst = sortUsersList(users, "ROLE_USER_FIRST", null);
  assert.equal(userFirst[0].role, "USER");
  assert.equal(userFirst[1].role, "USER");
  assert.equal(userFirst[2].role, "ADMINISTRATOR");
  assert.equal(userFirst[3].role, "ADMINISTRATOR");
});
