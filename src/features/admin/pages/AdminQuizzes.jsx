import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Clock, FileText, GripVertical, ListChecks, ListOrdered, Pencil, Plus, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import "../Admin.css";
import "./AdminQuizzes.css";
import AdminPageHeader from "../components/AdminPageHeader";
import DataTable from "../components/ui/DataTable";
import RowActions from "../components/ui/RowActions";
import SearchBar from "../components/SearchBar";
import EmptyState from "../../../components/ui/EmptyState/EmptyState";
import ErrorState from "../../../components/ui/ErrorState/ErrorState";
import ConfirmDeleteModal from "../components/modals/ConfirmDeleteModal";
import { useToast } from "../../../components/ui/Toast/Toast";
import { getChaptersBySubject, getSubjects } from "../../../services/contentService";
import { getErrorMessage } from "../../../services/apiClient";
import { deleteQuiz, getQuizzesByChapter, getSubjectQuizzesOverview, reorderQuizzes } from "../services/quizService";
import { reorderById } from "../utils/displayOrder";

const getSubjectId = (subject) => String(subject?.subjectId ?? subject?.id ?? "");
const getChapterId = (chapter) => String(chapter?.chapterId ?? chapter?.id ?? "");
const getQuizId = (quiz) => String(quiz?.quizId ?? quiz?.id ?? "");

const QUIZ_TYPE_LABELS = {
  CHAPTER: "Theo chương",
  FINAL: "Đề tổng kết",
  ADAPTIVE: "Đề thích ứng",
};

// De thich ung chon cau theo nang luc nguoi lam nen khong co danh sach cau co dinh.
const ADAPTIVE_QUIZ_TYPE = "ADAPTIVE";
const isAdaptiveQuiz = (quiz) => quiz?.type === ADAPTIVE_QUIZ_TYPE;

// Mau huy hieu theo tung loai de: FINAL ho phach, ADAPTIVE xanh thong tin, con lai xam.
const QUIZ_TYPE_BADGE_CLASSES = {
  FINAL: "adm2-badge--amber",
  ADAPTIVE: "adm2-badge--info",
};
const getQuizTypeBadgeClass = (type) => QUIZ_TYPE_BADGE_CLASSES[type] || "adm2-badge--gray";

