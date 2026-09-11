import {
  FORMAT_BLOCKNOTE,
  normalizePlainText,
  parseRichTextContent,
  resolveContentFormat,
  serializeRichTextContent,
} from "../../../components/richtext/richTextUtils.js";
import { blockToPlainText, blocksToPlainText } from "../../../components/richtext/richTextBlocks.js";

/**
 * Lý thuyết không có cột tiêu đề riêng trong dữ liệu — suy ra tên hiển thị từ
 * block heading đầu tiên (nội dung dạng blocknote), nếu không có thì đánh số
 * thứ tự theo vị trí trong chương.
 */
export function getTheoryDisplayTitle(theory, index) {
  if (theory?.title && typeof theory.title === "string" && theory.title.trim()) {
    return theory.title.trim();
  }
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

/**
 * Một số bài được soạn bằng cách paste nguyên văn markdown (kèm ```fence) vào
 * editor BlockNote, nên fence nằm trong paragraph và hiển thị thô. Nhận diện
 * trường hợp đó (nội dung blocknote chứa ít nhất một cặp fence) và trả về
 * chuỗi markdown đã reflow để render qua react-markdown; trả null nếu nội
 * dung blocknote bình thường.
 *
 * Reflow: BlockNote lưu mỗi dòng thành một block nên khi ghép lại phải chèn
 * dòng trống giữa các đoạn văn (markdown mới tách paragraph), nhưng bên trong
 * fence phải giữ nguyên từng dòng code.
 */
export function blocknoteAsPastedMarkdown(content, contentFormat) {
  if (resolveContentFormat(content, contentFormat) !== FORMAT_BLOCKNOTE) return null;

  const flat = blocksToPlainText(parseRichTextContent(content));
  const fenceCount = (flat.match(/^\s*```/gm) || []).length;
  if (fenceCount < 2) return null;

  let result = "";
  let inFence = false;
  for (const line of flat.split("\n")) {
    if (/^\s*```/.test(line)) inFence = !inFence;
    result += line;
    result += inFence ? "\n" : "\n\n";
  }
  return result.trimEnd();
}

function normalizeTitleText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim().toLowerCase();
}

/** Bỏ ký hiệu markdown bao quanh một dòng tiêu đề (#, **, __, *) trước khi so sánh. */
function stripMarkdownDecorations(line) {
  let text = String(line ?? "").trim();
  text = text.replace(/^#{1,6}\s+/, "");
  const wrappers = [/^\*\*(.+)\*\*$/, /^__(.+)__$/, /^\*(.+)\*$/];
  for (const pattern of wrappers) {
    const match = pattern.exec(text);
    if (match) text = match[1].trim();
  }
  return text.trim();
}

/**
 * Nội dung cũ thường lặp lại tên bài ở block đầu tiên, trùng với h1 của trang.
 * Bỏ heading/đoạn mở đầu khi text chuẩn hóa (trim, gộp khoảng trắng, lowercase)
 * trùng với tiêu đề bài; không trùng thì giữ nguyên nội dung.
 */
export function stripLeadingTitleBlock(content, contentFormat, title) {
  const normalizedTitle = normalizeTitleText(title);
  if (!normalizedTitle) return content;

  const format = resolveContentFormat(content, contentFormat);

  if (format === FORMAT_BLOCKNOTE) {
    const blocks = parseRichTextContent(content);
    const first = blocks[0];
    const removable =
      first &&
      (first.type === "heading" || first.type === "paragraph") &&
      (!Array.isArray(first.children) || first.children.length === 0) &&
      normalizeTitleText(blockToPlainText(first)) === normalizedTitle;

    // Giữ nguyên khi chỉ có đúng một block để không tạo ra nội dung rỗng "[]".
    if (!removable || blocks.length <= 1) return content;
    return serializeRichTextContent(blocks.slice(1));
  }

  const lines = normalizePlainText(content).split("\n");
  const firstIndex = lines.findIndex((line) => line.trim() !== "");
  if (firstIndex === -1) return content;
  if (normalizeTitleText(stripMarkdownDecorations(lines[firstIndex])) !== normalizedTitle) {
    return content;
  }

  let nextIndex = firstIndex + 1;
  while (nextIndex < lines.length && lines[nextIndex].trim() === "") nextIndex += 1;
  return lines.slice(nextIndex).join("\n");
}
