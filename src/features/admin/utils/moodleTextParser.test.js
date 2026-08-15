import test from "node:test";
import assert from "node:assert/strict";

import {
  detectAiken,
  detectGift,
  parseQuestionsFromAiken,
  parseQuestionsFromGift,
} from "./moodleTextParser.js";

test("parses an Aiken question with one correct answer", () => {
  const source = `Thủ đô Việt Nam là gì?
A. Hà Nội
B. Huế
C. Đà Nẵng
D. Cần Thơ
ANSWER: A`;
  assert.equal(detectAiken(source), true);
  const [row] = parseQuestionsFromAiken(source);
  assert.equal(row.content, "Thủ đô Việt Nam là gì?");
  assert.equal(row.correctKey, "A");
  assert.deepEqual(row.sourceErrors, []);
});

test("reports an Aiken ANSWER that does not match its options", () => {
  const [row] = parseQuestionsFromAiken(`Câu hỏi?\nA. Một\nB. Hai\nANSWER: D`);
  assert.match(row.sourceErrors.join(" "), /không khớp/);
});

test("parses GIFT title, category and general feedback", () => {
  const source = `$CATEGORY: Chương 1

::Câu mẫu::2 + 2 bằng bao nhiêu? {=4 ~3 ~5 ####Bốn là đáp án đúng.}`;
  assert.equal(detectGift(source), true);
  const [row] = parseQuestionsFromGift(source);
  assert.equal(row.moodleName, "Câu mẫu");
  assert.equal(row.moodleCategory, "Chương 1");
  assert.equal(row.correctKey, "A");
  assert.equal(row.explanation, "Bốn là đáp án đúng.");
  assert.deepEqual(row.sourceErrors, []);
});

test("rejects GIFT questions with multiple positive answers", () => {
  const [row] = parseQuestionsFromGift(`Nhiều đáp án {~%50%A ~%50%B ~%-50%C}`);
  assert.match(row.sourceErrors.join(" "), /nhiều đáp án đúng/);
});

test("keeps escaped GIFT control characters", () => {
  const [row] = parseQuestionsFromGift(`Ký hiệu \\{x\\} {=Đúng \\= rồi ~Sai}`);
  assert.equal(row.content, "Ký hiệu {x}");
  assert.equal(row.options[0].content, "Đúng = rồi");
});

test("converts GIFT true-false questions to the current option model", () => {
  const [row] = parseQuestionsFromGift(`Trái Đất hình cầu. {TRUE}`);
  assert.equal(row.options[0].content, "Đúng");
  assert.equal(row.options[1].content, "Sai");
  assert.equal(row.correctKey, "A");
  assert.deepEqual(row.sourceErrors, []);
});
