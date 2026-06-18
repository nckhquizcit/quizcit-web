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

export default function AdminSubjects() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [openAddSubject, setOpenAddSubject] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [deletingSubject, setDeletingSubject] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [chapterCountBySubject, setChapterCountBySubject] = useState({});

  useEffect(() => {
    const load = async () => {
      const data = (await getSubjects()) || [];
      setSubjects(data);
      const chapterEntries = await Promise.all(
        data.map(async (subject) => [
          subject.subjectId,
          ((await getChaptersBySubject(subject.subjectId)) || []).length,
        ]),
      );
      setChapterCountBySubject(Object.fromEntries(chapterEntries));
    };
    load();
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

  const handleUpdateSubject = async (payload) => {
    await updateSubject(editingSubject.subjectId, payload);
    setSubjects((current) =>
      current.map((s) =>
        s.subjectId === editingSubject.subjectId ? { ...s, ...payload } : s,
      ),
    );
    setEditingSubject(null);
  };

  const handleDeleteSubject = async () => {
    await deleteSubject(deletingSubject.subjectId);
    setSubjects((current) =>
      current.filter((s) => s.subjectId !== deletingSubject.subjectId),
    );
    setDeletingSubject(null);
  };

  return (
    <>
      {/* ===== HEADER ===== */}
      <AdminPageHeader
        breadcrumb={["Tổng quan", "Môn học"]}
        title="Quản lý môn học"
        subtitle="Quản lý danh sách môn học và chương học"
        action={
          <button className="add-btn" onClick={() => setOpenAddSubject(true)}>
            <Plus size={18} />
            Thêm môn học
          </button>
        }
      />

      {/* ===== SEARCH ===== */}
      <SearchBar placeholder="Tìm kiếm môn học..." onChange={setSearch} />

      {/* ===== SUBJECT GRID ===== */}
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
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingSubject(subject);
                }}
              >
                <Pencil size={16} />
              </button>
              <button
                className="icon-btn danger"
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

      {/* ===== MODALS ===== */}
      <AddSubjectModal
        open={openAddSubject}
        onClose={() => setOpenAddSubject(false)}
        onSubmit={async (payload) => {
          const created = await createSubject(payload);
          setSubjects((current) => [created, ...current]);
          setOpenAddSubject(false);
        }}
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