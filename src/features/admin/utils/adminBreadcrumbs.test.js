import assert from "node:assert/strict";
import test from "node:test";
import {
  ADMIN_CRUMB_ROUTES,
  resolveAdminBreadcrumb,
  resolveAdminBreadcrumbs,
} from "./adminBreadcrumbs.js";

test("adminBreadcrumbs: resolves individual breadcrumb items correctly", () => {
  assert.deepEqual(resolveAdminBreadcrumb(null, 0, 1), {
    label: "",
    href: "",
    isCurrent: true,
  });

  assert.deepEqual(resolveAdminBreadcrumb("Môn học", 0, 2), {
    label: "Môn học",
    href: ADMIN_CRUMB_ROUTES["Môn học"],
    isCurrent: false,
  });

  assert.deepEqual(resolveAdminBreadcrumb("Môn học", 1, 2), {
    label: "Môn học",
    href: "",
    isCurrent: true,
  });

  assert.deepEqual(
    resolveAdminBreadcrumb({ label: "Custom", href: "/custom/path" }, 0, 2),
    {
      label: "Custom",
      href: "/custom/path",
      isCurrent: false,
    },
  );
});

test("adminBreadcrumbs: resolves default route for string breadcrumb when not last", () => {
  const crumbs = resolveAdminBreadcrumbs(["Tổng quan", "Môn học"]);
  assert.equal(crumbs.length, 2);
  assert.deepEqual(crumbs[0], {
    label: "Tổng quan",
    href: "/admin/dashboard",
    isCurrent: false,
  });
  assert.deepEqual(crumbs[1], {
    label: "Môn học",
    href: "",
    isCurrent: true,
  });
});

test("adminBreadcrumbs: resolves multi-level string crumbs correctly", () => {
  const crumbs = resolveAdminBreadcrumbs(["Tổng quan", "Môn học", "Chương 1"]);
  assert.equal(crumbs.length, 3);
  assert.equal(crumbs[0].href, "/admin/dashboard");
  assert.equal(crumbs[0].isCurrent, false);
  assert.equal(crumbs[1].href, "/admin/subjects");
  assert.equal(crumbs[1].isCurrent, false);
  assert.equal(crumbs[2].label, "Chương 1");
  assert.equal(crumbs[2].href, "");
  assert.equal(crumbs[2].isCurrent, true);
});

test("adminBreadcrumbs: supports explicit href and to properties", () => {
  const crumbs = resolveAdminBreadcrumbs([
    "Tổng quan",
    { label: "Môn học", href: "/admin/subjects" },
    { label: "Giải tích 1", to: "/admin/subjects/123/chapters" },
    "Chương 1",
  ]);

  assert.equal(crumbs.length, 4);
  assert.equal(crumbs[0].href, "/admin/dashboard");
  assert.equal(crumbs[1].href, "/admin/subjects");
  assert.equal(crumbs[2].href, "/admin/subjects/123/chapters");
  assert.equal(crumbs[3].isCurrent, true);
  assert.equal(crumbs[3].href, "");
});

test("adminBreadcrumbs: disabled crumb produces no link even if not last", () => {
  const crumbs = resolveAdminBreadcrumbs([
    "Tổng quan",
    { label: "Môn học", disabled: true },
    "Chương 1",
  ]);
  assert.equal(crumbs[1].href, "");
  assert.equal(crumbs[1].isCurrent, false);
});

test("adminBreadcrumbs: handles empty, null or invalid inputs gracefully", () => {
  assert.deepEqual(resolveAdminBreadcrumbs([]), []);
  assert.deepEqual(resolveAdminBreadcrumbs(null), []);
  assert.deepEqual(resolveAdminBreadcrumbs(undefined), []);

  const crumbs = resolveAdminBreadcrumbs(["Tổng quan", null, "", "   ", { label: "Môn học" }]);
  assert.equal(crumbs.length, 2);
  assert.equal(crumbs[0].label, "Tổng quan");
  assert.equal(crumbs[0].href, "/admin/dashboard");
  assert.equal(crumbs[1].label, "Môn học");
  assert.equal(crumbs[1].isCurrent, true);
});

test("adminBreadcrumbs: single crumb is marked as current", () => {
  const crumbs = resolveAdminBreadcrumbs(["Tổng quan"]);
  assert.equal(crumbs.length, 1);
  assert.deepEqual(crumbs[0], {
    label: "Tổng quan",
    href: "",
    isCurrent: true,
  });
});
