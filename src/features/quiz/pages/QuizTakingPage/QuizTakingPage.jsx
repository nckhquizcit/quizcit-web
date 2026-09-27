import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useBlocker, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flag,
  ListChecks,
  X,
} from "lucide-react";
import {
  clearQuizDraft,
  clearQuizDraftsByQuizId,
  getAttemptState,
  getQuestionsByQuiz,
  getQuizById,
  loadQuizDraft,
  saveAttemptDraft,
  saveQuizDraft,
  startQuiz,
  submitAttempt,
} from "../../../../services/quizService";
import { getErrorMessage, getStoredUser } from "../../../../services/apiClient";
import { shuffleQuestionsOptions } from "../../../../utils/shuffle";
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
import ExamExitModal from "../../components/ExamExitModal";
import { getOptionSeedKey, shuffleOptions } from "../../utils/optionShuffle";
import {
  clampQuizPage,
  getAttemptDeadlineAt,
  getPageNavigationTarget,
  getQuestionNavigationTarget,
  getQuizPaginationPages,
  getResumableQuizDraft,
  getTotalQuizPages,
  isAttemptInProgress,
  shouldAutoSubmitAttempt,
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

const QuizQuestionCard = memo(function QuizQuestionCard({
  question,
  questionIndex,
  attemptId,
  selectedOptionId,
  flagged,
  isActive,
  submitting,
  onSelectOption,
  onToggleFlag,
  onShowSkills,
  onSetActive,
  setCardRef,
}) {
  const hasSkills =
    Array.isArray(question.skills) && question.skills.length > 0;
  // Thứ tự đáp án ổn định theo attempt: cùng lượt làm luôn ra cùng một thứ tự.
  const options = useMemo(
    () => shuffleOptions(question.options, getOptionSeedKey(attemptId, question.questionId)),
    [attemptId, question.options, question.questionId],
  );

  return (
    <article
      ref={(element) => setCardRef(question.questionId, element)}
      className={[
        "quiz-question-card",
        flagged ? "is-flagged" : "",
        isActive ? "is-active" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={() => onSetActive(question.questionId)}
    >
      <div className="question-top">
        <div className="question-number">Câu {questionIndex + 1}</div>
        <div className="question-actions">
          <button
            type="button"
            className={`flag-btn ${flagged ? "flag-btn--active" : ""}`}
            aria-pressed={flagged}
            onClick={() => onToggleFlag(question.questionId)}
          >
            <Flag size={14} />
            {flagged ? "Bỏ đánh dấu" : "Đánh dấu"}
          </button>
          {hasSkills && (
            <button
              type="button"
              className="skill-btn"
              onClick={() => onShowSkills(question)}
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
        {options.map((option, optIndex) => {
          const selected = selectedOptionId === option.optionId;
          const inputId = `opt-${question.questionId}-${option.optionId}`;

          return (
            <label
              key={option.optionId}
              htmlFor={inputId}
              className={`option-item ${selected ? "is-selected" : ""}`}
              onClick={(e) => {
                if (submitting) return;
                if (e.target.closest("a")) return;
                if (e.target.tagName !== "INPUT") {
                  onSelectOption(question.questionId, option.optionId);
                }
              }}
            >
              <input
                id={inputId}
                type="radio"
                name={`question-${question.questionId}`}
                value={option.optionId}
                checked={selected}
                onChange={() =>
                  onSelectOption(question.questionId, option.optionId)
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
        {(!question.options || question.options.length === 0) && (
          <p className="quiz-empty-option">
            Câu hỏi này chưa có đáp án lựa chọn.
          </p>
        )}
      </div>
    </article>
  );
});

export default function QuizTakingPage() {
  const { quizId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlAttemptId = searchParams.get("attemptId");
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
  // Hết giờ nhưng nộp tự động thất bại — cần báo rõ và cho thử lại.
  const [autoSubmitFailed, setAutoSubmitFailed] = useState(false);
  const startedRef = useRef(false);
  const submittedRef = useRef(false);
  const timerStartedRef = useRef(false);
  const autoSubmittedRef = useRef(false);
  const leavingRef = useRef(false);
  const routeActiveRef = useRef(true);
  const deadlineRef = useRef(0);
  const questionRefs = useRef(new Map());
  // Bản sao đáp án luôn cập nhật ngay, để lúc tự nộp không đọc phải giá trị cũ
  // trong closure của effect (đáp án cuối có thể rơi cùng nhịp với đồng hồ về 0).
  const answersRef = useRef({});
  const draftSaveQueueRef = useRef(Promise.resolve());

  useEffect(() => {
    routeActiveRef.current = true;
    return () => {
      routeActiveRef.current = false;
    };
  }, []);

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
        const loadedQuestions = Array.isArray(questionsData)
          ? shuffleQuestionsOptions(questionsData)
          : [];

        let attemptData = null;
        let resumableDraft = null;
        let attemptState = null;

        if (urlAttemptId) {
          let draft = loadQuizDraft(urlAttemptId, currentUser.userId);
          attemptState = await getAttemptState(urlAttemptId);
          if (!isAttemptInProgress(attemptState)) {
            clearQuizDraft(urlAttemptId, currentUser.userId);
            clearQuizDraftsByQuizId(quizId, currentUser.userId);
            navigate(`/app/quiz/result/${urlAttemptId}`, { replace: true });
            return;
          }
          attemptData = { attemptId: urlAttemptId };
          if (draft && attemptState.deadlineAt) {
            draft = { ...draft, deadlineAt: new Date(attemptState.deadlineAt).getTime() };
          }
          resumableDraft = getResumableQuizDraft(draft, quizId, durationSeconds, Date.now(), urlAttemptId);
        }

        if (!attemptData) {
          // Bắt đầu một lượt làm mới: dọn dẹp các draft cũ của quiz này (nếu có)
          clearQuizDraftsByQuizId(quizId, currentUser.userId);
          attemptData = await startQuiz(quizId, currentUser.userId);
          setSearchParams({ attemptId: attemptData.attemptId }, { replace: true });
        }

        if (!attemptState) attemptState = await getAttemptState(attemptData.attemptId);
        if (!isAttemptInProgress(attemptState)) {
          clearQuizDraft(attemptData.attemptId, currentUser.userId);
          clearQuizDraftsByQuizId(quizId, currentUser.userId);
          navigate(`/app/quiz/result/${attemptData.attemptId}`, { replace: true });
          return;
        }

        const draftDeadlineAt = Number(resumableDraft?.deadlineAt);
        const serverDeadlineAt = getAttemptDeadlineAt(attemptState, durationSeconds);
        if (durationSeconds > 0 && serverDeadlineAt === null) {
          throw new Error("Không nhận được hạn nộp bài từ máy chủ. Vui lòng tải lại sau.");
        }
        const deadlineAt = serverDeadlineAt ?? (resumableDraft && Number.isFinite(draftDeadlineAt)
          ? draftDeadlineAt
          : Date.now() + durationSeconds * 1000);

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
        const restoredAnswers = {
          ...(attemptState.answers || {}),
          ...(resumableDraft?.answers || {}),
        };
        setAnswers(restoredAnswers);
        answersRef.current = restoredAnswers;
        deadlineRef.current = deadlineAt;
        setTimeLeft(
          durationSeconds > 0
            ? Math.max(0, Math.ceil((deadlineAt - Date.now()) / 1000))
            : 0,
        );
        timerStartedRef.current = durationSeconds > 0;
        autoSubmittedRef.current = false;

        if (resumableDraft) {
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
  }, [currentUser?.userId, navigate, quizId, setSearchParams, urlAttemptId]);

  const totalPages = useMemo(
    () => getTotalQuizPages(questions.length, PAGE_SIZE),
    [questions.length],
  );

  const paginationPages = useMemo(
    () => getQuizPaginationPages(currentPage, totalPages),
    [currentPage, totalPages],
  );

  const pageStartIndex = currentPage * PAGE_SIZE;
  const pageEndIndex = Math.min(pageStartIndex + PAGE_SIZE, questions.length);

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
    if (!attempt?.attemptId || submittedRef.current || !currentUser?.userId) return;
    const answerSnapshot = { ...answers };
    saveQuizDraft(attempt.attemptId, currentUser.userId, {
      answers: answerSnapshot,
      attemptId: attempt.attemptId,
      quizId,
      quizName: quiz?.name || "",
      deadlineAt: deadlineRef.current,
      currentPage,
      flaggedQuestionIds: Array.from(flaggedQuestionIds),
      updatedAt: new Date().toISOString(),
    });
    const timer = window.setTimeout(() => {
      if (submittedRef.current) return;
      draftSaveQueueRef.current = draftSaveQueueRef.current
        .catch(() => {})
        .then(() => saveAttemptDraft(attempt.attemptId, answerSnapshot))
        .catch(() => {});
    }, 350);
    return () => window.clearTimeout(timer);
  }, [answers, attempt?.attemptId, currentPage, currentUser?.userId, flaggedQuestionIds, quiz?.name, quizId]);

  const shouldBlock = Boolean(attempt && !submittedRef.current && !submitting);

  const blocker = useBlocker(
    useCallback(
      ({ currentLocation, nextLocation }) =>
        shouldBlock && currentLocation.pathname !== nextLocation.pathname,
      [shouldBlock],
    ),
  );

  useEffect(() => {
    if (!shouldBlock) return undefined;

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue =
        "Bạn đang làm bài trắc nghiệm, nếu thoát ra thì bài của bạn sẽ tự động được nộp khi hết giờ làm bài.";
      return event.returnValue;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [shouldBlock]);

  const doSubmit = useCallback(
    async (currentAnswers) => {
      if (!attempt?.attemptId || submittedRef.current || leavingRef.current) return false;
      submittedRef.current = true;
      setSubmitting(true);
      setError("");
      setSubmitConfirmOpen(false);

      try {
        const answerList = Object.entries(currentAnswers).map(([questionId, optionId]) => ({
          questionId,
          optionId,
        }));

        await draftSaveQueueRef.current.catch(() => {});
        await saveAttemptDraft(attempt.attemptId, currentAnswers).catch(() => {});

        await submitAttempt({
          quizId,
          attemptId: attempt.attemptId,
          answers: answerList,
        });
        clearQuizDraft(attempt.attemptId, currentUser?.userId);
        clearQuizDraftsByQuizId(quizId, currentUser?.userId);
        if (routeActiveRef.current && !leavingRef.current) {
          setAutoSubmitFailed(false);
          navigate(`/app/quiz/result/${attempt.attemptId}`, { replace: true });
        }
        return true;
      } catch (submitError) {
        if (routeActiveRef.current && !leavingRef.current) {
          submittedRef.current = false;
          setSubmitting(false);
          setError(getErrorMessage(submitError, "Có lỗi xảy ra khi nộp bài. Đáp án của bạn vẫn được giữ lại."));
        }
        return false;
      }
    },
    [attempt?.attemptId, currentUser?.userId, navigate, quizId],
  );

  useEffect(() => {
    if (!hasTimeLimit || !attempt || submitting) return undefined;

    const timer = setInterval(() => {
      setTimeLeft(Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000)));
    }, 1000);

    return () => clearInterval(timer);
  }, [attempt, hasTimeLimit, submitting]);

  useEffect(() => {
    if (shouldAutoSubmitAttempt({
      hasTimeLimit,
      timerStarted: timerStartedRef.current,
      timeLeft,
      hasAttempt: Boolean(attempt),
      submitted: submittedRef.current,
      autoSubmitted: autoSubmittedRef.current,
      leaving: leavingRef.current,
    })) {
      autoSubmittedRef.current = true;
      // Đọc đáp án từ ref: closure của effect có thể đang giữ bản cũ nếu người
      // dùng vừa chọn đáp án cuối cùng nhịp với lúc đồng hồ về 0.
      doSubmit(answersRef.current).then((ok) => {
        // Nộp tự động thất bại thì hạ cờ để người dùng còn nút thử lại.
        if (!ok) {
          autoSubmittedRef.current = false;
          setAutoSubmitFailed(true);
        }
      });
    }
  }, [attempt, doSubmit, hasTimeLimit, timeLeft]);

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
    setActiveQuestionId((prev) => (prev === questionId ? prev : questionId));
    setAnswers((current) => {
      if (current[questionId] === optionId) return current;
      const next = { ...current, [questionId]: optionId };
      // Cập nhật ngay trong updater để ref không bao giờ lệch khỏi state.
      answersRef.current = next;
      return next;
    });
  }, []);

  const handleSetActive = useCallback((questionId) => {
    setActiveQuestionId((prev) => (prev === questionId ? prev : questionId));
  }, []);

  const handleShowSkills = useCallback((question) => {
    setActiveSkillQuestion(question);
  }, []);

  const toggleFlag = useCallback((questionId) => {
    setFlaggedQuestionIds((current) => {
      const next = new Set(current);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  }, []);

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
      // Phím số/chữ phải tra theo đúng thứ tự đáp án đang hiển thị.
      const activeOptions = shuffleOptions(
        activeQuestion?.options,
        getOptionSeedKey(attempt?.attemptId, activeQuestion?.questionId),
      );
      const option = activeOptions[optionIndex];
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
    attempt?.attemptId,
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
    const submitted = await doSubmit(answersRef.current);
    if (submitted) setSubmitConfirmOpen(false);
  };

  const leaveAttempt = async () => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    if (attempt?.attemptId) {
      const save = draftSaveQueueRef.current
        .catch(() => {})
        .then(() => saveAttemptDraft(attempt.attemptId, answersRef.current))
        .catch(() => {});
      await Promise.race([save, new Promise((resolve) => window.setTimeout(resolve, 1000))]);
    }
    blocker.proceed?.();
  };

  const stayInAttempt = () => {
    if (!leavingRef.current) blocker.reset?.();
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

  // Chỉ đếm câu thật sự có trong đề: object đáp án có thể còn khoá của câu đã
  // bị gỡ khỏi đề (khôi phục từ nháp cũ), khiến số đã trả lời vượt tổng số câu.
  const answeredCount = questions.filter(
    (question) => answers[question.questionId] != null,
  ).length;
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

      {autoSubmitFailed && (
        <div className="quiz-inline-error quiz-inline-error--autosubmit" role="alert">
          <AlertCircle size={16} />
          <span>
            Đã hết thời gian làm bài nhưng bài của bạn chưa được nộp thành công.
            Vui lòng thử nộp lại.
          </span>
          <Button
            variant="primary"
            size="sm"
            onClick={() => doSubmit(answersRef.current)}
            loading={submitting}
            disabled={submitting}
          >
            Thử nộp lại
          </Button>
        </div>
      )}

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
          {totalPages > 1 ? (
            <div
              className="quiz-page-bar--top"
              role="region"
              aria-label="Điều hướng trang nhanh"
            >
              <div className="quiz-page-bar__info">
                <span className="quiz-page-bar__badge">
                  Trang {currentPage + 1} / {totalPages}
                </span>
                <span className="quiz-page-bar__range">
                  Câu {pageStartIndex + 1}–{pageEndIndex} / {questions.length} câu
                </span>
                <span className="quiz-page-bar__hint">
                  Phím tắt: 1-4 chọn đáp án, ←/→ chuyển trang
                </span>
              </div>
              <div className="quiz-page-bar__actions">
                <Button
                  variant="secondary"
                  size="sm"
                  iconLeft={<ChevronLeft size={16} />}
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 0}
                  title="Trang trước (Phím tắt: ←)"
                  aria-label="Về trang trước"
                >
                  Trang trước
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  iconRight={<ChevronRight size={16} />}
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= totalPages - 1}
                  title="Trang sau (Phím tắt: →)"
                  aria-label="Sang trang sau"
                >
                  Trang sau
                </Button>
              </div>
            </div>
          ) : (
            <div className="quiz-info-banner">
              <span className="quiz-info-banner__icon" aria-hidden="true">
                ⓘ
              </span>
              <span className="quiz-info-banner__hint">
                Phím tắt: 1-4 chọn đáp án
              </span>
            </div>
          )}

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
            {visibleQuestions.map((question, index) => {
              const questionIndex = currentPage * PAGE_SIZE + index;
              return (
                <QuizQuestionCard
                  key={question.questionId}
                  question={question}
                  questionIndex={questionIndex}
                  attemptId={attempt?.attemptId}
                  selectedOptionId={answers[question.questionId]}
                  flagged={flaggedQuestionIds.has(question.questionId)}
                  isActive={activeQuestionId === question.questionId}
                  submitting={submitting}
                  onSelectOption={handleAnswerChange}
                  onToggleFlag={toggleFlag}
                  onShowSkills={handleShowSkills}
                  onSetActive={handleSetActive}
                  setCardRef={setQuestionCardRef}
                />
              );
            })}
          </div>

          {questions.length > 0 && totalPages > 1 && (
            <nav className="quiz-pagination" aria-label="Điều hướng trang câu hỏi">
              <div className="quiz-pagination__actions-desktop">
                <Button
                  variant="secondary"
                  size="md"
                  className="quiz-pagination__btn quiz-pagination__btn--prev"
                  iconLeft={<ChevronLeft size={18} />}
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 0}
                  title="Trang trước (Phím tắt: ←)"
                >
                  Trang trước
                </Button>
              </div>

              <div className="quiz-pagination__center">
                <div className="quiz-pagination__pages" aria-label="Danh sách trang">
                  {paginationPages.map((item, idx) =>
                    typeof item === "number" ? (
                      <button
                        key={item}
                        type="button"
                        className={`quiz-page-pill ${
                          item === currentPage ? "is-active" : ""
                        }`}
                        onClick={() => goToPage(item)}
                        aria-current={item === currentPage ? "page" : undefined}
                        aria-label={`Chuyển đến trang ${item + 1}`}
                      >
                        {item + 1}
                      </button>
                    ) : (
                      <span
                        key={`ellipsis-${idx}`}
                        className="quiz-page-ellipsis"
                        aria-hidden="true"
                      >
                        …
                      </span>
                    ),
                  )}
                </div>
                <span className="quiz-pagination__indicator">
                  Trang <strong>{currentPage + 1}</strong> / {totalPages}
                </span>
              </div>

              <div className="quiz-pagination__actions-desktop">
                {currentPage < totalPages - 1 ? (
                  <Button
                    variant="primary"
                    size="md"
                    className="quiz-pagination__btn quiz-pagination__btn--next"
                    iconRight={<ChevronRight size={18} />}
                    onClick={() => goToPage(currentPage + 1)}
                    title="Trang sau (Phím tắt: →)"
                  >
                    Trang sau
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="md"
                    className="quiz-pagination__btn quiz-pagination__btn--submit"
                    iconRight={<CheckCircle2 size={18} />}
                    onClick={handleSubmit}
                    disabled={questions.length === 0 || submitting}
                  >
                    {submitting ? "Đang nộp..." : "Nộp bài"}
                  </Button>
                )}
              </div>

              {/* Hàng nút bấm lớn trên màn hình mobile / cảm ứng */}
              <div className="quiz-pagination__mobile-actions">
                <Button
                  variant="secondary"
                  size="md"
                  className="quiz-pagination__btn quiz-pagination__btn--prev"
                  iconLeft={<ChevronLeft size={18} />}
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 0}
                  title="Trang trước"
                >
                  Trang trước
                </Button>
                {currentPage < totalPages - 1 ? (
                  <Button
                    variant="primary"
                    size="md"
                    className="quiz-pagination__btn quiz-pagination__btn--next"
                    iconRight={<ChevronRight size={18} />}
                    onClick={() => goToPage(currentPage + 1)}
                    title="Trang sau"
                  >
                    Trang sau
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="md"
                    className="quiz-pagination__btn quiz-pagination__btn--submit"
                    iconRight={<CheckCircle2 size={18} />}
                    onClick={handleSubmit}
                    disabled={questions.length === 0 || submitting}
                  >
                    {submitting ? "Đang nộp..." : "Nộp bài"}
                  </Button>
                )}
              </div>
            </nav>
          )}

          {questions.length > 0 && totalPages === 1 && (
            <div className="quiz-pagination quiz-pagination--single-page">
              <span className="quiz-pagination__single-page-note">
                Đã hiển thị toàn bộ {questions.length} câu hỏi
              </span>
              <Button
                variant="primary"
                size="md"
                className="quiz-pagination__btn quiz-pagination__btn--submit"
                iconRight={<CheckCircle2 size={18} />}
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Đang nộp..." : "Nộp bài"}
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

      <ExamExitModal
        open={blocker.state === "blocked"}
        onStay={stayInAttempt}
        onLeave={leaveAttempt}
      />
    </div>
  );
}
