import { blocksToPlainText } from "./richTextBlocks.js";

export const FORMAT_PLAIN = "plain";
export const FORMAT_BLOCKNOTE = "blocknote";

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

/**
 * Nội dung cũ dạng plain text được nâng thành các block paragraph để mở được
 * trong trình soạn thảo mà không cần migrate dữ liệu.
 */
export function deserializeRichTextContent(content, format = FORMAT_PLAIN) {
  if (normalizeContentFormat(format) === FORMAT_BLOCKNOTE) {
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
  if (normalizeContentFormat(format) === FORMAT_PLAIN) {
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
