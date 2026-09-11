import test from "node:test";
import assert from "node:assert/strict";
import {
  blocknoteAsPastedMarkdown,
  getTheoryDisplayTitle,
  stripLeadingTitleBlock,
} from "./theoryDisplay.js";

const TITLE = "Chương 3. Hàm (Function)";

test("strips leading plain-text line matching the title", () => {
  const content = `${TITLE}\n\n3.1. Khái niệm\nHàm là một khối lệnh.`;
  assert.equal(
    stripLeadingTitleBlock(content, "plain", TITLE),
    "3.1. Khái niệm\nHàm là một khối lệnh."
  );
});

test("strips leading markdown heading/bold variants of the title", () => {
  assert.equal(
    stripLeadingTitleBlock(`# ${TITLE}\n\nNội dung.`, "plain", TITLE),
    "Nội dung."
  );
  assert.equal(
    stripLeadingTitleBlock(`**${TITLE}**\n\nNội dung.`, "plain", TITLE),
    "Nội dung."
  );
  // Chuẩn hóa: khác hoa/thường và khoảng trắng thừa vẫn được coi là trùng.
  assert.equal(
    stripLeadingTitleBlock(`  chương 3.   hàm (function)  \n\nNội dung.`, "plain", TITLE),
    "Nội dung."
  );
});

test("keeps plain content when first line differs from the title", () => {
  const content = "Mở đầu khác.\n\nNội dung.";
  assert.equal(stripLeadingTitleBlock(content, "plain", TITLE), content);
});

test("keeps code fences and unsafe-looking text intact after stripping", () => {
  const body = "```c\nint main(void) { return 0; }\n```\n<script>alert(1)</script>";
  const content = `${TITLE}\n\n${body}`;
  assert.equal(stripLeadingTitleBlock(content, "plain", TITLE), body);
});

test("strips first blocknote heading block matching the title", () => {
  const blocks = [
    { type: "heading", props: { level: 1 }, content: TITLE, children: [] },
    { type: "paragraph", content: "Nội dung.", children: [] },
  ];
  const result = stripLeadingTitleBlock(JSON.stringify(blocks), "blocknote", TITLE);
  assert.deepEqual(JSON.parse(result), [blocks[1]]);
});

test("keeps blocknote content when the title block is the only block", () => {
  const blocks = [{ type: "heading", props: { level: 1 }, content: TITLE, children: [] }];
  const content = JSON.stringify(blocks);
  assert.equal(stripLeadingTitleBlock(content, "blocknote", TITLE), content);
});

test("keeps blocknote content when first block does not match", () => {
  const blocks = [
    { type: "paragraph", content: "Mở đầu khác.", children: [] },
    { type: "paragraph", content: "Nội dung.", children: [] },
  ];
  const content = JSON.stringify(blocks);
  assert.equal(stripLeadingTitleBlock(content, "blocknote", TITLE), content);
});

test("detects markdown pasted into blocknote and reflows it", () => {
  const blocks = [
    { type: "paragraph", content: "Giới thiệu hàm.", children: [] },
    { type: "paragraph", content: "```c", children: [] },
    { type: "paragraph", content: "int main(void) {", children: [] },
    { type: "paragraph", content: "return 0;", children: [] },
    { type: "paragraph", content: "```", children: [] },
    { type: "paragraph", content: "Đoạn kết.", children: [] },
  ];
  assert.equal(
    blocknoteAsPastedMarkdown(JSON.stringify(blocks), "blocknote"),
    "Giới thiệu hàm.\n\n```c\nint main(void) {\nreturn 0;\n```\n\nĐoạn kết."
  );
});

test("leaves ordinary blocknote content alone (no fence pair)", () => {
  const blocks = [
    { type: "paragraph", content: "Chỉ có một dòng ``` lẻ.", children: [] },
    { type: "paragraph", content: "Nội dung thường.", children: [] },
  ];
  assert.equal(blocknoteAsPastedMarkdown(JSON.stringify(blocks), "blocknote"), null);
});

test("returns null for plain content even when it contains fences", () => {
  assert.equal(blocknoteAsPastedMarkdown("```c\nint x;\n```", "plain"), null);
});

test("derives display title from first heading of blocknote content", () => {
  const blocks = [
    { type: "paragraph", content: "Mở đầu.", children: [] },
    { type: "heading", props: { level: 1 }, content: TITLE, children: [] },
  ];
  assert.equal(getTheoryDisplayTitle({ content: JSON.stringify(blocks), contentFormat: "blocknote" }, 0), TITLE);
  assert.equal(getTheoryDisplayTitle({ content: "chỉ là chữ", contentFormat: "plain" }, 2), "Bài lý thuyết 3");
});

test("uses title directly when provided by backend", () => {
  assert.equal(getTheoryDisplayTitle({ title: "Bài 1: Giới thiệu biến", content: "" }, 0), "Bài 1: Giới thiệu biến");
  assert.equal(getTheoryDisplayTitle({ title: "  Bài 2: Vòng lặp for  " }, 1), "Bài 2: Vòng lặp for");
});
