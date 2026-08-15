import { useCallback, useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

import "./AdminQuizzes.css";
import AdminPageHeader from "../components/AdminPageHeader";
import { CreateQuizForm } from "../components/modals/CreateQuizModal";
import ErrorState from "../../../components/ui/ErrorState/ErrorState";
import { useToast } from "../../../components/ui/Toast/Toast";
import { getErrorMessage } from "../../../services/apiClient";
import { getSubjects } from "../../../services/contentService";

export default function AdminQuizCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const returnPath = "/admin/quizzes";
  const goBack = () => {
    navigate(returnPath);
  };

  const loadSubjects = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setSubjects((await getSubjects()) || []);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Không thể tải danh sách môn học."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  const handleCreated = () => {
    toast.success("Tạo đề thi thành công.");
    navigate(returnPath);
  };

  return (
    <>
      <AdminPageHeader
        title="Tạo đề thi"
        backHref={returnPath}
        backLabel="Danh sách đề"
      />

      {loading ? (
        <div className="admin-section-card quiz-inline-empty">
          <LoaderCircle size={16} className="spin" /> Đang tải danh sách môn học...
        </div>
      ) : error ? (
        <ErrorState description={error} onRetry={loadSubjects} />
      ) : (
        <CreateQuizForm
          open
          variant="page"
          subjects={subjects}
          defaultSubjectId={searchParams.get("subjectId") || ""}
          defaultChapterId={searchParams.get("chapterId") || ""}
          onCancel={goBack}
          onCreated={handleCreated}
        />
      )}
    </>
  );
}
