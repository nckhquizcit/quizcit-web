import { useMemo } from "react";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import {
  deserializeRichTextContent,
  FORMAT_BLOCKNOTE,
  isRichTextEmpty,
  normalizePlainText,
  resolveContentFormat,
} from "../../../components/richtext/richTextUtils.js";
import { richTextSchema } from "../../../components/richtext/richTextSchema.js";
import "../../../components/richtext/richtext.css";

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

function BlockNoteTheoryContent({ content, className = "" }) {
  const blocks = useMemo(
    () => deserializeRichTextContent(content, FORMAT_BLOCKNOTE),
    [content]
  );
  const editor = useCreateBlockNote(
    {
      initialContent: blocks,
      schema: richTextSchema,
    },
    [blocks]
  );

  return (
    <div className={`theory-rich-text theory-rich-text--blocknote ${className}`.trim()}>
      <BlockNoteView
        editor={editor}
        editable={false}
        theme="light"
        formattingToolbar={false}
        slashMenu={false}
        linkToolbar={false}
        sideMenu={false}
        tableHandles={false}
        emojiPicker={false}
      />
    </div>
  );
}

export default function TheoryContent({ content, contentFormat = "plain", className = "" }) {
  const format = resolveContentFormat(content, contentFormat);

  if (isRichTextEmpty(content, format)) {
    return null;
  }

  if (format === FORMAT_BLOCKNOTE) {
    return <BlockNoteTheoryContent key={content} content={content} className={className} />;
  }

  const text = normalizePlainText(content).trim();
  if (!text) return null;

  return <MarkdownContent text={text} className={className} />;
}

