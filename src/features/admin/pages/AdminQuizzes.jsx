import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FileText, FileEdit, Trash2 } from "lucide-react";

import "../Admin.css";
import AdminPageHeader from "../components/AdminPageHeader";
import SearchBar from "../components/SearchBar";
import AddQuizModal from "../components/modals/AddQuizModal";
import EditQuizModal from "../components/modals/EditQuizModal";
import ConfirmDeleteModal from "../components/modals/ConfirmDeleteModal";
import {
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getQuizzesByChapter as getQuizzesBySubject,
} from "../../../services/quizService";

export default function AdminQuizzes() {
  const navigate = useNavigate();
  
  // Lấy subjectId từ URL params
  const searchParams = new URLSearchParams(window.location.search);
  const subjectId = searchParams.get("subjectId");

  const [search, setSearch] = useState("");
  const [openAddQuiz, setOpenAddQuiz] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [deletingQuiz, setDeletingQuiz] = useState(null);
  const [quizzes, setQuizzes] = useState([]);

  useEffect(() => {
    if (!subjectId) return;
    const load = async () => {
      const data = (await getQuizzesBySubject(subjectId)) || [];
      setQuizzes(data);
    };
    load();
  }, [subjectId]);

  const filteredQuizzes = useMemo(
    () =>
      quizzes.filter(
        (q) =>
          q.title.toLowerCase().includes(search.toLowerCase()) ||
          q.description?.toLowerCase().includes(search.toLowerCase()),
      ),
    [search, quizzes],
  );

  const handleUpdateQuiz = async (payload) => {
    await updateQuiz(editingQuiz.quizId, payload);
    setQuizzes((current) =>
      current.map((q) =>
        q.quizId === editingQuiz.quizId ? { ...q, ...payload } : q,
      ),
    );
    setEditingQuiz(null);
  };

  const handleDeleteQuiz = async () => {
    await deleteQuiz(deletingQuiz.quizId);
    setQuizzes((current) =>
      current.filter((q) => q.quizId !== deletingQuiz.quizId),
    );
    setDeletingQuiz(null);
  };

  if (!subjectId) {
    return <div>Vui lòng chọn môn học</div>;
  }

  return (
    <>
      {/* ===== HEADER ===== */}
      <AdminPageHeader
        breadcrumb={["Tổng quan", "Môn học", "Đề thi"]}
        title="Quản lý đề thi"
        subtitle="Quản lý danh sách đề thi"
        action={
          <button className="add-btn" onClick={() => setOpenAddQuiz(true)}>
            <Plus size={18} />
            Thêm đề thi
          </button>
        }
      />

      {/* ===== SEARCH ===== */}
      <SearchBar placeholder="Tìm kiếm đề thi..." onChange={setSearch} />

      {/* ===== QUIZ GRID ===== */}
      <div className="quiz-grid">
        {filteredQuizzes.map((quiz) => (
          <div
            key={quiz.quizId}
            className="quiz-card"
            onClick={() => navigate(`/admin/quizzes/${quiz.quizId}`)}
          >
            <div className="quiz-card-actions">
              <button
                className="icon-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingQuiz(quiz);
                }}
              >
                <FileEdit size={16} />
              </button>
              <button
                className="icon-btn danger"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeletingQuiz(quiz);
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="header-icon">
              <FileText size={22} />
            </div>

            <div className="quiz-title">{quiz.title}</div>

            <div className="quiz-desc">{quiz.description || "Không có mô tả"}</div>

            <div className="quiz-footer">
              <span>{quiz.questionsCount || 0} câu hỏi</span>
              <span>›</span>
            </div>
          </div>
        ))}
      </div>

      {/* ===== MODALS ===== */}
      <AddQuizModal
        open={openAddQuiz}
        onClose={() => setOpenAddQuiz(false)}
        onSubmit={async (payload) => {
          const created = await createQuiz(payload);
          setQuizzes((current) => [created, ...current]);
          setOpenAddQuiz(false);
        }}
      />

      <EditQuizModal
        open={Boolean(editingQuiz)}
        onClose={() => setEditingQuiz(null)}
        quiz={editingQuiz}
        onSubmit={handleUpdateQuiz}
      />

      <ConfirmDeleteModal
        open={Boolean(deletingQuiz)}
        onClose={() => setDeletingQuiz(null)}
        title="Xóa đề thi"
        message={`Bạn có muốn xóa đề thi "${deletingQuiz?.title}" không? Hành động này không thể hoàn tác.`}
        itemName={deletingQuiz?.title}
        onConfirm={handleDeleteQuiz}
      />
    </>
  );
}
