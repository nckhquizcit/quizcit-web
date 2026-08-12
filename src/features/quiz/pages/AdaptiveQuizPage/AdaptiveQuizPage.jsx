import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle, X } from "lucide-react";
import { Button, EmptyState, ErrorState, Spinner } from "../../../../components/ui";
import RichTextView from "../../../../components/richtext/RichTextView";
import { getErrorMessage } from "../../../../services/apiClient";
import {
  getAdaptiveAttempt,
  getQuizById,
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

  useEffect(() => {
    getAdaptiveAttempt(attemptId)
      .then((data) => {
        if (data.completed) navigate(`/app/quiz/result/${attemptId}`, { replace: true });
        else setState(data);
      })
      .catch((err) => setError(getErrorMessage(err, "Không thể tải bài thích ứng.")))
      .finally(() => setLoading(false));
  }, [attemptId, navigate]);

  useEffect(() => {
    if (!state?.quizId || metaRequestedRef.current) return;
    metaRequestedRef.current = true;

    // Each batch can draw from any unlocked chapter in the subject, so there is
    // no single "current chapter" to show — only the subject name is reliable.
    getQuizById(state.quizId)
      .then((quiz) => (quiz?.subjectId ? getSubjectById(quiz.subjectId) : null))
      .then((subject) => setMeta({ subjectName: subject?.name || "" }))
      .catch(() => setMeta({ subjectName: "" }));
  }, [state?.quizId]);

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
  const totalGroups = Math.ceil((state.totalQuestion || 0) / ADAPTIVE_PAGE_SIZE);
  const isLastBatch = state.answeredQuestion + questions.length >= state.totalQuestion;
  const subjectLine = meta?.subjectName || "";
  const batchReady = hasAnsweredAdaptiveBatch(questions, answers);

  return (
    <div className="quiz-taking-page">
      <header className="quiz-header">
        <div className="quiz-header__info">
          <h1>Bài kiểm tra thích ứng</h1>
          {subjectLine && <p className="adaptive-header__subject">{subjectLine}</p>}
        </div>
        <span className="adaptive-header__chip">
          Nhóm {state.page}/{totalGroups}
        </span>
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

      <div className="adaptive-subline">
        <span>Nhóm 5 câu · trả lời đủ rồi nộp để nhận nhóm tiếp theo</span>
        <span className="adaptive-subline__muted">Không hiển thị đúng/sai trước khi nộp</span>
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
                  <div className="question-actions">
                    <button
                      type="button"
                      className="skill-btn"
                      disabled={!question.skills?.length}
                      onClick={() => setActiveSkillQuestion(question)}
                    >
                      {question.skills?.length
                        ? `${question.skills.length} kỹ năng`
                        : "Chưa gắn kỹ năng"}
                    </button>
                  </div>
                </div>
                <RichTextView className="question-content" content={question.content} contentFormat={question.contentFormat} />
                <div className="options-list">
                  {(question.options || []).map((option, optionIndex) => (
                    <label className={`option-item ${answers[question.questionId] === option.optionId ? "is-selected" : ""}`} key={option.optionId}>
                      <input type="radio" name={question.questionId} checked={answers[question.questionId] === option.optionId}
                        disabled={submitting} onChange={() => setAnswers((current) => ({ ...current, [question.questionId]: option.optionId }))} />
                      <span className="option-marker">{String.fromCharCode(65 + optionIndex)}</span>
                      <RichTextView className="option-text" variant="inline" content={option.content} contentFormat={option.contentFormat} />
                    </label>
                  ))}
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

        <aside className="adaptive-rail">
          <div className="adaptive-rail__card">
            <p className="adaptive-rail__title">Cách làm bài thích ứng</p>
            <p className="adaptive-rail__text">
              Mỗi nhóm gồm 5 câu. Trả lời đủ rồi nộp để nhận nhóm câu tiếp theo theo
              năng lực hiện tại.
            </p>
            <p className="adaptive-rail__text">Kết quả hiển thị sau khi hoàn thành bài.</p>
          </div>
        </aside>
      </div>

      {activeSkillQuestion && (
        <div className="skill-modal-overlay" onClick={() => setActiveSkillQuestion(null)}>
          <div
            className="skill-modal"
            role="dialog"
            aria-modal="true"
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
                  {skill.primary && <span className="skill-primary-badge">Chính</span>}
                  <span className="skill-weight">
                    Trọng số: {skill.weight > 0 ? skill.weight : "—"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
