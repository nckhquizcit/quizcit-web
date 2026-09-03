import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildEnrolledSubjects } from "./homeSubjects.js";

describe("buildEnrolledSubjects", () => {
  it("returns empty array when enrollments is empty or not an array", () => {
    assert.deepEqual(buildEnrolledSubjects([]), []);
    assert.deepEqual(buildEnrolledSubjects(null), []);
    assert.deepEqual(buildEnrolledSubjects(undefined), []);
  });

  it("merges enrolled subjects with catalog data and counts open chapters", () => {
    const enrollments = [
      { subjectId: "sub-1", enrolledAt: "2026-09-01T00:00:00Z" },
      { subjectId: "sub-2", enrolledAt: "2026-09-02T00:00:00Z" },
    ];

    const catalogSubjects = [
      {
        subjectId: "sub-1",
        courseCode: "CT101",
        name: "Lập trình C",
        imageUrl: "/images/c.png",
        displayOrder: 2,
      },
      {
        subjectId: "sub-2",
        courseCode: "CT102",
        name: "Cấu trúc dữ liệu",
        imageUrl: "/images/dsa.png",
        displayOrder: 1,
      },
      {
        subjectId: "sub-3",
        courseCode: "CT103",
        name: "Cơ sở dữ liệu",
        displayOrder: 3,
      },
    ];

    const openChapters = [
      { chapterId: "chap-1", subjectId: "sub-1" },
      { chapterId: "chap-2", subjectId: "sub-1" },
      { chapterId: "chap-3", subjectId: "sub-2" },
      { chapterId: "chap-4", subjectId: "sub-3" },
    ];

    const result = buildEnrolledSubjects(enrollments, catalogSubjects, openChapters);

    assert.equal(result.length, 2);
    // Sắp xếp theo displayOrder: sub-2 (displayOrder: 1), sau đó sub-1 (displayOrder: 2)
    assert.equal(result[0].subjectId, "sub-2");
    assert.equal(result[0].courseCode, "CT102");
    assert.equal(result[0].name, "Cấu trúc dữ liệu");
    assert.equal(result[0].imageUrl, "/images/dsa.png");
    assert.equal(result[0].chapterCount, 1);
    assert.equal(result[0].enrolled, true);
    assert.equal(result[0].enrolledAt, "2026-09-02T00:00:00Z");

    assert.equal(result[1].subjectId, "sub-1");
    assert.equal(result[1].courseCode, "CT101");
    assert.equal(result[1].name, "Lập trình C");
    assert.equal(result[1].imageUrl, "/images/c.png");
    assert.equal(result[1].chapterCount, 2);
    assert.equal(result[1].enrolled, true);
  });

  it("handles enrolled subjects not found in catalog gracefully", () => {
    const enrollments = [
      {
        subjectId: "sub-99",
        courseCode: "CT999",
        name: "Môn học lưu trữ",
        displayOrder: 5,
      },
    ];

    const result = buildEnrolledSubjects(enrollments, [], []);

    assert.equal(result.length, 1);
    assert.equal(result[0].subjectId, "sub-99");
    assert.equal(result[0].courseCode, "CT999");
    assert.equal(result[0].name, "Môn học lưu trữ");
    assert.equal(result[0].enrolled, true);
    assert.equal(result[0].chapterCount, 0);
  });
});