export default function AdminQuizzes() {
  const navigate = useNavigate();
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
  const [deletingQuiz, setDeletingQuiz] = useState(null);
  const [draggedQuizId, setDraggedQuizId] = useState(null);
  const [isReordering, setIsReordering] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderSnapshot, setOrderSnapshot] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [reloadTick, setReloadTick] = useState(0);
  // Chuong dang duoc chon, doc ngay trong callback de khong dung gia tri bi capture cu.
  const selectedChapterIdRef = useRef(selectedChapterId);

  useEffect(() => {
    selectedChapterIdRef.current = selectedChapterId;
  }, [selectedChapterId]);

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
  }, [reloadTick]);

  useEffect(() => {
    if (!selectedSubjectId) {
      setChapters([]);
      setSelectedChapterId("");
      setQuizzes([]);
      return undefined;
    }
    let isMounted = true;
    setIsLoadingChapters(true);
    setIsLoadingQuizzes(true);
    setError("");
    setIsOrdering(false);
    setOrderSnapshot([]);
    setDraggedQuizId(null);

    async function loadSubjectData() {
      try {
        const overview = await getSubjectQuizzesOverview(selectedSubjectId);
        if (!isMounted) return;
        const chapList = overview?.chapters || [];
        setChapters(chapList);
        setSelectedChapterId((current) => {
          const has = chapList.some((chapter) => getChapterId(chapter) === current);
          const target = has ? current : getChapterId(chapList[0]);
          const activeChap = chapList.find((c) => getChapterId(c) === target);
          setQuizzes(activeChap?.quizzes || []);
          return target;
        });
      } catch (overviewErr) {
        // Resilient fallback for older backend
        console.warn("Failed to fetch quizzes overview, falling back:", overviewErr);
        try {
          const rows = (await getChaptersBySubject(selectedSubjectId)) || [];
          if (!isMounted) return;
          setChapters(rows);
          setSelectedChapterId((current) => {
            const has = rows.some((chapter) => getChapterId(chapter) === current);
            return has ? current : getChapterId(rows[0]);
          });
        } catch (chapErr) {
          if (isMounted) {
            setError(getErrorMessage(chapErr, "Không thể tải danh sách chương."));
            setChapters([]);
            setSelectedChapterId("");
            setQuizzes([]);
          }
        }
      } finally {
        if (isMounted) {
          setIsLoadingChapters(false);
          setIsLoadingQuizzes(false);
        }
      }
    }

    loadSubjectData();
    return () => {
      isMounted = false;
    };
  }, [selectedSubjectId, reloadTick]);

  const handleChapterChange = (nextChapterId) => {
    setSelectedChapterId(nextChapterId);
    selectedChapterIdRef.current = nextChapterId;
    setIsOrdering(false);
    setOrderSnapshot([]);
    setDraggedQuizId(null);

    const found = chapters.find((c) => getChapterId(c) === nextChapterId);
    if (found?.quizzes) {
      setQuizzes(found.quizzes);
    } else if (nextChapterId) {
      setIsLoadingQuizzes(true);
      setError("");
      getQuizzesByChapter(nextChapterId)
        // Bo qua ket qua ve muon cua chuong khong con duoc chon.
        .then((rows) => {
          if (selectedChapterIdRef.current !== nextChapterId) return;
          setQuizzes(rows || []);
        })
        .catch((loadErr) => {
          if (selectedChapterIdRef.current !== nextChapterId) return;
          setError(getErrorMessage(loadErr, "Không thể tải danh sách đề thi."));
        })
        .finally(() => {
          if (selectedChapterIdRef.current !== nextChapterId) return;
          setIsLoadingQuizzes(false);
        });
    } else {
      setQuizzes([]);
    }
  };

  const selectedChapter = useMemo(
    () => chapters.find((chapter) => getChapterId(chapter) === selectedChapterId),
    [chapters, selectedChapterId],
  );

  const filteredQuizzes = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return quizzes;
    return quizzes.filter((quiz) => (quiz.name || "").toLowerCase().includes(keyword));
  }, [quizzes, searchQuery]);

  const handleQuizDrop = (event, targetQuiz) => {
    event.preventDefault();
    const targetQuizId = getQuizId(targetQuiz);
    if (!isOrdering || !draggedQuizId || draggedQuizId === targetQuizId || isReordering) return;
    setQuizzes((current) => reorderById(current, draggedQuizId, targetQuizId, getQuizId));
    setDraggedQuizId(null);
  };

  const startOrdering = () => { setOrderSnapshot(quizzes); setIsOrdering(true); setSearchQuery(""); };
  const cancelOrdering = () => { setQuizzes(orderSnapshot); setIsOrdering(false); setDraggedQuizId(null); };
  const saveOrdering = async () => {
    setIsReordering(true);
    setError("");
    try {
      await reorderQuizzes(selectedChapterId, quizzes);
      toast.success("Đã cập nhật thứ tự đề thi.");
      setIsOrdering(false);
      setOrderSnapshot([]);
    } catch (reorderError) {
      setQuizzes(orderSnapshot);
      setError(getErrorMessage(reorderError, "Không thể cập nhật thứ tự đề thi."));
    } finally {
      setIsReordering(false);
    }
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
    ...(isOrdering
      ? [
          {
            key: "drag",
            label: "",
            width: 42,
            align: "center",
            render: () => (
              <GripVertical className="display-order-drag-handle" size={17} aria-label="Kéo để đổi thứ tự" />
            ),
          },
        ]
      : []),
    {
      key: "displayOrder",
      label: "Thứ tự",
      width: 80,
      align: "center",
      render: (quiz) => <span className="bank-question-index">{quiz.displayOrder ?? "-"}</span>,
    },
    {
      key: "name",
      label: "Tên đề",
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
      width: 150,
      sortValue: (quiz) => QUIZ_TYPE_LABELS[quiz.type] || quiz.type || "Không rõ",
      render: (quiz) => (
        <span className={`adm2-badge ${getQuizTypeBadgeClass(quiz.type)}`}>
          {QUIZ_TYPE_LABELS[quiz.type] || quiz.type || "Không rõ"}
        </span>
      ),
    },
    {
      key: "totalQuestion",
      label: "Số câu",
      width: 100,
      align: "center",
      sortValue: (quiz) => quiz.totalQuestion ?? 0,
      render: (quiz) => (
        <span className="quiz-meta-cell">{quiz.totalQuestion ?? 0} câu</span>
      ),
    },
    {
      key: "duration",
      label: "Thời gian",
      width: 120,
      align: "center",
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
      width: 210,
      align: "right",
      render: (quiz) => isOrdering ? null : (
        <RowActions
          labelled
          items={[
            // De thich ung khong co danh sach cau co dinh nen khong co gi de cau hinh.
            ...(isAdaptiveQuiz(quiz)
              ? []
              : [
                  {
                    label: "Câu hỏi",
                    icon: <ListChecks size={14} />,
                    onClick: () => navigate(`/admin/quizzes/${getQuizId(quiz)}/edit/questions`),
                  },
                ]),
            {
              label: "Sửa",
              icon: <Pencil size={14} />,
              onClick: () => navigate(`/admin/quizzes/${getQuizId(quiz)}/edit`),
            },
            {
              label: "Xóa",
              icon: <Trash2 size={14} />,
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
        action={
          <button
            className="add-btn"
            disabled={isOrdering}
            onClick={() =>
              navigate(
                `/admin/quizzes/new?subjectId=${encodeURIComponent(selectedSubjectId)}&chapterId=${encodeURIComponent(
                  selectedChapterId,
                )}`,
              )
            }
          >
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
            onChange={(event) => handleChapterChange(event.target.value)}
            disabled={isLoadingChapters || !chapters.length}
          >
            {chapters.map((chapter) => (
              <option key={getChapterId(chapter)} value={getChapterId(chapter)}>
                {chapter.name}
              </option>
            ))}
          </select>
        </label>

        <div className="quiz-filter-search">
          <SearchBar placeholder="Tìm tên đề..." value={searchQuery} onChange={setSearchQuery} />
        </div>

        <div className="quiz-filter-order-actions">
          {isOrdering ? (
            <>
              <button className="cancel-btn" onClick={cancelOrdering} disabled={isReordering}><X size={17} /> Hủy</button>
              <button className="add-btn" onClick={saveOrdering} disabled={isReordering}><Check size={17} /> Lưu thứ tự</button>
            </>
          ) : (
            <button className="cancel-btn" onClick={startOrdering} disabled={!quizzes.length || isLoadingQuizzes}>
              <ListOrdered size={17} /> Chỉnh thứ tự
            </button>
          )}
        </div>
      </div>

      {error ? (
        <ErrorState description={error} onRetry={() => setReloadTick((tick) => tick + 1)} />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={filteredQuizzes}
            getRowKey={(quiz) => getQuizId(quiz)}
            loading={isLoadingQuizzes}
            searchable={false}
            rowDraggable={isOrdering && !isReordering}
            draggedRowKey={draggedQuizId}
            onRowDragStart={(event, quiz) => {
              setDraggedQuizId(getQuizId(quiz));
              event.dataTransfer.effectAllowed = "move";
            }}
            onRowDragOver={(event) => event.preventDefault()}
            onRowDrop={handleQuizDrop}
            onRowDragEnd={() => setDraggedQuizId(null)}
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
          {!isLoadingQuizzes && (
            <div className="adm2-note adm2-note--muted quiz-table-footnote">
              {filteredQuizzes.length} đề trong chương
            </div>
          )}
        </>
      )}

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
