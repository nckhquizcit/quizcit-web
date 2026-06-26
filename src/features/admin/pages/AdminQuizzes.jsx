import { useEffect, useMemo, useState } from "react";
import { Clock, FileText, ListChecks, Pencil, Plus, Trash2 } from "lucide-react";

import "../Admin.css";
import "./AdminQuizzes.css";
import AdminPageHeader from "../components/AdminPageHeader";
import DataTable from "../components/ui/DataTable";
import RowActions from "../components/ui/RowActions";
import EmptyState from "../../../components/ui/EmptyState/EmptyState";
import ErrorState from "../../../components/ui/ErrorState/ErrorState";
import ConfirmDeleteModal from "../components/modals/ConfirmDeleteModal";
import CreateQuizModal from "../components/modals/CreateQuizModal";
import EditQuizModal from "../components/modals/EditQuizModal";
import { useToast } from "../../../components/ui/Toast/Toast";
import { getChaptersBySubject, getSubjects } from "../../../services/contentService";
import { getErrorMessage } from "../../../services/apiClient";
import { deleteQuiz, getQuizzesByChapter } from "../services/quizService";

const getSubjectId = (subject) => String(subject?.subjectId ?? subject?.id ?? "");
const getChapterId = (chapter) => String(chapter?.chapterId ?? chapter?.id ?? "");
const getQuizId = (quiz) => String(quiz?.quizId ?? quiz?.id ?? "");

const QUIZ_TYPE_LABELS = {
  CHAPTER: "Theo chương",
  SUBJECT: "Theo môn học",
  FINAL: "Đề tổng kết",
};

