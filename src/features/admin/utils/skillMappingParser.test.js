import test from "node:test";
import assert from "node:assert/strict";

import { matchSkill, normalizeSingleQuestionSkills, parseSkillArray } from "./skillMappingParser.js";

const mockSkills = [
  { skillId: "sk-1", name: "Kỹ năng lập trình" },
  { skillId: "sk-2", name: "Kỹ năng phân tích" },
  { skillId: "sk-3", name: "Kỹ năng debug" },
];

test("matchSkill finds skill by ID or name", () => {
  assert.equal(matchSkill("sk-1", mockSkills)?.name, "Kỹ năng lập trình");
  assert.equal(matchSkill("Kỹ năng phân tích", mockSkills)?.skillId, "sk-2");
  assert.equal(matchSkill("ky nang debug", mockSkills)?.skillId, "sk-3");
});

test("normalizeSingleQuestionSkills normalizes equal weights and single primary", () => {
  const single = normalizeSingleQuestionSkills(["Kỹ năng lập trình"], mockSkills);
  assert.equal(single.length, 1);
  assert.equal(single[0].skillId, "sk-1");
  assert.equal(single[0].weight, "1");
  assert.equal(single[0].primary, true);

  const multiple = normalizeSingleQuestionSkills(
    [
      { name: "Kỹ năng lập trình", weight: 0.6, primary: true },
      { name: "Kỹ năng debug", weight: 0.4, primary: false },
    ],
    mockSkills
  );
  assert.equal(multiple.length, 2);
  assert.equal(multiple[0].weight, "0.6");
  assert.equal(multiple[0].primary, true);
  assert.equal(multiple[1].weight, "0.4");
  assert.equal(multiple[1].primary, false);
});

test("parseSkillArray parses JSON array and lines", () => {
  const jsonInput = JSON.stringify([
    [{ name: "Kỹ năng lập trình", weight: 1, primary: true }],
    [
      { name: "Kỹ năng lập trình", weight: 0.7, primary: true },
      { name: "Kỹ năng debug", weight: 0.3, primary: false },
    ],
  ]);

  const jsonResult = parseSkillArray(jsonInput, mockSkills);
  assert.equal(jsonResult.isValid, true);
  assert.equal(jsonResult.mappings.length, 2);
  assert.equal(jsonResult.mappings[0][0].skillId, "sk-1");
  assert.equal(jsonResult.mappings[1][0].weight, "0.7");
  assert.equal(jsonResult.mappings[1][1].weight, "0.3");

  const lineInput = `Kỹ năng lập trình: 1.0
Kỹ năng lập trình: 0.6: primary, Kỹ năng debug: 0.4`;

  const lineResult = parseSkillArray(lineInput, mockSkills);
  assert.equal(lineResult.isValid, true);
  assert.equal(lineResult.mappings.length, 2);
  assert.equal(lineResult.mappings[0][0].skillId, "sk-1");
  assert.equal(lineResult.mappings[1][0].primary, true);
});
