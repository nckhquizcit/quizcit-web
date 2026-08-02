import { useCallback, useEffect, useState } from "react";
import { FileText, ListChecks, LoaderCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AdminPageHeader from "../components/AdminPageHeader";
import { CreateQuizForm } from "../components/modals/CreateQuizModal";
import ErrorState from "../../../components/ui/ErrorState/ErrorState";
import { getErrorMessage } from "../../../services/apiClient";
import { getSubjects } from "../../../services/contentService";
import { getQuizById } from "../../../services/quizService";
import { useToast } from "../../../components/ui/Toast/Toast";

export default function AdminQuizEdit() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
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

  return <>
    <AdminPageHeader title="Chỉnh sửa đề thi" subtitle="Cập nhật thông tin chung của đề thi" icon={<FileText size={22} />} backHref={returnPath} action={<button className="cancel-btn" onClick={() => navigate(`/admin/quizzes/${quizId}/edit/questions`)}><ListChecks size={17} /> Quản lý câu hỏi</button>} />
    <div className="admin-section-card admin-form-page quiz-form-page">
      {!data && !error && <div className="quiz-inline-empty"><LoaderCircle size={16} className="spin" /> Đang tải đề thi...</div>}
      {error && <ErrorState description={error} onRetry={load} />}
      {data && <CreateQuizForm open subjects={data.subjects} initialQuiz={data.quiz} showQuestions={false} onCancel={() => navigate(returnPath)} onUpdated={() => { toast.success("Cập nhật đề thi thành công."); navigate(returnPath); }} />}
    </div>
  </>;
}
