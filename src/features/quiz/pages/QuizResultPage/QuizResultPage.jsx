import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getErrorMessage } from "../../../../services/apiClient";
import { getAttemptResult } from "../../../../services/quizService";
import "./QuizResultPage.css";

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

const formatSubmittedAt = (value) => {
  if (!value) return FALLBACK_DATE;

  const submittedDate = new Date(value);
  return Number.isNaN(submittedDate.getTime()) ? FALLBACK_DATE : submittedAtFormatter.format(submittedDate);
};

export default function QuizResultPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function loadResult() {
      try {
        setLoading(true);
        setError("");
        const resultData = await getAttemptResult(attemptId);
        if (alive) setResult(resultData);
      } catch (loadError) {
        if (alive) setError(getErrorMessage(loadError, "Không thể tải kết quả."));
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadResult();
    return () => {
      alive = false;
    };
  }, [attemptId]);

  if (loading) {
    return <div className="result-loading">Đang tải kết quả...</div>;
  }

  if (error || !result) {
    return (
      <div className="result-error">
        <p>{error || "Không tìm thấy kết quả"}</p>
        <button type="button" onClick={() => navigate("/app/subjects")}>
          Về danh sách môn học
        </button>
      </div>
    );
  }

  const score = result.rawScore ?? 0;
  const total = result.totalQuestion ?? 0;
  const percentage = result.percentage ?? (total > 0 ? Math.round((score / total) * 100) : 0);
  const displayQuizName = isFakeQuizName(result.quizName, result.quizId) ? FALLBACK_QUIZ_NAME : result.quizName;
  const displaySubjectName = result.subjectName || FALLBACK_SUBJECT_NAME;
  const displaySubmittedAt = formatSubmittedAt(result.submittedAt);
  const message =
    percentage >= 80
      ? { text: "Xuất sắc! Bạn đã nắm vững kiến thức.", className: "excellent" }
      : percentage >= 60
        ? { text: "Khá tốt. Hãy ôn tập thêm để cải thiện.", className: "good" }
        : { text: "Cần cố gắng thêm. Hãy xem lại lý thuyết.", className: "needs-improvement" };

  return (
    <div className="quiz-result-page">
      <div className="result-card">
        <h1>Kết quả bài làm</h1>

        <div className="result-meta">
          <strong>{displayQuizName}</strong>
          <span>{displaySubjectName}</span>
          <span>Ngày nộp: {displaySubmittedAt}</span>
        </div>

        <div className="score-circle">
          <div className="score-value">{percentage}%</div>
          <div className="score-label">Hoàn thành</div>
        </div>

        <div className="result-stats">
          <div className="stat-item">
            <div className="stat-label">Số câu đúng</div>
            <div className="stat-value">{score}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Tổng câu</div>
            <div className="stat-value">{total}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Theta tổng quan</div>
            <div className="stat-value">{Number(result.overallTheta || 0).toFixed(2)}</div>
          </div>
        </div>

        <div className={`result-message ${message.className}`}>{message.text}</div>

        <section className="result-skill-section">
          <h2>Kết quả theo kỹ năng</h2>
          {result.skillResults?.length ? (
            <div className="result-skill-list">
              {result.skillResults.map((skill) => (
                <div className="result-skill-item" key={skill.skillId}>
                  <span>{skill.name || skill.skillId}</span>
                  <strong>{Number(skill.theta || 0).toFixed(2)}</strong>
                  <small>Sai số: {skill.standardError ?? "—"}</small>
                </div>
              ))}
            </div>
          ) : (
            <p className="result-skill-empty">Chưa có dữ liệu kỹ năng cho bài làm này.</p>
          )}
        </section>

        <div className="result-actions">
          <button className="result-btn primary" type="button" onClick={() => navigate("/app/subjects")}>
            Về môn học
          </button>
          <button className="result-btn secondary" type="button" onClick={() => navigate("/app/history")}>
            Xem lịch sử
          </button>
        </div>
      </div>
    </div>
  );
}
