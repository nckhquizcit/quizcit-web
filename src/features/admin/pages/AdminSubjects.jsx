import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, BookOpen } from "lucide-react";

import "../Admin.css";
import AdminPageHeader from "../components/AdminPageHeader";
import SearchBar from "../components/SearchBar";
import AddSubjectModal from "../components/modals/AddSubjectModal";

import { subjects, chapters } from "../../../mock/mockData";

export default function AdminSubjects() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [openAddSubject, setOpenAddSubject] = useState(false);

  const filteredSubjects = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase()),
  );

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
            key={subject.id}
            className="subject-card"
            onClick={() => navigate(`/admin/subjects/${subject.id}/chapters`)}
          >
            <div className="header-icon">
              <BookOpen size={22} />
            </div>

            <div className="subject-title">{subject.name}</div>

            <div className="subject-code">Mã môn: {subject.code}</div>

            <div className="subject-desc">{subject.description}</div>

            <div className="subject-footer">
              <span>
                {chapters.filter((c) => c.subjectId === subject.id).length}{" "}
                chương
              </span>
              <span>›</span>
            </div>
          </div>
        ))}
      </div>

      {/* ===== MODAL ===== */}
      <AddSubjectModal
        open={openAddSubject}
        onClose={() => setOpenAddSubject(false)}
      />
    </>
  );
}
