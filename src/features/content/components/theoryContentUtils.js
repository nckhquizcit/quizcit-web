/**
 * Lý thuyết dùng chung hạ tầng rich text với câu hỏi và đáp án.
 * Module này chỉ còn là lớp bọc giữ lại tên cũ cho các chỗ đang import.
 * Code mới nên import thẳng từ `src/components/richtext`.
 */
import {
  deserializeRichTextContent,
  extractPlainText,
  FORMAT_BLOCKNOTE,
  FORMAT_PLAIN,
  isRichTextEmpty,
  normalizePlainText,
  parseRichTextContent,
  serializeRichTextContent,
  splitPlainParagraphs,
} from "../../../components/richtext/richTextUtils.js";

export const THEORY_FORMAT_PLAIN = FORMAT_PLAIN;
export const THEORY_FORMAT_BLOCKNOTE = FORMAT_BLOCKNOTE;

export const normalizeTheoryText = normalizePlainText;
export const splitTheoryParagraphs = splitPlainParagraphs;
export const parseBlockNoteContent = parseRichTextContent;
export const deserializeTheoryContent = deserializeRichTextContent;
export const serializeBlockNoteContent = serializeRichTextContent;
export const isTheoryContentEmpty = isRichTextEmpty;
export const extractTheoryPlainText = extractPlainText;
