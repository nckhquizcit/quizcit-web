import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeHomeSummary } from "./homeSummary.js";

describe("normalizeHomeSummary", () => {
  it("normalizes complete backend home summary", () => {
    const summary = {
      greeting: { displayName: "Nguyễn Văn A", period: "sáng" },
      abilityOverview: { averageTheta: 1.75, skillCount: 3, abilityLevel: "Giỏi" },
      enrolledSubjects: [
        {
          subjectId: "sub-1",
          courseCode: "CS101",
          name: "Nhập môn",
          chapterCount: 2,
          unlockedChapterCount: 2,
          totalChapterCount: 4,
        },
      ],
      stats: { totalEnrolledSubjects: 1, totalUnlockedChapters: 2 },
    };

    const result = normalizeHomeSummary(summary);
    assert.equal(result.enrolledSubjects.length, 1);
    assert.equal(result.enrolledSubjects[0].subjectId, "sub-1");
    assert.equal(result.enrolledSubjects[0].chapterCount, 2);
    assert.equal(result.totalUnlockedChapters, 2);
    assert.equal(result.skillCount, 3);
    assert.equal(result.averageTheta, 1.75);
    assert.equal(result.abilityLevel, "Giỏi");
  });

  it("handles empty or null summary gracefully", () => {
    const emptyResult = normalizeHomeSummary(null);
    assert.deepEqual(emptyResult.enrolledSubjects, []);
    assert.equal(emptyResult.totalUnlockedChapters, 0);
    assert.equal(emptyResult.skillCount, 0);
    assert.equal(emptyResult.averageTheta, null);
  });

  it("returns null averageTheta when the backend sends a non-numeric value", () => {
    const result = normalizeHomeSummary({
      abilityOverview: { averageTheta: "không phải số", skillCount: 1 },
    });
    assert.equal(result.averageTheta, null);
  });
});
