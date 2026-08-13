import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import RichTextView from "../../../components/richtext/RichTextView";
import {
  FORMAT_BLOCKNOTE,
  normalizePlainText,
  resolveContentFormat,
} from "../../../components/richtext/richTextUtils.js";
import { blocknoteAsPastedMarkdown } from "../utils/theoryDisplay.js";
import "../../../components/richtext/richtext.css";

/**
 * Nội dung BlockNote render qua RichTextView như trước. Nội dung legacy dạng
 * plain text thực chất là markdown (fence code, bullet, bold...) nên render
 * qua react-markdown + GFM thay vì tách đoạn thô. Không bật raw HTML
 * (không dùng rehype-raw) để giữ mặc định an toàn của react-markdown.
 */
const markdownComponents = {
  // Trang đã có h1 là tiêu đề bài, hạ heading của nội dung xuống một cấp.
  h1: "h2",
  h2: "h3",
  h3: "h4",
  a: ({ children, ...props }) => (
    <a {...props} target="_blank" rel="noreferrer noopener">
      {children}
    </a>
  ),
};

function MarkdownContent({ text, className }) {
  return (
    <div className={`rich-text rich-text--markdown theory-rich-text ${className}`.trim()}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {text}
      </ReactMarkdown>
    </div>
  );
}

export default function TheoryContent({ content, contentFormat = "plain", className = "" }) {
  const format = resolveContentFormat(content, contentFormat);

  if (format === FORMAT_BLOCKNOTE) {
    // Bài blocknote nhưng thực chất là markdown paste thô (có ```fence):
    // render như markdown để code/danh sách hiển thị đúng.
    const pastedMarkdown = blocknoteAsPastedMarkdown(content, contentFormat);
    if (pastedMarkdown) {
      return <MarkdownContent text={pastedMarkdown} className={className} />;
    }
    return (
      <RichTextView
        content={content}
        contentFormat={contentFormat}
        className={`theory-rich-text ${className}`.trim()}
      />
    );
  }

  const text = normalizePlainText(content).trim();
  if (!text) return null;

  return <MarkdownContent text={text} className={className} />;
}
