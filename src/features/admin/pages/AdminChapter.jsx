import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Brain, Check, ChevronDown, ChevronRight, FileText, GripVertical, ListOrdered, Plus, Pencil, Trash2, X } from "lucide-react";
import AddChapterModal from "../components/modals/AddChapterModal";
import { formatScaledThetaValue } from "../../../services/mappers";
import ConfirmDeleteModal from "../components/modals/ConfirmDeleteModal";
import TheoryContent from "../../content/components/TheoryContent";
import AdminPageHeader from "../components/AdminPageHeader";
import AdminPageState from "../components/AdminPageState";
import SearchBar from "../components/SearchBar";
import {
  createChapter,
  getChaptersBySubject,
  getSubjectById,
  reorderChapters,
  deleteChapter,
  updateChapter,
  getTheoriesByChapter,
} from "../../../services/contentService";
import { getAllQuestions } from "../../../services/quizService";
import { getErrorMessage } from "../../../services/apiClient";
import { useToast } from "../../../components/ui/Toast/Toast";
import { reorderById } from "../utils/displayOrder";

const getQuestionChapterId = (question) =>
  question?.chapterId ?? question?.chapter?.chapterId ?? question?.chapter?.id;

export default function AdminChapters() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
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
        const entries = chapters.map((chapter) => [
          chapter.chapterId,
          questions.filter(
            (question) => String(getQuestionChapterId(question)) === String(chapter.chapterId),
          ).length,
        ]);

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


  const handleRemoveSkillFromChapter = async (chapter, skillToRemove) => {
    const nextSkills = (chapter.skills || []).filter(
      (s) => s.skillId !== skillToRemove.skillId,
    );
    try {
      await updateChapter(chapter.chapterId, {
        name: chapter.name,
        displayOrder: Number(chapter.displayOrder),
        skills: nextSkills.map((s) => ({
          skillId: s.skillId,
          requiredTheta: Number(s.requiredTheta ?? 0),
        })),
      });
      toast.success(`Đã gỡ kỹ năng "${skillToRemove.name}" khỏi ${chapter.name}.`);
      setSubjectChapters((current) =>
        current.map((c) =>
          c.chapterId === chapter.chapterId ? { ...c, skills: nextSkills } : c,
        ),
      );
    } catch (err) {
      toast.error(
        getErrorMessage(
          err,
          "Không thể gỡ kỹ năng khỏi chương. Có thể câu hỏi trong chương đang sử dụng kỹ năng này.",
        ),
      );
    }
  };

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

    // Delete failures are shown inside ConfirmDeleteModal, so skip the
    // page-level actionError and let the error propagate to the modal.
    setPendingAction("delete-chapter");
    try {
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
    } finally {
      setPendingAction("");
    }
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
  const pageError = loadError || (!loading && !subject ? "Không tìm thấy môn học." : "");

  return (
    <>
      <AdminPageHeader
        breadcrumb={["Tổng quan", "Môn học", subject?.name || "Chương"]}
        title={subject ? `${subject.name} · Chương` : "Chương"}
        subtitle={
          subject
            ? `${subjectChapters.length} chương · quản lý lý thuyết, kỹ năng và câu hỏi.`
            : "Quản lý lý thuyết, kỹ năng và câu hỏi."
        }
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

      <AdminPageState
        loading={loading}
        error={pageError || null}
        errorTitle="Không tải được chương"
      >
      <SearchBar placeholder="Tìm chương..." value={search} onChange={setSearch} />

      {actionError && <div className="admin-page-state error">{actionError}</div>}
      {filteredChapters.length === 0 && (
        <div className="admin-page-state">
          {subjectChapters.length > 0
            ? "Không tìm thấy chương phù hợp. Thử từ khóa khác."
            : "Chưa có chương nào."}
        </div>
      )}

      <div className="chapter-list">
        {filteredChapters.map((chapter, index) => {
          const isExpanded = expandedChapter === chapter.chapterId;
          const loadedTheories = theoriesByChapter[chapter.chapterId];
          const chapterTheories = loadedTheories || [];
          const isLoadingTheories = Boolean(theoryLoadingByChapter[chapter.chapterId]);
          const theoryError = theoryErrorByChapter[chapter.chapterId];
          const questionCountLabel = `${questionCountByChapter[chapter.chapterId] || 0} câu`;
          const chapterMeta = Array.isArray(loadedTheories)
            ? `${questionCountLabel} · ${loadedTheories.length} lý thuyết`
            : questionCountLabel;
          const chapterSkillNames = (chapter.skills || []).map((skill) => skill.name).filter(Boolean).join(", ");

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
                role={isOrdering ? undefined : "button"}
                tabIndex={isOrdering ? undefined : 0}
                aria-expanded={isOrdering ? undefined : isExpanded}
                onClick={() => !isOrdering && handleExpandChapter(chapter.chapterId)}
                onKeyDown={(event) => {
                  // Only react when the card itself is focused, not inner buttons.
                  if (isOrdering || event.target !== event.currentTarget) return;
                  if (event.key !== "Enter" && event.key !== " ") return;
                  if (event.key === " ") event.preventDefault();
                  handleExpandChapter(chapter.chapterId);
                }}
              >
                <div className="chapter-left">
                  {isOrdering && <span className="display-order-drag-handle" title="Kéo để đổi thứ tự" aria-label="Kéo để đổi thứ tự">
                    <GripVertical size={17} />
                  </span>}
                  <div className="chapter-index">{index + 1}</div>

                  <div>
                    <div className="chapter-title">{chapter.name}</div>
                    <div className="chapter-sub">{chapterMeta}</div>
                  </div>
                </div>

                <div className="chapter-actions">
                  <button
                    type="button"
                    className="adm2-text-btn"
                    disabled={isMutating || isOrdering}
                    aria-label={`Chỉnh sửa ${chapter.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/admin/subjects/${subjectId}/chapters/${chapter.chapterId}/edit`);
                    }}
                  >
                    <Pencil size={14} /> Sửa
                  </button>
                  <button
                    type="button"
                    className="adm2-text-btn is-danger"
                    disabled={isMutating || isOrdering}
                    aria-label={`Xóa ${chapter.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingChapter(chapter);
                    }}
                  >
                    <Trash2 size={14} /> Xóa
                  </button>
                  <div className="chapter-arrow" aria-hidden="true">
                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="chapter-expanded-content">
                  {/* Kỹ năng của chương */}
                  <div className="chapter-skills-management">
                    <div className="theory-header adm2-chapter-panel-head">
                      <div className="adm2-chapter-panel-head-text">
                        <h4>Kỹ năng của chương ({chapter.skills?.length || 0})</h4>
                        <span className="adm2-chapter-panel-skills">
                          Kỹ năng cần đạt (θ raw) để mở khóa chương tiếp theo
                        </span>
                      </div>
                    </div>

                    {chapter.skills?.length > 0 ? (
                      <div className="chapter-skills-badge-list">
                        {chapter.skills.map((skill) => {
                          const raw = Number(skill.requiredTheta ?? 0);
                          return (
                            <span className="chapter-skill-tag" key={skill.skillId}>
                              <Brain size={13} className="chapter-skill-tag__icon" />
                              <strong className="chapter-skill-tag__name">{skill.name}</strong>
                              <span
                                className="chapter-skill-tag__theta"
                                title="Điểm năng lực raw yêu cầu"
                              >
                                ≥ {raw} raw (≈ {formatScaledThetaValue(raw)})
                              </span>
                              <button
                                type="button"
                                className="chapter-skill-tag__remove"
                                title={`Gỡ kỹ năng "${skill.name}" khỏi chương`}
                                aria-label={`Gỡ kỹ năng "${skill.name}" khỏi chương`}
                                disabled={isMutating}
                                onClick={() => handleRemoveSkillFromChapter(chapter, skill)}
                              >
                                <X size={12} />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="chapter-skills-empty">
                        <span>Chương này chưa được gán kỹ năng nào.</span>
                      </div>
                    )}
                  </div>

                  <div className="theory-management">
                    <div className="theory-header adm2-chapter-panel-head">
                      <div className="adm2-chapter-panel-head-text">
                        <span className="adm2-chip adm2-chip--emerald">Chương {index + 1}</span>
                        {chapterSkillNames && (
                          <span className="adm2-chapter-panel-skills">Kỹ năng: {chapterSkillNames}</span>
                        )}
                      </div>

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
                              <div className="adm2-theory-row-head">
                                <span className="theory-item-label">
                                  Lý thuyết {String(theoryIndex + 1).padStart(2, "0")}
                                </span>
                                <span className="adm2-badge adm2-badge--info">Rich text</span>
                              </div>
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

                          </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="question-management adm2-panel-footer">
                    <span className="adm2-panel-footer-count">
                      {questionCountByChapter[chapter.chapterId] || 0} câu hỏi trong chương
                    </span>
                    <button
                      type="button"
                      className="adm2-link-arrow"
                      onClick={() =>
                        navigate(
                          `/admin/subjects/${subjectId}/chapters/${chapter.chapterId}/questions`,
                        )
                      }
                    >
                      <FileText size={14} />
                      Quản lý câu hỏi <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      </AdminPageState>

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
        message="Bạn có muốn xóa chương này không? Dữ liệu liên quan (lý thuyết, câu hỏi, đề thi) sẽ không còn truy cập được. Hành động này không thể hoàn tác."
        itemName={deletingChapter?.name}
        onConfirm={handleDeleteChapter}
      />


    </>
  );
}
