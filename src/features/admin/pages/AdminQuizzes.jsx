import { useEffect, useMemo, useState } from "react";
import { Edit2, FileText, LoaderCircle, Plus, RefreshCw, Shuffle, Trash2, X } from "lucide-react";

import "../Admin.css";
import AdminPageHeader from "../components/AdminPageHeader";
import SearchBar from "../components/SearchBar";
import ConfirmDeleteModal from "../components/modals/ConfirmDeleteModal";
import { getChaptersBySubject, getSubjects } from "../../../services/contentService";
import { getErrorMessage } from "../../../services/apiClient";
import {
  createQuiz,
  deleteQuiz,
  getQuestionsByChapter,
  getQuizzesByChapter,
  updateQuiz,
} from "../services/quizService";

const getSubjectId = (subject) => String(subject?.subjectId ?? subject?.id ?? "");
const getChapterId = (chapter) => String(chapter?.chapterId ?? chapter?.id ?? "");
const getQuestionId = (question) => String(question?.questionId ?? question?.id ?? "");
const getQuizId = (quiz) => String(quiz?.quizId ?? quiz?.id ?? "");
const QUIZ_TYPE_LABELS = {
  CHAPTER: "Theo chương",
  SUBJECT: "Theo môn học",
};

function pickRandomIds(questionIds, count) {
  const shuffled = [...questionIds];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled.slice(0, count);
}

function getQuizQuestionIds(quiz) {
  const rawIds = quiz?.questionIds || quiz?.questions?.map(getQuestionId) || [];
  return rawIds.map(String).filter(Boolean);
}

