import { useCallback, useEffect, useMemo, useState } from "react";
import { ListChecks, Plus, Save, Search, Trash2, X } from "lucide-react";
import { useBlocker, useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../components/AdminPageHeader";
import ConfirmActionModal from "../components/modals/ConfirmActionModal";
import EmptyState from "../../../components/ui/EmptyState/EmptyState";
import ErrorState from "../../../components/ui/ErrorState/ErrorState";
import { getErrorMessage } from "../../../services/apiClient";
import { getQuestionsByChapter, getQuestionsByQuiz, getQuizById, getQuizDetailWithQuestions, updateQuiz } from "../../../services/quizService";
import { useToast } from "../../../components/ui/Toast/Toast";
import { toPreviewText } from "../../../components/richtext/richTextUtils";
import { getDifficultyLabelVi, getDifficultyTone } from "../utils/difficultyLevels";
import "./AdminQuizzes.css";

const BANK_CACHE_PREFIX = "quizcit:question-bank:";
const getQuestionId = (question) => String(question?.questionId ?? question?.id ?? "");

// De thich ung chon cau theo nang luc nguoi lam, khong co danh sach cau co dinh.
const ADAPTIVE_QUIZ_TYPE = "ADAPTIVE";
const isAdaptiveQuiz = (quiz) => quiz?.type === ADAPTIVE_QUIZ_TYPE;

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
  const [saveError, setSaveError] = useState("");
  const [bankError, setBankError] = useState("");
  const [saving, setSaving] = useState(false);
  // Ban goc ngay sau khi nap xong, dung de biet nguoi dung co sua gi khong.
  const [originalQuestionIds, setOriginalQuestionIds] = useState(null);
  const [pendingLeave, setPendingLeave] = useState(null);
  const returnPath = `/admin/quizzes/${quizId}/edit`;

  const load = useCallback(async () => {
    try {
      setError("");
      let quizData;
      let currentQuestions;
      try {
        const detail = await getQuizDetailWithQuestions(quizId);
        quizData = detail?.quiz;
        currentQuestions = detail?.questions;
      } catch {
        const [loadedQuiz, loadedQuestions] = await Promise.all([
          getQuizById(quizId),
          getQuestionsByQuiz(quizId),
        ]);
        quizData = loadedQuiz;
        currentQuestions = loadedQuestions;
      }
      const loaded = currentQuestions || [];
      setQuiz(quizData);
      setQuizQuestions(loaded);
      setOriginalQuestionIds(loaded.map(getQuestionId));
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

  // Chi coi la co thay doi khi danh sach cau khac ban goc (thu tu cung tinh).
  const isDirty = useMemo(() => {
    if (!originalQuestionIds) return false;
    const current = quizQuestions.map(getQuestionId);
    return (
      current.length !== originalQuestionIds.length ||
      current.some((id, index) => id !== originalQuestionIds[index])
    );
  }, [quizQuestions, originalQuestionIds]);

  // Chan roi trang khi danh sach cau chua luu, copy tu AdminChapterEdit.
  const shouldBlock = isDirty && !saving;
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
        "Bạn có danh sách câu hỏi chưa lưu, nếu rời trang thì thay đổi sẽ mất.";
      return event.returnValue;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [shouldBlock]);

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

  // Nut huy cung phai hoi lai khi dang co thay doi chua luu.
  const handleCancelChanges = () => {
    if (isDirty) {
      setPendingLeave(() => () => navigate(returnPath));
      return;
    }
    navigate(returnPath);
  };

  const save = async () => {
    // Loi kiem tra hop le hien inline canh nut luu, khong dung ErrorState cua trang.
    if (!quizQuestions.length) { setSaveError("Đề thi phải có ít nhất một câu hỏi."); return; }
    try {
      setSaving(true); setSaveError("");
      await updateQuiz(quizId, {
        name: quiz.name,
        duration: quiz.durationMinutes ?? quiz.duration,
        chapterId: quiz.chapterId,
        displayOrder: quiz.displayOrder,
        questionIds: quizQuestions.map(getQuestionId),
      });
      toast.success("Đã cập nhật câu hỏi của đề thi.");
      navigate(returnPath);
    } catch (saveError) { setSaveError(getErrorMessage(saveError, "Không thể cập nhật câu hỏi.")); }
    finally { setSaving(false); }
  };

  const isAdaptive = isAdaptiveQuiz(quiz);

  // De thich ung khong cau hinh danh sach cau: dung som, khong hien giao dien them bot.
  if (isAdaptive) {
    return <>
      <AdminPageHeader
        breadcrumb={[
          "Tổng quan",
          "Đề thi",
          { label: quiz.name || "Chỉnh sửa đề", href: returnPath },
          "Câu hỏi trong đề",
        ]}
        title="Câu hỏi trong đề"
        subtitle={quiz.name}
        backHref={returnPath}
        backLabel="Chỉnh sửa đề"
      />

      <div className="admin-section-card adm2-card-pad quiz-questions-page">
        <EmptyState
          icon={<ListChecks size={28} />}
          title="Đề thích ứng chọn câu tự động"
          description="Đề thích ứng chọn câu hỏi theo năng lực của người làm bài nên không cấu hình danh sách câu cố định."
          action={
            <button className="cancel-btn" type="button" onClick={() => navigate(returnPath)}>
              Quay lại chỉnh sửa đề
            </button>
          }
        />
      </div>
    </>;
  }

  return <>
    <AdminPageHeader
      breadcrumb={[
        "Tổng quan",
        "Đề thi",
        { label: quiz?.name || "Chỉnh sửa đề", href: returnPath },
        "Câu hỏi trong đề",
      ]}
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
        {!quiz && !error && <div className="quiz-inline-empty">Đang tải câu hỏi của đề thi...</div>}
      </div>

      {quiz && !quizQuestions.length && (
        <EmptyState
          icon={<ListChecks size={28} />}
          title="Đề thi chưa có câu hỏi"
          description="Thêm câu hỏi từ ngân hàng của chương để lưu được đề thi."
          action={
            <button className="add-btn" type="button" onClick={openQuestionBank}>
              <Plus size={17} /> Thêm từ ngân hàng
            </button>
          }
        />
      )}

      <div className="question-modal-actions">
        {saveError && <div className="modal-inline-error">{saveError}</div>}
        <button className="cancel-btn" type="button" onClick={handleCancelChanges} disabled={saving}>
          Hủy thay đổi
        </button>
        <button className="add-btn" type="button" onClick={save} disabled={saving || !quiz || !quizQuestions.length}>
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

    <ConfirmActionModal
      isOpen={blocker.state === "blocked" || Boolean(pendingLeave)}
      onClose={() => { blocker.reset?.(); setPendingLeave(null); }}
      onConfirm={() => {
        if (pendingLeave) {
          const action = pendingLeave;
          setPendingLeave(null);
          action();
          return;
        }
        blocker.proceed?.();
      }}
      user={{ displayName: "danh sách câu hỏi" }}
      message={
        <>
          Danh sách câu hỏi của đề <strong>chưa được lưu</strong>. Rời trang sẽ mất các thay đổi vừa
          thực hiện. Bạn có muốn rời trang?
        </>
      }
    />
  </>;
}
