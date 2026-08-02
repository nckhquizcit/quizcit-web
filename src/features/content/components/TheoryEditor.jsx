import RichTextEditor from "../../../components/richtext/RichTextEditor";
import { THEORY_FORMAT_BLOCKNOTE } from "./theoryContentUtils";

export default function TheoryEditor({
  value = "",
  contentFormat = THEORY_FORMAT_BLOCKNOTE,
  onChange,
  disabled = false,
}) {
  return (
    <RichTextEditor
      className="theory-editor-shell"
      value={value}
      contentFormat={contentFormat}
      onChange={onChange}
      disabled={disabled}
    />
  );
}
