import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { BookOpen, ChevronDown, ChevronRight, FileText, Plus, Pencil, Trash2 } from "lucide-react";
import AddChapterModal from "../components/modals/AddChapterModal";
import EditChapterModal from "../components/modals/EditChapterModal";
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
  updateChapter,
  deleteChapter,
  getTheoriesByChapter,
  createTheory,
  updateTheory,
  deleteTheory,
} from "../../../services/contentService";
import { getQuestionsByChapter } from "../../../services/quizService";
import { getErrorMessage } from "../../../services/apiClient";

export default function AdminChapters() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [openAddChapter, setOpenAddChapter] = useState(false);
  const [editingChapter, setEditingChapter] = useState(null);
  const [deletingChapter, setDeletingChapter] = useState(null);
  const [subject, setSubject] = useState(null);
  const [subjectChapters, setSubjectChapters] = useState([]);
  const [questionCountByChapter, setQuestionCountByChapter] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [pendingAction, setPendingAction] = useState("");
  
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
        const subjectData = await getSubjectById(subjectId);
        const chapters = (await getChaptersBySubject(subjectId)) || [];
        const entries = await Promise.all(
          chapters.map(async (chapter) => [
            chapter.chapterId,
            ((await getQuestionsByChapter(chapter.chapterId)) || []).length,
          ]),
        );

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
      setSubjectChapters((current) => [...current, created]);
      setQuestionCountByChapter((current) => ({
        ...current,
        [created.chapterId]: 0,
      }));
      setOpenAddChapter(false);
    });
  };

  const handleUpdateChapter = async (payload) => {
    if (!editingChapter) return;

    await runAction("update-chapter", async () => {
      await updateChapter(editingChapter.chapterId, payload);
      setSubjectChapters((current) =>
        current.map((c) => (c.chapterId === editingChapter.chapterId ? { ...c, ...payload } : c)),
      );
      setEditingChapter(null);
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
        action={
          <button className="add-btn" onClick={() => setOpenAddChapter(true)} disabled={isMutating}>
            <Plus size={18} />
            Thêm chương
          </button>
        }
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
                onClick={() => handleExpandChapter(chapter.chapterId)}
              >
                <div className="chapter-left">
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
                    disabled={isMutating}
                    aria-label={`Chỉnh sửa ${chapter.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingChapter(chapter);
                    }}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="icon-btn danger"
                    disabled={isMutating}
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

      <EditChapterModal
        open={Boolean(editingChapter)}
        onClose={() => setEditingChapter(null)}
        chapter={editingChapter}
        onSubmit={handleUpdateChapter}
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
