import { blocksToPlainText } from "./richTextBlocks.js";

export const FORMAT_PLAIN = "plain";
export const FORMAT_BLOCKNOTE = "blocknote";

const BLOCKNOTE_BLOCK_TYPES = new Set([
  "audio",
  "bulletListItem",
  "checkListItem",
  "codeBlock",
  "divider",
  "file",
  "heading",
  "image",
  "numberedListItem",
  "paragraph",
  "quote",
  "table",
  "toggleListItem",
  "video",
]);

export function normalizeContentFormat(value) {
  return String(value ?? "").toLowerCase() === FORMAT_BLOCKNOTE ? FORMAT_BLOCKNOTE : FORMAT_PLAIN;
}

export function normalizePlainText(value) {
  return String(value ?? "").replace(/\r\n?/g, "\n");
}

export function splitPlainParagraphs(value) {
  return normalizePlainText(value)
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function parseRichTextContent(value) {
  try {
    const blocks = JSON.parse(String(value ?? ""));
    return Array.isArray(blocks) ? blocks : [];
  } catch {
    return [];
  }
}

export function isSerializedBlockNoteContent(value) {
  const blocks = parseRichTextContent(value);

  const isBlockNoteBlock = (block) =>
    block &&
    typeof block === "object" &&
    !Array.isArray(block) &&
    typeof block.id === "string" &&
    block.id.length > 0 &&
    BLOCKNOTE_BLOCK_TYPES.has(block.type) &&
    block.props &&
    typeof block.props === "object" &&
    !Array.isArray(block.props) &&
    Array.isArray(block.children) &&
    block.children.every(isBlockNoteBlock);

  return blocks.length > 0 && blocks.every(isBlockNoteBlock);
}

export function resolveContentFormat(content, format) {
  const normalizedFormat = normalizeContentFormat(format);
  return normalizedFormat === FORMAT_BLOCKNOTE || isSerializedBlockNoteContent(content)
    ? FORMAT_BLOCKNOTE
    : FORMAT_PLAIN;
}

/**
 * Nội dung cũ dạng plain text được nâng thành các block paragraph để mở được
 * trong trình soạn thảo mà không cần migrate dữ liệu.
 */
export function deserializeRichTextContent(content, format = FORMAT_PLAIN) {
  if (resolveContentFormat(content, format) === FORMAT_BLOCKNOTE) {
    const blocks = parseRichTextContent(content);
    return blocks.length ? blocks : [{ type: "paragraph" }];
  }

  const paragraphs = splitPlainParagraphs(content);
  return paragraphs.length
    ? paragraphs.map((paragraph) => ({ type: "paragraph", content: paragraph }))
    : [{ type: "paragraph" }];
}

export function serializeRichTextContent(blocks) {
  return JSON.stringify(blocks);
}

export function extractPlainText(content, format = FORMAT_BLOCKNOTE) {
  if (resolveContentFormat(content, format) === FORMAT_PLAIN) {
    return normalizePlainText(content);
  }

  return blocksToPlainText(parseRichTextContent(content));
}

export function isRichTextEmpty(content, format = FORMAT_BLOCKNOTE) {
  return !extractPlainText(content, format).trim();
}

/**
 * Dùng cho ô bảng và danh sách: gộp mọi khoảng trắng thành một dấu cách rồi
 * cắt ngắn, để nội dung nhiều dòng không làm vỡ bố cục bảng.
 */
export function toPreviewText(content, format = FORMAT_BLOCKNOTE, maxLength = 160) {
  const text = extractPlainText(content, format).replace(/\s+/g, " ").trim();

  if (maxLength <= 0 || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}
