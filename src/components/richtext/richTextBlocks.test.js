import test from "node:test";
import assert from "node:assert/strict";
import {
  blocksToPlainText,
  blockToPlainText,
  groupBlocks,
  isTableContent,
  resolveImageSrc,
  resolveLinkHref,
  segmentsToText,
  toInlineSegments,
  toTableRows,
} from "./richTextBlocks.js";

test("keeps http and https image sources", () => {
  assert.equal(resolveImageSrc("https://cdn.example.com/a.png"), "https://cdn.example.com/a.png");
  assert.equal(resolveImageSrc("http://example.com/a.png"), "http://example.com/a.png");
});

test("keeps relative image paths, which carry no scheme", () => {
  assert.equal(resolveImageSrc("/uploads/a.png"), "/uploads/a.png");
  assert.equal(resolveImageSrc("images/a.png"), "images/a.png");
});

test("drops image sources that could execute or inline data", () => {
  assert.equal(resolveImageSrc("javascript:alert(1)"), "");
  assert.equal(resolveImageSrc("JavaScript:alert(1)"), "");
  assert.equal(resolveImageSrc("data:image/svg+xml;base64,PHN2Zz48L3N2Zz4="), "");
  assert.equal(resolveImageSrc("  "), "");
  assert.equal(resolveImageSrc(null), "");
});

test("allows mailto and tel links but not scripts", () => {
  assert.equal(resolveLinkHref("mailto:a@b.com"), "mailto:a@b.com");
  assert.equal(resolveLinkHref("tel:+8490"), "tel:+8490");
  assert.equal(resolveLinkHref("javascript:alert(1)"), "");
});

test("reads inline content given as a bare string", () => {
  assert.deepEqual(toInlineSegments("Xin chao"), [{ text: "Xin chao", styles: {}, href: "" }]);
  assert.deepEqual(toInlineSegments(""), []);
  assert.deepEqual(toInlineSegments(null), []);
});

test("keeps styles and flattens links onto their text", () => {
  const segments = toInlineSegments([
    { type: "text", text: "A", styles: { bold: true } },
    { type: "link", href: "https://x.dev", content: [{ type: "text", text: "B", styles: {} }] },
  ]);

  assert.deepEqual(segments, [
    { text: "A", styles: { bold: true }, href: "" },
    { text: "B", styles: {}, href: "https://x.dev" },
  ]);
});

test("strips the href of a link that uses an unsafe scheme", () => {
  const segments = toInlineSegments([
    { type: "link", href: "javascript:alert(1)", content: [{ type: "text", text: "B" }] },
  ]);

  assert.equal(segments[0].href, "");
  assert.equal(segments[0].text, "B");
});

test("recognises table content and reads its cells", () => {
  const content = {
    type: "tableContent",
    rows: [
      { cells: [[{ type: "text", text: "a" }], [{ type: "text", text: "b" }]] },
      { cells: [{ type: "tableCell", content: [{ type: "text", text: "c" }] }] },
    ],
  };

  assert.equal(isTableContent(content), true);
  assert.equal(isTableContent([]), false);

  const rows = toTableRows(content);
  assert.equal(rows.length, 2);
  assert.equal(segmentsToText(rows[0][0]), "a");
  assert.equal(segmentsToText(rows[0][1]), "b");
  assert.equal(segmentsToText(rows[1][0]), "c");
});

test("uses the caption as the plain text of an image block", () => {
  assert.equal(
    blockToPlainText({ type: "image", props: { url: "https://x/a.png", caption: "Hinh 1" } }),
    "Hinh 1",
  );
});

test("joins table cells with tabs and rows with newlines", () => {
  const block = {
    type: "table",
    content: {
      rows: [
        { cells: [[{ type: "text", text: "a" }], [{ type: "text", text: "b" }]] },
        { cells: [[{ type: "text", text: "c" }], [{ type: "text", text: "d" }]] },
      ],
    },
  };

  assert.equal(blockToPlainText(block), "a\tb\nc\td");
});

test("walks nested children when flattening blocks to text", () => {
  const blocks = [
    {
      type: "paragraph",
      content: [{ type: "text", text: "cha" }],
      children: [{ type: "paragraph", content: [{ type: "text", text: "con" }] }],
    },
    { type: "paragraph", content: [] },
    { type: "paragraph", content: [{ type: "text", text: "sau" }] },
  ];

  assert.equal(blocksToPlainText(blocks), "cha\ncon\nsau");
});

test("survives malformed block arrays", () => {
  assert.equal(blocksToPlainText(null), "");
  assert.equal(blocksToPlainText([null, "x", 3]), "");
  assert.equal(blockToPlainText(undefined), "");
});

test("merges adjacent list items of the same type into one group", () => {
  const groups = groupBlocks([
    { type: "paragraph", id: "p" },
    { type: "bulletListItem", id: "b1" },
    { type: "bulletListItem", id: "b2" },
    { type: "numberedListItem", id: "n1" },
    { type: "bulletListItem", id: "b3" },
  ]);

  assert.deepEqual(
    groups.map((group) => (group.kind === "list" ? `${group.listType}:${group.items.length}` : "block")),
    ["block", "bullet:2", "numbered:1", "bullet:1"],
  );
});

test("treats checklist items as their own group type", () => {
  const groups = groupBlocks([
    { type: "checkListItem", props: { checked: true } },
    { type: "checkListItem", props: { checked: false } },
  ]);

  assert.equal(groups.length, 1);
  assert.equal(groups[0].listType, "check");
  assert.equal(groups[0].items.length, 2);
});
