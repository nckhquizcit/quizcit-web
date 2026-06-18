import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getQuizById, getQuestionsByChapter, startQuiz, submitAttempt } from "../../../../services/quizService";
import "./QuizTakingPage.css";

export default function QuizTakingPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);

  const currentUser = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    const loadQuiz = async () => {
      if (!currentUser?.userId) {
        navigate("/login");
        return;
      }

      try {
        const [quizData, attemptData] = await Promise.all([
          getQuizById(quizId),
          startQuiz(quizId, currentUser.userId),
        ]);

        const questionsData = (await getQuestionsByChapter(quizData.chapterId)) || [];

        setQuiz(quizData);
        setQuestions(questionsData);
        setAttempt(attemptData);
        setTimeLeft(quizData.duration * 60);
        setLoading(false);
      } catch (error) {
        console.error("Error loading quiz:", error);
        alert("Không thể bắt đầu bài kiểm tra. Vui lòng thử lại.");
        navigate("/app/subjects");
      }
    };

    loadQuiz();
  }, [quizId, currentUser, navigate]);

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

      <div className="quiz-questions">
        {questions.map((question, index) => (
          <div key={question.questionId} className="quiz-question-card">
            <div className="question-number">Câu {index + 1}</div>
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
        ))}
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
    </div>
  );
}