import RichTextView from "../../../components/richtext/RichTextView";

/**
 * Trước đây phần hiển thị dựng một `BlockNoteView` chỉ đọc, kéo theo cả bundle
 * BlockNote vào trang của sinh viên. `RichTextView` dựng thẳng React element
 * nên nhẹ hơn nhiều và dùng chung với câu hỏi.
 */
export default function TheoryContent({ content, contentFormat = "plain", className = "" }) {
  return (
    <RichTextView
      content={content}
      contentFormat={contentFormat}
      className={`theory-rich-text ${className}`.trim()}
    />
  );
}