export default function AdminQuizzes() {
  const toast = useToast();
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedChapterId, setSelectedChapterId] = useState("");
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(false);
  const [error, setError] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [deletingQuiz, setDeletingQuiz] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadSubjects() {
      try {
        setError("");
        const rows = (await getSubjects()) || [];
        if (!isMounted) return;
        setSubjects(rows);
        setSelectedSubjectId((current) => current || getSubjectId(rows[0]));
      } catch (loadError) {
        if (isMounted) setError(getErrorMessage(loadError, "Không thể tải danh sách môn học."));
      } finally {
        if (isMounted) setIsBootstrapping(false);
      }
    }
    loadSubjects();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedSubjectId) {
      setChapters([]);
      setSelectedChapterId("");
      return undefined;
    }
    let isMounted = true;
    setIsLoadingChapters(true);
    getChaptersBySubject(selectedSubjectId)
      .then((rows) => {
        if (!isMounted) return;
        const list = rows || [];
        setChapters(list);
        setSelectedChapterId((current) => {
          const has = list.some((chapter) => getChapterId(chapter) === current);
          return has ? current : getChapterId(list[0]);
        });
      })
      .catch((loadError) => {
        if (isMounted) {
          setError(getErrorMessage(loadError, "Không thể tải danh sách chương."));
          setChapters([]);
          setSelectedChapterId("");
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingChapters(false);
      });
    return () => {
      isMounted = false;
    };
  }, [selectedSubjectId]);

  useEffect(() => {
    if (!selectedChapterId) {
      setQuizzes([]);
      return undefined;
    }
    let isMounted = true;
    setIsLoadingQuizzes(true);
    setError("");
    getQuizzesByChapter(selectedChapterId)
      .then((rows) => {
        if (isMounted) setQuizzes(rows || []);
      })
      .catch((loadError) => {
        if (isMounted) {
          setError(getErrorMessage(loadError, "Không thể tải danh sách đề thi."));
          setQuizzes([]);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingQuizzes(false);
      });
    return () => {
      isMounted = false;
    };
  }, [selectedChapterId]);

  const selectedChapter = useMemo(
    () => chapters.find((chapter) => getChapterId(chapter) === selectedChapterId),
    [chapters, selectedChapterId],
  );

  const handleQuizCreated = (createdQuiz, context) => {
    if (context?.chapterId === selectedChapterId) {
      setQuizzes((current) => [createdQuiz, ...current]);
    }
    toast.success("Tạo đề thi thành công.");
  };

  const handleQuizUpdated = (updatedQuiz) => {
    setQuizzes((current) =>
      current.map((quiz) => (getQuizId(quiz) === getQuizId(updatedQuiz) ? updatedQuiz : quiz)),
    );
    setEditingQuiz(null);
    toast.success("Cập nhật đề thi thành công.");
  };

  const handleDeleteQuiz = async () => {
    if (!deletingQuiz) return;
    const quizId = getQuizId(deletingQuiz);
    await deleteQuiz(quizId);
    setQuizzes((current) => current.filter((quiz) => getQuizId(quiz) !== quizId));
    setDeletingQuiz(null);
    toast.success("Xóa đề thi thành công.");
  };

  const columns = [
    {
      key: "name",
      label: "Tên đề thi",
      sortable: true,
      render: (quiz) => (
        <div className="quiz-name-cell">
          <span className="quiz-name-icon">
            <FileText size={16} />
          </span>
          <strong>{quiz.name || "Đề thi chưa đặt tên"}</strong>
        </div>
      ),
    },
    {
      key: "type",
      label: "Loại",
      width: 140,
      sortable: true,
      sortValue: (quiz) => QUIZ_TYPE_LABELS[quiz.type] || "Theo chương",
      render: (quiz) => (
        <span className="quiz-type-badge">{QUIZ_TYPE_LABELS[quiz.type] || "Theo chương"}</span>
      ),
    },
    {
      key: "totalQuestion",
      label: "Số câu",
      width: 100,
      align: "center",
      sortable: true,
      sortValue: (quiz) => quiz.totalQuestion ?? 0,
      render: (quiz) => (
        <span className="quiz-meta-cell">
          <ListChecks size={14} /> {quiz.totalQuestion ?? 0}
        </span>
      ),
    },
    {
      key: "duration",
      label: "Thời gian",
      width: 120,
      align: "center",
      sortable: true,
      sortValue: (quiz) => quiz.durationMinutes ?? quiz.duration ?? 0,
      render: (quiz) => (
        <span className="quiz-meta-cell">
          <Clock size={14} /> {quiz.durationMinutes ?? quiz.duration ?? 0} phút
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      width: 60,
      align: "right",
      render: (quiz) => (
        <RowActions
          items={[
            {
              label: "Chỉnh sửa",
              icon: <Pencil size={16} />,
              onClick: () => setEditingQuiz(quiz),
            },
            {
              label: "Xóa",
              icon: <Trash2 size={16} />,
              danger: true,
              onClick: () => setDeletingQuiz(quiz),
            },
          ]}
        />
      ),
    },
  ];

  if (isBootstrapping) {
    return (
      <DataTable columns={columns} rows={[]} loading searchable={false} pageSize={6} />
    );
  }

  return (
    <>
      <AdminPageHeader
        breadcrumb={["Tổng quan", "Đề thi"]}
        title="Quản lý đề thi"
        subtitle="Tạo và quản lý đề thi theo môn học và chương"
        icon={<FileText size={22} />}
        action={
          <button className="add-btn" onClick={() => setIsCreateOpen(true)}>
            <Plus size={18} />
            Tạo đề thi
          </button>
        }
      />

      <div className="admin-section-card quiz-filter-bar">
        <label className="quiz-field">
          <span>Môn học</span>
          <select
            value={selectedSubjectId}
            onChange={(event) => setSelectedSubjectId(event.target.value)}
          >
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
      </div>

      {error ? (
        <ErrorState description={error} onRetry={() => setSelectedChapterId((id) => id)} />
      ) : (
        <DataTable
          columns={columns}
          rows={quizzes}
          getRowKey={(quiz) => getQuizId(quiz)}
          loading={isLoadingQuizzes}
          searchPlaceholder="Tìm kiếm đề thi theo tên..."
          searchKeys={["name"]}
          initialSort={{ key: "name", dir: "asc" }}
          emptyState={
            <EmptyState
              icon={<FileText size={28} />}
              title="Chưa có đề thi"
              description={
                selectedChapter
                  ? "Chương này chưa có đề thi. Bấm \"Tạo đề thi\" để thêm mới."
                  : "Chọn môn học và chương để xem danh sách đề thi."
              }
            />
          }
        />
      )}

      <CreateQuizModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        subjects={subjects}
        defaultSubjectId={selectedSubjectId}
        defaultChapterId={selectedChapterId}
        onCreated={handleQuizCreated}
      />

      <EditQuizModal
        open={Boolean(editingQuiz)}
        quiz={editingQuiz}
        onClose={() => setEditingQuiz(null)}
        onUpdated={handleQuizUpdated}
      />

      <ConfirmDeleteModal
        open={Boolean(deletingQuiz)}
        onClose={() => setDeletingQuiz(null)}
        onConfirm={handleDeleteQuiz}
        title="Xóa đề thi"
        message="Bạn có chắc chắn muốn xóa đề thi này? Hành động này không thể hoàn tác."
        itemName={deletingQuiz?.name || ""}
      />
    </>
  );
}
