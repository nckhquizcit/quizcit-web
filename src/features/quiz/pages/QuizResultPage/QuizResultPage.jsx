import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { BookOpen, ChevronDown, ChevronUp, History } from "lucide-react";
import { getErrorMessage } from "../../../../services/apiClient";
import {
  getAttemptResult,
  getQuestionsByQuiz,
  getQuizById,
} from "../../../../services/quizService";
import {
  buildAiEstimatePayload,
  estimateAbility,
} from "../../../../services/aiService";
import { getSubjectById } from "../../../../services/subjectService";
import {
  formatScaledThetaValue,
  thetaScaledToPercent,
} from "../../../../services/mappers";
import { Badge, Button, Card, Spinner, StatTile } from "../../../../components/ui";
import RichTextView from "../../../../components/richtext/RichTextView";
import { isRichTextEmpty, toPreviewText } from "../../../../components/richtext/richTextUtils";
import { formatSubmittedAt } from "../../../../utils/dateFormat";
import { formatDelta } from "../../../progress/utils/skillProgress";
import "./QuizResultPage.css";

const FALLBACK_QUIZ_NAME = "Bài kiểm tra";
// Chuỗi giữ chỗ backend trả về khi thiếu tên — dùng để so khớp, không hiển thị.
const MISSING_QUIZ_NAME = "Chưa có tên bài quiz";
const FALLBACK_SUBJECT_NAME = "Không rõ môn học";
const DIFFICULTY_BADGES = {
  easy: { label: "Dễ", variant: "success" },
  medium: { label: "Trung bình", variant: "warning" },
  hard: { label: "Khó", variant: "error" },
};

/** So khớp không phân biệt hoa thường; giá trị lạ vẫn hiện badge trung tính. */
const getDifficultyBadge = (difficulty) => {
  const raw = String(difficulty ?? "").trim();
  if (!raw) return null;
  return (
    DIFFICULTY_BADGES[raw.toLowerCase()] ?? { label: raw, variant: "neutral" }
  );
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
  let duration = 0;

  if (result.quizId) {
    try {
      const quiz = await getQuizById(result.quizId);
      if (isMissingName(quizName) && quiz?.name) {
        quizName = quiz.name;
      }
      if (isMissingName(subjectName) && quiz?.subjectId) {
        const subject = await getSubjectById(quiz.subjectId).catch(() => null);
        if (subject?.name) subjectName = subject.name;
      }
      duration = Number(quiz?.duration) || 0;
    } catch {
      // Best-effort enrichment; keep fallbacks if lookups fail.
    }
  }

  return { ...result, quizName, subjectName, duration };
}

function findOption(question, optionId) {
  return (question.options || []).find((option) => option.optionId === optionId);
}

