import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Save, Search, Trash2, X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../components/AdminPageHeader";
import ErrorState from "../../../components/ui/ErrorState/ErrorState";
import { getErrorMessage } from "../../../services/apiClient";
import { getQuestionsByChapter, getQuestionsByQuiz, getQuizById, updateQuiz } from "../../../services/quizService";
import { useToast } from "../../../components/ui/Toast/Toast";
import { toPreviewText } from "../../../components/richtext/richTextUtils";
import { getDifficultyLabelVi, getDifficultyTone } from "../utils/difficultyLevels";
import "./AdminQuizzes.css";

const BANK_CACHE_PREFIX = "quizcit:question-bank:";
const getQuestionId = (question) => String(question?.questionId ?? question?.id ?? "");

function readCachedBank(chapterId) {
  try {
    const value = sessionStorage.getItem(`${BANK_CACHE_PREFIX}${chapterId}`);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function cacheBank(chapterId, questions) {
  try {
    sessionStorage.setItem(`${BANK_CACHE_PREFIX}${chapterId}`, JSON.stringify(questions));
  } catch {
    // Cache failure must not block question management.
  }
}

export default function AdminQuizQuestions() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [quiz, setQuiz] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [bankQuestions, setBankQuestions] = useState([]);
  const [bankSelection, setBankSelection] = useState([]);
  const [bankOpen, setBankOpen] = useState(false);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankQuery, setBankQuery] = useState("");
  const [error, setError] = useState("");
  const [bankError, setBankError] = useState("");
  const [saving, setSaving] = useState(false);
  const returnPath = `/admin/quizzes/${quizId}/edit`;

  const load = useCallback(async () => {
    try {
      setError("");
      const [quizData, currentQuestions] = await Promise.all([
        getQuizById(quizId),
        getQuestionsByQuiz(quizId),
      ]);
      setQuiz(quizData);
      setQuizQuestions(currentQuestions || []);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Không thể tải câu hỏi của đề thi."));
    }
  }, [quizId]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const closeQuestionBank = useCallback(() => setBankOpen(false), []);

  useEffect(() => {
    if (!bankOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") closeQuestionBank();
    };

    const previousOverflow = document.body.style.overflow;
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [bankOpen, closeQuestionBank]);

  const openQuestionBank = async () => {
    if (!quiz) return;
    setBankOpen(true);
    setBankError("");
    setBankSelection([]);

    const cached = readCachedBank(quiz.chapterId);
    if (Array.isArray(cached)) {
      setBankQuestions(cached);
      return;
    }

    try {
      setBankLoading(true);
      const questions = (await getQuestionsByChapter(quiz.chapterId)) || [];
      setBankQuestions(questions);
      cacheBank(quiz.chapterId, questions);
    } catch (loadError) {
      setBankError(getErrorMessage(loadError, "Không thể tải ngân hàng câu hỏi."));
    } finally {
      setBankLoading(false);
    }
  };

  const currentIds = useMemo(() => new Set(quizQuestions.map(getQuestionId)), [quizQuestions]);
  const availableBankQuestions = useMemo(() => {
    const keyword = bankQuery.trim().toLowerCase();
    return bankQuestions.filter((question) => {
      if (currentIds.has(getQuestionId(question))) return false;
      return !keyword || question.content?.toLowerCase().includes(keyword);
    });
  }, [bankQuestions, bankQuery, currentIds]);

  const toggleBankQuestion = (questionId) => setBankSelection((current) =>
    current.includes(questionId) ? current.filter((id) => id !== questionId) : [...current, questionId],
  );

  const addSelectedQuestions = () => {
    const selected = bankQuestions.filter((question) => bankSelection.includes(getQuestionId(question)));
    setQuizQuestions((current) => [...current, ...selected]);
    setBankSelection([]);
    closeQuestionBank();
  };

  const removeQuestion = (questionId) => {
    setQuizQuestions((current) => current.filter((question) => getQuestionId(question) !== questionId));
  };

  const save = async () => {
    if (!quizQuestions.length) { setError("Đề thi phải có ít nhất một câu hỏi."); return; }
    try {
      setSaving(true); setError("");
      await updateQuiz(quizId, {
        name: quiz.name,
        duration: quiz.durationMinutes ?? quiz.duration,
        chapterId: quiz.chapterId,
        displayOrder: quiz.displayOrder,
        questionIds: quizQuestions.map(getQuestionId),
      });
      toast.success("Đã cập nhật câu hỏi của đề thi.");
      navigate(returnPath);
    } catch (saveError) { setError(getErrorMessage(saveError, "Không thể cập nhật câu hỏi.")); }
    finally { setSaving(false); }
  };

  return <>
    <AdminPageHeader
      title="Câu hỏi trong đề"
      subtitle={quiz ? `${quiz.name} · ${quizQuestions.length} câu` : "Đang tải câu hỏi..."}
      backHref={returnPath}
      backLabel="Chỉnh sửa đề"
      action={<button className="cancel-btn" onClick={openQuestionBank} disabled={!quiz}><Plus size={17} /> Thêm từ ngân hàng</button>}
    />

    <div className="admin-section-card adm2-card-pad quiz-questions-page">
      {error && <ErrorState description={error} onRetry={!quiz ? load : undefined} />}

      <div className="adm2-section-heading">
        <h3>Đang có trong đề</h3>
        <p>{quizQuestions.length} câu hỏi</p>
      </div>

      <div className="quiz-question-list quiz-question-list--scroll quiz-current-list">
        {quizQuestions.map((question, index) => {
          const questionId = getQuestionId(question);
          return (
            <div key={questionId} className="quiz-question-checkbox-row">
              <span className="bank-question-index">{String(index + 1).padStart(2, "0")}</span>
              <span className="quiz-question-content">
                <span>{toPreviewText(question.content, question.contentFormat)}</span>
              </span>
              <span className={`difficulty-pill ${getDifficultyTone(question.difficultyB)}`}>
                {getDifficultyLabelVi(question.difficultyB)}
              </span>
              <button type="button" className="adm2-text-btn is-danger" onClick={() => removeQuestion(questionId)}>
                <Trash2 size={14} /> Bỏ
              </button>
            </div>
          );
        })}
        {quiz && !quizQuestions.length && <div className="quiz-inline-empty">Đề thi hiện chưa có câu hỏi.</div>}
        {!quiz && !error && <div className="quiz-inline-empty">Đang tải câu hỏi của đề thi...</div>}
      </div>

      <div className="question-modal-actions">
        <button className="cancel-btn" type="button" onClick={() => navigate(returnPath)} disabled={saving}>
          Hủy thay đổi
        </button>
        <button className="add-btn" type="button" onClick={save} disabled={saving || !quiz}>
          <Save size={17} /> {saving ? "Đang lưu..." : `Lưu danh sách ${quizQuestions.length} câu`}
        </button>
      </div>
    </div>

    {bankOpen && <div className="quiz-bank-overlay" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) closeQuestionBank(); }}>
      <section className="quiz-bank-dialog" role="dialog" aria-modal="true" aria-labelledby="quiz-bank-title">
        <header className="quiz-bank-header"><div><h2 id="quiz-bank-title">Ngân hàng chương</h2><p>Có thể chọn nhiều câu hỏi trong một lần.</p></div><button className="quiz-bank-close" type="button" onClick={closeQuestionBank} aria-label="Đóng"><X size={18} /></button></header>
        <div className="quiz-bank-body">
          {bankError && <div className="modal-inline-error">{bankError}</div>}
          <label className="quiz-bank-search"><Search size={17} /><input value={bankQuery} onChange={(event) => setBankQuery(event.target.value)} placeholder="Tìm nội dung câu hỏi..." /><span className="sr-only">Tìm nội dung câu hỏi</span></label>
          {bankLoading ? <div className="quiz-inline-empty">Đang tải ngân hàng câu hỏi...</div> : <div className="quiz-question-list quiz-question-list--scroll quiz-bank-list">
            {availableBankQuestions.map((question) => {
              const id = getQuestionId(question);
              const skillCount = question.skills?.length || 0;
              return (
                <label key={id} className={`quiz-question-checkbox-row ${bankSelection.includes(id) ? "selected" : ""}`}>
                  <input type="checkbox" checked={bankSelection.includes(id)} onChange={() => toggleBankQuestion(id)} />
                  <span className="quiz-question-content">
                    <span>{toPreviewText(question.content, question.contentFormat)}</span>
                    <span className="quiz-bank-option-meta">
                      {getDifficultyLabelVi(question.difficultyB)} · {skillCount} kỹ năng
                    </span>
                  </span>
                </label>
              );
            })}
            {!bankLoading && !availableBankQuestions.length && <div className="quiz-inline-empty">Không còn câu hỏi phù hợp để thêm.</div>}
          </div>}
        </div>
        <footer className="quiz-bank-footer">
          <span className="quiz-bank-footer-note">Đã chọn thêm {bankSelection.length} câu</span>
          <button className="add-btn" onClick={addSelectedQuestions} disabled={!bankSelection.length}><Plus size={17} /> Thêm {bankSelection.length || ""} câu vào đề</button>
        </footer>
      </section>
    </div>}
  </>;
}
