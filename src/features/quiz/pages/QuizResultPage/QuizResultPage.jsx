import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BookOpen, CalendarDays, CheckCircle2, History, TrendingUp, TrendingDown, Minus, XCircle, Sparkles } from "lucide-react";
import { getErrorMessage } from "../../../../services/apiClient";
import { getAttemptResult, getQuizById } from "../../../../services/quizService";
import { getSubjectById } from "../../../../services/subjectService";
import {
  formatScaledThetaValue,
  getAbilityLevel,
} from "../../../../services/mappers";
import {
  Badge,
  Button,
  Card,
  ProgressRing,
  Spinner,
} from "../../../../components/ui";
import RichTextView from "../../../../components/richtext/RichTextView";
import { isRichTextEmpty } from "../../../../components/richtext/richTextUtils";
import "./QuizResultPage.css";

const FALLBACK_QUIZ_NAME = "Bài kiểm tra";
const MISSING_QUIZ_NAME = "Chưa có tên bài quiz";
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

const isMissingName = (value) => {
  if (typeof value !== "string" || !value.trim()) return true;
  const trimmed = value.trim();
  return (
    trimmed === MISSING_QUIZ_NAME ||
    trimmed === FALLBACK_SUBJECT_NAME
  );
};

async function resolveResultMetadata(result) {
  let { quizName, subjectName } = result;

  if (isMissingName(quizName) || isMissingName(subjectName)) {
    try {
      const quiz = result.quizId ? await getQuizById(result.quizId) : null;
      if (isMissingName(quizName) && quiz?.name) {
        quizName = quiz.name;
      }
      if (isMissingName(subjectName) && quiz?.subjectId) {
        const subject = await getSubjectById(quiz.subjectId).catch(() => null);
        if (subject?.name) subjectName = subject.name;
      }
    } catch {
      // Best-effort enrichment; keep fallbacks if lookups fail.
    }
  }

  return { ...result, quizName, subjectName };
}

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
        const enriched = await resolveResultMetadata(resultData);
        if (alive) setResult(enriched);
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
  const displayQuizName = isMissingName(result.quizName)
    ? FALLBACK_QUIZ_NAME
    : result.quizName.trim();
  const displaySubjectName = isMissingName(result.subjectName)
    ? FALLBACK_SUBJECT_NAME
    : result.subjectName;
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
            <strong>
              {formatScaledThetaValue(result.overallTheta)}
              <span className="result-stat__level">
                {getAbilityLevel(result.overallTheta).label}
              </span>
            </strong>
          </div>
        </Card>
      </div>

      <Card padding="lg" className="result-skill-section">
        <h2>Kết quả theo kỹ năng</h2>
        {result.skillResults?.length ? (
          <div className="result-skill-list">
            {result.skillResults.map((skill) => {
              const level = getAbilityLevel(skill.theta);
              const delta = skill.delta ?? 0;
              const DeltaIcon = delta > 0.001 ? TrendingUp : delta < -0.001 ? TrendingDown : Minus;
              const deltaClass =
                delta > 0.001 ? "result-skill-item__delta--up"
                  : delta < -0.001 ? "result-skill-item__delta--down"
                  : "result-skill-item__delta--flat";
              return (
              <div className="result-skill-item" key={skill.skillId}>
                <span className="result-skill-item__name">
                  {skill.name || "Kỹ năng chưa đặt tên"}
                </span>
                <span className={`result-skill-item__delta ${deltaClass}`}>
                  <DeltaIcon size={14} />
                  {delta > 0 ? "+" : ""}
                  {delta.toFixed(2)}
                </span>
                <strong className="result-skill-item__theta">
                  {formatScaledThetaValue(skill.theta)}
                  <span>/4 · {level.label}</span>
                </strong>
              </div>
              );
            })}
          </div>
        ) : (
          <p className="result-skill-empty">
            Chưa có dữ liệu kỹ năng cho bài làm này.
          </p>
        )}
      </Card>

      {result.overallAdvice ? (
        <Card padding="lg" className="result-advice-section">
          <h2>
            <Sparkles size={18} style={{ marginRight: 6 }} />
            Lời khuyên cải thiện
          </h2>
          <p className="result-advice-text">{result.overallAdvice}</p>
        </Card>
      ) : null}

      <Card padding="lg" className="result-question-section">
        <h2>Chi tiết câu trả lời</h2>
        {result.questionResults?.length ? (
          <div className="result-question-list">
            {result.questionResults.map((question, questionIndex) => {
              const questionNumber = question.questionNumber || questionIndex + 1;
              const answered = Boolean(question.selectedOptionId);
              const statusClass = question.correct
                ? "is-correct"
                : answered
                  ? "is-wrong"
                  : "is-unanswered";
              const statusText = question.correct
                ? "Đúng"
                : answered
                  ? "Sai"
                  : "Chưa trả lời";

              return (
                <article
                  className={`result-question-item ${statusClass}`}
                  key={question.questionId || questionIndex}
                >
                  <div className="result-question-header">
                    <div>
                      <span className="result-question-number">
                        Câu {questionNumber}
                      </span>
                      <h3>
                        {isRichTextEmpty(question.content, question.contentFormat) ? (
                          "Câu hỏi chưa có nội dung"
                        ) : (
                          <RichTextView
                            variant="inline"
                            content={question.content}
                            contentFormat={question.contentFormat}
                          />
                        )}
                      </h3>
                    </div>
                    <span className="result-question-status">
                      {question.correct ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                      {statusText}
                    </span>
                  </div>

                  <div className="result-option-list">
                    {(question.options || []).map((option, optionIndex) => {
                      const selected = option.optionId === question.selectedOptionId;
                      const correctOption = option.optionId === question.correctOptionId || option.corrected;
                      const optionClasses = [
                        "result-option-item",
                        selected ? "is-selected" : "",
                        correctOption ? "is-correct-option" : "",
                        selected && !correctOption ? "is-wrong-option" : "",
                      ]
                        .filter(Boolean)
                        .join(" ");

                      return (
                        <div className={optionClasses} key={option.optionId || optionIndex}>
                          <span className="result-option-marker">
                            {String.fromCharCode(65 + optionIndex)}
                          </span>
                          <span className="result-option-content">
                            {isRichTextEmpty(option.content, option.contentFormat) ? (
                              "Đáp án chưa có nội dung"
                            ) : (
                              <RichTextView
                                variant="inline"
                                content={option.content}
                                contentFormat={option.contentFormat}
                              />
                            )}
                          </span>
                          <span className="result-option-tags">
                            {selected && <span>Bạn chọn</span>}
                            {correctOption && <span>Đáp án đúng</span>}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {!isRichTextEmpty(question.explanation, question.contentFormat) && (
                    <div className="result-question-explanation">
                      <span>Giải thích: </span>
                      <RichTextView
                        variant="inline"
                        content={question.explanation}
                        contentFormat={question.contentFormat}
                      />
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <p className="result-question-empty">
            Chưa có dữ liệu câu trả lời cho bài làm này.
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
