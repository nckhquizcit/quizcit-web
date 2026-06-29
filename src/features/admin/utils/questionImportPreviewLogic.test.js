import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { filterImportSkills } from "./questionImportPreviewLogic.js";

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
