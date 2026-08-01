import test from "node:test";
import assert from "node:assert/strict";
import {
  deserializeTheoryContent,
  isTheoryContentEmpty,
  normalizeTheoryText,
  serializeBlockNoteContent,
  splitTheoryParagraphs,
} from "./theoryContentUtils.js";

test("normalizes line endings without flattening paragraphs", () => {
  assert.equal(normalizeTheoryText("A\r\n\r\nB\rC"), "A\n\nB\nC");
});

test("splits plain theory into non-empty paragraphs", () => {
  assert.deepEqual(splitTheoryParagraphs("  A  \n\n\n B\nC "), ["A", "B\nC"]);
});

test("handles missing content", () => {
  assert.deepEqual(splitTheoryParagraphs(null), []);
});

test("converts legacy plain text into editor paragraphs", () => {
  assert.deepEqual(deserializeTheoryContent("A\n\nB", "plain"), [
    { type: "paragraph", content: "A" },
    { type: "paragraph", content: "B" },
  ]);
});

test("serializes block content without exposing HTML", () => {
  const blocks = [{ type: "paragraph", content: [{ type: "text", text: "Bold" }] }];
  assert.equal(serializeBlockNoteContent(blocks), JSON.stringify(blocks));
});

test("detects empty and non-empty block content", () => {
  assert.equal(isTheoryContentEmpty(JSON.stringify([{ type: "paragraph" }])), true);
  assert.equal(
    isTheoryContentEmpty(JSON.stringify([{ type: "paragraph", content: "Hello" }])),
    false,
  );
});