export default function QuizResultPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewFilter, setReviewFilter] = useState("all");
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [aiEstimate, setAiEstimate] = useState({ status: "idle", data: null, error: "" });

  const cameFromHistory = location.state?.from === "history";

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

  useEffect(() => {
    if (!result) return undefined;
    let alive = true;

    async function loadEstimate() {
      setAiEstimate({ status: "loading", data: null, error: "" });
      try {
        if (!result.quizId || !result.questionResults?.length) {
          throw new Error("Kết quả chưa đủ dữ liệu để ước lượng năng lực AI.");
        }
        const questions = await getQuestionsByQuiz(result.quizId);
        const payload = buildAiEstimatePayload(result.questionResults, questions);
        if (!payload) {
          throw new Error("Không tìm thấy đầy đủ độ khó và trọng số câu hỏi.");
        }
        const estimate = await estimateAbility(payload);
        if (!Number.isFinite(estimate.theta)) {
          throw new Error("Dịch vụ AI trả về kết quả không hợp lệ.");
        }
        if (alive) setAiEstimate({ status: "success", data: estimate, error: "" });
      } catch (estimateError) {
        if (alive) {
          setAiEstimate({
            status: "error",
            data: null,
            error: getErrorMessage(estimateError, "Không thể tải ước lượng AI."),
          });
        }
      }
    }

    loadEstimate();
    return () => {
      alive = false;
    };
  }, [result]);

  const questionResults = useMemo(
    () => result?.questionResults || [],
    [result],
  );
  const wrongQuestions = useMemo(
    () => questionResults.filter((q) => !q.correct && q.selectedOptionId),
    [questionResults],
  );
  const blankQuestions = useMemo(
    () => questionResults.filter((q) => !q.selectedOptionId),
    [questionResults],
  );
  const filteredQuestions =
    reviewFilter === "wrong"
      ? wrongQuestions
      : reviewFilter === "blank"
        ? blankQuestions
        : questionResults;

  const toggleExpanded = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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

  const correctCount = result.rawScore ?? 0;
  const total = result.totalQuestion ?? 0;
  const percentage =
    result.percentage ?? (total > 0 ? Math.round((correctCount / total) * 100) : 0);
  const hasQuestionDetail = questionResults.length > 0;
  const blankCount = hasQuestionDetail ? blankQuestions.length : 0;
  const wrongCount = hasQuestionDetail
    ? wrongQuestions.length
    : Math.max(total - correctCount, 0);
  const correctPct = total > 0 ? (correctCount / total) * 100 : 0;
  const wrongPct = total > 0 ? (wrongCount / total) * 100 : 0;
  const blankPct = total > 0 ? (blankCount / total) * 100 : 0;

  const displayQuizName = isMissingName(result.quizName)
    ? FALLBACK_QUIZ_NAME
    : result.quizName.trim();
  const displaySubjectName = isMissingName(result.subjectName)
    ? FALLBACK_SUBJECT_NAME
    : result.subjectName;
  const displaySubmittedAt = formatSubmittedAt(result.submittedAt);
  const durationLabel =
    result.duration > 0 ? ` · Thời lượng ${result.duration} phút` : "";

  const backLabel = cameFromHistory ? "← Quay lại lịch sử" : "← Về môn học";
  const backTarget = cameFromHistory ? "/app/history" : "/app/subjects";

  return (
    <div className="quiz-result-page">
      <div className="result-header">
        <button
          type="button"
          className="result-back-link"
          onClick={() => navigate(backTarget)}
        >
          {backLabel}
        </button>
        <h1 className="result-header__title">{displayQuizName}</h1>
        <p className="result-header__subject">{displaySubjectName}</p>
        <p className="result-header__sub">
          Nộp lúc {displaySubmittedAt} · {total} câu{durationLabel}
        </p>
      </div>

      <div className="result-top-grid">
        <Card padding="lg" className="result-score-card">
          <p className="result-score-card__label">Điểm bài kiểm tra</p>
          <div className="result-score-card__body">
            <div className="result-score-card__main">
              <span className="result-score-card__percent">{percentage}%</span>
              <span className="result-score-card__fraction">
                {correctCount}/{total} câu
              </span>
            </div>
            <div className="result-score-card__theta">
              <span>Năng lực</span>
              <strong>{formatScaledThetaValue(result.overallTheta)} / 4</strong>
            </div>
          </div>
          <p className="result-score-card__hint">
            Năng lực (θ) ước tính theo thang 0–4.
          </p>
        </Card>

        <Card padding="lg" className="result-overview-card">
          <h2>Tổng quan</h2>
          <div className="overview-grid">
            <StatTile value={correctCount} label="Đúng" tone="success" />
            <StatTile value={wrongCount} label="Sai" tone="danger" />
            <StatTile value={blankCount} label="Bỏ trống" tone="warning" />
            <StatTile value={total} label="Tổng số câu" />
          </div>
          <div className="overview-bar">
            <span
              className="overview-bar__seg overview-bar__seg--correct"
              style={{ width: `${correctPct}%` }}
            />
            <span
              className="overview-bar__seg overview-bar__seg--wrong"
              style={{ width: `${wrongPct}%` }}
            />
            <span
              className="overview-bar__seg overview-bar__seg--blank"
              style={{ width: `${blankPct}%` }}
            />
          </div>
        </Card>
      </div>

      <Card padding="lg" className="result-ai-card">
        <div className="result-ai-card__header">
          <div>
            <h2>Ước lượng năng lực AI</h2>
            <p>Đối chiếu độc lập từ đáp án, độ khó và trọng số kỹ năng.</p>
          </div>
          <Badge variant={aiEstimate.status === "success" ? "success" : "neutral"}>
            {aiEstimate.status === "success" ? "Đã tính" : "Tham khảo"}
          </Badge>
        </div>

        {(aiEstimate.status === "idle" || aiEstimate.status === "loading") && (
          <div className="result-ai-card__state">
            <Spinner size={18} />
            <span>Đang ước lượng năng lực...</span>
          </div>
        )}
        {aiEstimate.status === "error" && (
          <p className="result-ai-card__error">{aiEstimate.error}</p>
        )}
        {aiEstimate.status === "success" && (
          <div className="result-ai-card__metrics">
            <div>
              <span>Theta (θ)</span>
              <strong>{aiEstimate.data.theta.toFixed(2)}</strong>
              {Number.isFinite(aiEstimate.data.thetaScaled) && (
                <small>{aiEstimate.data.thetaScaled.toFixed(2)} / 4</small>
              )}
            </div>
            <div>
              <span>Sai số chuẩn</span>
              <strong>
                {Number.isFinite(aiEstimate.data.standardError)
                  ? aiEstimate.data.standardError.toFixed(2)
                  : "Không có"}
              </strong>
            </div>
          </div>
        )}
      </Card>

      <Card padding="lg" className="result-skill-card">
        <h2>Phân tích theo kỹ năng</h2>
        {result.skillResults?.length ? (
          <div className="skill-analysis-list">
            {result.skillResults.map((skill) => {
              const delta = formatDelta(skill.deltaScaled ?? 0);
              const fillPercent = thetaScaledToPercent(skill.thetaScaled);
              return (
                <div className="skill-analysis-row" key={skill.skillId}>
                  <span className="skill-analysis-row__name">
                    {skill.name || "Kỹ năng chưa đặt tên"}
                  </span>
                  <span className="skill-analysis-row__theta">
                    {formatScaledThetaValue(skill.theta)} / 4
                  </span>
                  <span className="skill-analysis-row__bar">
                    <span
                      className="skill-analysis-row__fill"
                      style={{ width: `${fillPercent}%` }}
                    />
                  </span>
                  <span className={`skill-analysis-row__delta skill-analysis-row__delta--${delta.trend}`}>
                    {delta.text}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="result-empty-row">
            Chưa có dữ liệu kỹ năng cho bài làm này.
          </p>
        )}
      </Card>

      {result.overallAdvice ? (
        <Card padding="lg" className="result-advice-card">
          <h2>Lời khuyên cải thiện</h2>
          <p className="result-advice-text">{result.overallAdvice}</p>
        </Card>
      ) : null}

      <section className="result-review-section">
        <div className="result-review-header">
          <h2>Xem lại câu hỏi</h2>
          <div className="result-filter-chips">
            <button
              type="button"
              className={`filter-chip ${reviewFilter === "all" ? "is-active" : ""}`}
              onClick={() => setReviewFilter("all")}
            >
              Tất cả {questionResults.length}
            </button>
            <button
              type="button"
              className={`filter-chip ${reviewFilter === "wrong" ? "is-active" : ""}`}
              onClick={() => setReviewFilter("wrong")}
            >
              Sai {wrongQuestions.length}
            </button>
            <button
              type="button"
              className={`filter-chip ${reviewFilter === "blank" ? "is-active" : ""}`}
              onClick={() => setReviewFilter("blank")}
            >
              Bỏ trống {blankQuestions.length}
            </button>
          </div>
        </div>

        {filteredQuestions.length ? (
          <div className="result-question-list">
            {filteredQuestions.map((question, questionIndex) => {
              const questionNumber = question.questionNumber || questionIndex + 1;
              const answered = Boolean(question.selectedOptionId);
              const statusClass = question.correct
                ? "is-correct"
                : answered
                  ? "is-wrong"
                  : "is-unanswered";
              const selectedOption = findOption(question, question.selectedOptionId);
              const correctOption =
                findOption(question, question.correctOptionId) ||
                (question.options || []).find((option) => option.corrected);
              const selectedText = selectedOption
                ? toPreviewText(selectedOption.content, selectedOption.contentFormat, 60)
                : "";
              const correctText = correctOption
                ? toPreviewText(correctOption.content, correctOption.contentFormat, 60)
                : "—";
              const expanded = expandedIds.has(question.questionId || questionIndex);
              const difficultyBadge = getDifficultyBadge(question.difficulty);

              return (
                <article
                  className={`result-question-row ${statusClass}`}
                  key={question.questionId || questionIndex}
                >
                  <div className="result-question-row__top">
                    <span className="result-question-row__badge">{questionNumber}</span>
                    <div className="result-question-row__body">
                      <p className="result-question-row__content">
                        {isRichTextEmpty(question.content, question.contentFormat)
                          ? "Câu hỏi chưa có nội dung"
                          : toPreviewText(question.content, question.contentFormat, 140)}
                      </p>
                      <p className="result-question-row__answer">
                        {answered ? (
                          <>
                            Bạn chọn <strong>{selectedText}</strong> · Đáp án đúng{" "}
                            <strong>{correctText}</strong>
                          </>
                        ) : (
                          <>
                            Chưa trả lời · Đáp án đúng <strong>{correctText}</strong>
                          </>
                        )}
                      </p>
                    </div>
                    {difficultyBadge && (
                      <Badge variant={difficultyBadge.variant} size="sm">
                        {difficultyBadge.label}
                      </Badge>
                    )}
                    <button
                      type="button"
                      className="result-question-row__toggle"
                      aria-expanded={expanded}
                      onClick={() => toggleExpanded(question.questionId || questionIndex)}
                    >
                      {expanded ? "Ẩn lời giải" : "Xem lời giải"}
                      {expanded ? (
                        <ChevronUp size={14} aria-hidden="true" />
                      ) : (
                        <ChevronDown size={14} aria-hidden="true" />
                      )}
                    </button>
                  </div>

                  {expanded && (
                    <div className="result-question-row__detail">
                      <div className="result-option-list">
                        {(question.options || []).map((option, optionIndex) => {
                          const selected = option.optionId === question.selectedOptionId;
                          const isCorrectOption =
                            option.optionId === question.correctOptionId || option.corrected;
                          const optionClasses = [
                            "result-option-item",
                            isCorrectOption ? "is-correct-option" : "",
                            selected && !isCorrectOption ? "is-wrong-option" : "",
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
                                {isCorrectOption && <span>Đáp án đúng</span>}
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
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <p className="result-empty-row">
            {questionResults.length
              ? "Không có câu hỏi phù hợp với bộ lọc."
              : "Chưa có dữ liệu câu trả lời cho bài làm này."}
          </p>
        )}
      </section>

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
