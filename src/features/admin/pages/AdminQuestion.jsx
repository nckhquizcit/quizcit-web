import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  Database,
  Download,
  Funnel,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";

import AddQuestionModal from "../components/modals/AddQuestionModal";
import AdminPageHeader from "../components/AdminPageHeader";
import Modal from "../components/ui/Modal";
import { adminQuestionService } from "../services/questionService";

const PAGE_SIZE = 10;
const bulkSteps = ["Tải file", "Ánh xạ", "Tags", "Xác nhận"];

function ImportHistoryModal({ open, onClose }) {
  const importLogs = adminQuestionService.getImportHistory();

  return (
    <Modal open={open} onClose={onClose}>
      <div className="question-modal question-history-modal">
        <h2>Lịch sử nhập câu hỏi</h2>
        <p>Xem các lần nhập gần đây</p>

        <div className="import-history-list">
          {importLogs.map((item) => (
            <div className="import-history-item" key={item.id}>
              <Download size={34} className="import-file-icon" />
              <div className="import-history-info">
                <strong>{item.fileName}</strong>
                <span>
                  {item.date} • {item.total} câu hỏi
                </span>
              </div>
              <span className={`status-pill ${item.tone}`}>{item.status}</span>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

function BulkImportModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="question-modal bulk-import-modal">
        <h2>Nhập câu hỏi hàng loạt</h2>
        <p>Nhập nhiều câu hỏi cùng lúc từ file CSV, Excel hoặc JSON</p>

        <div className="bulk-stepper">
          {bulkSteps.map((step, index) => (
            <div className="bulk-step" key={step}>
              <span className={index === 0 ? "active" : ""}>{index + 1}</span>
              <strong>{step}</strong>
            </div>
          ))}
        </div>

        <div className="template-panel">
          <div className="template-title">
            <Clock3 size={20} />
            <strong>Tải template mẫu để bắt đầu</strong>
          </div>
          <div className="template-actions">
            <button>
              <Download size={16} />
              CSV
            </button>
            <button>
              <Download size={16} />
              Excel
            </button>
            <button>
              <Download size={16} />
              JSON
            </button>
          </div>
        </div>

        <label className="drop-zone">
          <Upload size={54} />
          <strong>Kéo thả file vào đây hoặc click để chọn</strong>
          <span>Hỗ trợ: CSV, Excel (.xlsx), JSON</span>
          <input type="file" accept=".csv,.xlsx,.json" />
        </label>

        <div className="question-modal-actions">
          <button className="cancel-btn" onClick={onClose}>
            Hủy
          </button>
          <button className="add-btn disabled" disabled>
            Tiếp theo
          </button>
        </div>
      </div>
    </Modal>
  );
}

function DeleteQuestionModal({ open, question, onCancel, onConfirm, onClose }) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="question-modal delete-question-modal">
        <h2>Xóa câu hỏi</h2>
        <p>Bạn có muốn xóa câu hỏi này không?</p>

        {question && (
          <div className="delete-question-preview">
            <strong>{question.content}</strong>
            <span>
              {question.subject?.name} • {question.chapter?.name}
            </span>
          </div>
        )}

        <div className="question-modal-actions">
          <button className="cancel-btn" onClick={onCancel}>
            Không
          </button>
          <button className="danger-btn" onClick={onConfirm}>
            Có
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function AdminQuestions() {
  const { subjectId, chapterId } = useParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [questionRows, setQuestionRows] = useState(() =>
    adminQuestionService.getInitialQuestions(),
  );
  const [openHistory, setOpenHistory] = useState(false);
  const [openBulkImport, setOpenBulkImport] = useState(false);
  const [openAddQuestion, setOpenAddQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [deletingQuestion, setDeletingQuestion] = useState(null);

  const filteredQuestions = useMemo(
    () => adminQuestionService.filterQuestions(questionRows, { chapterId, search }),
    [chapterId, questionRows, search],
  );

  const {
    items: paginatedQuestions,
    totalPages,
    safePage,
    startIndex,
    displayStart,
    displayEnd,
  } = adminQuestionService.paginateQuestions(filteredQuestions, {
    page,
    pageSize: PAGE_SIZE,
  });

  const selectedSubject = adminQuestionService
    .getSubjects()
    .find((subject) => subject.id === subjectId);
  const selectedChapter = adminQuestionService
    .getChapters()
    .find((chapter) => chapter.id === chapterId);

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
  };

  const handleCreateQuestion = (formValues) => {
    setQuestionRows((currentRows) => adminQuestionService.createQuestion(currentRows, formValues));
    setOpenAddQuestion(false);
    setPage(1);
  };

  const handleUpdateQuestion = (formValues) => {
    setQuestionRows((currentRows) =>
      adminQuestionService.updateQuestion(currentRows, editingQuestion.id, formValues),
    );
    setEditingQuestion(null);
  };

  const handleSoftDelete = () => {
    setQuestionRows((currentRows) =>
      adminQuestionService.unpublishQuestion(currentRows, deletingQuestion.id),
    );
    setDeletingQuestion(null);
  };

  const handleHardDelete = () => {
    setQuestionRows((currentRows) =>
      adminQuestionService.deleteQuestion(currentRows, deletingQuestion.id),
    );
    setDeletingQuestion(null);
  };

  return (
    <>
      <AdminPageHeader
        breadcrumb={["Tổng quan", "Ngân hàng câu hỏi"]}
        title="Ngân hàng câu hỏi"
        subtitle="Quản lý tập trung tất cả câu hỏi trong hệ thống"
        icon={<Database size={22} />}
        action={
          <div className="question-bank-actions">
            <button className="outline-action purple" onClick={() => setOpenHistory(true)}>
              <Clock3 size={18} />
              Lịch sử nhập
            </button>
            <button className="outline-action blue" onClick={() => setOpenBulkImport(true)}>
              <Upload size={18} />
              Nhập hàng loạt
            </button>
            <button className="add-btn" onClick={() => setOpenAddQuestion(true)}>
              <Plus size={18} />
              Thêm câu hỏi
            </button>
          </div>
        }
      />

      <div className="question-bank-filter">
        <div className="bank-search">
          <Search size={24} />
          <input
            value={search}
            placeholder="Tìm kiếm câu hỏi theo nội dung..."
            onChange={handleSearchChange}
          />
        </div>
        <button className="filter-btn">
          <Funnel size={18} />
          Lọc
        </button>
      </div>

      <span className="question-count">
        Hiển thị {displayStart}-{displayEnd} / {filteredQuestions.length} câu hỏi
      </span>

      <div className="question-bank-table">
        <table>
          <thead>
            <tr>
              <th>Câu hỏi</th>
              <th>Độ khó</th>
              <th>Loại</th>
              <th>Trạng thái</th>
              <th>Cập nhật</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {paginatedQuestions.map((question, index) => (
              <tr key={question.id}>
                <td>
                  <div className="bank-question-cell">
                    <span className="bank-question-index">{startIndex + index + 1}</span>
                    <div>
                      <strong>{question.content}</strong>
                      <div className="question-tags">
                        <span>Môn: {question.subject?.name || "Mock Subject"}</span>
                        <span>Chương: {question.chapter?.name || "Mock Chapter"}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="difficulty-pill">
                    {adminQuestionService.getDifficultyLabel(question.difficulty)}
                  </span>
                </td>
                <td>{question.type}</td>
                <td>
                  <span
                    className={
                      question.status === "Unpublished" ? "unpublished-pill" : "published-pill"
                    }
                  >
                    {question.status}
                  </span>
                </td>
                <td>{question.updatedAt}</td>
                <td>
                  <div className="table-actions">
                    <button
                      aria-label="Chỉnh sửa câu hỏi"
                      onClick={() => setEditingQuestion(question)}
                    >
                      <Pencil size={18} />
                    </button>
                    <button aria-label="Xóa câu hỏi" onClick={() => setDeletingQuestion(question)}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="question-pagination">
        <button disabled={safePage === 1} onClick={() => setPage((value) => value - 1)}>
          <ChevronLeft size={18} />
        </button>
        {Array.from({ length: totalPages }, (_, index) => (
          <button
            className={safePage === index + 1 ? "active" : ""}
            onClick={() => setPage(index + 1)}
            key={index + 1}
          >
            {index + 1}
          </button>
        ))}
        <button disabled={safePage === totalPages} onClick={() => setPage((value) => value + 1)}>
          <ChevronRight size={18} />
        </button>
      </div>

      {chapterId && (
        <button
          className="back-to-chapters"
          onClick={() => navigate(`/admin/subjects/${subjectId}/chapters`)}
        >
          Quay lại danh sách chương
        </button>
      )}

      <ImportHistoryModal open={openHistory} onClose={() => setOpenHistory(false)} />
      <BulkImportModal open={openBulkImport} onClose={() => setOpenBulkImport(false)} />
      <AddQuestionModal
        open={openAddQuestion}
        onClose={() => setOpenAddQuestion(false)}
        subject={selectedSubject}
        chapter={selectedChapter}
        onSubmit={handleCreateQuestion}
      />
      <AddQuestionModal
        open={Boolean(editingQuestion)}
        onClose={() => setEditingQuestion(null)}
        initialQuestion={editingQuestion}
        mode="edit"
        onSubmit={handleUpdateQuestion}
      />
      <DeleteQuestionModal
        open={Boolean(deletingQuestion)}
        question={deletingQuestion}
        onCancel={handleSoftDelete}
        onConfirm={handleHardDelete}
        onClose={() => setDeletingQuestion(null)}
      />
    </>
  );
}
