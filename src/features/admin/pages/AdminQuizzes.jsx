import { useState } from "react";
import { ClipboardList, Pencil, Plus, Trash2 } from "lucide-react";

import "../Admin.css";
import AddQuizModal from "../components/modals/AddQuizModal";
import AdminPageHeader from "../components/AdminPageHeader";
import { adminQuizService } from "../services/quizService";

export default function AdminQuizzes() {
  const [quizRows, setQuizRows] = useState(() => adminQuizService.getQuizzes());
  const [openAddQuiz, setOpenAddQuiz] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);

  const handleCreateQuiz = (formValues) => {
    setQuizRows((currentRows) => adminQuizService.createQuiz(currentRows, formValues));
    setOpenAddQuiz(false);
  };

  const handleUpdateQuiz = (formValues) => {
    setQuizRows((currentRows) =>
      adminQuizService.updateQuiz(currentRows, editingQuiz.id, formValues),
    );
    setEditingQuiz(null);
  };

  return (
    <>
      <AdminPageHeader
        breadcrumb={["Tổng quan", "Quản lý đề thi"]}
        title="Quản lý đề thi"
        subtitle="Quản lý các đề thi và bài kiểm tra"
        icon={<ClipboardList size={22} />}
        action={
          <button className="add-btn" onClick={() => setOpenAddQuiz(true)}>
            <Plus size={18} />
            Thêm đề thi
          </button>
        }
      />

      <section className="quiz-table-card">
        <h3>Danh sách đề thi</h3>

        <div className="quiz-table-wrap">
          <table className="quiz-table">
            <thead>
              <tr>
                <th>Tên đề</th>
                <th>Môn học</th>
                <th>Chương</th>
                <th>Loại đề</th>
                <th>Số câu hỏi</th>
                <th>Thời gian</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {quizRows.map((quiz) => (
                <tr key={quiz.id}>
                  <td>
                    <strong>{quiz.name}</strong>
                  </td>
                  <td>{quiz.subject?.name}</td>
                  <td>{quiz.chapter?.name}</td>
                  <td>
                    <span className={quiz.type === "FIXED" ? "quiz-type fixed" : "quiz-type generated"}>
                      {adminQuizService.getTypeLabel(quiz.type)}
                    </span>
                  </td>
                  <td>{quiz.totalQuestions}</td>
                  <td>{quiz.duration} phút</td>
                  <td>
                    <div className="quiz-actions">
                      <button className="quiz-edit-btn" onClick={() => setEditingQuiz(quiz)}>
                        <Pencil size={18} />
                        Sửa
                      </button>
                      <button className="quiz-delete-btn" type="button" disabled>
                        <Trash2 size={18} />
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <AddQuizModal
        open={openAddQuiz}
        onClose={() => setOpenAddQuiz(false)}
        onSubmit={handleCreateQuiz}
      />
      <AddQuizModal
        open={Boolean(editingQuiz)}
        onClose={() => setEditingQuiz(null)}
        initialQuiz={editingQuiz}
        mode="edit"
        onSubmit={handleUpdateQuiz}
      />
    </>
  );
}
