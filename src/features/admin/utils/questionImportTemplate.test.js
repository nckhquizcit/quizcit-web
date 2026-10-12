import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createQuestionImportTemplate,
  createSkillsListCsv,
  createSampleDifficultiesTxt,
  createSampleSkillsTxt,
  QUESTION_IMPORT_SAMPLE_QUESTION_COUNTS,
} from "./questionImportTemplate.js";
import { parseQuestionsFromCsv, validateQuestionImportRow } from "./questionImportParser.js";
import { parseQuestionsFromAiken, parseQuestionsFromGift } from "./moodleTextParser.js";
import { parseSkillArray } from "./skillMappingParser.js";

describe("createQuestionImportTemplate", () => {
  it("creates a CSV template with question, options, answer, explanation and difficulty without repeating subject and chapter", () => {
    const csv = createQuestionImportTemplate("csv");

    assert.match(csv, /^Câu hỏi,A,B,C,D,Đáp án,Giải thích,Độ khó/m);
    assert.doesNotMatch(csv, /Môn học/);
    assert.doesNotMatch(csv, /Chương/);
    assert.doesNotMatch(csv, /Kỹ năng/);
    assert.ok(csv.includes('"HTML là viết tắt của gì?"'));
    assert.match(csv, /"0\.6"/);
  });

  it("creates samples for Moodle XML, GIFT and Aiken", () => {
    assert.match(createQuestionImportTemplate("moodle"), /<question type="multichoice">/);
    assert.match(createQuestionImportTemplate("gift"), /\$CATEGORY:[\s\S]*\{[\s\S]*=/);
    assert.match(createQuestionImportTemplate("aiken"), /ANSWER: A/);
  });

  it("question samples parse with the count recorded for their format", () => {
    const samples = {
      csv: parseQuestionsFromCsv(createQuestionImportTemplate("csv")),
      gift: parseQuestionsFromGift(createQuestionImportTemplate("gift")),
      aiken: parseQuestionsFromAiken(createQuestionImportTemplate("aiken")),
    };

    const chapterSkills = [
      { skillId: "skill-1", name: "Kỹ năng 1" },
      { skillId: "skill-2", name: "Kỹ năng 2" },
    ];

    Object.entries(samples).forEach(([format, rows]) => {
      assert.equal(rows.length, QUESTION_IMPORT_SAMPLE_QUESTION_COUNTS[format]);
      assert.ok(rows.every((row) => (row.sourceErrors || []).length === 0));

      const skills = parseSkillArray(createSampleSkillsTxt(chapterSkills, rows.length), chapterSkills);
      const difficulties = format === "csv"
        ? rows.map((row) => row.difficultyB)
        : createSampleDifficultiesTxt(rows.length).split(",").map(Number);
      assert.equal(skills.isValid, true);
      assert.equal(skills.mappings.length, rows.length);

      rows.forEach((row, index) => {
        const validation = validateQuestionImportRow({
          ...row,
          subjectId: "subject-1",
          chapterId: "chapter-1",
          difficultyB: difficulties[index],
          skills: skills.mappings[index],
        }, {
          requireSubject: true,
          requireChapter: true,
          requireDifficulty: true,
          requireSkills: true,
        });
        assert.deepEqual(validation.errors, []);
      });
    });

    const moodleXml = createQuestionImportTemplate("moodle");
    assert.equal(
      (moodleXml.match(/<question type="multichoice">/g) || []).length,
      QUESTION_IMPORT_SAMPLE_QUESTION_COUNTS.moodle,
    );
    assert.equal((moodleXml.match(/<answer fraction="100"/g) || []).length, 1);
  });
});

describe("questionImportTemplate txt & skills without ID", () => {
  it("createSkillsListCsv does not require or contain Skill ID column", () => {
    const csv = createSkillsListCsv(
      { name: "Toán" },
      [{ name: "Đại số", chapterName: "Chương 1", description: "Mô tả" }]
    );
    assert.doesNotMatch(csv, /Skill ID/);
    assert.doesNotMatch(csv, /Mã kỹ năng/);
    assert.match(csv, /"Tên kỹ năng"/);
  });

  it("creates one difficulty per sample question", () => {
    assert.equal(createSampleDifficultiesTxt(1), "0.6");
    assert.equal(createSampleDifficultiesTxt(2), "0.6, 0.2");
  });

  it("creates importable skill lines matching question count and available chapter skills", () => {
    const chapterSkills = [
      { skillId: "skill-1", name: "Kỹ năng 1" },
      { skillId: "skill-2", name: "Kỹ năng 2" },
    ];
    const txt = createSampleSkillsTxt(chapterSkills, 2);
    assert.deepEqual(txt.split("\n"), [
      "Kỹ năng 1: 1.0",
      "Kỹ năng 1: 0.6: primary, Kỹ năng 2: 0.4",
    ]);
    const parsed = parseSkillArray(txt, chapterSkills);
    assert.equal(parsed.isValid, true);
    assert.equal(parsed.mappings.length, 2);
    assert.deepEqual(parsed.mappings.map((mapping) => mapping.map((skill) => skill.skillId)), [
      ["skill-1"],
      ["skill-1", "skill-2"],
    ]);
  });

  it("reuses one real skill for every row when chapter has only one", () => {
    assert.deepEqual(
      createSampleSkillsTxt([{ name: "Kỹ năng có sẵn" }], 2).split("\n"),
      ["Kỹ năng có sẵn: 1.0", "Kỹ năng có sẵn: 1.0"],
    );
  });
});
