import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createQuestionImportTemplate,
  createSkillsListCsv,
  createSampleDifficultiesTxt,
  createSampleSkillsTxt,
} from "./questionImportTemplate.js";

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

  it("createSampleDifficultiesTxt returns comma separated numbers", () => {
    const txt = createSampleDifficultiesTxt();
    assert.match(txt, /1, 1\.05, 2, 3/);
  });

  it("createSampleSkillsTxt returns line-based skill format with weights", () => {
    const txt = createSampleSkillsTxt([
      { name: "Kỹ năng 1" },
      { name: "Kỹ năng 2" },
    ]);
    assert.match(txt, /Kỹ năng 1: 1\.0/);
    assert.match(txt, /Kỹ năng 1: 0\.6: primary, Kỹ năng 2: 0\.4/);
  });
});
