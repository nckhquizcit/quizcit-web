import test from "node:test";
import assert from "node:assert/strict";
import {
  deserializeRichTextContent,
  extractPlainText,
  isRichTextEmpty,
  normalizeContentFormat,
  normalizePlainText,
  parseRichTextContent,
  serializeRichTextContent,
  splitPlainParagraphs,
  toPreviewText,
} from "./richTextUtils.js";

test("normalizes any casing or junk format down to two values", () => {
  assert.equal(normalizeContentFormat("BlockNote"), "blocknote");
  assert.equal(normalizeContentFormat("blocknote"), "blocknote");
  assert.equal(normalizeContentFormat("markdown"), "plain");
  assert.equal(normalizeContentFormat(null), "plain");
  assert.equal(normalizeContentFormat(undefined), "plain");
});

test("normalizes line endings without flattening paragraphs", () => {
  assert.equal(normalizePlainText("A\r\n\r\nB\rC"), "A\n\nB\nC");
});

test("splits plain text into non-empty paragraphs", () => {
  assert.deepEqual(splitPlainParagraphs("  A  \n\n\n B\nC "), ["A", "B\nC"]);
  assert.deepEqual(splitPlainParagraphs(null), []);
});

test("returns an empty block list for content that is not valid JSON", () => {
  assert.deepEqual(parseRichTextContent("khong phai json"), []);
  assert.deepEqual(parseRichTextContent('{"a":1}'), []);
  assert.deepEqual(parseRichTextContent(null), []);
});

test("upgrades legacy plain text into editor paragraphs", () => {
  assert.deepEqual(deserializeRichTextContent("A\n\nB", "plain"), [
    { type: "paragraph", content: "A" },
    { type: "paragraph", content: "B" },
  ]);
});

test("gives the editor one empty paragraph when there is nothing to open", () => {
  assert.deepEqual(deserializeRichTextContent("", "plain"), [{ type: "paragraph" }]);
  assert.deepEqual(deserializeRichTextContent("[]", "blocknote"), [{ type: "paragraph" }]);
});

test("serializes blocks as JSON rather than HTML", () => {
  const blocks = [{ type: "paragraph", content: [{ type: "text", text: "Bold" }] }];
  assert.equal(serializeRichTextContent(blocks), JSON.stringify(blocks));
});

test("extracts plain text from both formats", () => {
  assert.equal(extractPlainText("A\r\nB", "plain"), "A\nB");
  assert.equal(
    extractPlainText(
      JSON.stringify([
        { type: "heading", content: [{ type: "text", text: "Tieu de" }] },
        { type: "paragraph", content: [{ type: "text", text: "Noi dung" }] },
      ]),
      "blocknote",
    ),
    "Tieu de\nNoi dung",
  );
});

test("treats whitespace-only and structurally-empty content as empty", () => {
  assert.equal(isRichTextEmpty("", "plain"), true);
  assert.equal(isRichTextEmpty("   ", "plain"), true);
  assert.equal(isRichTextEmpty("[]", "blocknote"), true);
  assert.equal(isRichTextEmpty(JSON.stringify([{ type: "paragraph" }]), "blocknote"), true);
  assert.equal(
    isRichTextEmpty(JSON.stringify([{ type: "paragraph", content: "   " }]), "blocknote"),
    true,
  );
});

test("does not report real content as empty", () => {
  assert.equal(isRichTextEmpty("xin chao", "plain"), false);
  assert.equal(
    isRichTextEmpty(JSON.stringify([{ type: "paragraph", content: "Hello" }]), "blocknote"),
    false,
  );
});

test("a serialized empty document is not the empty string", () => {
  // Ly do phai co isRichTextEmpty: kiem tra chuoi rong khong con dung nua.
  const serialized = serializeRichTextContent([{ type: "paragraph" }]);
  assert.notEqual(serialized.trim(), "");
  assert.equal(isRichTextEmpty(serialized, "blocknote"), true);
});

test("collapses whitespace and truncates preview text", () => {
  assert.equal(toPreviewText("A\n\n   B", "plain"), "A B");
  assert.equal(toPreviewText("abcdef", "plain", 3), "abc…");
  assert.equal(toPreviewText("abc", "plain", 3), "abc");
  assert.equal(toPreviewText("abcdef", "plain", 0), "abcdef");
});
