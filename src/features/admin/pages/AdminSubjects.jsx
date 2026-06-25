import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, BookOpen, Pencil, Trash2 } from "lucide-react";

import "../Admin.css";
import AdminPageHeader from "../components/AdminPageHeader";
import SearchBar from "../components/SearchBar";
import AddSubjectModal from "../components/modals/AddSubjectModal";
import EditSubjectModal from "../components/modals/EditSubjectModal";
import ConfirmDeleteModal from "../components/modals/ConfirmDeleteModal";
import { createSubject, updateSubject, deleteSubject, getChaptersBySubject, getSubjects } from "../../../services/contentService";
import { getErrorMessage } from "../../../services/apiClient";

export default function AdminSubjects() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [openAddSubject, setOpenAddSubject] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [deletingSubject, setDeletingSubject] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [chapterCountBySubject, setChapterCountBySubject] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [pendingAction, setPendingAction] = useState("");

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        setLoading(true);
        setLoadError("");
        const data = (await getSubjects()) || [];
        const chapterEntries = await Promise.all(
          data.map(async (subject) => [
            subject.subjectId,
            ((await getChaptersBySubject(subject.subjectId)) || []).length,
          ]),
        );

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
      setSubjects((current) => [created, ...current]);
      setChapterCountBySubject((current) => ({
        ...current,
        [created.subjectId]: 0,
      }));
      setOpenAddSubject(false);
    });
  };

  const handleUpdateSubject = async (payload) => {
    if (!editingSubject) return;

    await runAction("update-subject", async () => {
      await updateSubject(editingSubject.subjectId, payload);
      setSubjects((current) =>
        current.map((s) =>
          s.subjectId === editingSubject.subjectId ? { ...s, ...payload } : s,
        ),
      );
      setEditingSubject(null);
    });
  };

  const handleDeleteSubject = async () => {
    if (!deletingSubject) return;

    await runAction("delete-subject", async () => {
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
    });
  };

  const isMutating = Boolean(pendingAction);

  return (
    <>
      {/* ===== HEADER ===== */}
      <AdminPageHeader
        breadcrumb={["Tổng quan", "Môn học"]}
        title="Quản lý môn học"
        subtitle="Quản lý danh sách môn học và chương học"
        action={
          <button className="add-btn" onClick={() => setOpenAddSubject(true)} disabled={loading || isMutating}>
            <Plus size={18} />
            Thêm môn học
          </button>
        }
      />

      {/* ===== SEARCH ===== */}
      <SearchBar placeholder="Tìm kiếm môn học..." onChange={setSearch} />

      {loading && <div className="admin-page-state">Đang tải danh sách môn học...</div>}
      {loadError && <div className="admin-page-state error">{loadError}</div>}
      {actionError && <div className="admin-page-state error">{actionError}</div>}
      {!loading && !loadError && filteredSubjects.length === 0 && (
        <div className="admin-page-state">Chưa có môn học nào.</div>
      )}

      {/* ===== SUBJECT GRID ===== */}
      {!loading && !loadError && filteredSubjects.length > 0 && (
      <div className="subject-grid">
        {filteredSubjects.map((subject) => (
          <div
            key={subject.subjectId}
            className="subject-card"
            onClick={() => navigate(`/admin/subjects/${subject.subjectId}/chapters`)}
          >
            <div className="subject-card-actions">
              <button
                className="icon-btn"
                disabled={isMutating}
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingSubject(subject);
                }}
              >
                <Pencil size={16} />
              </button>
              <button
                className="icon-btn danger"
                disabled={isMutating}
                onClick={(e) => {
                  e.stopPropagation();
                  setDeletingSubject(subject);
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="header-icon">
              <BookOpen size={22} />
            </div>

            <div className="subject-title">{subject.name}</div>

            <div className="subject-code">Mã môn: {subject.courseCode}</div>

            <div className="subject-desc">{subject.description}</div>

            <div className="subject-footer">
              <span>
                {chapterCountBySubject[subject.subjectId] || 0}{" "}
                chương
              </span>
              <span>›</span>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* ===== MODALS ===== */}
      <AddSubjectModal
        open={openAddSubject}
        onClose={() => setOpenAddSubject(false)}
        onSubmit={handleCreateSubject}
      />

      <EditSubjectModal
        open={Boolean(editingSubject)}
        onClose={() => setEditingSubject(null)}
        subject={editingSubject}
        onSubmit={handleUpdateSubject}
      />

      <ConfirmDeleteModal
        open={Boolean(deletingSubject)}
        onClose={() => setDeletingSubject(null)}
        title="Xóa môn học"
        message="Bạn có muốn xóa môn học này không? Tất cả chương, lý thuyết, câu hỏi và đề thi liên quan cũng sẽ bị xóa."
        itemName={deletingSubject?.name}
        onConfirm={handleDeleteSubject}
      />
    </>
  );
}
