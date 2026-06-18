import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAttemptResult } from "../../../../services/quizService";
import "./QuizResultPage.css";

export default function QuizResultPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadResult = async () => {
      try {
        const resultData = await getAttemptResult(attemptId);
        setResult(resultData);
      } catch (error) {
        console.error("Error loading result:", error);
        navigate("/app/subjects");
      } finally {
        setLoading(false);
      }
    };

    loadResult();
  }, [attemptId, navigate]);

  if (loading) {
    return <div className="result-loading">Đang tải kết quả...</div>;
  }

  if (!result) {
    return <div className="result-error">Không tìm thấy kết quả</div>;
  }

  const score = result.rawScore ?? 0;
  const total = result.totalQuestion ?? 0;
  const percentage = total > 0 ? (score / total) * 100 : 0;

  const getMessage = () => {
    if (percentage >= 80)
      return { text: "🎉 Xuất sắc! Bạn đã nắm vững kiến thức!", className: "excellent" };
    if (percentage >= 60)
      return { text: "👍 Khá tốt! Hãy ôn tập thêm để cải thiện.", className: "good" };
    return { text: "💪 Cần cố gắng thêm! Hãy xem lại lý thuyết.", className: "needs-improvement" };
  };

  const message = getMessage();

  return (
    <div className="quiz-result-page">
      <div className="result-card">
        <h1>Kết quả bài làm</h1>

        <div className="score-section">
          <div className="score-circle">
            <svg className="score-svg" viewBox="0 0 100 100">
              <circle className="score-bg" cx="50" cy="50" r="45" fill="none" strokeWidth="8" />
              <circle
                className="score-progress"
                cx="50"
                cy="50"
                r="45"
                fill="none"
                strokeWidth="8"
                strokeDasharray={`${percentage * 2.83} 283`}
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className="score-text">
              <div className="score-value">
                {score}/{total}
              </div>
              <div className="score-percent">{percentage.toFixed(1)}%</div>
            </div>
          </div>
        </div>

        <div className="result-stats">
          <div className="stat-item">
            <div className="stat-label">Số câu đúng</div>
            <div className="stat-value">{score}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Tổng số câu</div>
            <div className="stat-value">{total}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Tỷ lệ đúng</div>
            <div className="stat-value">{percentage.toFixed(1)}%</div>
          </div>
        </div>

        <div className={`result-message ${message.className}`}>{message.text}</div>

        <div className="result-actions">
          <button className="result-btn primary" onClick={() => navigate("/app/subjects")}>
            Về trang chủ
          </button>
          <button className="result-btn secondary" onClick={() => navigate(-1)}>
            Làm bài khác
          </button>
        </div>
      </div>
    </div>
  );
}