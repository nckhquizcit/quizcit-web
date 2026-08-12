import { useEffect, useRef, useState } from "react";
import { Bot, X } from "lucide-react";
import { useChatSession } from "./useChatSession";
import ChatMessages from "./ChatMessages";
import ChatComposer from "./ChatComposer";
import "./ChatBox.css";

/** Trợ giảng RAG chỉ được mount trong vùng đọc lý thuyết. */
export default function ChatBox({ subjectId, chapterId }) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const { messages, draft, setDraft, loading, error, listRef, handleSend } = useChatSession({
    subjectId,
    chapterId,
  });

  useEffect(() => {
    if (!open) return undefined;
    inputRef.current?.focus();
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  if (!subjectId || !chapterId) return null;

  return (
    <div className={`chatbox-root ${open ? "chatbox-root--open" : ""}`}>
      <button
        type="button"
        className="chatbox-fab"
        onClick={() => setOpen(true)}
        aria-label="Mở trợ giảng AI"
        aria-expanded={open}
      >
        <Bot size={24} />
        <span>Hỏi AI</span>
      </button>

      {open && (
        <aside className="chatbox-panel" role="complementary" aria-label="Trợ giảng AI">
          <header className="chatbox-header">
            <div className="chatbox-title">
              <span className="chatbox-title__icon">
                <Bot size={19} />
              </span>
              <span>
                <strong>Trợ giảng AI</strong>
                <small>Hỗ trợ nội dung đã mở khóa</small>
              </span>
            </div>
            <button type="button" className="chatbox-close" onClick={() => setOpen(false)} aria-label="Đóng">
              <X size={22} />
            </button>
          </header>

          <ChatMessages
            messages={messages}
            loading={loading}
            error={error}
            listRef={listRef}
            emptyTitle="Bạn cần làm rõ phần nào?"
            emptyDescription="Mình giải thích ngắn gọn dựa trên lý thuyết bạn đã mở khóa và không cung cấp đáp án bài kiểm tra."
          />

          <ChatComposer
            draft={draft}
            setDraft={setDraft}
            loading={loading}
            onSend={handleSend}
            inputRef={inputRef}
            placeholder="Hỏi về nội dung lý thuyết..."
            hint="Enter để gửi · Shift + Enter để xuống dòng"
          />
        </aside>
      )}
    </div>
  );
}
