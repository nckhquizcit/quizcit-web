import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import {
  deserializeTheoryContent,
  splitTheoryParagraphs,
  THEORY_FORMAT_BLOCKNOTE,
} from "./theoryContentUtils";

function PlainTheoryContent({ content, className }) {
  const paragraphs = splitTheoryParagraphs(content);

  if (!paragraphs.length) return null;

  return (
    <div className={`theory-rich-text ${className}`.trim()}>
      {paragraphs.map((paragraph, index) => (
        <p key={`${index}-${paragraph.slice(0, 12)}`}>{paragraph}</p>
      ))}
    </div>
  );
}

function BlockNoteTheoryContent({ content, className }) {
  const editor = useCreateBlockNote({
    initialContent: deserializeTheoryContent(content, THEORY_FORMAT_BLOCKNOTE),
  });

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
  if (contentFormat === THEORY_FORMAT_BLOCKNOTE) {
    return <BlockNoteTheoryContent content={content} className={className} />;
  }

  return <PlainTheoryContent content={content} className={className} />;
}
