import test from "node:test";
import assert from "node:assert/strict";

import { detectMoodleXml } from "./moodleXmlParser.js";

test("detects Moodle XML quiz documents", () => {
  assert.equal(detectMoodleXml('<?xml version="1.0"?><quiz><question type="multichoice"/></quiz>'), true);
  assert.equal(detectMoodleXml("\n<quiz>\n</quiz>"), true);
});

test("does not mistake CSV or arbitrary XML for Moodle XML", () => {
  assert.equal(detectMoodleXml("Câu hỏi,A,B,C,D,Đáp án"), false);
  assert.equal(detectMoodleXml("<questions><question /></questions>"), false);
});
