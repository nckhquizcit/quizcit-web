import { useCallback, useEffect, useRef, useState } from "react";
import { useBlocker, useNavigate, useParams } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { Button, EmptyState, ErrorState, Spinner } from "../../../../components/ui";
import RichTextView from "../../../../components/richtext/RichTextView";
import SkillInfoModal from "../../components/SkillInfoModal";
import ExamExitModal from "../../components/ExamExitModal";
import { getErrorMessage, getStoredUser } from "../../../../services/apiClient";
import {
  clearAdaptiveDraft,
  getAdaptiveAttempt,
  getQuizById,
  loadAdaptiveDraft,
  saveAdaptiveDraft,
  submitAdaptiveBatch,
} from "../../../../services/quizService";
import { getSubjectById } from "../../../../services/subjectService";
import {
  ADAPTIVE_PAGE_SIZE,
  buildAdaptiveBatchAnswers,
  hasAnsweredAdaptiveBatch,
} from "./AdaptiveQuizPage.logic.js";
import "../QuizTakingPage/QuizTakingPage.css";
import "./AdaptiveQuizPage.css";

export default function AdaptiveQuizPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState(null);
  const [meta, setMeta] = useState(null);
  const [answers, setAnswers] = useState({});
  const [activeSkillQuestion, setActiveSkillQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const metaRequestedRef = useRef(false);
  const submittedRef = useRef(false);

  useEffect(() => {
    getAdaptiveAttempt(attemptId)
      .then((data) => {
        if (data.completed) {
          submittedRef.current = true;
          navigate(`/app/quiz/result/${attemptId}`, { replace: true });
        } else {
          setState(data);
          const currentUser = getStoredUser();
          const draft = loadAdaptiveDraft(attemptId, currentUser?.userId);
          if (draft && Number(draft.page) === Number(data.page) && draft.answers) {
            setAnswers(draft.answers);
          }
        }
      })
      .catch((err) =>
        setError(getErrorMessage(err, "Không thể tải bài kiểm tra thích ứng.")),
      )
      .finally(() => setLoading(false));
  }, [attemptId, navigate]);

  useEffect(() => {
    // Phase 3: Tận dụng subjectName được trả về trực tiếp trong AdaptiveQuizResponse
    if (state?.subjectName) {
      setMeta({ subjectName: state.subjectName });
      return;
    }
    if (!state?.quizId || metaRequestedRef.current) return;
    metaRequestedRef.current = true;

    // Fallback: chỉ tra cứu phụ nếu backend chưa có subjectName
    getQuizById(state.quizId)
      .then((quiz) => (quiz?.subjectId ? getSubjectById(quiz.subjectId) : null))
      .then((subject) => setMeta({ subjectName: subject?.name || "" }))
      .catch(() => setMeta({ subjectName: "" }));
  }, [state?.quizId, state?.subjectName]);

  const handleSelectAnswer = useCallback((questionId, optionId) => {
    setAnswers((current) => {
      if (current[questionId] === optionId) return current;
      return { ...current, [questionId]: optionId };
    });
  }, []);

  useEffect(() => {
    if (!state?.quizId || submittedRef.current) return;
    const currentUser = getStoredUser();
    if (!currentUser?.userId) return;
    saveAdaptiveDraft(attemptId, currentUser.userId, {
      attemptId,
      quizId: state.quizId,
      page: state.page,
      answers,
      updatedAt: new Date().toISOString(),
    });
  }, [answers, attemptId, state?.page, state?.quizId]);

  const submitPage = async () => {
    const questions = state?.questions || [];
    if (!hasAnsweredAdaptiveBatch(questions, answers)) {
      setError("Vui lòng trả lời đủ 5 câu trước khi tiếp tục.");
      return;
    }
    try {
      setSubmitting(true);
      setError("");
      const next = await submitAdaptiveBatch(
        attemptId,
        buildAdaptiveBatchAnswers(questions, answers),
      );
      const currentUser = getStoredUser();
      clearAdaptiveDraft(attemptId, currentUser?.userId);
      if (next.completed) {
        submittedRef.current = true;
        navigate(`/app/quiz/result/${attemptId}`);
        return;
      }
      setState(next);
      setAnswers({});
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(getErrorMessage(err, "Không thể nộp nhóm câu hỏi này."));
    } finally {
      setSubmitting(false);
    }
  };

  const shouldBlock = Boolean(state && !state.completed && !submittedRef.current && !submitting);

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

  if (loading) return <div className="quiz-loading"><Spinner size={32} /><p>Đang chọn câu hỏi phù hợp...</p></div>;
  if (!state) return <div className="quiz-taking-page adaptive-quiz-page"><ErrorState title="Không thể mở bài kiểm tra thích ứng" description={error} onRetry={() => navigate("/app/subjects")} /></div>;

  const questions = state.questions || [];
  const totalGroups = Math.ceil((state.totalQuestion || 0) / ADAPTIVE_PAGE_SIZE);
  const isLastBatch = state.answeredQuestion + questions.length >= state.totalQuestion;
  const subjectLine = state?.subjectName || meta?.subjectName || "";
  const batchReady = hasAnsweredAdaptiveBatch(questions, answers);
  const answeredInBatch = questions.filter(
    (question) => answers[question.questionId],
  ).length;

  return (
    <div className="quiz-taking-page adaptive-quiz-page">
      <header className="quiz-header">
        <div className="quiz-header__info">
          <h1>Bài kiểm tra thích ứng</h1>
          {subjectLine && <p className="adaptive-header__subject">{subjectLine}</p>}
        </div>
        <div className="adaptive-header__status">
          {questions.length > 0 && (
            <span className="adaptive-header__count">
              {answeredInBatch}/{questions.length} câu
            </span>
          )}
          <span className="adaptive-header__chip">
            Nhóm {state.page}/{totalGroups}
          </span>
        </div>
      </header>

      {error && <div className="quiz-inline-error"><AlertCircle size={16} /><span>{error}</span></div>}

      <div className="quiz-progress">
        <div className="quiz-progress__track">
          <div
            className="quiz-progress__fill"
            style={{ width: `${(state.answeredQuestion / state.totalQuestion) * 100}%` }}
          />
        </div>
      </div>

      <div className="quiz-layout">
        <div className="quiz-main">
          {questions.length === 0 && (
            <EmptyState
              title="Chưa có câu hỏi cho nhóm này"
              description="Hệ thống chưa chọn được câu hỏi phù hợp cho nhóm tiếp theo. Bạn có thể quay lại môn học và thử lại sau."
              action={
                <Button variant="primary" onClick={() => navigate("/app/subjects")}>
                  Về danh sách môn học
                </Button>
              }
            />
          )}
          <div className="quiz-questions">
            {questions.map((question, index) => (
              <article className="quiz-question-card" key={question.questionId}>
                <div className="question-top">
                  <div className="question-number">Câu {state.answeredQuestion + index + 1}</div>
                  {(question.skills?.length ?? 0) > 0 && (
                    <div className="question-actions">
                      <button
                        type="button"
                        className="skill-btn"
                        onClick={() => setActiveSkillQuestion(question)}
                      >
                        {question.skills.length} kỹ năng
                      </button>
                    </div>
                  )}
                </div>
                <RichTextView className="question-content" content={question.content} contentFormat={question.contentFormat} />
                <div className="options-list">
                  {(question.options || []).map((option, optionIndex) => {
                    const selected = answers[question.questionId] === option.optionId;
                    const inputId = `adaptive-opt-${question.questionId}-${option.optionId}`;

                    return (
                      <label
                        key={option.optionId}
                        htmlFor={inputId}
                        className={`option-item ${selected ? "is-selected" : ""}`}
                        onClick={(e) => {
                          if (submitting) return;
                          if (e.target.closest("a")) return;
                          if (e.target.tagName !== "INPUT") {
                            handleSelectAnswer(question.questionId, option.optionId);
                          }
                        }}
                      >
                        <input
                          id={inputId}
                          type="radio"
                          name={`adaptive-q-${question.questionId}`}
                          value={option.optionId}
                          checked={selected}
                          disabled={submitting}
                          onChange={() =>
                            handleSelectAnswer(question.questionId, option.optionId)
                          }
                        />
                        <span className="option-marker">{String.fromCharCode(65 + optionIndex)}</span>
                        <RichTextView className="option-text" variant="inline" content={option.content} contentFormat={option.contentFormat} />
                      </label>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
          {questions.length > 0 && (
            <div className="adaptive-submit-row">
              {!batchReady && (
                <span className="adaptive-submit-row__hint">
                  Vui lòng trả lời đủ 5 câu trước khi tiếp tục.
                </span>
              )}
              <Button
                variant="primary"
                loading={submitting}
                disabled={!batchReady}
                onClick={submitPage}
              >
                {isLastBatch ? "Nộp bài" : "Nộp 5 câu và tiếp tục"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Thanh thao tác cố định đáy màn hình, chỉ hiện trên mobile */}
      {questions.length > 0 && (
        <div className="adaptive-bottombar">
          <div className="adaptive-bottombar__status">
            <span className="adaptive-bottombar__count">
              {answeredInBatch}/{questions.length} câu
            </span>
            <span className="adaptive-bottombar__group">
              Nhóm {state.page}/{totalGroups}
            </span>
          </div>
          <Button
            variant="primary"
            loading={submitting}
            disabled={!batchReady}
            onClick={submitPage}
          >
            {isLastBatch ? "Nộp bài" : "Nộp và tiếp tục"}
          </Button>
        </div>
      )}

      <SkillInfoModal
        question={activeSkillQuestion}
        onClose={() => setActiveSkillQuestion(null)}
      />

      <ExamExitModal
        open={blocker.state === "blocked"}
        onStay={() => blocker.reset?.()}
        onLeave={() => blocker.proceed?.()}
      />
    </div>
  );
}
