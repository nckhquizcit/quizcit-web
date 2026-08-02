import { useCallback, useEffect, useMemo, useState } from "react";
import { Upload } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import ErrorState from "../../../components/ui/ErrorState/ErrorState";
import { useToast } from "../../../components/ui/Toast/Toast";
import { getErrorMessage } from "../../../services/apiClient";
import { getAllChapters, getSubjects } from "../../../services/contentService";
import { createQuestion } from "../../../services/quizService";
import AdminPageHeader from "../components/AdminPageHeader";
import ImportQuestionsModal from "../components/modals/ImportQuestionsModal";

const normalizeSubject = (subject) => ({
  ...subject,
  subjectId: subject?.subjectId ?? subject?.id,
});

const normalizeChapter = (chapter, subjectId) => ({
  ...chapter,
  chapterId: chapter?.chapterId ?? chapter?.id,
  subjectId: chapter?.subjectId ?? chapter?.subject?.subjectId ?? chapter?.subject?.id ?? subjectId,
});

export default function AdminQuestionImport() {
  const { subjectId, chapterId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const returnPath =
    subjectId && chapterId
      ? `/admin/subjects/${subjectId}/chapters/${chapterId}/questions`
      : "/admin/questions";

  const loadPlacementData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [subjectData = [], chapterData = []] = await Promise.all([getSubjects(), getAllChapters()]);
      const normalizedSubjects = subjectData.map(normalizeSubject);

      setSubjects(normalizedSubjects);
      setChapters(chapterData.map((chapter) => normalizeChapter(chapter, chapter.subjectId)));
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Không thể tải môn học và chương."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlacementData();
  }, [loadPlacementData]);

  const routeSubject = useMemo(
    () => subjects.find((subject) => String(subject.subjectId) === String(subjectId)),
    [subjectId, subjects],
  );
  const routeChapter = useMemo(
    () => chapters.find((chapter) => String(chapter.chapterId) === String(chapterId)),
    [chapterId, chapters],
  );

  const handleImport = async (items = [], onProgress) => {
    const errors = [];
    let successCount = 0;

    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      try {
        await createQuestion(item.payload);
        successCount += 1;
      } catch (importError) {
        errors.push({
          clientId: item.clientId,
          index: item.index || index + 1,
          message: getErrorMessage(importError, "Không thể lưu câu hỏi này."),
        });
      }

      onProgress?.({
        total: items.length,
        completed: index + 1,
        success: successCount,
        failed: errors.length,
      });
    }

    if (successCount) toast.success(`Đã import ${successCount} câu hỏi.`);
    return { successCount, failureCount: errors.length, errors };
  };

  return (
    <>
      <AdminPageHeader
        title="Import câu hỏi"
        subtitle="Đọc dữ liệu, gán môn/chương và kiểm tra lỗi trước khi lưu"
        icon={<Upload size={22} />}
        backHref={returnPath}
      />

      {error ? (
        <ErrorState description={error} onRetry={loadPlacementData} />
      ) : loading ? (
        <div className="admin-section-card page-loader">Đang tải dữ liệu...</div>
      ) : (
        <ImportQuestionsModal
          open
          variant="page"
          onClose={() => navigate(returnPath)}
          subjects={subjects}
          chapters={chapters}
          subject={routeSubject}
          chapter={routeChapter}
          onSubmit={handleImport}
        />
      )}
    </>
  );
}
