import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import "./QuizTakingPage.css";

const PAGE_SIZE = 5;

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
  const [activeSkillQuestion, setActiveSkillQuestion] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [hasTimeLimit, setHasTimeLimit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const startedRef = useRef(false);
  const submittedRef = useRef(false);
  const timerStartedRef = useRef(false);
  const autoSubmittedRef = useRef(false);

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

        setQuiz(quizData);
        setQuestions(Array.isArray(questionsData) ? questionsData : []);
        setAttempt(attemptData);
        setHasTimeLimit(durationSeconds > 0);
        setTimeLeft(durationSeconds);
        timerStartedRef.current = durationSeconds > 0;
        autoSubmittedRef.current = false;

        if (draft?.answers) {
          setAnswers(draft.answers);
          setCurrentPage(Number(draft.currentPage || 0));
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
    () => Math.max(1, Math.ceil(questions.length / PAGE_SIZE)),
    [questions.length],
  );

  const visibleQuestions = useMemo(() => {
    const start = currentPage * PAGE_SIZE;
    return questions.slice(start, start + PAGE_SIZE);
  }, [currentPage, questions]);

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
    setCurrentPage(Math.floor(index / PAGE_SIZE));
  };

  const goToPage = (page) => {
    setCurrentPage(Math.min(Math.max(page, 0), totalPages - 1));
  };

  const handleSubmit = async () => {
    if (submitting) return;
    const answered = Object.keys(answers).length;
    const confirmed = window.confirm(`Bạn đã trả lời ${answered}/${questions.length} câu. Xác nhận nộp bài?`);
    if (confirmed) await doSubmit(answers);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const timeLimitLabel = hasTimeLimit ? `${quiz?.duration} phút` : "Không giới hạn thời gian";
  const timerLabel = hasTimeLimit ? formatTime(timeLeft) : "Không giới hạn thời gian";

  if (loading) {
    return <div className="quiz-loading">Đang tải đề thi...</div>;
  }

  if (error && !quiz) {
    return (
      <div className="quiz-error">
        <p>{error}</p>
        <button type="button" onClick={() => navigate("/app/subjects")}>
          Quay lại danh sách môn học
        </button>
      </div>
    );
  }

  if (!quiz || !attempt) {
    return <div className="quiz-error">Không tìm thấy đề thi</div>;
  }

  return (
    <div className="quiz-taking-page">
      <div className="quiz-header">
        <div>
          <h1>{quiz.name}</h1>
          <div className="quiz-meta">
            <span>{quiz.totalQuestion || questions.length} câu hỏi</span>
            <span>-</span>
            <span>{timeLimitLabel}</span>
          </div>
        </div>
        <div className={`quiz-timer ${hasTimeLimit && timeLeft < 60 ? "time-warning" : ""}`}>{timerLabel}</div>
      </div>

      {error && <div className="quiz-error inline-error">{error}</div>}

      <div className="quiz-progress">
        Đã trả lời: {Object.keys(answers).length} / {questions.length}
      </div>

      <div className="quiz-nav">
        {questions.map((question, index) => {
          const answered = answers[question.questionId] != null;
          const flagged = flaggedQuestionIds.has(question.questionId);
          const isCurrentPage = Math.floor(index / PAGE_SIZE) === currentPage;
          const classes = ["quiz-nav-item", answered ? "answered" : "", flagged ? "flagged" : "", isCurrentPage ? "in-current-page" : ""]
            .filter(Boolean)
            .join(" ");

          return (
            <button key={question.questionId} type="button" className={classes} onClick={() => goToQuestion(index)}>
              {index + 1}
              {flagged && <span className="quiz-nav-flag">!</span>}
            </button>
          );
        })}
      </div>

      <div className="quiz-questions">
        {visibleQuestions.map((question) => {
          const questionIndex = questions.findIndex((item) => item.questionId === question.questionId);
          const flagged = flaggedQuestionIds.has(question.questionId);
          const hasSkills = Array.isArray(question.skills) && question.skills.length > 0;

          return (
            <article key={question.questionId} className={`quiz-question-card ${flagged ? "is-flagged" : ""}`}>
              <div className="question-top">
                <div className="question-number">Câu {questionIndex + 1}</div>
                <div className="question-actions">
                  <button type="button" className="flag-btn" onClick={() => toggleFlag(question.questionId)}>
                    {flagged ? "Bỏ đánh dấu" : "Đánh dấu"}
                  </button>
                  <button
                    type="button"
                    className="skill-btn"
                    disabled={!hasSkills}
                    onClick={() => setActiveSkillQuestion(question)}
                  >
                    {hasSkills ? `${question.skills.length} kỹ năng` : "Chưa gắn kỹ năng"}
                  </button>
                </div>
              </div>

              <p className="question-content">{question.content}</p>

              <div className="options-list">
                {(question.options || []).map((option) => (
                  <label key={option.optionId} className="option-item">
                    <input
                      type="radio"
                      name={question.questionId}
                      checked={answers[question.questionId] === option.optionId}
                      onChange={() => handleAnswerChange(question.questionId, option.optionId)}
                      disabled={submitting}
                    />
                    <span className="option-text">{option.content}</span>
                  </label>
                ))}
                {(!question.options || question.options.length === 0) && (
                  <p className="quiz-empty-option">Câu hỏi này chưa có đáp án lựa chọn.</p>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <div className="quiz-pagination">
        <button type="button" className="page-btn" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 0}>
          Trước
        </button>
        <span className="page-indicator">
          Trang {currentPage + 1} / {totalPages}
        </span>
        <button
          type="button"
          className="page-btn"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
        >
          Sau
        </button>
      </div>

      <div className="quiz-actions">
        <button className="submit-btn" type="button" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Đang nộp bài..." : "Nộp bài"}
        </button>
      </div>

      {activeSkillQuestion && (
        <div className="skill-modal-overlay" onClick={() => setActiveSkillQuestion(null)}>
          <div className="skill-modal" onClick={(event) => event.stopPropagation()}>
            <div className="skill-modal-header">
              <h3>Kỹ năng của câu hỏi</h3>
              <button type="button" onClick={() => setActiveSkillQuestion(null)}>
                Đóng
              </button>
            </div>
            <ul className="skill-list">
              {(activeSkillQuestion.skills || []).map((skill) => (
                <li key={skill.skillId} className="skill-item">
                  <span>{skill.name || skill.skillId}</span>
                  {skill.primary && <span className="skill-primary-badge">Chính</span>}
                  <span className="skill-weight">Trọng số: {skill.weight ?? "—"}</span>
                </li>
              ))}
              {(!activeSkillQuestion.skills || activeSkillQuestion.skills.length === 0) && (
                <li className="skill-item skill-empty">Câu hỏi này chưa gắn kỹ năng.</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
