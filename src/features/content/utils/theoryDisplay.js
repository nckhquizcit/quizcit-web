import {
  FORMAT_BLOCKNOTE,
  parseRichTextContent,
  resolveContentFormat,
} from "../../../components/richtext/richTextUtils.js";
import { blockToPlainText } from "../../../components/richtext/richTextBlocks.js";

/**
 * Lý thuyết không có cột tiêu đề riêng trong dữ liệu — suy ra tên hiển thị từ
 * block heading đầu tiên (nội dung dạng blocknote), nếu không có thì đánh số
 * thứ tự theo vị trí trong chương.
 */
export function getTheoryDisplayTitle(theory, index) {
  const content = theory?.content ?? "";
  const format = resolveContentFormat(content, theory?.contentFormat);

  if (format === FORMAT_BLOCKNOTE) {
    const blocks = parseRichTextContent(content);
    const heading = blocks.find((block) => block?.type === "heading");
    const headingText = heading ? blockToPlainText(heading).trim() : "";
    if (headingText) return headingText;
  }

  return `Bài lý thuyết ${index + 1}`;
}
