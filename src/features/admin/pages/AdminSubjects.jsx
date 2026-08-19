import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Plus, BookOpen, Check, GripVertical, ListOrdered, Pencil, Trash2, X } from "lucide-react";

import "../Admin.css";
import AdminPageHeader from "../components/AdminPageHeader";
import SearchBar from "../components/SearchBar";
import AddSubjectModal from "../components/modals/AddSubjectModal";
import ConfirmDeleteModal from "../components/modals/ConfirmDeleteModal";
import EmptyState from "../../../components/ui/EmptyState/EmptyState";
import { createSubject, deleteSubject, getAllChapters, getSubjects, reorderSubjects } from "../../../services/contentService";
import { getErrorMessage } from "../../../services/apiClient";
import { resolveImageUrl } from "../../../services/mappers";
import { reorderById } from "../utils/displayOrder";

export default function AdminSubjects() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [openAddSubject, setOpenAddSubject] = useState(false);
  const [deletingSubject, setDeletingSubject] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [chapterCountBySubject, setChapterCountBySubject] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [pendingAction, setPendingAction] = useState("");
  const [draggedSubjectId, setDraggedSubjectId] = useState(null);
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderSnapshot, setOrderSnapshot] = useState([]);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        setLoading(true);
        setLoadError("");
        const [data = [], chapters = []] = await Promise.all([getSubjects(), getAllChapters()]);
        const chapterEntries = data.map((subject) => [subject.subjectId,
          chapters.filter((chapter) => chapter.subjectId === subject.subjectId).length]);

        if (!alive) return;
        setSubjects(data);
        setChapterCountBySubject(Object.fromEntries(chapterEntries));
      } catch (error) {
        if (alive) {
          setLoadError(getErrorMessage(error, "Không thể tải danh sách môn học."));
        }
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();

    return () => {
      alive = false;
    };
  }, []);

  const filteredSubjects = useMemo(
    () =>
      subjects.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.courseCode.toLowerCase().includes(search.toLowerCase()),
      ),
    [search, subjects],
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

  const handleCreateSubject = async (payload) => {
    await runAction("create-subject", async () => {
      const created = await createSubject(payload);
      setSubjects((current) => [...current, created].sort((a, b) => a.displayOrder - b.displayOrder));
      setChapterCountBySubject((current) => ({
        ...current,
        [created.subjectId]: 0,
      }));
      setOpenAddSubject(false);
    });
  };

  const handleDeleteSubject = async () => {
    if (!deletingSubject) return;

    // Delete failures are shown inside ConfirmDeleteModal, so skip the
    // page-level actionError and let the error propagate to the modal.
    setPendingAction("delete-subject");
    try {
      await deleteSubject(deletingSubject.subjectId);
      setSubjects((current) =>
        current.filter((s) => s.subjectId !== deletingSubject.subjectId),
      );
      setChapterCountBySubject((current) => {
        const next = { ...current };
        delete next[deletingSubject.subjectId];
        return next;
      });
      setDeletingSubject(null);
    } finally {
      setPendingAction("");
    }
  };

  const isMutating = Boolean(pendingAction);

  const handleSubjectDrop = (event, targetSubjectId) => {
    event.preventDefault();
    if (!isOrdering || !draggedSubjectId || draggedSubjectId === targetSubjectId || isMutating) return;
    setSubjects((current) => reorderById(current, draggedSubjectId, targetSubjectId, (item) => item.subjectId));
    setDraggedSubjectId(null);
  };

  const startOrdering = () => {
    setOrderSnapshot(subjects);
    setIsOrdering(true);
  };

  const cancelOrdering = () => {
    setSubjects(orderSnapshot);
    setIsOrdering(false);
    setDraggedSubjectId(null);
  };

  const saveOrdering = async () => {
    try {
      await runAction("reorder-subjects", () => reorderSubjects(subjects));
      setIsOrdering(false);
      setOrderSnapshot([]);
    } catch {
      setSubjects(orderSnapshot);
    }
  };

  return (
    <>
      {/* ===== HEADER ===== */}
      <AdminPageHeader
        breadcrumb={["Tổng quan", "Môn học"]}
        title="Quản lý môn học"
        subtitle="Quản lý danh sách môn, thứ tự và cấu trúc chương."
        action={<div className="display-order-actions">
          {isOrdering ? <>
            <button className="cancel-btn" onClick={cancelOrdering} disabled={isMutating}><X size={17} /> Hủy</button>
            <button className="add-btn" onClick={saveOrdering} disabled={isMutating}><Check size={17} /> Lưu thứ tự</button>
          </> : <button className="cancel-btn" onClick={startOrdering} disabled={loading || isMutating || !subjects.length}><ListOrdered size={17} /> Chỉnh thứ tự</button>}
          <button className="add-btn" onClick={() => setOpenAddSubject(true)} disabled={loading || isMutating || isOrdering}>
            <Plus size={18} />
            Thêm môn
          </button>
        </div>}
      />

      {/* ===== SEARCH ===== */}
      <SearchBar
        placeholder="Tìm kiếm tên hoặc mã môn..."
        value={search}
        onChange={setSearch}
        right={
          !loading && !loadError ? (
            <span className="adm2-count-pill">{filteredSubjects.length} môn</span>
          ) : null
        }
      />

      {loading && <div className="admin-page-state">Đang tải danh sách môn học...</div>}
      {loadError && <div className="admin-page-state error">{loadError}</div>}
      {actionError && <div className="admin-page-state error">{actionError}</div>}
      {!loading && !loadError && filteredSubjects.length === 0 && (
        subjects.length > 0 ? (
          <EmptyState
            icon={<BookOpen size={28} />}
            title="Không tìm thấy môn học phù hợp"
            description="Thử từ khóa khác hoặc kiểm tra lại chính tả."
          />
        ) : (
          <EmptyState
            icon={<BookOpen size={28} />}
            title="Chưa có môn học"
            description="Thêm môn học mới để bắt đầu xây dựng nội dung."
          />
        )
      )}

      {/* ===== SUBJECT GRID ===== */}
      {!loading && !loadError && filteredSubjects.length > 0 && (
      <div className="subject-grid">
        {filteredSubjects.map((subject) => {
          const isVisible = subject.visible !== false;
          return (
          <div
            key={subject.subjectId}
            className="subject-card adm2-card"
            draggable={isOrdering && !isMutating}
            onDragStart={(event) => {
              setDraggedSubjectId(subject.subjectId);
              event.dataTransfer.effectAllowed = "move";
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => handleSubjectDrop(event, subject.subjectId)}
            onDragEnd={() => setDraggedSubjectId(null)}
            data-dragging={draggedSubjectId === subject.subjectId || undefined}
            role={isOrdering ? undefined : "button"}
            tabIndex={isOrdering ? undefined : 0}
            onClick={() => !isOrdering && navigate(`/admin/subjects/${subject.subjectId}/chapters`)}
            onKeyDown={(event) => {
              // Only react when the card itself is focused, not inner buttons.
              if (isOrdering || event.target !== event.currentTarget) return;
              if (event.key !== "Enter" && event.key !== " ") return;
              if (event.key === " ") event.preventDefault();
              navigate(`/admin/subjects/${subject.subjectId}/chapters`);
            }}
          >
            {isOrdering && <span className="display-order-drag-handle" title="Kéo để đổi thứ tự" aria-label="Kéo để đổi thứ tự"><GripVertical size={17} /></span>}

            {subject.imageUrl ? (
              <div className="adm2-subject-card-cover">
                <img
                  src={resolveImageUrl(subject.imageUrl)}
                  alt={subject.name}
                  className="adm2-subject-card-cover-img"
                  loading="lazy"
                />
              </div>
            ) : null}

            <div className="adm2-subject-card-head">
              <div className="adm2-icon-square" title={subject.courseCode}>{subject.courseCode}</div>
              <div className="adm2-subject-card-headtext">
                <div className="subject-title">{subject.name}</div>
                <div className="subject-code">{subject.courseCode}</div>
              </div>
              <span className={`adm2-badge ${isVisible ? "adm2-badge--emerald" : "adm2-badge--gray"}`}>
                {isVisible ? "Hiển thị" : "Đang ẩn"}
              </span>
            </div>

            <div className="subject-desc">{subject.description}</div>

            <div className="adm2-divider" />

            <div className="adm2-subject-card-meta">
              {chapterCountBySubject[subject.subjectId] || 0} chương
            </div>

            <div className="adm2-card-footer">
              <div className="adm2-card-footer-actions">
                <button
                  type="button"
                  className="adm2-text-btn"
                  disabled={isMutating || isOrdering}
                  aria-label={`Chỉnh sửa ${subject.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/admin/subjects/${subject.subjectId}/edit`);
                  }}
                >
                  <Pencil size={14} /> Sửa
                </button>
                <button
                  type="button"
                  className="adm2-text-btn is-danger"
                  disabled={isMutating || isOrdering}
                  aria-label={`Xóa ${subject.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingSubject(subject);
                  }}
                >
                  <Trash2 size={14} /> Xóa
                </button>
              </div>
              <button
                type="button"
                className="adm2-link-arrow"
                disabled={isOrdering}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/admin/subjects/${subject.subjectId}/chapters`);
                }}
              >
                Mở chương <ChevronRight size={14} />
              </button>
            </div>
          </div>
          );
        })}
      </div>
      )}

      {/* ===== MODALS ===== */}
      <AddSubjectModal
        open={openAddSubject}
        onClose={() => setOpenAddSubject(false)}
        onSubmit={handleCreateSubject}
      />


      <ConfirmDeleteModal
        open={Boolean(deletingSubject)}
        onClose={() => setDeletingSubject(null)}
        title="Xóa môn học"
        message="Bạn có muốn xóa môn học này không? Dữ liệu liên quan (chương, lý thuyết, câu hỏi, đề thi) sẽ không còn truy cập được. Hành động này không thể hoàn tác."
        itemName={deletingSubject?.name}
        onConfirm={handleDeleteSubject}
      />
    </>
  );
}
