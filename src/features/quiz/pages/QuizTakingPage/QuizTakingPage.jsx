import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getQuizById, getQuestionsByQuiz, startQuiz, submitAttempt } from "../../../../services/quizService";

import "./QuizTakingPage.css";

// Task 2: số câu hỏi render mỗi cụm/trang.
const PAGE_SIZE = 5;

export default function QuizTakingPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  // `questions` là nguồn dữ liệu đầy đủ đã cache (toàn bộ câu hỏi của quiz).
  const [questions, setQuestions] = useState([]);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  // Tập câu hỏi đã cắm cờ (lưu theo questionId để không phụ thuộc index).
  const [flaggedQuestionIds, setFlaggedQuestionIds] = useState(() => new Set());
  // Trang hiện tại (0-based) của cụm 5 câu.
  const [currentPage, setCurrentPage] = useState(0);
  // Câu đang mở popup skill (null nếu đóng).
  const [activeSkillQuestion, setActiveSkillQuestion] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);
  // Chỉ khởi tạo attempt một lần cho mỗi quiz; tránh gọi startQuiz lặp lại.
  const startedRef = useRef(false);

  // Đọc user một lần với reference ổn định. Nếu parse trực tiếp trong render,
  // mỗi lần render sẽ tạo object mới -> useEffect chạy lại -> startQuiz bị gọi
  // liên tục, sinh ra hàng loạt attempt rỗng trong DB.
  const currentUser = useMemo(
    () => JSON.parse(localStorage.getItem("user") || "null"),
    [],
  );

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const loadQuiz = async () => {
      if (!currentUser?.userId) {
        navigate("/login");
        return;
      }

      try {
        const [quizData, questionsData, attemptData] = await Promise.all([
          getQuizById(quizId),
          getQuestionsByQuiz(quizId),
          startQuiz(quizId, currentUser.userId),
        ]);

        setQuiz(quizData);
        setQuestions(Array.isArray(questionsData) ? questionsData : []);
        setAttempt(attemptData);
        setTimeLeft(quizData.duration * 60);
        setLoading(false);
      } catch (error) {
        console.error("Error loading quiz:", error);
        alert("Không thể bắt đầu bài kiểm tra. Vui lòng thử lại.");
        // Cho phép thử lại nếu khởi tạo thất bại.
        startedRef.current = false;
        navigate("/app/subjects");
      }
    };

    loadQuiz();
  }, [quizId, currentUser, navigate]);


  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(questions.length / PAGE_SIZE)),
    [questions.length],
  );

  // Câu hỏi của trang hiện tại (cụm 5 câu). Toàn bộ questions vẫn được cache
  // trong state nên chuyển trang không mất đáp án/cờ đã chọn.
  const visibleQuestions = useMemo(() => {
    const start = currentPage * PAGE_SIZE;
    return questions.slice(start, start + PAGE_SIZE);
  }, [questions, currentPage]);

  const doSubmit = async (currentAnswers) => {
    if (!attempt || submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);

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

      navigate(`/app/quiz/result/${attempt.attemptId}`);
    } catch (error) {
      console.error("Error submitting quiz:", error);
      alert("Có lỗi xảy ra khi nộp bài. Vui lòng thử lại.");
      submittedRef.current = false;
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (timeLeft <= 0 || !attempt) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, attempt]);

  useEffect(() => {
    if (timeLeft === 0 && attempt && !submittedRef.current) {
      doSubmit(answers);
    }
  }, [timeLeft]);

  const handleAnswerChange = (questionId, optionId) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const toggleFlag = (questionId) => {
    setFlaggedQuestionIds((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  // Click số câu `x` trên navigation -> chuyển tới page chứa câu `x`.
  const goToQuestion = (index) => {
    setCurrentPage(Math.floor(index / PAGE_SIZE));
  };

  const goToPage = (page) => {
    setCurrentPage(Math.min(Math.max(page, 0), totalPages - 1));
  };

  const handleSubmit = async () => {
    if (submitting) return;

    const answered = Object.keys(answers).length;
    const confirmed = window.confirm(
      `Bạn đã trả lời ${answered}/${questions.length} câu. Xác nhận nộp bài?`,
    );
    if (!confirmed) return;

    await doSubmit(answers);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return <div className="quiz-loading">Đang tải đề thi...</div>;
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
            <span>{quiz.totalQuestion} câu hỏi</span>
            <span>•</span>
            <span>{quiz.duration} phút</span>
          </div>
        </div>
        <div className={`quiz-timer ${timeLeft < 60 ? "time-warning" : ""}`}>
          ⏱️ {formatTime(timeLeft)}
        </div>
      </div>

      <div className="quiz-progress">
        Đã trả lời: {Object.keys(answers).length} / {questions.length}
      </div>

      {/* Thanh điều hướng nhanh theo số câu */}
      <div className="quiz-nav">
        {questions.map((question, index) => {
          const answered = answers[question.questionId] != null;
          const flagged = flaggedQuestionIds.has(question.questionId);
          const isCurrentPage =
            Math.floor(index / PAGE_SIZE) === currentPage;
          const classes = [
            "quiz-nav-item",
            answered ? "answered" : "",
            flagged ? "flagged" : "",
            isCurrentPage ? "in-current-page" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <button
              key={question.questionId}
              type="button"
              className={classes}
              onClick={() => goToQuestion(index)}
              title={`Câu ${index + 1}${flagged ? " (đã cắm cờ)" : ""}`}
            >
              {index + 1}
              {flagged && <span className="quiz-nav-flag">🚩</span>}
            </button>
          );
        })}
      </div>

      <div className="quiz-questions">
        {visibleQuestions.map((question) => {
          const questionIndex = questions.findIndex(
            (q) => q.questionId === question.questionId,
          );
          const flagged = flaggedQuestionIds.has(question.questionId);
          const hasSkills = Array.isArray(question.skills) && question.skills.length > 0;
          return (
            <div
              key={question.questionId}
              className={`quiz-question-card ${flagged ? "is-flagged" : ""}`}
            >
              <div className="question-top">
                <div className="question-number">Câu {questionIndex + 1}</div>
                <div className="question-tools">
                  {hasSkills && (
                    <button
                      type="button"
                      className="skill-btn"
                      onClick={() => setActiveSkillQuestion(question)}
                    >
                      🧠 Skill
                    </button>
                  )}
                  <button
                    type="button"
                    className={`flag-btn ${flagged ? "active" : ""}`}
                    onClick={() => toggleFlag(question.questionId)}
                  >
                    {flagged ? "🚩 Đã cắm cờ" : "⚐ Cắm cờ"}
                  </button>
                </div>
              </div>
              <div className="question-content">{question.content}</div>
              <div className="question-options">
                {question.options?.map((option) => (
                  <label key={option.optionId} className="option-label">
                    <input
                      type="radio"
                      name={`question-${question.questionId}`}
                      value={option.optionId}
                      checked={answers[question.questionId] === option.optionId}
                      onChange={() => handleAnswerChange(question.questionId, option.optionId)}
                      disabled={submitting}
                    />
                    <span className="option-text">{option.content}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Phân trang cụm 5 câu */}
      <div className="quiz-pagination">
        <button
          type="button"
          className="page-btn"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 0}
        >
          ← Trước
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
          Sau →
        </button>
      </div>

      <div className="quiz-actions">
        <button
          className="submit-btn"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "Đang nộp bài..." : "Nộp bài"}
        </button>
      </div>

      {/* Popup skill của câu hỏi */}
      {activeSkillQuestion && (
        <div
          className="skill-modal-overlay"
          onClick={() => setActiveSkillQuestion(null)}
        >
          <div className="skill-modal" onClick={(e) => e.stopPropagation()}>
            <div className="skill-modal-header">
              <h3>Kỹ năng liên quan</h3>
              <button
                type="button"
                className="skill-modal-close"
                onClick={() => setActiveSkillQuestion(null)}
              >
                ✕
              </button>
            </div>
            <ul className="skill-list">
              {(activeSkillQuestion.skills || []).map((skill) => (
                <li key={skill.skillId} className="skill-item">
                  <span className="skill-name">
                    {skill.name || skill.skillId}
                    {skill.primary && <span className="skill-primary-badge">Chính</span>}
                  </span>
                  <span className="skill-weight">Trọng số: {skill.weight}</span>
                </li>
              ))}
              {(!activeSkillQuestion.skills || activeSkillQuestion.skills.length === 0) && (
                <li className="skill-item skill-empty">Câu hỏi này chưa gán kỹ năng.</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
