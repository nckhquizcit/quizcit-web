import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { BookOpen, Check, ChevronDown, ChevronRight, FileText, GripVertical, ListOrdered, Plus, Pencil, Trash2, X } from "lucide-react";
import AddChapterModal from "../components/modals/AddChapterModal";
import ConfirmDeleteModal from "../components/modals/ConfirmDeleteModal";
import AddTheoryModal from "../components/modals/AddTheoryModal";
import EditTheoryModal from "../components/modals/EditTheoryModal";
import TheoryContent from "../../content/components/TheoryContent";
import AdminPageHeader from "../components/AdminPageHeader";
import SearchBar from "../components/SearchBar";
import {
  createChapter,
  getChaptersBySubject,
  getSubjectById,
  reorderChapters,
  deleteChapter,
  getTheoriesByChapter,
  createTheory,
  updateTheory,
  deleteTheory,
} from "../../../services/contentService";
import { getAllQuestions } from "../../../services/quizService";
import { getErrorMessage } from "../../../services/apiClient";
import { reorderById } from "../utils/displayOrder";

export default function AdminChapters() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [openAddChapter, setOpenAddChapter] = useState(false);
  const [deletingChapter, setDeletingChapter] = useState(null);
  const [subject, setSubject] = useState(null);
  const [subjectChapters, setSubjectChapters] = useState([]);
  const [questionCountByChapter, setQuestionCountByChapter] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [pendingAction, setPendingAction] = useState("");
  const [draggedChapterId, setDraggedChapterId] = useState(null);
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderSnapshot, setOrderSnapshot] = useState([]);
  
  // Theory management
  const [expandedChapter, setExpandedChapter] = useState(null);
  const [theoriesByChapter, setTheoriesByChapter] = useState({});
  const [theoryLoadingByChapter, setTheoryLoadingByChapter] = useState({});
  const [theoryErrorByChapter, setTheoryErrorByChapter] = useState({});
  const [openAddTheory, setOpenAddTheory] = useState(false);
  const [editingTheory, setEditingTheory] = useState(null);
  const [deletingTheory, setDeletingTheory] = useState(null);
  const [expandedTheories, setExpandedTheories] = useState({});

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        setLoading(true);
        setLoadError("");
        const [subjectData, chapters = [], questions = []] = await Promise.all([
          getSubjectById(subjectId), getChaptersBySubject(subjectId), getAllQuestions(),
        ]);
        const entries = chapters.map((chapter) => [chapter.chapterId,
          questions.filter((question) => question.chapterId === chapter.chapterId).length]);

        if (!alive) return;
        setSubject(subjectData);
        setSubjectChapters(chapters);
        setQuestionCountByChapter(Object.fromEntries(entries));
      } catch (error) {
        if (alive) {
          setLoadError(getErrorMessage(error, "Không thể tải danh sách chương."));
        }
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();

    return () => {
      alive = false;
    };
  }, [subjectId]);

  const loadTheories = async (chapterId) => {
    setTheoryLoadingByChapter((prev) => ({ ...prev, [chapterId]: true }));
    setTheoryErrorByChapter((prev) => ({ ...prev, [chapterId]: "" }));

    try {
      const theories = (await getTheoriesByChapter(chapterId)) || [];
      setTheoriesByChapter((prev) => ({ ...prev, [chapterId]: theories }));
      return theories;
    } catch (error) {
      const message = getErrorMessage(error, "Không thể tải danh sách lý thuyết.");
      setTheoryErrorByChapter((prev) => ({ ...prev, [chapterId]: message }));
      throw error;
    } finally {
      setTheoryLoadingByChapter((prev) => ({ ...prev, [chapterId]: false }));
    }
  };

  const handleExpandChapter = async (chapterId) => {
    if (expandedChapter === chapterId) {
      setExpandedChapter(null);
    } else {
      setExpandedChapter(chapterId);
      if (!theoriesByChapter[chapterId]) {
        try {
          await loadTheories(chapterId);
        } catch {
          // Error is shown inside the expanded chapter panel.
        }
      }
    }
  };

  const filteredChapters = useMemo(
    () => subjectChapters.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())),
    [subjectChapters, search],
  );

  const runAction = async (actionName, action) => {
    setPendingAction(actionName);
    setActionError("");

    try {
      return await action();
    } catch (error) {
      setActionError(getErrorMessage(error, "Không thể thực hiện thao tác. Vui lòng thử lại."));
      throw error;
    } finally {
      setPendingAction("");
    }
  };

  const handleAddChapter = async (payload) => {
    await runAction("create-chapter", async () => {
      const created = await createChapter(subjectId, payload);
      setSubjectChapters((current) => [...current, created].sort((a, b) => a.displayOrder - b.displayOrder));
      setQuestionCountByChapter((current) => ({
        ...current,
        [created.chapterId]: 0,
      }));
      setOpenAddChapter(false);
    });
  };

  const handleDeleteChapter = async () => {
    if (!deletingChapter) return;

    await runAction("delete-chapter", async () => {
      await deleteChapter(deletingChapter.chapterId);
      setSubjectChapters((current) =>
        current.filter((c) => c.chapterId !== deletingChapter.chapterId),
      );
      setQuestionCountByChapter((current) => {
        const next = { ...current };
        delete next[deletingChapter.chapterId];
        return next;
      });
      setDeletingChapter(null);
    });
  };

  const handleAddTheory = async (payload) => {
    if (!expandedChapter) return;

    await runAction("create-theory", async () => {
      await createTheory(expandedChapter, payload);
      await loadTheories(expandedChapter);
      setOpenAddTheory(false);
    });
  };

  const handleUpdateTheory = async (payload) => {
    if (!editingTheory) return;

    await runAction("update-theory", async () => {
      await updateTheory(editingTheory.theoryId, payload);
      await loadTheories(editingTheory.chapterId);
      setEditingTheory(null);
    });
  };

  const handleDeleteTheory = async () => {
    if (!deletingTheory) return;

    await runAction("delete-theory", async () => {
      await deleteTheory(deletingTheory.theoryId);
      await loadTheories(deletingTheory.chapterId);
      setDeletingTheory(null);
    });
  };

  const toggleTheory = (theoryId) => {
    setExpandedTheories((current) => ({
      ...current,
      [theoryId]: !current[theoryId],
    }));
  };

  const handleChapterDrop = (event, targetChapterId) => {
    event.preventDefault();
    if (!isOrdering || !draggedChapterId || draggedChapterId === targetChapterId || pendingAction) return;
    setSubjectChapters((current) => reorderById(current, draggedChapterId, targetChapterId, (item) => item.chapterId));
    setDraggedChapterId(null);
  };

  const startOrdering = () => { setOrderSnapshot(subjectChapters); setExpandedChapter(null); setIsOrdering(true); };
  const cancelOrdering = () => { setSubjectChapters(orderSnapshot); setIsOrdering(false); setDraggedChapterId(null); };
  const saveOrdering = async () => {
    try {
      await runAction("reorder-chapters", () => reorderChapters(subjectId, subjectChapters));
      setIsOrdering(false);
      setOrderSnapshot([]);
    } catch {
      setSubjectChapters(orderSnapshot);
    }
  };

  const isMutating = Boolean(pendingAction);

  if (loading) return <div className="admin-page-state">Đang tải danh sách chương...</div>;
  if (loadError) return <div className="admin-page-state error">{loadError}</div>;
  if (!subject) return <div className="admin-page-state error">Không tìm thấy môn học.</div>;

  const expandedChapterData = subjectChapters.find((c) => c.chapterId === expandedChapter);

  return (
    <>
      <AdminPageHeader
        breadcrumb={["Tổng quan", "Môn học", subject.name]}
        title={subject.name}
        subtitle={`Mã môn: ${subject.courseCode} • ${subjectChapters.length} chương`}
        icon={<BookOpen size={22} />}
        onBack={() => navigate("/admin/subjects")}
        action={<div className="display-order-actions">
          {isOrdering ? <>
            <button className="cancel-btn" onClick={cancelOrdering} disabled={isMutating}><X size={17} /> Hủy</button>
            <button className="add-btn" onClick={saveOrdering} disabled={isMutating}><Check size={17} /> Lưu thứ tự</button>
          </> : <button className="cancel-btn" onClick={startOrdering} disabled={isMutating || !subjectChapters.length}><ListOrdered size={17} /> Chỉnh thứ tự</button>}
          <button className="add-btn" onClick={() => setOpenAddChapter(true)} disabled={isMutating || isOrdering}>
            <Plus size={18} />
            Thêm chương
          </button>
        </div>}
      />

      <SearchBar placeholder="Tìm kiếm chương..." onChange={setSearch} />

      {actionError && <div className="admin-page-state error">{actionError}</div>}
      {filteredChapters.length === 0 && <div className="admin-page-state">Chưa có chương nào.</div>}

      <div className="chapter-list">
        {filteredChapters.map((chapter, index) => {
          const isExpanded = expandedChapter === chapter.chapterId;
          const chapterTheories = theoriesByChapter[chapter.chapterId] || [];
          const isLoadingTheories = Boolean(theoryLoadingByChapter[chapter.chapterId]);
          const theoryError = theoryErrorByChapter[chapter.chapterId];

          return (
            <div key={chapter.chapterId} className="chapter-card-wrapper">
              <div
                className="chapter-card"
                draggable={isOrdering && !pendingAction}
                onDragStart={(event) => {
                  setDraggedChapterId(chapter.chapterId);
                  event.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => handleChapterDrop(event, chapter.chapterId)}
                onDragEnd={() => setDraggedChapterId(null)}
                data-dragging={draggedChapterId === chapter.chapterId || undefined}
                onClick={() => !isOrdering && handleExpandChapter(chapter.chapterId)}
              >
                <div className="chapter-left">
                  {isOrdering && <span className="display-order-drag-handle" title="Kéo để đổi thứ tự" aria-label="Kéo để đổi thứ tự">
                    <GripVertical size={17} />
                  </span>}
                  <div className="chapter-index">{index + 1}</div>

                  <div>
                    <div className="chapter-title">{chapter.name}</div>
                    <div className="chapter-sub">
                      {questionCountByChapter[chapter.chapterId] || 0} câu hỏi
                    </div>
                  </div>
                </div>

                <div className="chapter-actions">
                  <button
                    className="icon-btn"
                    disabled={isMutating || isOrdering}
                    aria-label={`Chỉnh sửa ${chapter.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/admin/subjects/${subjectId}/chapters/${chapter.chapterId}/edit`);
                    }}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="icon-btn danger"
                    disabled={isMutating || isOrdering}
                    aria-label={`Xóa ${chapter.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingChapter(chapter);
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="chapter-arrow" aria-hidden="true">
                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="chapter-expanded-content">
                  <div className="theory-management">
                    <div className="theory-header">
                      <h4>
                        <BookOpen size={17} />
                        Lý thuyết
                      </h4>
                      <button
                        className="add-btn small"
                        disabled={isMutating}
                        onClick={() => setOpenAddTheory(true)}
                      >
                        <Plus size={14} />
                        Thêm lý thuyết
                      </button>
                    </div>

                    <div className="theory-list">
                      {isLoadingTheories ? (
                        <div className="empty-state">Đang tải lý thuyết...</div>
                      ) : theoryError ? (
                        <div className="empty-state error">{theoryError}</div>
                      ) : chapterTheories.length === 0 ? (
                        <div className="empty-state">Chưa có lý thuyết</div>
                      ) : (
                        chapterTheories.map((theory, theoryIndex) => {
                          const theoryId = theory.theoryId || theory.theory_id;
                          const theoryText = theory.content || "";
                          const isTheoryExpanded = Boolean(expandedTheories[theoryId]);
                          const isLongTheory =
                            theoryText.length > 320 || theoryText.split(/\r?\n/).length > 6;

                          return (
                          <div key={theoryId} className="theory-item-admin">
                            <div className="theory-content">
                              <span className="theory-item-label">Lý thuyết {theoryIndex + 1}</span>
                              <TheoryContent
                                key={`${theoryId}-${theoryText}`}
                                content={theoryText}
                                contentFormat={theory.contentFormat}
                                className={isTheoryExpanded ? "is-expanded" : "is-collapsed"}
                              />
                              {isLongTheory && (
                                <button
                                  type="button"
                                  className="theory-expand-btn"
                                  onClick={() => toggleTheory(theoryId)}
                                >
                                  {isTheoryExpanded ? "Thu gọn" : "Xem đầy đủ"}
                                </button>
                              )}
                            </div>
                            <div className="theory-actions">
                              <button
                                className="icon-btn"
                                disabled={isMutating}
                                aria-label="Chỉnh sửa lý thuyết"
                                onClick={() => setEditingTheory(theory)}
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                className="icon-btn danger"
                                disabled={isMutating}
                                aria-label="Xóa lý thuyết"
                                onClick={() => setDeletingTheory(theory)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="question-management">
                    <button
                      className="view-questions-btn"
                      onClick={() =>
                        navigate(
                          `/admin/subjects/${subjectId}/chapters/${chapter.chapterId}/questions`,
                        )
                      }
                    >
                      <FileText size={16} />
                      Quản lý câu hỏi
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <AddChapterModal
        open={openAddChapter}
        onClose={() => setOpenAddChapter(false)}
        subject={subject}
        onSubmit={handleAddChapter}
      />


      <ConfirmDeleteModal
        open={Boolean(deletingChapter)}
        onClose={() => setDeletingChapter(null)}
        title="Xóa chương"
        message="Bạn có muốn xóa chương này không? Tất cả câu hỏi và lý thuyết trong chương cũng sẽ bị xóa."
        itemName={deletingChapter?.name}
        onConfirm={handleDeleteChapter}
      />

      <AddTheoryModal
        open={openAddTheory}
        onClose={() => setOpenAddTheory(false)}
        chapter={expandedChapterData}
        onSubmit={handleAddTheory}
      />

      <EditTheoryModal
        open={Boolean(editingTheory)}
        onClose={() => setEditingTheory(null)}
        theory={editingTheory}
        onSubmit={handleUpdateTheory}
      />

      <ConfirmDeleteModal
        open={Boolean(deletingTheory)}
        onClose={() => setDeletingTheory(null)}
        title="Xóa lý thuyết"
        message="Bạn có muốn xóa nội dung lý thuyết này không?"
        itemName={deletingTheory?.content?.substring(0, 50)}
        onConfirm={handleDeleteTheory}
      />
    </>
  );
}
