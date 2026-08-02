import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { Button, ErrorState, Spinner } from "../../../../components/ui";
import { getErrorMessage } from "../../../../services/apiClient";
import { getAdaptiveAttempt, submitAdaptiveBatch } from "../../../../services/quizService";
import {
  buildAdaptiveBatchAnswers,
  hasAnsweredAdaptiveBatch,
} from "./AdaptiveQuizPage.logic.js";
import "../QuizTakingPage/QuizTakingPage.css";

export default function AdaptiveQuizPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getAdaptiveAttempt(attemptId)
      .then((data) => {
        if (data.completed) navigate(`/app/quiz/result/${attemptId}`, { replace: true });
        else setState(data);
      })
      .catch((err) => setError(getErrorMessage(err, "Không thể tải bài thích ứng.")))
      .finally(() => setLoading(false));
  }, [attemptId, navigate]);

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
      if (next.completed) {
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

  if (loading) return <div className="quiz-loading"><Spinner size={32} /><p>Đang chọn câu hỏi phù hợp...</p></div>;
  if (!state) return <div className="quiz-taking-page"><ErrorState title="Không thể mở bài thích ứng" description={error} onRetry={() => navigate("/app/subjects")} /></div>;

  const questions = state.questions || [];
  return (
    <div className="quiz-taking-page">
      <header className="quiz-header">
        <div className="quiz-header__info">
          <h1>Bài kiểm tra thích ứng</h1>
          <div className="quiz-meta">
            <span>Trang {state.page}</span><span className="quiz-meta__dot" />
            <span>{state.answeredQuestion}/{state.totalQuestion} câu đã nộp</span>
          </div>
        </div>
      </header>
      {error && <div className="quiz-inline-error"><AlertCircle size={16} /><span>{error}</span></div>}
      <div className="quiz-progress"><div className="quiz-progress__track"><div className="quiz-progress__fill" style={{ width: `${state.answeredQuestion / state.totalQuestion * 100}%` }} /></div></div>
      <div className="quiz-main">
        <div className="quiz-questions">
          {questions.map((question, index) => (
            <article className="quiz-question-card" key={question.questionId}>
              <div className="question-number">Câu {state.answeredQuestion + index + 1}</div>
              <p className="question-content">{question.content}</p>
              <div className="options-list">
                {(question.options || []).map((option, optionIndex) => (
                  <label className={`option-item ${answers[question.questionId] === option.optionId ? "is-selected" : ""}`} key={option.optionId}>
                    <input type="radio" name={question.questionId} checked={answers[question.questionId] === option.optionId}
                      disabled={submitting} onChange={() => setAnswers((current) => ({ ...current, [question.questionId]: option.optionId }))} />
                    <span className="option-marker">{String.fromCharCode(65 + optionIndex)}</span>
                    <span className="option-text">{option.content}</span>
                  </label>
                ))}
              </div>
            </article>
          ))}
        </div>
        <div className="quiz-pagination">
          <Button variant="primary" loading={submitting} onClick={submitPage}>
            {state.answeredQuestion + questions.length >= state.totalQuestion ? "Nộp bài" : "Nộp 5 câu và tiếp tục"}
          </Button>
        </div>
      </div>
    </div>
  );
}
