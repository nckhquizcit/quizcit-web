import { useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { askChatbot } from "../../services/chatbotService";
import "./ChatBox.css";

function AssistantMessage({ text }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ children, ...props }) => (
          <a {...props} target="_blank" rel="noreferrer">
            {children}
          </a>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  );
}

/** Trợ giảng RAG chỉ được mount trong vùng đọc lý thuyết. */
export default function ChatBox({ subjectId, chapterId }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, loading]);

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

  async function handleSend(event) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || loading || !subjectId) return;

    const nextMessages = [...messages, { role: "user", text: message }];
    setMessages(nextMessages);
    setDraft("");
    setError(null);
    setLoading(true);

    try {
      const history = nextMessages.slice(-6).map(({ role, text }) => ({ role, text }));
      const result = await askChatbot({ subjectId, chapterId, message, history });
      setMessages((current) => [
        ...current,
        { role: "assistant", text: result.answer, sources: result.sources },
      ]);
    } catch {
      setError("Không gửi được câu hỏi. Bạn thử lại nhé.");
    } finally {
      setLoading(false);
    }
  }

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
                <span className="chatbox-title__icon"><Sparkles size={19} /></span>
                <span><strong>Trợ giảng AI</strong><small>Hỗ trợ nội dung đã mở khóa</small></span>
              </div>
              <button type="button" className="chatbox-close" onClick={() => setOpen(false)} aria-label="Đóng">
                <X size={22} />
              </button>
            </header>

            <div className="chatbox-messages" ref={listRef}>
              {messages.length === 0 && (
                <div className="chatbox-empty">
                  <Bot size={30} />
                  <strong>Bạn cần làm rõ phần nào?</strong>
                  <p>Mình giải thích ngắn gọn dựa trên lý thuyết bạn đã mở khóa và không cung cấp đáp án bài kiểm tra.</p>
                </div>
              )}

              {messages.map((message, index) => (
                <div key={index} className={`chatbox-bubble chatbox-bubble--${message.role}`}>
                  {message.role === "assistant" ? <AssistantMessage text={message.text} /> : <p>{message.text}</p>}
                  {message.sources?.length > 0 && (
                    <div className="chatbox-sources">
                      {message.sources.map((source, sourceIndex) => (
                        <span key={sourceIndex} className="chatbox-source-chip" title={source.snippet}>
                          Nguồn {sourceIndex + 1}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="chatbox-bubble chatbox-bubble--assistant chatbox-bubble--loading" aria-label="AI đang trả lời">
                  <span className="chatbox-dot" /><span className="chatbox-dot" /><span className="chatbox-dot" />
                </div>
              )}
              {error && <div className="chatbox-error">{error}</div>}
            </div>

            <form className="chatbox-input-row" onSubmit={handleSend}>
              <textarea
                ref={inputRef}
                rows="1"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) handleSend(event);
                }}
                placeholder="Hỏi về nội dung lý thuyết..."
                disabled={loading}
              />
              <button type="submit" disabled={loading || !draft.trim()} aria-label="Gửi câu hỏi">
                <Send size={19} />
              </button>
              <small>Enter để gửi · Shift + Enter để xuống dòng</small>
            </form>
          </aside>
      )}
    </div>
  );
}
