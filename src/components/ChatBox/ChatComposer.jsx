import { Send } from "lucide-react";

/** Ô nhập câu hỏi + nút gửi dùng chung giữa FAB nổi và panel neo. */
export default function ChatComposer({
  draft,
  setDraft,
  loading,
  onSend,
  inputRef,
  placeholder,
  hint = "",
}) {
  return (
    <form className="chatbox-input-row" onSubmit={onSend}>
      <textarea
        ref={inputRef}
        rows="1"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) onSend(event);
        }}
        placeholder={placeholder}
        disabled={loading}
      />
      <button type="submit" disabled={loading || !draft.trim()} aria-label="Gửi câu hỏi">
        <Send size={19} />
      </button>
      {hint && <small>{hint}</small>}
    </form>
  );
}
