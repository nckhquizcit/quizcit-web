import { useCallback, useState } from "react";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import {
  deserializeTheoryContent,
  serializeBlockNoteContent,
  THEORY_FORMAT_BLOCKNOTE,
} from "./theoryContentUtils";

export default function TheoryEditor({
  value = "",
  contentFormat = THEORY_FORMAT_BLOCKNOTE,
  onChange,
  disabled = false,
}) {
  const [initialBlocks] = useState(() => deserializeTheoryContent(value, contentFormat));
  const editor = useCreateBlockNote({ initialContent: initialBlocks });

  const handleChange = useCallback(
    (nextEditor) => {
      onChange?.({
        content: serializeBlockNoteContent(nextEditor.document),
        contentFormat: THEORY_FORMAT_BLOCKNOTE,
      });
    },
    [onChange],
  );

  return (
    <div className="theory-editor-shell">
      <BlockNoteView
        editor={editor}
        editable={!disabled}
        onChange={handleChange}
        theme="light"
        formattingToolbar
        slashMenu
        linkToolbar
        sideMenu
        tableHandles
        emojiPicker
      />
    </div>
  );
}
