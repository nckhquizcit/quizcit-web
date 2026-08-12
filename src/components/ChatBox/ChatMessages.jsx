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

/** Vùng hiển thị hội thoại dùng chung giữa FAB nổi và panel neo. */
export default function ChatMessages({
  messages,
  loading,
  error,
  listRef,
  emptyTitle,
  emptyDescription,
}) {
  return (
    <div className="chatbox-messages" ref={listRef}>
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
