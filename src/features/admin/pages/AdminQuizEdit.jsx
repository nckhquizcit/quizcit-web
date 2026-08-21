import { useCallback, useEffect, useState } from "react";
import { ListChecks, LoaderCircle, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../components/AdminPageHeader";
import { CreateQuizForm } from "../components/modals/CreateQuizModal";
import ConfirmDeleteModal from "../components/modals/ConfirmDeleteModal";
import ErrorState from "../../../components/ui/ErrorState/ErrorState";
import { getErrorMessage } from "../../../services/apiClient";
import { getSubjects } from "../../../services/contentService";
import { deleteQuiz, getQuizById } from "../../../services/quizService";
import { useToast } from "../../../components/ui/Toast/Toast";
import "./AdminQuizzes.css";

const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
};

export default function AdminQuizEdit() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const returnPath = "/admin/quizzes";

  const load = useCallback(async () => {
    try {
      setError("");
      const [subjects, quiz] = await Promise.all([getSubjects(), getQuizById(quizId)]);
      setData({ subjects, quiz });
    } catch (loadError) { setError(getErrorMessage(loadError, "Không thể tải đề thi.")); }
  }, [quizId]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const handleDeleteQuiz = async (hard) => {
    await deleteQuiz(quizId, hard);
    toast.success("Đã xóa đề thi.");
    navigate(returnPath);
  };

  const createdAtLabel = formatDateTime(data?.quiz?.createdAt || data?.quiz?.created_at);

  return <>
    <AdminPageHeader
      title="Chỉnh sửa đề thi"
      subtitle={data?.quiz?.name || "Đang tải đề thi..."}
      backHref={returnPath}
      backLabel="Danh sách đề"
    />

    {!data && !error && (
      <div className="admin-section-card quiz-inline-empty">
        <LoaderCircle size={16} className="spin" /> Đang tải đề thi...
      </div>
    )}
    {error && <ErrorState description={error} onRetry={load} />}

    {data && (
      <div className="adm2-form-grid">
        <div className="admin-section-card adm2-card-pad">
          <CreateQuizForm
            open
            variant="edit"
            subjects={data.subjects}
            initialQuiz={data.quiz}
            showQuestions={false}
            onCancel={() => navigate(returnPath)}
            onUpdated={() => { toast.success("Cập nhật đề thi thành công."); navigate(returnPath); }}
          />
        </div>

        <div className="adm2-aside-stack">
          <div className="adm2-card adm2-aside-card">
            <span className="adm2-chip">Câu hỏi</span>
            <h4>{data.quiz.totalQuestion ?? 0} câu đang dùng</h4>
            <p>Cập nhật danh sách ở màn riêng.</p>
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate(`/admin/quizzes/${quizId}/edit/questions`)}
            >
              <ListChecks size={16} /> Quản lý câu hỏi
            </button>
            {createdAtLabel && <p className="adm2-note--muted">Tạo lúc: {createdAtLabel}</p>}
          </div>

          <div className="adm2-card adm2-aside-card">
            <span className="adm2-chip adm2-chip--red">Vùng nguy hiểm</span>
            <h4>Xóa đề thi</h4>
            <p>Không xóa câu hỏi gốc.</p>
            <button type="button" className="cancel-btn is-danger" onClick={() => setDeleting(true)}>
              <Trash2 size={16} /> Xóa đề
            </button>
          </div>
        </div>
      </div>
    )}

    <ConfirmDeleteModal
      open={deleting}
      onClose={() => setDeleting(false)}
      onConfirm={handleDeleteQuiz}
      title="Xóa đề thi"
      message="Bạn có chắc chắn muốn xóa đề thi này? Hành động này không thể hoàn tác."
      itemName={data?.quiz?.name || ""}
    />
  </>;
}
