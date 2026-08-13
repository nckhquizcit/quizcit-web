import { useEffect, useRef, useState } from "react";
import { Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

/** Chip nguồn bấm được (bàn phím/chạm): mở trích dẫn đầy đủ ngay trong bong bóng. */
function SourceChips({ sources }) {
  const [expandedIndex, setExpandedIndex] = useState(-1);
  const expanded = expandedIndex >= 0 ? sources[expandedIndex] : null;

  return (
    <>
      <div className="chatbox-sources">
        {sources.map((source, index) => (
          <button
            key={index}
            type="button"
            className={`chatbox-source-chip ${expandedIndex === index ? "is-open" : ""}`}
            aria-expanded={expandedIndex === index}
            aria-label={`Nguồn ${index + 1}, xem trích dẫn`}
            onClick={() =>
              setExpandedIndex((current) => (current === index ? -1 : index))
            }
          >
            Nguồn {index + 1}
          </button>
        ))}
      </div>
      {expanded && (
        <p className="chatbox-source-snippet">
          {expanded.snippet || "Nguồn này không có trích dẫn."}
        </p>
      )}
    </>
  );
}

/** Vùng hiển thị hội thoại dùng chung giữa FAB nổi và panel neo. */
export default function ChatMessages({
  messages,
  loading,
  error,
  listRef,
  emptyTitle,
  emptyDescription,
}) {
  // Tự cuộn tại chỗ bằng ref cục bộ: khi hai danh sách cùng chia sẻ một phiên
  // chat (dock + FAB), mỗi danh sách vẫn tự cuộn đúng phần tử của mình.
  const localRef = useRef(null);
  const attachList = (element) => {
    localRef.current = element;
    if (listRef) listRef.current = element;
  };

  useEffect(() => {
    const element = localRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [messages, loading]);

  return (
    <div className="chatbox-messages" ref={attachList} aria-live="polite">
      {messages.length === 0 && (
        <div className="chatbox-empty">
          <Bot size={30} />
          <strong>{emptyTitle}</strong>
          <p>{emptyDescription}</p>
        </div>
      )}

      {messages.map((message, index) => (
        <div key={index} className={`chatbox-bubble chatbox-bubble--${message.role}`}>
          {message.role === "assistant" ? (
            <AssistantMessage text={message.text} />
          ) : (
            <p>{message.text}</p>
          )}
          {message.role === "assistant" && message.hasUnlockedContent === false && (
            <p className="chatbox-note">
              Bạn chưa mở khóa nội dung lý thuyết nào trong phạm vi này, nên câu trả lời có
              thể còn thiếu. Hãy học phần lý thuyết trước rồi hỏi lại nhé.
            </p>
          )}
          {message.sources?.length > 0 && <SourceChips sources={message.sources} />}
        </div>
      ))}

      {loading && (
        <div
          className="chatbox-bubble chatbox-bubble--assistant chatbox-bubble--loading"
          aria-label="AI đang trả lời"
        >
          <span className="chatbox-dot" />
          <span className="chatbox-dot" />
          <span className="chatbox-dot" />
        </div>
      )}
      {error && <div className="chatbox-error">{error}</div>}
    </div>
  );
}
