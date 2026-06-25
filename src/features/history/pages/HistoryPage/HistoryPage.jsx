import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getErrorMessage, getStoredUser } from "../../../../services/apiClient";
import { getQuizById, getUserAttempts } from "../../../../services/quizService";
import { getSubjectById } from "../../../../services/subjectService";
import {
  EmptyState,
  ErrorState,
  SkeletonCard,
} from "../../../../components/ui";
import HistoryCard from "../../components/HistoryCard/HistoryCard";
import "./HistoryPage.css";

const FALLBACK_QUIZ_NAME = "Chưa có tên bài quiz";
const FALLBACK_SUBJECT_NAME = "Không rõ môn học";
const FALLBACK_DATE = "—";
const submittedAtFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
});

const isFakeQuizName = (name, quizId) => {
  const trimmedName = typeof name === "string" ? name.trim() : "";
  return !trimmedName || trimmedName === "Quiz" || (quizId && trimmedName === `Quiz ${quizId}`);
};

const isMissingQuizName = (name, quizId) => isFakeQuizName(name, quizId) || name === FALLBACK_QUIZ_NAME;
const isMissingSubjectName = (name) => {
  const trimmedName = typeof name === "string" ? name.trim() : "";
  return !trimmedName || trimmedName === FALLBACK_SUBJECT_NAME;
};

const formatSubmittedAt = (value) => {
  if (!value) return FALLBACK_DATE;

  const submittedDate = new Date(value);
  return Number.isNaN(submittedDate.getTime()) ? FALLBACK_DATE : submittedAtFormatter.format(submittedDate);
};

async function resolveAttemptMetadata(attempts) {
  const quizIds = [...new Set(attempts.map((attempt) => attempt.quizId).filter(Boolean))];
  const quizEntries = await Promise.all(
    quizIds.map(async (quizId) => {
      try {
        return [quizId, await getQuizById(quizId)];
      } catch {
        return [quizId, null];
      }
    }),
  );
  const quizById = new Map(quizEntries);
  const subjectIds = [
    ...new Set(
      quizEntries
        .map(([, quiz]) => quiz?.subjectId)
        .filter(Boolean),
    ),
  ];
  const subjectEntries = await Promise.all(
    subjectIds.map(async (subjectId) => {
      try {
        return [subjectId, await getSubjectById(subjectId)];
      } catch {
        return [subjectId, null];
      }
    }),
  );
  const subjectById = new Map(subjectEntries);

  return attempts.map((attempt) => {
    const quiz = quizById.get(attempt.quizId);
    const subject = quiz?.subjectId ? subjectById.get(quiz.subjectId) : null;

    return {
      ...attempt,
      quizName: isMissingQuizName(attempt.quizName, attempt.quizId)
        ? quiz?.name || FALLBACK_QUIZ_NAME
        : attempt.quizName,
      subjectName: isMissingSubjectName(attempt.subjectName)
        ? subject?.name || FALLBACK_SUBJECT_NAME
        : attempt.subjectName,
    };
  });
}

export default function HistoryPage() {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const user = useMemo(() => getStoredUser(), []);
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;

    async function loadHistory() {
      if (!user?.userId) return;
      try {
        setLoading(true);
        setError("");
        const attempts = (await getUserAttempts(user.userId)) || [];
        const resolvedAttempts = await resolveAttemptMetadata(attempts);
        if (!alive) return;
        setHistoryData(
          resolvedAttempts.map((attempt) => ({
            id: attempt.attemptId,
            title: isFakeQuizName(attempt.quizName, attempt.quizId) ? FALLBACK_QUIZ_NAME : attempt.quizName,
            subjectName: attempt.subjectName || FALLBACK_SUBJECT_NAME,
            date: formatSubmittedAt(attempt.submittedAt),
            questionCount: attempt.totalQuestion,
            score: Math.round(attempt.rawScore || 0),
            totalQuestions: attempt.totalQuestion,
            powerIndex: Math.round((attempt.overallTheta || 0) * 100),
            percentage: attempt.percentage,
          })),
        );
      } catch (loadError) {
        if (alive) setError(getErrorMessage(loadError, "Không thể tải lịch sử làm bài."));
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadHistory();
    return () => {
      alive = false;
    };
  }, [user?.userId]);

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
        <ErrorState
          description={error}
          onRetry={() => window.location.reload()}
        />
      ) : historyData.length === 0 ? (
        <EmptyState
          title="Chưa có bài làm nào"
          description="Hãy bắt đầu một bài quiz để xem lịch sử tại đây."
        />
      ) : (
        <div className="history-list">
          {historyData.map((item) => (
            <HistoryCard
              key={item.id}
              {...item}
              onViewDetail={() => navigate(`/app/quiz/result/${item.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
