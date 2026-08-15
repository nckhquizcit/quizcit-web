import { useEffect, useRef, useState } from "react";
import { Bot, X } from "lucide-react";
import { useChatSession } from "./useChatSession";
import ChatMessages from "./ChatMessages";
import ChatComposer from "./ChatComposer";
import "./ChatBox.css";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

/**
 * Trợ giảng RAG chỉ được mount trong vùng đọc lý thuyết. Phạm vi trả lời do
 * môn học quyết định, chương chỉ là ngữ cảnh nên có thể không có.
 *
 * `session` (tùy chọn): trang cha có thể truyền một phiên `useChatSession`
 * dùng chung (ví dụ TheoryPage chia sẻ hội thoại giữa dock desktop và FAB
 * mobile). Không truyền thì ChatBox tự quản lý phiên riêng như trước.
 */
export default function ChatBox({ subjectId, chapterId, session = null }) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const fabRef = useRef(null);
  const panelRef = useRef(null);
  const internalSession = useChatSession({ subjectId, chapterId });
  const { messages, draft, setDraft, loading, error, listRef, handleSend } =
    session ?? internalSession;

  useEffect(() => {
    if (!open) return undefined;
    const fabElement = fabRef.current;
    inputRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      // Trên mobile panel chiếm toàn màn hình như một dialog: giữ focus bên trong.
      if (!window.matchMedia("(max-width: 767px)").matches) return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = panel.querySelectorAll(FOCUSABLE_SELECTOR);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (event.shiftKey) {
        if (active === first || !panel.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || !panel.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      // Trả focus về nút FAB khi đóng để người dùng bàn phím không bị mất vị trí.
      if (fabElement?.isConnected) fabElement.focus();
    };
  }, [open]);

  if (!subjectId) return null;

  return (
    <div className={`chatbox-root ${open ? "chatbox-root--open" : ""}`}>
      <button
        ref={fabRef}
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
        <aside
          ref={panelRef}
          className="chatbox-panel"
          role="complementary"
          aria-label="Trợ giảng AI"
        >
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
