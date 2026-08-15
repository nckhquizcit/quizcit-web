import { request } from "./apiClient";

/**
 * Gửi câu hỏi lý thuyết cho chatbox RAG.
 *
 * @param {Object} params
 * @param {string} params.subjectId  môn học đang xem — dùng để xác định phạm
 *                                   vi chương đã mở khóa (giới hạn RAG)
 * @param {string} [params.chapterId] chương hiện tại (optional, chỉ ưu tiên
 *                                    ngữ cảnh, không giới hạn phạm vi; bỏ khỏi
 *                                    payload khi người dùng chưa chọn chương)
 * @param {string} params.message   câu hỏi của sinh viên
 * @param {Array<{role: "user"|"assistant", text: string}>} [params.history]
 *        lịch sử hội thoại gần đây (FE tự giữ state, gửi kèm mỗi lần hỏi)
 */
export async function askChatbot({ subjectId, chapterId, message, history = [] }) {
  const response = await request({
    method: "POST",
    url: "/api/chatbot/ask",
    data: {
      subjectId,
      ...(chapterId ? { chapterId } : {}),
      message,
      history,
    },
  });

  return {
    answer: response?.answer ?? "",
    sources: response?.sources ?? [],
    hasUnlockedContent: response?.hasUnlockedContent ?? false,
  };
}