export default function AdminQuizzes() {
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [search, setSearch] = useState("");
  const [deletingQuiz, setDeletingQuiz] = useState(null);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedChapterId, setSelectedChapterId] = useState("");
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [editQuestionIds, setEditQuestionIds] = useState([]);
  const [randomCount, setRandomCount] = useState("");
  const [quizName, setQuizName] = useState("");
  const [duration, setDuration] = useState(30);
  const [editName, setEditName] = useState("");
  const [editDuration, setEditDuration] = useState(30);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadSubjects() {
      try {
        setError("");
        const subjectRows = (await getSubjects()) || [];
        if (!isMounted) return;
        setSubjects(subjectRows);
        setSelectedSubjectId((currentId) => currentId || getSubjectId(subjectRows[0]));
      } catch (loadError) {
        if (isMounted) {
          setError(getErrorMessage(loadError, "Không thể tải danh sách môn học."));
          setSubjects([]);
        }
      } finally {
        if (isMounted) setIsBootstrapping(false);
      }
    }

    loadSubjects();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedSubjectId) {
      setChapters([]);
      setSelectedChapterId("");
      return;
    }

    let isMounted = true;

    async function loadChapters() {
      setIsLoadingChapters(true);
      setError("");

      try {
        const chapterRows = (await getChaptersBySubject(selectedSubjectId)) || [];
        if (!isMounted) return;
        setChapters(chapterRows);
        setSelectedChapterId((currentChapterId) => {
          const hasCurrent = chapterRows.some((chapter) => getChapterId(chapter) === currentChapterId);
          return hasCurrent ? currentChapterId : getChapterId(chapterRows[0]);
        });
      } catch (loadError) {
        if (isMounted) {
          setError(getErrorMessage(loadError, "Không thể tải danh sách chương."));
          setChapters([]);
          setSelectedChapterId("");
        }
      } finally {
        if (isMounted) setIsLoadingChapters(false);
      }
    }

    loadChapters();

    return () => {
      isMounted = false;
    };
  }, [selectedSubjectId]);

  useEffect(() => {
    if (!selectedChapterId) {
      setQuestions([]);
      setQuizzes([]);
      setSelectedQuestionIds([]);
      return;
    }

    let isMounted = true;

    async function loadChapterData() {
      setIsLoadingQuestions(true);
      setIsLoadingQuizzes(true);
      setError("");

      const [questionResult, quizResult] = await Promise.allSettled([
        getQuestionsByChapter(selectedChapterId),
        getQuizzesByChapter(selectedChapterId),
      ]);

      if (!isMounted) return;

      if (questionResult.status === "fulfilled") {
        setQuestions(questionResult.value || []);
      } else {
        setQuestions([]);
      }

      if (quizResult.status === "fulfilled") {
        setQuizzes(quizResult.value || []);
      } else {
        setQuizzes([]);
      }

      if (questionResult.status === "rejected" || quizResult.status === "rejected") {
        setError("Một phần dữ liệu của chương chưa tải được. Vui lòng thử lại.");
      }

      setSelectedQuestionIds([]);
      setRandomCount("");
      setIsLoadingQuestions(false);
      setIsLoadingQuizzes(false);
    }

    loadChapterData();

    return () => {
      isMounted = false;
    };
  }, [selectedChapterId]);

  const filteredQuizzes = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return quizzes;
    return quizzes.filter((quiz) => String(quiz.name || "").toLowerCase().includes(keyword));
  }, [quizzes, search]);

  const filteredQuestions = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return questions;
    return questions.filter((question) => String(question.content || "").toLowerCase().includes(keyword));
  }, [questions, search]);

  const allFilteredQuestionIds = useMemo(
    () => filteredQuestions.map((question) => getQuestionId(question)).filter(Boolean),
    [filteredQuestions],
  );

  const selectedSubject = useMemo(
    () => subjects.find((subject) => getSubjectId(subject) === selectedSubjectId),
    [selectedSubjectId, subjects],
  );

  const selectedChapter = useMemo(
    () => chapters.find((chapter) => getChapterId(chapter) === selectedChapterId),
    [chapters, selectedChapterId],
  );

  const toggleQuestion = (questionId) => {
    setSelectedQuestionIds((currentIds) =>
      currentIds.includes(questionId)
        ? currentIds.filter((id) => id !== questionId)
        : [...currentIds, questionId],
    );
  };

  const toggleEditQuestion = (questionId) => {
    setEditQuestionIds((currentIds) =>
      currentIds.includes(questionId)
        ? currentIds.filter((id) => id !== questionId)
        : [...currentIds, questionId],
    );
  };

  const handleSelectAll = () => {
    setSelectedQuestionIds(allFilteredQuestionIds);
  };

  const handleClearSelection = () => {
    setSelectedQuestionIds([]);
  };

  const handleRandomSelect = () => {
    const count = Number(randomCount);

    if (!count || count < 1) {
      setError("Vui lòng nhập số lượng câu hỏi ngẫu nhiên hợp lệ.");
      return;
    }

    if (count > allFilteredQuestionIds.length) {
      setError("Số lượng ngẫu nhiên vượt quá số câu hỏi hiện có.");
      return;
    }

    setError("");
    setSelectedQuestionIds(pickRandomIds(allFilteredQuestionIds, count));
  };

  const handleCreateQuiz = async () => {
    if (!selectedSubjectId || !selectedChapterId) {
      setError("Vui lòng chọn môn học và chương.");
      return;
    }

    if (!quizName.trim()) {
      setError("Vui lòng nhập tên đề thi.");
      return;
    }

    if (!selectedQuestionIds.length) {
      setError("Vui lòng chọn ít nhất một câu hỏi.");
      return;
    }

    setIsCreating(true);
    setError("");
    setSuccessMessage("");

    try {
      const createdQuiz = await createQuiz({
        subjectId: selectedSubjectId,
        chapterId: selectedChapterId,
        name: quizName.trim(),
        duration: Number(duration),
        totalQuestion: selectedQuestionIds.length,
        type: "CHAPTER",
        questionIds: selectedQuestionIds,
      });

      setQuizzes((currentRows) => [createdQuiz, ...currentRows]);
      setQuizName("");
      setSelectedQuestionIds([]);
      setRandomCount("");
      setSuccessMessage("Tạo đề thi thành công.");
    } catch (createError) {
      setError(getErrorMessage(createError, "Không thể tạo đề thi."));
    } finally {
      setIsCreating(false);
    }
  };

  const openEditQuiz = (quiz) => {
    setEditingQuiz(quiz);
    setEditName(quiz.name || "");
    setEditDuration(quiz.durationMinutes || quiz.duration || 30);
    setEditQuestionIds(getQuizQuestionIds(quiz));
    setError("");
    setSuccessMessage("");
  };

  const handleUpdateQuiz = async () => {
    if (!editingQuiz) return;

    if (!editName.trim()) {
      setError("Vui lòng nhập tên đề thi.");
      return;
    }

    setIsUpdating(true);
    setError("");
    setSuccessMessage("");

    try {
      const updatedQuiz = await updateQuiz(getQuizId(editingQuiz), {
        subjectId: selectedSubjectId,
        chapterId: selectedChapterId,
        name: editName.trim(),
        duration: Number(editDuration),
        totalQuestion: editQuestionIds.length || editingQuiz.totalQuestion,
        type: editingQuiz.type || "CHAPTER",
        questionIds: editQuestionIds,
      });

      setQuizzes((currentRows) =>
        currentRows.map((quiz) => (getQuizId(quiz) === getQuizId(editingQuiz) ? updatedQuiz : quiz)),
      );
      setEditingQuiz(null);
      setSuccessMessage("Cập nhật đề thi thành công.");
    } catch (updateError) {
      setError(getErrorMessage(updateError, "Không thể cập nhật đề thi."));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteQuiz = async () => {
    if (!deletingQuiz) return;

    try {
      const deletingQuizId = getQuizId(deletingQuiz);
      await deleteQuiz(deletingQuizId);
      setQuizzes((currentRows) => currentRows.filter((quiz) => getQuizId(quiz) !== deletingQuizId));
      setDeletingQuiz(null);
      setSuccessMessage("Xóa đề thi thành công.");
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, "Không thể xóa đề thi."));
    }
  };

  if (isBootstrapping) {
    return (
      <div className="admin-loading-state">
        <LoaderCircle size={20} className="spin" /> Đang tải dữ liệu quản lý đề thi...
      </div>
    );
  }

  return (
    <>
      <AdminPageHeader
        breadcrumb={["Tổng quan", "Đề thi"]}
        title="Quản lý đề thi"
        subtitle="Tạo và cập nhật đề theo môn học, chương học và danh sách câu hỏi đã chọn"
        action={
          <button className="add-btn" onClick={handleCreateQuiz} disabled={isCreating}>
            <Plus size={18} />
            {isCreating ? "Đang tạo..." : "Tạo đề thi"}
          </button>
        }
      />

      <div className="admin-section-card" style={{ marginBottom: 24 }}>
        <div className="admin-filter-row" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 16 }}>
          <label className="quiz-field">
            <span>Môn học</span>
            <select value={selectedSubjectId} onChange={(event) => setSelectedSubjectId(event.target.value)}>
              {subjects.map((subject) => (
                <option key={getSubjectId(subject)} value={getSubjectId(subject)}>
                  {subject.name}
                </option>
              ))}
            </select>
          </label>

          <label className="quiz-field">
            <span>Chương</span>
            <select
              value={selectedChapterId}
              onChange={(event) => setSelectedChapterId(event.target.value)}
              disabled={isLoadingChapters || !chapters.length}
            >
              {chapters.map((chapter) => (
                <option key={getChapterId(chapter)} value={getChapterId(chapter)}>
                  {chapter.name}
                </option>
              ))}
            </select>
          </label>

          <label className="quiz-field">
            <span>Tên đề thi</span>
            <input value={quizName} onChange={(event) => setQuizName(event.target.value)} placeholder="Ví dụ: Kiểm tra chương 1" />
          </label>

          <label className="quiz-field">
            <span>Thời gian (phút)</span>
            <input type="number" min="1" value={duration} onChange={(event) => setDuration(event.target.value)} />
          </label>
        </div>

        <div style={{ marginTop: 16 }}>
          <SearchBar placeholder="Tìm kiếm câu hỏi hoặc đề thi..." onChange={setSearch} />
        </div>

        {(error || successMessage) && (
          <div style={{ marginTop: 16, color: error ? "#dc2626" : "#16a34a" }}>
            {error || successMessage}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16, color: "#64748b" }}>
          <span>Đang chọn: {selectedQuestionIds.length} câu hỏi</span>
          <span>|</span>
          <span>{selectedSubject?.name || "Chưa chọn môn"} / {selectedChapter?.name || "Chưa chọn chương"}</span>
        </div>
      </div>

      <div className="admin-section-card" style={{ marginBottom: 24 }}>
        <div className="quiz-question-head">
          <h3>Chọn câu hỏi cho đề thi</h3>
          <div>
            <button type="button" onClick={handleSelectAll} disabled={!allFilteredQuestionIds.length}>
              Chọn tất cả
            </button>
            <button type="button" onClick={handleClearSelection} disabled={!selectedQuestionIds.length}>
              Bỏ chọn
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, margin: "16px 0" }}>
          <input
            type="number"
            min="1"
            value={randomCount}
            onChange={(event) => setRandomCount(event.target.value)}
            placeholder="Số câu ngẫu nhiên"
            style={{ width: 180, height: 40, border: "1px solid #d8dde6", borderRadius: 10, padding: "0 12px" }}
          />
          <button className="add-btn" type="button" onClick={handleRandomSelect}>
            <Shuffle size={16} /> Chọn ngẫu nhiên
          </button>
          {(isLoadingQuestions || isLoadingQuizzes) && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#64748b" }}>
              <LoaderCircle size={16} className="spin" /> Đang tải...
            </span>
          )}
        </div>

        <div className="quiz-question-list">
          {filteredQuestions.map((question, index) => {
            const questionId = getQuestionId(question);
            const isSelected = selectedQuestionIds.includes(questionId);

            return (
              <button
                key={questionId}
                type="button"
                className={`quiz-question-item ${isSelected ? "selected" : ""}`}
                onClick={() => toggleQuestion(questionId)}
              >
                <span className="quiz-checkmark">✓</span>
                <span className="quiz-question-content">
                  <strong>Câu {index + 1}</strong>
                  <span>{question.content}</span>
                </span>
              </button>
            );
          })}

          {!filteredQuestions.length && !isLoadingQuestions && (
            <div style={{ color: "#64748b" }}>Chưa có câu hỏi nào trong chương này.</div>
          )}
        </div>
      </div>

      <div className="admin-section-card">
        <h3 style={{ marginBottom: 16 }}>Danh sách đề thi của chương</h3>

        <div className="quiz-grid">
          {filteredQuizzes.map((quiz) => (
            <div key={getQuizId(quiz)} className="quiz-card">
              <div className="quiz-card-actions">
                <button className="icon-btn" type="button" onClick={() => openEditQuiz(quiz)} aria-label="Sửa đề thi">
                  <Edit2 size={16} />
                </button>
                <button className="icon-btn danger" type="button" onClick={() => setDeletingQuiz(quiz)} aria-label="Xóa đề thi">
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="header-icon">
                <FileText size={22} />
              </div>

              <h4>{quiz.name || "Đề thi chưa đặt tên"}</h4>
              <p>{QUIZ_TYPE_LABELS[quiz.type] || "Theo chương"}</p>
              <div style={{ display: "flex", gap: 12, color: "#64748b", fontSize: 14 }}>
                <span>{quiz.totalQuestion || 0} câu hỏi</span>
                <span>{quiz.durationMinutes || quiz.duration || 0} phút</span>
              </div>
            </div>
          ))}

          {!filteredQuizzes.length && !isLoadingQuizzes && (
            <div style={{ color: "#64748b" }}>Chưa có đề thi nào phù hợp.</div>
          )}
        </div>
      </div>

      {editingQuiz && (
        <div className="modal-overlay" onClick={() => setEditingQuiz(null)}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2>Cập nhật đề thi</h2>
              <button type="button" onClick={() => setEditingQuiz(null)} aria-label="Đóng modal">
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ display: "grid", gap: 16 }}>
              <label className="quiz-field">
                <span>Tên đề thi</span>
                <input value={editName} onChange={(event) => setEditName(event.target.value)} />
              </label>

              <label className="quiz-field">
                <span>Thời gian (phút)</span>
                <input type="number" min="1" value={editDuration} onChange={(event) => setEditDuration(event.target.value)} />
              </label>

              <div>
                <strong>Câu hỏi trong đề</strong>
                <div className="quiz-question-list" style={{ marginTop: 12, maxHeight: 300, overflow: "auto" }}>
                  {questions.map((question, index) => {
                    const questionId = getQuestionId(question);
                    const isSelected = editQuestionIds.includes(questionId);

                    return (
                      <button
                        key={questionId}
                        type="button"
                        className={`quiz-question-item ${isSelected ? "selected" : ""}`}
                        onClick={() => toggleEditQuestion(questionId)}
                      >
                        <span className="quiz-checkmark">✓</span>
                        <span className="quiz-question-content">
                          <strong>Câu {index + 1}</strong>
                          <span>{question.content}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="cancel-btn" onClick={() => setEditingQuiz(null)}>
                Hủy
              </button>
              <button type="button" className="submit-btn" onClick={handleUpdateQuiz} disabled={isUpdating}>
                {isUpdating ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        open={Boolean(deletingQuiz)}
        onClose={() => setDeletingQuiz(null)}
        onConfirm={handleDeleteQuiz}
        title="Xóa đề thi"
        description={`Bạn có chắc chắn muốn xóa đề thi "${deletingQuiz?.name || ""}"?`}
      />
    </>
  );
}
