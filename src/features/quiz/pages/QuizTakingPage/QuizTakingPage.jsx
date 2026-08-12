import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle, AlertTriangle, Flag, X } from "lucide-react";
import {
  clearQuizDraft,
  getQuestionsByQuiz,
  getQuizById,
  loadQuizDraft,
  saveQuizDraft,
  startQuiz,
  submitAttempt,
} from "../../../../services/quizService";
import { getErrorMessage, getStoredUser } from "../../../../services/apiClient";
import { Button, ErrorState, Spinner } from "../../../../components/ui";
import RichTextView from "../../../../components/richtext/RichTextView";
import {
  clampQuizPage,
  getPageNavigationTarget,
  getQuestionNavigationTarget,
  getTotalQuizPages,
  QUIZ_PAGE_SIZE,
} from "./QuizTakingPage.logic.js";
import "./QuizTakingPage.css";

const PAGE_SIZE = QUIZ_PAGE_SIZE;

const getDurationSeconds = (quizData) => {
  const durationMinutes = Number(quizData?.duration ?? quizData?.durationMinutes);
  return Number.isFinite(durationMinutes) && durationMinutes > 0
    ? Math.floor(durationMinutes * 60)
    : 0;
};

export default function QuizTakingPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const currentUser = useMemo(() => getStoredUser(), []);
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [flaggedQuestionIds, setFlaggedQuestionIds] = useState(() => new Set());
  const [currentPage, setCurrentPage] = useState(0);
  const [activeQuestionId, setActiveQuestionId] = useState(null);
  const [pendingScrollQuestionId, setPendingScrollQuestionId] = useState(null);
  const [activeSkillQuestion, setActiveSkillQuestion] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [hasTimeLimit, setHasTimeLimit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const startedRef = useRef(false);
  const submittedRef = useRef(false);
  const timerStartedRef = useRef(false);
  const autoSubmittedRef = useRef(false);
  const questionRefs = useRef(new Map());

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    async function loadQuiz() {
      if (!currentUser?.userId) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        setError("");
        const [quizData, questionsData, attemptData] = await Promise.all([
          getQuizById(quizId),
          getQuestionsByQuiz(quizId),
          startQuiz(quizId, currentUser.userId),
        ]);
        const draft = loadQuizDraft(quizId, currentUser.userId);

        const durationSeconds = getDurationSeconds(quizData);
        const loadedQuestions = Array.isArray(questionsData)
          ? questionsData
          : [];
        const draftPage = Number(draft?.currentPage ?? 0);
        const safeDraftPage = clampQuizPage(
          draftPage,
          getTotalQuizPages(loadedQuestions.length, PAGE_SIZE),
        );
        const initialQuestionId = getPageNavigationTarget(
          loadedQuestions,
          safeDraftPage,
          PAGE_SIZE,
        ).questionId;

        setQuiz(quizData);
        setQuestions(loadedQuestions);
        setAttempt(attemptData);
        setCurrentPage(safeDraftPage);
        setActiveQuestionId(initialQuestionId);
        setHasTimeLimit(durationSeconds > 0);
        setTimeLeft(durationSeconds);
        timerStartedRef.current = durationSeconds > 0;
        autoSubmittedRef.current = false;

        if (draft) {
          if (draft.answers) {
            setAnswers(draft.answers);
          }
          setFlaggedQuestionIds(new Set(draft.flaggedQuestionIds || []));
        }
      } catch (loadError) {
        startedRef.current = false;
        setError(getErrorMessage(loadError, "Không thể bắt đầu bài kiểm tra."));
      } finally {
        setLoading(false);
      }
    }

    loadQuiz();
  }, [currentUser?.userId, navigate, quizId]);

  const totalPages = useMemo(
    () => getTotalQuizPages(questions.length, PAGE_SIZE),
    [questions.length],
  );

  const visibleQuestions = useMemo(() => {
    const start = currentPage * PAGE_SIZE;
    return questions.slice(start, start + PAGE_SIZE);
  }, [currentPage, questions]);

  const setQuestionCardRef = useCallback((questionId, element) => {
    if (!questionId) return;

    if (element) {
      questionRefs.current.set(questionId, element);
    } else {
      questionRefs.current.delete(questionId);
    }
  }, []);

  useEffect(() => {
    if (!pendingScrollQuestionId) return undefined;

    const targetIsVisible = visibleQuestions.some(
      (question) => question.questionId === pendingScrollQuestionId,
    );
    if (!targetIsVisible) return undefined;

    const frame = window.requestAnimationFrame(() => {
      const target = questionRefs.current.get(pendingScrollQuestionId);
      target?.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
      setPendingScrollQuestionId(null);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pendingScrollQuestionId, visibleQuestions]);

  useEffect(() => {
    if (visibleQuestions.length === 0) {
      if (activeQuestionId !== null) setActiveQuestionId(null);
      return;
    }

    const activeIsVisible = visibleQuestions.some(
      (question) => question.questionId === activeQuestionId,
    );
    if (!activeIsVisible) {
      setActiveQuestionId(visibleQuestions[0].questionId);
    }
  }, [activeQuestionId, visibleQuestions]);

  useEffect(() => {
    if (!attempt || submittedRef.current || !currentUser?.userId) return;
    saveQuizDraft(quizId, currentUser.userId, {
      answers,
      currentPage,
      flaggedQuestionIds: Array.from(flaggedQuestionIds),
      updatedAt: new Date().toISOString(),
    });
  }, [answers, attempt, currentPage, currentUser?.userId, flaggedQuestionIds, quizId]);

  useEffect(() => {
    const hasWork = Object.keys(answers).length > 0 && !submittedRef.current;
    if (!hasWork) return undefined;

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [answers]);

  const doSubmit = useCallback(
    async (currentAnswers) => {
      if (!attempt || submittedRef.current) return;
      submittedRef.current = true;
      setSubmitting(true);
      setError("");

      try {
        const answerList = Object.entries(currentAnswers).map(([questionId, optionId]) => ({
          questionId,
          optionId,
        }));

        await submitAttempt({
          quizId,
          attemptId: attempt.attemptId,
          answers: answerList,
        });
        clearQuizDraft(quizId, currentUser?.userId);
        navigate(`/app/quiz/result/${attempt.attemptId}`);
      } catch (submitError) {
        submittedRef.current = false;
        setSubmitting(false);
        setError(getErrorMessage(submitError, "Có lỗi xảy ra khi nộp bài. Đáp án của bạn vẫn được giữ lại."));
      }
    },
    [attempt, currentUser?.userId, navigate, quizId],
  );

  useEffect(() => {
    if (!hasTimeLimit || !attempt || submitting || timeLeft <= 0) return undefined;

    const timer = setInterval(() => {
      setTimeLeft((previous) => Math.max(previous - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [attempt, hasTimeLimit, submitting, timeLeft]);

  useEffect(() => {
    if (
      hasTimeLimit &&
      timerStartedRef.current &&
      timeLeft === 0 &&
      attempt &&
      !submittedRef.current &&
      !autoSubmittedRef.current
    ) {
      autoSubmittedRef.current = true;
      doSubmit(answers);
    }
  }, [answers, attempt, doSubmit, hasTimeLimit, timeLeft]);

  const handleAnswerChange = (questionId, optionId) => {
    setActiveQuestionId(questionId);
    setAnswers((current) => ({ ...current, [questionId]: optionId }));
  };

  const toggleFlag = (questionId) => {
    setFlaggedQuestionIds((current) => {
      const next = new Set(current);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  const goToQuestion = (index) => {
    const target = getQuestionNavigationTarget(questions, index, PAGE_SIZE);
    if (!target.questionId) return;

    setCurrentPage(target.page);
    setActiveQuestionId(target.questionId);
    setPendingScrollQuestionId(target.questionId);
  };

  const goToPage = (page) => {
    const target = getPageNavigationTarget(questions, page, PAGE_SIZE);

    setCurrentPage(target.page);
    setActiveQuestionId(target.questionId);
    setPendingScrollQuestionId(target.questionId);
  };

  const handleSubmit = () => {
    if (submitting) return;
    setSubmitConfirmOpen(true);
  };

  const closeSubmitConfirm = () => {
    if (submitting) return;
    setSubmitConfirmOpen(false);
  };

  const confirmSubmit = async () => {
    if (submitting) return;
    setSubmitConfirmOpen(false);
    await doSubmit(answers);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const timeLimitLabel = hasTimeLimit ? `${quiz?.duration} phút` : "Không giới hạn thời gian";
  const timerLabel = hasTimeLimit ? formatTime(timeLeft) : "Không giới hạn thời gian";

  if (loading) {
    return (
      <div className="quiz-loading">
        <Spinner size={32} />
        <p>Đang tải đề thi...</p>
      </div>
    );
  }

  if (error && !quiz) {
    return (
      <div className="quiz-taking-page">
        <ErrorState
          title="Không thể bắt đầu bài kiểm tra"
          description={error}
          onRetry={() => navigate("/app/subjects")}
          retryLabel="Quay lại danh sách môn học"
        />
      </div>
    );
  }

  if (!quiz || !attempt) {
    return (
      <div className="quiz-taking-page">
        <ErrorState
          title="Không tìm thấy đề thi"
          description="Đề thi này không tồn tại hoặc đã bị gỡ."
          onRetry={() => navigate("/app/subjects")}
          retryLabel="Quay lại danh sách môn học"
        />
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const answeredPercent = questions.length
    ? Math.round((answeredCount / questions.length) * 100)
    : 0;

  return (
    <div className="quiz-taking-page">
      <header className="quiz-header">
        <div className="quiz-header__info">
          <h1>{quiz.name}</h1>
          <div className="quiz-meta">
            <span>{quiz.totalQuestion || questions.length} câu hỏi</span>
            <span className="quiz-meta__dot" />
            <span>{timeLimitLabel}</span>
          </div>
        </div>
        <div
          className={`quiz-timer ${
            hasTimeLimit && timeLeft < 60 ? "time-warning" : ""
          } ${hasTimeLimit ? "" : "quiz-timer--unlimited"}`}
        >
          {hasTimeLimit && <span className="quiz-timer__label">Thời gian còn</span>}
          <span className="quiz-timer__value">{timerLabel}</span>
        </div>
      </header>

      {error && (
        <div className="quiz-inline-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="quiz-progress">
        <div className="quiz-progress__head">
          <span>Tiến độ làm bài</span>
          <strong>
            {answeredCount}/{questions.length} câu
          </strong>
        </div>
        <div className="quiz-progress__track">
          <div
            className="quiz-progress__fill"
            style={{ width: `${answeredPercent}%` }}
          />
        </div>
      </div>

      <div className="quiz-layout">
        <div className="quiz-main">
          <div className="quiz-info-banner">
            <span className="quiz-info-banner__icon" aria-hidden="true">
              ⓘ
            </span>
            <span>Không hiển thị đúng sai hoặc lời giải trước khi nộp.</span>
          </div>

          <div className="quiz-questions">
            {visibleQuestions.map((question) => {
              const questionIndex = questions.findIndex(
                (item) => item.questionId === question.questionId
              );
              const flagged = flaggedQuestionIds.has(question.questionId);
              const hasSkills =
                Array.isArray(question.skills) && question.skills.length > 0;

              return (
                <article
                  key={question.questionId}
                  ref={(element) =>
                    setQuestionCardRef(question.questionId, element)
                  }
                  className={[
                    "quiz-question-card",
                    flagged ? "is-flagged" : "",
                    activeQuestionId === question.questionId
                      ? "is-active"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  tabIndex={-1}
                  onClick={() => setActiveQuestionId(question.questionId)}
                  onFocusCapture={() =>
                    setActiveQuestionId(question.questionId)
                  }
                >
                  <div className="question-top">
                    <div className="question-number">Câu {questionIndex + 1}</div>
                    <div className="question-actions">
                      <button
                        type="button"
                        className={`flag-btn ${flagged ? "flag-btn--active" : ""}`}
                        onClick={() => toggleFlag(question.questionId)}
                      >
                        <Flag size={14} />
                        {flagged ? "Bỏ đánh dấu" : "Đánh dấu"}
                      </button>
                      <button
                        type="button"
                        className="skill-btn"
                        disabled={!hasSkills}
                        onClick={() => setActiveSkillQuestion(question)}
                      >
                        {hasSkills
                          ? `${question.skills.length} kỹ năng`
                          : "Chưa gắn kỹ năng"}
                      </button>
                    </div>
                  </div>

                  <RichTextView
                    className="question-content"
                    content={question.content}
                    contentFormat={question.contentFormat}
                  />

                  <div className="options-list">
                    {(question.options || []).map((option, optIndex) => {
                      const selected =
                        answers[question.questionId] === option.optionId;
                      return (
                        <label
                          key={option.optionId}
                          className={`option-item ${selected ? "is-selected" : ""}`}
                        >
                          <input
                            type="radio"
                            name={question.questionId}
                            checked={selected}
                            onChange={() =>
                              handleAnswerChange(
                                question.questionId,
                                option.optionId
                              )
                            }
                            disabled={submitting}
                          />
                          <span className="option-marker">
                            {String.fromCharCode(65 + optIndex)}
                          </span>
                          <RichTextView
                            className="option-text"
                            variant="inline"
                            content={option.content}
                            contentFormat={option.contentFormat}
                          />
                        </label>
                      );
                    })}
                    {(!question.options ||
                      question.options.length === 0) && (
                      <p className="quiz-empty-option">
                        Câu hỏi này chưa có đáp án lựa chọn.
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          <div className="quiz-pagination">
            <Button
              variant="ghost"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 0}
            >
              ← Trang trước
            </Button>
            <span className="page-indicator">
              Trang {currentPage + 1} / {totalPages}
            </span>
            <Button
              variant="ghost"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
            >
              Trang sau →
            </Button>
          </div>
        </div>

        <aside className="quiz-sidebar">
          <div className="quiz-sidebar__card">
            <p className="quiz-sidebar__title">Danh sách câu hỏi</p>
            <div className="quiz-nav">
              {questions.map((question, index) => {
                const answered = answers[question.questionId] != null;
                const flagged = flaggedQuestionIds.has(question.questionId);
                const isActive = activeQuestionId === question.questionId;
                const classes = [
                  "quiz-nav-item",
                  answered ? "answered" : "",
                  flagged ? "flagged" : "",
                  isActive ? "is-active" : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <button
                    key={question.questionId}
                    type="button"
                    className={classes}
                    onClick={() => goToQuestion(index)}
                    aria-current={isActive ? "true" : undefined}
                    aria-label={`Đi tới câu ${index + 1}`}
                  >
                    {index + 1}
                    {flagged && <span className="quiz-nav-flag" />}
                  </button>
                );
              })}
            </div>

            <div className="quiz-nav-legend">
              <span>
                <i className="legend-dot legend-dot--answered" /> Đã trả lời
              </span>
              <span>
                <i className="legend-dot legend-dot--flagged" /> Đánh dấu
              </span>
            </div>

            <Button
              variant="primary"
              fullWidth
              loading={submitting}
              onClick={handleSubmit}
            >
              {submitting ? "Đang nộp bài..." : "Nộp bài"}
            </Button>
          </div>
        </aside>
      </div>

      {submitConfirmOpen && (
        <div
          className="submit-confirm-overlay"
          onClick={closeSubmitConfirm}
        >
          <section
            className="submit-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="submit-confirm-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="submit-confirm-body">
              <div className="submit-confirm-icon">
                <AlertTriangle size={22} />
              </div>
              <h3 id="submit-confirm-title">Xác nhận nộp bài</h3>
              <p className="submit-confirm-sub">
                Kết quả chỉ được chấm sau thao tác này.
              </p>

              <div className="submit-confirm-divider" />

              <div className="submit-confirm-stats">
                <div className="submit-confirm-stat">
                  <strong>{answeredCount}</strong>
                  <span>Đã trả lời</span>
                </div>
                <div className="submit-confirm-stat">
                  <strong>{flaggedQuestionIds.size}</strong>
                  <span>Đánh dấu</span>
                </div>
                <div className="submit-confirm-stat">
                  <strong>{questions.length - answeredCount}</strong>
                  <span>Chưa trả lời</span>
                </div>
              </div>

              {answeredCount < questions.length && (
                <p className="submit-confirm-warning">
                  Bạn còn {questions.length - answeredCount} câu chưa trả lời. Có
                  thể quay lại phiếu trả lời trước khi nộp.
                </p>
              )}

              <p className="submit-confirm-note">
                Sau khi nộp — Không thể sửa đáp án · timer dừng · mở trang kết quả
              </p>
            </div>

            <div className="submit-confirm-actions">
              <Button
                variant="ghost"
                onClick={closeSubmitConfirm}
                disabled={submitting}
              >
                Quay lại bài thi
              </Button>
              <Button
                variant="primary"
                onClick={confirmSubmit}
                loading={submitting}
              >
                Nộp và xem kết quả
              </Button>
            </div>
          </section>
        </div>
      )}

      {activeSkillQuestion && (
        <div
          className="skill-modal-overlay"
          onClick={() => setActiveSkillQuestion(null)}
        >
          <div
            className="skill-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="skill-modal-header">
              <h3>Kỹ năng của câu hỏi</h3>
              <button
                type="button"
                className="skill-modal-close"
                onClick={() => setActiveSkillQuestion(null)}
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>
            <ul className="skill-list">
              {(activeSkillQuestion.skills || []).map((skill) => (
                <li key={skill.skillId} className="skill-item">
                  <span className="skill-item__name">
                    {skill.name || "Kỹ năng chưa đặt tên"}
                  </span>
                  {skill.primary && (
                    <span className="skill-primary-badge">Chính</span>
                  )}
                  <span className="skill-weight">
                    Trọng số: {skill.weight ?? "—"}
                  </span>
                </li>
              ))}
              {(!activeSkillQuestion.skills ||
                activeSkillQuestion.skills.length === 0) && (
                <li className="skill-item skill-empty">
                  Câu hỏi này chưa gắn kỹ năng.
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
