import { useEffect, useMemo, useState } from "react";
import { FileText, LoaderCircle, Plus, RefreshCw, Shuffle, Trash2 } from "lucide-react";

import "../Admin.css";
import AdminPageHeader from "../components/AdminPageHeader";
import SearchBar from "../components/SearchBar";
import ConfirmDeleteModal from "../components/modals/ConfirmDeleteModal";
import { getChaptersBySubject, getSubjects } from "../../../services/contentService";
import {
  createQuiz,
  deleteQuiz,
  getQuestionsByChapter,
  getQuizzesByChapter,
} from "../services/quizService";

const getSubjectId = (subject) => subject?.subjectId ?? subject?.id ?? "";
const getChapterId = (chapter) => chapter?.chapterId ?? chapter?.id ?? "";
const getQuestionId = (question) => question?.questionId ?? question?.id ?? "";
const getQuizId = (quiz) => quiz?.quizId ?? quiz?.id ?? "";

const pickRandomIds = (questionIds, count) => {
  const shuffled = [...questionIds];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled.slice(0, count);
};

export default function AdminQuizzes() {
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [search, setSearch] = useState("");
  const [deletingQuiz, setDeletingQuiz] = useState(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedChapterId, setSelectedChapterId] = useState("");
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [randomCount, setRandomCount] = useState("");
  const [quizName, setQuizName] = useState("");
  const [duration, setDuration] = useState(45);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const loadSubjects = async () => {
      setIsBootstrapping(true);
      setError("");

      try {
        const subjectRows = (await getSubjects()) || [];
        setSubjects(subjectRows);
        setSelectedSubjectId(getSubjectId(subjectRows[0]));
      } catch (loadError) {
        setError(loadError?.message || "Không thể tải danh sách môn học.");
      } finally {
        setIsBootstrapping(false);
      }
    };

    loadSubjects();
  }, []);

  useEffect(() => {
    if (!selectedSubjectId) {
      setChapters([]);
      setSelectedChapterId("");
      return;
    }

    const loadChapters = async () => {
      setIsLoadingChapters(true);
      setError("");

      try {
        const chapterRows = (await getChaptersBySubject(selectedSubjectId)) || [];
        setChapters(chapterRows);
        setSelectedChapterId((currentChapterId) => {
          const hasCurrent = chapterRows.some((chapter) => getChapterId(chapter) === currentChapterId);
          return hasCurrent ? currentChapterId : getChapterId(chapterRows[0]);
        });
      } catch (loadError) {
        setError(loadError?.message || "Không thể tải danh sách chương.");
        setChapters([]);
        setSelectedChapterId("");
      } finally {
        setIsLoadingChapters(false);
      }
    };

    loadChapters();
  }, [selectedSubjectId]);

  useEffect(() => {
    if (!selectedChapterId) {
      setQuestions([]);
      setQuizzes([]);
      setSelectedQuestionIds([]);
      return;
    }

    const loadChapterData = async () => {
      setIsLoadingQuestions(true);
      setIsLoadingQuizzes(true);
      setError("");

      try {
        const [questionRows, quizRows] = await Promise.all([
          getQuestionsByChapter(selectedChapterId),
          getQuizzesByChapter(selectedChapterId),
        ]);

        setQuestions(questionRows || []);
        setQuizzes(quizRows || []);
        setSelectedQuestionIds([]);
        setRandomCount("");
      } catch (loadError) {
        setError(loadError?.message || "Không thể tải dữ liệu của chương.");
        setQuestions([]);
        setQuizzes([]);
      } finally {
        setIsLoadingQuestions(false);
        setIsLoadingQuizzes(false);
      }
    };

    loadChapterData();
  }, [selectedChapterId]);

  const filteredQuizzes = useMemo(
    () => quizzes.filter((quiz) => String(quiz.name || "").toLowerCase().includes(search.toLowerCase())),
    [search, quizzes],
  );

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
      setError(createError?.message || "Không thể tạo đề thi.");
    } finally {
      setIsCreating(false);
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
      setError(deleteError?.message || "Không thể xóa đề thi.");
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
        subtitle="Tạo đề theo môn học, chương học và danh sách câu hỏi đã chọn"
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

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16, alignItems: "center" }}>
          <button className="add-btn small" onClick={handleSelectAll} disabled={!allFilteredQuestionIds.length}>
            Chọn tất cả
          </button>
          <button className="cancel-btn" onClick={handleClearSelection}>
            Bỏ chọn
          </button>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="number"
              min="1"
              value={randomCount}
              onChange={(event) => setRandomCount(event.target.value)}
              placeholder="n câu hỏi"
              style={{ width: 120 }}
            />
            <button className="add-btn small" onClick={handleRandomSelect}>
              <Shuffle size={16} />
              Chọn ngẫu nhiên
            </button>
          </div>
          <span style={{ color: "#64748b" }}>
            Đã chọn {selectedQuestionIds.length}/{questions.length} câu hỏi • Type: CHAPTER
          </span>
        </div>
      </div>

      <div className="admin-section-card" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: 0 }}>Ngân hàng câu hỏi</h3>
            <p style={{ margin: "6px 0 0", color: "#64748b" }}>
              {selectedSubject?.name || "Chưa chọn môn học"} • {selectedChapter?.name || "Chưa chọn chương"}
            </p>
          </div>
          {(isLoadingQuestions || isLoadingQuizzes) && <RefreshCw size={18} className="spin" />}
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          {filteredQuestions.map((question, index) => {
            const questionId = getQuestionId(question);
            const isSelected = selectedQuestionIds.includes(questionId);

            return (
              <label
                key={questionId}
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  padding: 16,
                  border: `1px solid ${isSelected ? "#2563eb" : "#e2e8f0"}`,
                  borderRadius: 14,
                  background: isSelected ? "#eff6ff" : "#fff",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleQuestion(questionId)}
                  style={{ marginTop: 4 }}
                />
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Câu {index + 1}</div>
                  <div>{question.content}</div>
                </div>
              </label>
            );
          })}

          {!filteredQuestions.length && !isLoadingQuestions && (
            <div style={{ color: "#64748b" }}>Chưa có câu hỏi nào trong chương này.</div>
          )}
        </div>
      </div>

      <div>
        <h3 style={{ marginBottom: 16 }}>Danh sách đề thi của chương</h3>
        <div className="quiz-grid">
          {filteredQuizzes.map((quiz) => (
            <div key={getQuizId(quiz)} className="quiz-card">
            <div className="quiz-card-actions">
              <button
                className="icon-btn danger"
                onClick={() => setDeletingQuiz(quiz)}
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="header-icon">
              <FileText size={22} />
            </div>

            <div className="quiz-title">{quiz.name}</div>
            <div className="quiz-desc">Loại: {quiz.type || "CHAPTER"}</div>

            <div className="quiz-footer">
              <span>{quiz.totalQuestion || 0} câu hỏi</span>
              <span>{quiz.duration || 0} phút</span>
            </div>
          </div>
        ))}
        </div>

        {!filteredQuizzes.length && !isLoadingQuizzes && (
          <div style={{ color: "#64748b", marginTop: 12 }}>Chưa có đề thi nào cho chương này.</div>
        )}
      </div>

      <ConfirmDeleteModal
        open={Boolean(deletingQuiz)}
        onClose={() => setDeletingQuiz(null)}
        title="Xóa đề thi"
        message={`Bạn có muốn xóa đề thi "${deletingQuiz?.name}" không?`}
        itemName={deletingQuiz?.name}
        onConfirm={handleDeleteQuiz}
      />
    </>
  );
}