import { useEffect, useRef, useState } from "react";
import { askChatbot } from "../../services/chatbotService";

/**
 * Logic hội thoại dùng chung giữa FAB nổi (ChatBox) và panel neo trong trang
 * đọc lý thuyết — chỉ khác nhau ở phần khung/hiển thị.
 */
export function useChatSession({ subjectId, chapterId }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, loading]);

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
        {
          role: "assistant",
          text: result.answer,
          sources: result.sources,
          hasUnlockedContent: result.hasUnlockedContent,
        },
      ]);
    } catch {
      setError("Không gửi được câu hỏi. Bạn thử lại nhé.");
    } finally {
      setLoading(false);
    }
  }

  return { messages, draft, setDraft, loading, error, listRef, handleSend };
}
