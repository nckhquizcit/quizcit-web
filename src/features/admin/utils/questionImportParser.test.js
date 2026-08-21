import test from "node:test";
import assert from "node:assert/strict";

import {
  createQuestionImportRow,
  parseQuestionsFromCsv,
  parseQuestionsFromText,
  validateQuestionImportRow,
} from "./questionImportParser.js";

test("validateQuestionImportRow requires difficulty by default", () => {
  const rowWithoutDiff = {
    content: "Câu hỏi test",
    options: [{ key: "A", content: "Đúng" }, { key: "B", content: "Sai" }],
    correctKey: "A",
    subjectId: "sub-1",
    chapterId: "chap-1",
    difficultyB: null,
    difficulty: "",
  };

  const validation = validateQuestionImportRow(rowWithoutDiff);
  assert.equal(validation.errors.includes("Chưa nhập độ khó câu hỏi."), true);

  const rowWithDiff = {
    ...rowWithoutDiff,
    difficultyB: 1.05,
    difficulty: "CUSTOM",
  };
  const validResult = validateQuestionImportRow(rowWithDiff);
  assert.equal(validResult.errors.includes("Chưa nhập độ khó câu hỏi."), false);
});

test("createQuestionImportRow leaves difficulty null when not provided", () => {
  const row = createQuestionImportRow({
    content: "Câu hỏi mẫu",
    options: [{ key: "A", content: "1" }, { key: "B", content: "2" }],
    correctKey: "A",
    subjectId: "sub-1",
    chapterId: "chap-1",
  });

  assert.equal(row.difficultyB, null);
  assert.equal(row.difficulty, "");
});

test("parseQuestionsFromText parses difficulty when present and leaves empty when absent", () => {
  const textWithDiff = `Câu 1: HTML là gì?
A. Ngôn ngữ markup
B. Ngôn ngữ lập trình
Đáp án: A
Độ khó: 1.05`;

  const [row1] = parseQuestionsFromText(textWithDiff);
  assert.equal(row1.difficultyB, 1.05);

  const textWithoutDiff = `Câu 1: HTML là gì?
A. Ngôn ngữ markup
B. Ngôn ngữ lập trình
Đáp án: A`;

  const [row2] = parseQuestionsFromText(textWithoutDiff);
  assert.equal(row2.difficultyB, null);
  assert.equal(row2.difficulty, "");
});
