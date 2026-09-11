import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeCatalogSummary } from "./catalogSummary.js";

describe("normalizeCatalogSummary", () => {
  it("maps catalog summary into subject collection and enrollments", () => {
    const rawCatalog = [
      {
        subjectId: "sub-1",
        courseCode: "CS101",
        name: "Lập trình C",
        openChapterCount: 3,
        totalChapterCount: 5,
        enrolled: true,
        enrolledAt: "2026-01-01T00:00:00Z",
        chapterPreview: [{ chapterId: "ch-1", name: "Cơ bản" }],
      },
      {
        subjectId: "sub-2",
        courseCode: "CS102",
        name: "Cấu trúc dữ liệu",
        openChapterCount: 0,
        totalChapterCount: 4,
        enrolled: false,
        chapterPreview: [],
      },
    ];

    const { subjectCollection, enrollments } = normalizeCatalogSummary(rawCatalog);
    assert.equal(subjectCollection.length, 2);
    assert.equal(subjectCollection[0].openChapterCount, 3);
    assert.equal(subjectCollection[0].chapterPreview[0].chapter_id, "ch-1");
    assert.equal(enrollments.length, 1);
    assert.equal(enrollments[0].subjectId, "sub-1");
  });

  it("handles non-array inputs safely", () => {
    const { subjectCollection, enrollments } = normalizeCatalogSummary(null);
    assert.deepEqual(subjectCollection, []);
    assert.deepEqual(enrollments, []);
  });
});
