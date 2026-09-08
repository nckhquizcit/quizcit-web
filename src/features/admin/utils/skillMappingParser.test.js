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

test("matchSkill matches skill name case-insensitively without needing ID", () => {
  assert.equal(matchSkill("kỹ năng lập trình", mockSkills)?.skillId, "sk-1");
  assert.equal(matchSkill("KỸ NĂNG PHÂN TÍCH", mockSkills)?.skillId, "sk-2");
  assert.equal(matchSkill("  kỹ năng debug  ", mockSkills)?.skillId, "sk-3");
});

test("parseSkillArray handles comments in txt input", () => {
  const lineInputWithComments = `# Danh sach kỹ năng
// Câu 1:
kỹ năng lập trình: 1.0
# Câu 2:
kỹ năng phân tích: 0.6: primary, kỹ năng debug: 0.4`;

  const result = parseSkillArray(lineInputWithComments, mockSkills);
  assert.equal(result.isValid, true);
  assert.equal(result.mappings.length, 2);
  assert.equal(result.mappings[0][0].name, "Kỹ năng lập trình");
  assert.equal(result.mappings[1][0].name, "Kỹ năng phân tích");
  assert.equal(result.mappings[1][1].name, "Kỹ năng debug");
});

test("parseSkillArray correctly handles commas inside skill names (parentheses, quotes, or colons)", () => {
  const advancedSkills = [
    { skillId: "sk-c-syntax", name: "Phân tích cú pháp C (biến, main, biên dịch)" },
    { skillId: "sk-pointers", name: "Con trỏ và bộ nhớ (malloc, free)" },
    { skillId: "sk-cpp-oop", name: "C++: Lập trình OOP (kế thừa, đa hình)" },
    { skillId: "sk-graphics", name: "Đồ họa 2D, 3D" },
  ];

  // 1. Single skill with internal commas in parentheses
  const input1 = "Phân tích cú pháp C (biến, main, biên dịch): 1.0";
  const result1 = parseSkillArray(input1, advancedSkills);
  assert.equal(result1.isValid, true);
  assert.equal(result1.mappings.length, 1);
  assert.equal(result1.mappings[0].length, 1);
  assert.equal(result1.mappings[0][0].name, "Phân tích cú pháp C (biến, main, biên dịch)");
  assert.equal(result1.mappings[0][0].skillId, "sk-c-syntax");
  assert.equal(result1.mappings[0][0].weight, "1");
  assert.equal(result1.mappings[0][0].primary, true);

  // 2. Multiple skills on one line, each with internal commas in parentheses
  const input2 = "Phân tích cú pháp C (biến, main, biên dịch): 0.6: primary, Con trỏ và bộ nhớ (malloc, free): 0.4";
  const result2 = parseSkillArray(input2, advancedSkills);
  assert.equal(result2.isValid, true);
  assert.equal(result2.mappings.length, 1);
  assert.equal(result2.mappings[0].length, 2);
  assert.equal(result2.mappings[0][0].name, "Phân tích cú pháp C (biến, main, biên dịch)");
  assert.equal(result2.mappings[0][0].weight, "0.6");
  assert.equal(result2.mappings[0][0].primary, true);
  assert.equal(result2.mappings[0][1].name, "Con trỏ và bộ nhớ (malloc, free)");
  assert.equal(result2.mappings[0][1].weight, "0.4");
  assert.equal(result2.mappings[0][1].primary, false);

  // 3. Skill name with colons and parentheses
  const input3 = "C++: Lập trình OOP (kế thừa, đa hình): 1.0";
  const result3 = parseSkillArray(input3, advancedSkills);
  assert.equal(result3.isValid, true);
  assert.equal(result3.mappings[0][0].name, "C++: Lập trình OOP (kế thừa, đa hình)");
  assert.equal(result3.mappings[0][0].skillId, "sk-cpp-oop");

  // 4. Skill name with quotes containing commas
  const input4 = '"Phân tích cú pháp C (biến, main, biên dịch)": 1.0';
  const result4 = parseSkillArray(input4, advancedSkills);
  assert.equal(result4.isValid, true);
  assert.equal(result4.mappings[0][0].name, "Phân tích cú pháp C (biến, main, biên dịch)");

  // 5. Skill name with comma matching directly without quotes
  const input5 = "Đồ họa 2D, 3D: 1.0";
  const result5 = parseSkillArray(input5, advancedSkills);
  assert.equal(result5.isValid, true);
  assert.equal(result5.mappings[0][0].name, "Đồ họa 2D, 3D");
  assert.equal(result5.mappings[0][0].skillId, "sk-graphics");
});
