import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { filterImportSkills, getImportSkillsForChapter } from "./questionImportPreviewLogic.js";

const skills = [
  { skillId: "skill-logic", name: "Tư duy logic" },
  { skillId: "skill-array", name: "Mảng một chiều" },
  { id: "SKILL-LOOP", name: "Vòng lặp" },
];

describe("filterImportSkills", () => {
  it("returns all skills when search is empty", () => {
    assert.deepEqual(filterImportSkills(skills, ""), skills);
  });

  it("filters skills by case-insensitive name", () => {
    assert.deepEqual(filterImportSkills(skills, "logic"), [skills[0]]);
  });

  it("filters skills by skillId or id", () => {
    assert.deepEqual(filterImportSkills(skills, "loop"), [skills[2]]);
  });

  it("returns an empty list when nothing matches", () => {
    assert.deepEqual(filterImportSkills(skills, "khong-co"), []);
  });
});

describe("getImportSkillsForChapter", () => {
  it("returns only skills assigned to the selected chapter", () => {
    const chapterSkills = [{ skillId: "skill-logic", name: "Tư duy logic" }];
    const chapters = [
      { chapterId: "chapter-1", skills: chapterSkills },
      { chapterId: "chapter-2", skills: [{ skillId: "skill-array", name: "Mảng" }] },
    ];

    assert.deepEqual(getImportSkillsForChapter(chapters, "chapter-1"), chapterSkills);
  });

  it("returns no skills when chapter is missing", () => {
    assert.deepEqual(getImportSkillsForChapter([], "chapter-1"), []);
  });
});
