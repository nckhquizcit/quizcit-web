import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import ErrorState from "../../../components/ui/ErrorState/ErrorState";
import { useToast } from "../../../components/ui/Toast/Toast";
import { getErrorMessage } from "../../../services/apiClient";
import { getAllChaptersForAdmin, getSubjects } from "../../../services/contentService";
import { createQuestionsBulk } from "../../../services/quizService";
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
      const subjectData = (await getSubjects()) || [];
      const normalizedSubjects = subjectData.map(normalizeSubject);
      const chapterData = (await getAllChaptersForAdmin(normalizedSubjects)) || [];

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
    for (let offset = 0; offset < items.length; offset += 500) {
      const batch = items.slice(offset, offset + 500);
      const result = await createQuestionsBulk(batch);
      successCount += result?.successCount || 0;
      (result?.items || []).filter((item) => !item.success).forEach((item) => errors.push({
        clientId: item.clientId,
        index: items.findIndex((source) => source.clientId === item.clientId) + 1,
        message: item.message || "Không thể lưu câu hỏi này.",
      }));
      onProgress?.({
        total: items.length,
        completed: Math.min(offset + batch.length, items.length),
        success: successCount,
        failed: errors.length,
      });
    }

    if (successCount) toast.success(`Đã import ${successCount} câu hỏi.`);
    return { successCount, failureCount: errors.length, errors };
  };

  const breadcrumb = useMemo(() => {
    if (subjectId && chapterId) {
      return [
        "Tổng quan",
        "Môn học",
        {
          label: routeSubject?.name || "Chương",
          href: `/admin/subjects/${subjectId}/chapters`,
        },
        {
          label: routeChapter
            ? `Chương ${routeChapter.displayOrder ?? ""}: ${routeChapter.name}`
            : "Câu hỏi",
          href: returnPath,
        },
        "Import câu hỏi",
      ];
    }
    return [
      "Tổng quan",
      { label: "Ngân hàng câu hỏi", href: "/admin/questions" },
      "Import câu hỏi",
    ];
  }, [subjectId, chapterId, routeSubject, routeChapter, returnPath]);

  return (
    <>
      <AdminPageHeader
        breadcrumb={breadcrumb}
        title="Import câu hỏi"
        subtitle="Đọc dữ liệu, gán môn/chương và kiểm tra lỗi trước khi lưu."
        backHref={returnPath}
        backLabel={subjectId && chapterId ? "Danh sách câu hỏi" : "Ngân hàng câu hỏi"}
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
