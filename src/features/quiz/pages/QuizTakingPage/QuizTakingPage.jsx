import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle, Flag, ListChecks, X } from "lucide-react";
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
import {
  Button,
  EmptyState,
  ErrorState,
  Modal,
  Spinner,
  StatTile,
} from "../../../../components/ui";
import RichTextView from "../../../../components/richtext/RichTextView";
import SkillInfoModal from "../../components/SkillInfoModal";
import {
  clampQuizPage,
  getPageNavigationTarget,
  getQuestionNavigationTarget,
  getResumableQuizDraft,
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
  // Phiếu trả lời dạng bottom sheet, chỉ dùng trên mobile (bar mở sheet ẩn ở desktop)
  const [answerSheetOpen, setAnswerSheetOpen] = useState(false);
  const startedRef = useRef(false);
  const submittedRef = useRef(false);
  const timerStartedRef = useRef(false);
  const autoSubmittedRef = useRef(false);
  const deadlineRef = useRef(0);
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
        const draft = loadQuizDraft(quizId, currentUser.userId);
        const [quizData, questionsData] = await Promise.all([
          getQuizById(quizId),
          getQuestionsByQuiz(quizId),
        ]);

        if (String(quizData?.type).toUpperCase() === "ADAPTIVE") {
          setError(
            "Đây là bài kiểm tra thích ứng, không mở được bằng đường dẫn này. Hãy vào môn học và bắt đầu bài kiểm tra thích ứng từ đó.",
          );
          return;
        }

        const durationSeconds = getDurationSeconds(quizData);
        // Giữ nguyên lượt làm và hạn nộp đã lưu để tải lại trang không tạo lượt mới
        // và không cấp thêm thời gian.
        const resumableDraft = getResumableQuizDraft(draft, quizId, durationSeconds);
        const draftDeadlineAt = Number(resumableDraft?.deadlineAt);
        const attemptData = resumableDraft
          ? { attemptId: resumableDraft.attemptId }
          : await startQuiz(quizId, currentUser.userId);
        const deadlineAt = resumableDraft && Number.isFinite(draftDeadlineAt)
          ? draftDeadlineAt
          : Date.now() + durationSeconds * 1000;
        const loadedQuestions = Array.isArray(questionsData)
          ? questionsData
          : [];
        const draftPage = Number(resumableDraft?.currentPage ?? 0);
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
        deadlineRef.current = deadlineAt;
        setTimeLeft(
          durationSeconds > 0
            ? Math.max(0, Math.ceil((deadlineAt - Date.now()) / 1000))
            : 0,
        );
        timerStartedRef.current = durationSeconds > 0;
        autoSubmittedRef.current = false;

        if (resumableDraft) {
          if (resumableDraft.answers) {
            setAnswers(resumableDraft.answers);
          }
          setFlaggedQuestionIds(new Set(resumableDraft.flaggedQuestionIds || []));
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
      attemptId: attempt.attemptId,
      quizId,
      deadlineAt: deadlineRef.current,
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
      if (!attempt || submittedRef.current) return false;
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
        return true;
      } catch (submitError) {
        submittedRef.current = false;
        setSubmitting(false);
        setError(getErrorMessage(submitError, "Có lỗi xảy ra khi nộp bài. Đáp án của bạn vẫn được giữ lại."));
        return false;
      }
    },
    [attempt, currentUser?.userId, navigate, quizId],
  );

  useEffect(() => {
    if (!hasTimeLimit || !attempt || submitting) return undefined;

    const timer = setInterval(() => {
      setTimeLeft(Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000)));
    }, 1000);

    return () => clearInterval(timer);
  }, [attempt, hasTimeLimit, submitting]);

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

  // Modal xác nhận nộp và modal kỹ năng tự xử lý Escape (Modal dùng chung);
  // chỉ còn bottom sheet phiếu trả lời cần đóng bằng Escape ở đây.
  useEffect(() => {
    if (!answerSheetOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setAnswerSheetOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [answerSheetOpen]);

  const handleAnswerChange = useCallback((questionId, optionId) => {
    setActiveQuestionId(questionId);
    setAnswers((current) => ({ ...current, [questionId]: optionId }));
  }, []);

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
    setAnswerSheetOpen(false);
  };

  const goToPage = useCallback(
    (page) => {
      const target = getPageNavigationTarget(questions, page, PAGE_SIZE);

      setCurrentPage(target.page);
      setActiveQuestionId(target.questionId);
      setPendingScrollQuestionId(target.questionId);
    },
    [questions],
  );

  // Phím tắt bàn phím: 1-9 hoặc A-D chọn đáp án, ←/→ chuyển trang câu hỏi.
  // "Câu hỏi đang chọn" = activeQuestionId, tức thẻ câu hỏi nhận tương tác gần
  // nhất (bấm chuột, focus, trả lời, hoặc điều hướng từ phiếu trả lời) — cách
  // đơn giản và dễ đoán nhất, không cần theo dõi vị trí cuộn.
  useEffect(() => {
    const anyDialogOpen =
      submitConfirmOpen || Boolean(activeSkillQuestion) || answerSheetOpen;
    if (anyDialogOpen || submitting) return undefined;

    // Không cướp phím khi người dùng đang gõ chữ (radio/checkbox không tính).
    const isTextEntryTarget = (element) => {
      if (!(element instanceof HTMLElement)) return false;
      if (element.isContentEditable) return true;
      const tag = element.tagName;
      if (tag === "TEXTAREA" || tag === "SELECT") return true;
      if (tag !== "INPUT") return false;
      return !["radio", "checkbox", "button", "submit", "range"].includes(
        (element.type || "").toLowerCase(),
      );
    };

    const handleShortcuts = (event) => {
      if (event.defaultPrevented) return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (isTextEntryTarget(event.target)) return;

      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        // Khi focus nằm trong input (kể cả radio), giữ hành vi mũi tên mặc định.
        if (
          event.target instanceof HTMLElement &&
          ["INPUT", "SELECT"].includes(event.target.tagName)
        ) {
          return;
        }
        event.preventDefault();
        goToPage(currentPage + (event.key === "ArrowRight" ? 1 : -1));
        return;
      }

      let optionIndex = -1;
      if (/^[1-9]$/.test(event.key)) {
        optionIndex = Number(event.key) - 1;
      } else if (/^[a-d]$/i.test(event.key)) {
        optionIndex = event.key.toLowerCase().charCodeAt(0) - 97;
      }
      if (optionIndex < 0) return;

      const activeQuestion = questions.find(
        (question) => question.questionId === activeQuestionId,
      );
      const option = activeQuestion?.options?.[optionIndex];
      if (!option) return;

      event.preventDefault();
      handleAnswerChange(activeQuestion.questionId, option.optionId);
    };

    window.addEventListener("keydown", handleShortcuts);
    return () => window.removeEventListener("keydown", handleShortcuts);
  }, [
    activeQuestionId,
    activeSkillQuestion,
    answerSheetOpen,
    currentPage,
    goToPage,
    handleAnswerChange,
    questions,
    submitConfirmOpen,
    submitting,
  ]);

  const handleSubmit = () => {
    if (submitting) return;
    setAnswerSheetOpen(false);
    setSubmitConfirmOpen(true);
  };

  const closeSubmitConfirm = () => {
    if (submitting) return;
    setSubmitConfirmOpen(false);
  };

  const confirmSubmit = async () => {
    if (submitting) return;
    // Chỉ đóng hộp thoại khi nộp thành công để lỗi hiện ngay cạnh nút bấm.
    const submitted = await doSubmit(answers);
    if (submitted) setSubmitConfirmOpen(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const paddedSecs = secs.toString().padStart(2, "0");
    if (seconds >= 3600) {
      return `${Math.floor(seconds / 3600)}:${(mins % 60)
        .toString()
        .padStart(2, "0")}:${paddedSecs}`;
    }
    return `${mins.toString().padStart(2, "0")}:${paddedSecs}`;
  };

  const timeLimitLabel = hasTimeLimit ? `${quiz?.duration} phút` : "Không giới hạn thời gian";
  const timerLabel = hasTimeLimit ? formatTime(timeLeft) : "Không giới hạn thời gian";

  if (loading) {
    return (
      <div className="quiz-loading">
        <Spinner size={32} />
        <p>Đang tải bài kiểm tra...</p>
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
          title="Không tìm thấy bài kiểm tra"
          description="Bài kiểm tra này không tồn tại hoặc đã bị gỡ."
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
            <span>{questions.length} câu hỏi</span>
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
            <span className="quiz-info-banner__hint">
              Phím tắt: 1-4 chọn đáp án, ←/→ chuyển trang.
            </span>
          </div>

          {questions.length === 0 && (
            <EmptyState
              title="Bài kiểm tra chưa có câu hỏi"
              description="Bài kiểm tra này chưa được thêm câu hỏi. Vui lòng quay lại sau hoặc chọn bài kiểm tra khác."
              action={
                <Button variant="primary" onClick={() => navigate("/app/subjects")}>
                  Về danh sách môn học
                </Button>
              }
            />
          )}

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
                        aria-pressed={flagged}
                        onClick={() => toggleFlag(question.questionId)}
                      >
                        <Flag size={14} />
                        {flagged ? "Bỏ đánh dấu" : "Đánh dấu"}
                      </button>
                      {hasSkills && (
                        <button
                          type="button"
                          className="skill-btn"
                          onClick={() => setActiveSkillQuestion(question)}
                        >
                          {question.skills.length} kỹ năng
                        </button>
                      )}
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

          {questions.length > 0 && (
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
          )}
        </div>

        {answerSheetOpen && (
          <div
            className="quiz-sheet-overlay"
            onClick={() => setAnswerSheetOpen(false)}
            aria-hidden="true"
          />
        )}

        <aside className={`quiz-sidebar ${answerSheetOpen ? "is-open" : ""}`}>
          <div className="quiz-sidebar__card">
            <div className="quiz-sidebar__head">
              <p className="quiz-sidebar__title">Danh sách câu hỏi</p>
              <button
                type="button"
                className="quiz-sheet-close"
                onClick={() => setAnswerSheetOpen(false)}
                aria-label="Đóng danh sách câu hỏi"
              >
                <X size={20} />
              </button>
            </div>
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
              disabled={questions.length === 0}
              onClick={handleSubmit}
            >
              {submitting ? "Đang nộp bài..." : "Nộp bài"}
            </Button>
          </div>
        </aside>
      </div>

      {/* Thanh thao tác cố định đáy màn hình, chỉ hiện trên mobile */}
      <div className="quiz-bottombar">
        <div className="quiz-bottombar__status">
          {hasTimeLimit && (
            <span
              className={`quiz-bottombar__timer ${
                timeLeft < 60 ? "time-warning" : ""
              }`}
            >
              {formatTime(timeLeft)}
            </span>
          )}
          <span className="quiz-bottombar__count">
            {answeredCount}/{questions.length} câu
          </span>
        </div>
        <Button
          variant="secondary"
          iconLeft={<ListChecks size={18} />}
          onClick={() => setAnswerSheetOpen(true)}
        >
          Danh sách câu
        </Button>
        <Button
          variant="primary"
          loading={submitting}
          disabled={questions.length === 0}
          onClick={handleSubmit}
        >
          Nộp bài
        </Button>
      </div>

      <Modal
        open={submitConfirmOpen}
        onClose={closeSubmitConfirm}
        title="Xác nhận nộp bài"
        size="md"
        footer={
          <div className="submit-confirm-footer">
            <Button
              variant="ghost"
              onClick={closeSubmitConfirm}
              disabled={submitting}
            >
              Quay lại bài kiểm tra
            </Button>
            <Button
              variant="primary"
              onClick={confirmSubmit}
              loading={submitting}
            >
              Nộp và xem kết quả
            </Button>
          </div>
        }
      >
        <div className="submit-confirm-content">
          <p className="submit-confirm-sub">
            Kết quả chỉ được chấm sau thao tác này.
          </p>

          <div className="submit-confirm-stats">
            <StatTile value={answeredCount} label="Đã trả lời" tone="success" />
            <StatTile
              value={flaggedQuestionIds.size}
              label="Đánh dấu"
              tone="warning"
            />
            <StatTile
              value={questions.length - answeredCount}
              label="Chưa trả lời"
              tone={questions.length - answeredCount > 0 ? "danger" : "default"}
            />
          </div>

          {answeredCount < questions.length && (
            <p className="submit-confirm-warning">
              Bạn còn {questions.length - answeredCount} câu chưa trả lời. Có
              thể quay lại danh sách câu hỏi trước khi nộp.
            </p>
          )}

          <p className="submit-confirm-note">
            Sau khi nộp, bạn không thể sửa đáp án; thời gian làm bài sẽ dừng và
            trang kết quả được mở.
          </p>

          {error && (
            <div className="quiz-inline-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
        </div>
      </Modal>

      <SkillInfoModal
        question={activeSkillQuestion}
        onClose={() => setActiveSkillQuestion(null)}
      />
    </div>
  );
}
