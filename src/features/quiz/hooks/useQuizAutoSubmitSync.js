import { useEffect, useRef } from "react";
import { clearQuizDraft, getExpiredQuizDrafts, submitAttempt } from "../../../services/quizService";

/**
 * Tự động quét và nộp các bài thi đã hết thời gian làm bài của người dùng trong nền,
 * kể cả khi họ đã thoát ra khỏi trang làm bài.
 */
export function useQuizAutoSubmitSync(currentUser, showToast) {
  const submittingRef = useRef(new Set());

  useEffect(() => {
    const userId = currentUser?.userId;
    if (!userId) return undefined;

    let isMounted = true;

    async function syncExpiredQuizzes() {
      const expiredDrafts = getExpiredQuizDrafts(userId);
      if (!expiredDrafts || expiredDrafts.length === 0) return;

      for (const draft of expiredDrafts) {
        const { attemptId, quizId, answers, quizName } = draft;
        if (!attemptId || !quizId || submittingRef.current.has(attemptId)) {
          continue;
        }

        submittingRef.current.add(attemptId);
        try {
          const answerList = Object.entries(answers || {}).map(([questionId, optionId]) => ({
            questionId,
            optionId,
          }));

          await submitAttempt({
            quizId,
            attemptId,
            answers: answerList,
          });

          clearQuizDraft(quizId, userId);
          if (isMounted && typeof showToast === "function") {
            const displayName = quizName ? `"${quizName}"` : "trắc nghiệm";
            showToast(`Bài kiểm tra ${displayName} đã hết thời gian và đã được tự động nộp.`, {
              type: "info",
              duration: 5000,
            });
          }
        } catch {
          // Nếu backend đã ghi nhận nộp hoặc lỗi attempt, xóa draft để không lặp vô tận
          clearQuizDraft(quizId, userId);
        } finally {
          submittingRef.current.delete(attemptId);
        }
      }
    }

    // Kiểm tra ngay khi mount / user thay đổi
    syncExpiredQuizzes();

    // Kiểm tra định kỳ mỗi 5 giây
    const interval = setInterval(syncExpiredQuizzes, 5000);

    // Kiểm tra khi người dùng quay lại tab trình duyệt
    const handleFocus = () => syncExpiredQuizzes();
    window.addEventListener("focus", handleFocus);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [currentUser?.userId, showToast]);
}
