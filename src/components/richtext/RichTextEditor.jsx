import { useCallback, useState } from "react";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import {
  deserializeRichTextContent,
  FORMAT_BLOCKNOTE,
  serializeRichTextContent,
} from "./richTextUtils";
import "./richtext.css";

/**
 * Trình soạn thảo dùng chung cho lý thuyết, câu hỏi, đáp án và giải thích.
 *
 * Không truyền `uploadFile` cho BlockNote là có chủ đích: khi thiếu prop đó,
 * bảng chèn ảnh chỉ còn tab dán URL. Backend chưa có endpoint upload nên đây
 * là cách duy nhất để chèn ảnh mà không phình dữ liệu bằng base64.
 *
 * `variant="inline"` dùng cho ô đáp án: bỏ side menu và tay cầm bảng để ô gọn
 * lại, nhưng vẫn giữ slash menu để chèn được ảnh và khối code.
 */
export default function RichTextEditor({
  value = "",
  contentFormat = FORMAT_BLOCKNOTE,
  onChange,
  disabled = false,
  variant = "block",
  className = "",
}) {
  const [initialBlocks] = useState(() => deserializeRichTextContent(value, contentFormat));
  const editor = useCreateBlockNote({ initialContent: initialBlocks });
  const inline = variant === "inline";

  const handleChange = useCallback(
    (nextEditor) => {
      onChange?.({
        content: serializeRichTextContent(nextEditor.document),
        contentFormat: FORMAT_BLOCKNOTE,
      });
    },
    [onChange],
  );

  const classes = ["rich-text-editor", `rich-text-editor--${variant}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      <BlockNoteView
        editor={editor}
        editable={!disabled}
        onChange={handleChange}
        theme="light"
        formattingToolbar
        slashMenu
        linkToolbar
        sideMenu={!inline}
        tableHandles={!inline}
        emojiPicker={!inline}
      />
    </div>
  );
}
