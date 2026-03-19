import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { BookOpen, Plus, Pencil, Trash2 } from "lucide-react";

import AddQuestionModal from "../components/modals/AddQuestionModal";
import AdminPageHeader from "../components/AdminPageHeader";
import SearchBar from "../components/SearchBar";

import { subjects, chapters, questions } from "../../../mock/mockData";

export default function AdminQuestions() {
  const { subjectId, chapterId } = useParams();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [openAddQuestion, setOpenAddQuestion] = useState(false);

  // ===== GET DATA =====
  const subject = subjects.find((s) => s.id === subjectId);
  const chapter = chapters.find((c) => c.id === chapterId);

  const chapterQuestions = questions.filter((q) => q.chapterId === chapterId);

  const filteredQuestions = chapterQuestions.filter((q) =>
    q.content.toLowerCase().includes(search.toLowerCase()),
  );

  if (!subject || !chapter) {
    return <div>Không tìm thấy dữ liệu</div>;
  }

  return (
    <>
      {/* ===== HEADER ===== */}
      <AdminPageHeader
        breadcrumb={["Tổng quan", "Môn học", subject.name, chapter.name]}
        title={chapter.name}
        subtitle={`${subject.name} • ${subject.code} • ${chapterQuestions.length} câu hỏi`}
        icon={<BookOpen size={22} />}
        onBack={() => navigate(`/admin/subjects/${subjectId}/chapters`)}
        action={
          <button className="add-btn" onClick={() => setOpenAddQuestion(true)}>
            <Plus size={18} />
            Thêm câu hỏi
          </button>
        }
      />

      {/* ===== SEARCH ===== */}
      <SearchBar placeholder="Tìm kiếm câu hỏi..." onChange={setSearch} />

      {/* ===== LIST ===== */}
      <div className="question-list">
        {filteredQuestions.map((q, index) => (
          <div key={q.id} className="question-card">
            {/* ===== HEADER ===== */}
            <div className="question-header">
              <div className="question-left">
                <div className="question-index">{index + 1}</div>

                <div className="question-content">{q.content}</div>
              </div>

              <div className="question-actions">
                <span className="difficulty">
                  {q.difficulty === "easy" && "Dễ"}
                  {q.difficulty === "medium" && "Trung bình"}
                  {q.difficulty === "hard" && "Khó"}
                </span>

                <Pencil size={18} className="icon-btn" />
                <Trash2 size={18} className="icon-btn delete" />
              </div>
            </div>

            {/* ===== ANSWERS ===== */}
            <div className="answer-grid">
              {q.options?.map((opt, i) => (
                <div
                  key={opt.id}
                  className={`answer-item ${opt.isCorrect ? "correct" : ""}`}
                >
                  <span className="answer-label">
                    {String.fromCharCode(65 + i)}.
                  </span>
                  {opt.content}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ===== MODAL ===== */}
      <AddQuestionModal
        open={openAddQuestion}
        onClose={() => setOpenAddQuestion(false)}
        subject={subject}
        chapter={chapter}
      />
    </>
  );
}
