import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BookOpen, CalendarDays, CheckCircle2, History, TrendingUp } from "lucide-react";
import { getErrorMessage } from "../../../../services/apiClient";
import { getAttemptResult } from "../../../../services/quizService";
import {
  Badge,
  Button,
  Card,
  ProgressRing,
  Spinner,
} from "../../../../components/ui";
import "./QuizResultPage.css";

const FALLBACK_QUIZ_NAME = "Bài kiểm tra";
const FALLBACK_SUBJECT_NAME = "Không rõ môn học";
const FALLBACK_DATE = "—";
const submittedAtFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
});

const formatSubmittedAt = (value) => {
  if (!value) return FALLBACK_DATE;
  const submittedDate = new Date(value);
  return Number.isNaN(submittedDate.getTime())
    ? FALLBACK_DATE
    : submittedAtFormatter.format(submittedDate);
};

const hasRealStandardError = (value) => {
  const numericValue = Number(value);
  return value !== null && value !== undefined && Number.isFinite(numericValue) && numericValue !== 0;
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
        if (alive)
          setError(getErrorMessage(loadError, "Không thể tải kết quả."));
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
    return (
      <div className="result-loading">
        <Spinner size={32} />
        <p>Đang tải kết quả...</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="quiz-result-page">
        <Card padding="lg" className="result-error-card">
          <h2>Không tìm thấy kết quả</h2>
          <p>{error || "Kết quả bài làm không tồn tại."}</p>
          <Button variant="primary" onClick={() => navigate("/app/subjects")}>
            Về danh sách môn học
          </Button>
        </Card>
      </div>
    );
  }

  const score = result.rawScore ?? 0;
  const total = result.totalQuestion ?? 0;
  const percentage =
    result.percentage ?? (total > 0 ? Math.round((score / total) * 100) : 0);
  const displayQuizName = result.quizName?.trim() || FALLBACK_QUIZ_NAME;
  const displaySubjectName = result.subjectName || FALLBACK_SUBJECT_NAME;
  const displaySubmittedAt = formatSubmittedAt(result.submittedAt);
  const message =
    percentage >= 80
      ? { text: "Xuất sắc! Bạn đã nắm vững kiến thức.", variant: "success" }
      : percentage >= 60
        ? { text: "Khá tốt. Hãy ôn tập thêm để cải thiện.", variant: "info" }
        : { text: "Cần cố gắng thêm. Hãy xem lại lý thuyết.", variant: "warning" };
  const ringColor =
    percentage >= 80
      ? "var(--color-success)"
      : percentage >= 60
        ? "var(--color-info)"
        : "var(--color-warning)";

  return (
    <div className="quiz-result-page">
      <Card padding="lg" className="result-hero">
        <div className="result-hero__info">
          <Badge variant="primary">Kết quả bài làm</Badge>
          <h1>{displayQuizName}</h1>
          <div className="result-hero__meta">
            <span>
              <BookOpen size={15} /> {displaySubjectName}
            </span>
            <span>
              <CalendarDays size={15} /> {displaySubmittedAt}
            </span>
          </div>
          <div className={`result-message result-message--${message.variant}`}>
            {message.text}
          </div>
        </div>
        <div className="result-hero__ring">
          <ProgressRing
            value={percentage}
            size={160}
            stroke={14}
            color={ringColor}
            sublabel="Tỷ lệ đúng"
          />
        </div>
      </Card>

      <div className="result-stats-grid">
        <Card className="result-stat">
          <span className="result-stat__icon result-stat__icon--green">
            <CheckCircle2 size={20} />
          </span>
          <div>
            <p>Số câu đúng</p>
            <strong>
              {score}/{total}
            </strong>
          </div>
        </Card>
        <Card className="result-stat">
          <span className="result-stat__icon result-stat__icon--blue">
            <TrendingUp size={20} />
          </span>
          <div>
            <p>Tỷ lệ đúng</p>
            <strong>{percentage}%</strong>
          </div>
        </Card>
        <Card className="result-stat">
          <span className="result-stat__icon result-stat__icon--amber">
            <TrendingUp size={20} />
          </span>
          <div>
            <p>Năng lực ước tính</p>
            <strong>{Number(result.overallTheta || 0).toFixed(2)}</strong>
          </div>
        </Card>
      </div>

      <Card padding="lg" className="result-skill-section">
        <h2>Kết quả theo kỹ năng</h2>
        {result.skillResults?.length ? (
          <div className="result-skill-list">
            {result.skillResults.map((skill) => (
              <div className="result-skill-item" key={skill.skillId}>
                <span className="result-skill-item__name">
                  {skill.name || "Kỹ năng chưa đặt tên"}
                </span>
                <strong className="result-skill-item__theta">
                  {Number(skill.theta || 0).toFixed(2)}
                </strong>
                {hasRealStandardError(skill.standardError) && (
                  <small className="result-skill-item__se">
                    Sai số chuẩn: {Number(skill.standardError).toFixed(2)}
                  </small>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="result-skill-empty">
            Chưa có dữ liệu kỹ năng cho bài làm này.
          </p>
        )}
      </Card>

      <div className="result-actions">
        <Button
          variant="primary"
          iconLeft={<BookOpen size={16} />}
          onClick={() => navigate("/app/subjects")}
        >
          Về môn học
        </Button>
        <Button
          variant="secondary"
          iconLeft={<History size={16} />}
          onClick={() => navigate("/app/history")}
        >
          Xem lịch sử
        </Button>
      </div>
    </div>
  );
}
