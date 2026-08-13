import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getErrorMessage, getStoredUser } from "../../../../services/apiClient";
import { getUserAttempts } from "../../../../services/quizService";
import {
  Button,
  EmptyState,
  ErrorState,
  SkeletonCard,
} from "../../../../components/ui";
import HistoryCard from "../../components/HistoryCard/HistoryCard";
import { formatSubmittedAt } from "../../../../utils/dateFormat";
import "./HistoryPage.css";

const FALLBACK_QUIZ_NAME = "Bài kiểm tra chưa đặt tên";
const FALLBACK_SUBJECT_NAME = "Không rõ môn học";
const INVALID_SESSION_MESSAGE = "Phiên đăng nhập không hợp lệ, vui lòng đăng nhập lại.";

const isFakeQuizName = (name, quizId) => {
  const trimmedName = typeof name === "string" ? name.trim() : "";
  return !trimmedName || trimmedName === "Quiz" || (quizId && trimmedName === `Quiz ${quizId}`);
};

export default function HistoryPage() {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const user = useMemo(() => getStoredUser(), []);
  const navigate = useNavigate();
  const loadIdRef = useRef(0);

  // Tách phần tải dữ liệu thành hàm gọi lại được: effect ban đầu và nút "Thử lại" dùng chung.
  const loadHistory = useCallback(async () => {
    const loadId = ++loadIdRef.current;
    const isCurrent = () => loadIdRef.current === loadId;

    if (!user?.userId) {
      setError(INVALID_SESSION_MESSAGE);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError("");
      const attempts = (await getUserAttempts(user.userId)) || [];
      if (!isCurrent()) return;
      setHistoryData(
        attempts.map((attempt) => ({
          id: attempt.attemptId,
          title: isFakeQuizName(attempt.quizName, attempt.quizId) ? FALLBACK_QUIZ_NAME : attempt.quizName,
          subjectName: attempt.subjectName || FALLBACK_SUBJECT_NAME,
          date: formatSubmittedAt(attempt.submittedAt),
          score: Math.round(attempt.rawScore || 0),
          totalQuestions: attempt.totalQuestion,
          estimatedAbility: attempt.overallTheta,
          percentage: attempt.percentage,
        })),
      );
    } catch (loadError) {
      if (isCurrent()) setError(getErrorMessage(loadError, "Không thể tải lịch sử làm bài."));
    } finally {
      if (isCurrent()) setLoading(false);
    }
  }, [user?.userId]);

  useEffect(() => {
    loadHistory();
    return () => {
      loadIdRef.current += 1;
    };
  }, [loadHistory]);

  return (
    <div className="history-page-wrapper">
      <div className="history-page-header">
        <h1 className="history-title">Lịch sử làm bài</h1>
        <p className="history-subtitle">
          Xem lại các bài kiểm tra bạn đã hoàn thành.
        </p>
      </div>

      {loading ? (
        <div className="history-list">
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
        </div>
      ) : error ? (
        <ErrorState description={error} onRetry={loadHistory} />
      ) : historyData.length === 0 ? (
        <EmptyState
          title="Chưa có bài làm nào"
          description="Hãy bắt đầu một bài kiểm tra để xem lịch sử tại đây."
          action={<Button to="/app/subjects">Khám phá môn học</Button>}
        />
      ) : (
        <section className="history-section">
          <h2 className="history-section__title">Các bài đã hoàn thành</h2>
          <div className="history-list">
            {historyData.map((item) => (
              <HistoryCard
                key={item.id}
                {...item}
                onViewDetail={() =>
                  navigate(`/app/quiz/result/${item.id}`, {
                    state: { from: "history" },
                  })
                }
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
