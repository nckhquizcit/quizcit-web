import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, BookOpen } from "lucide-react";

import "../Admin.css";
import AdminPageHeader from "../components/AdminPageHeader";
import SearchBar from "../components/SearchBar";
import AddSubjectModal from "../components/modals/AddSubjectModal";
import { createSubject, getChaptersBySubject, getSubjects } from "../../../services/contentService";

export default function AdminSubjects() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [openAddSubject, setOpenAddSubject] = useState(false);
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

      {/* ===== MODAL ===== */}
      <AddSubjectModal
        open={openAddSubject}
        onClose={() => setOpenAddSubject(false)}
        onSubmit={async (payload) => {
          const created = await createSubject(payload);
          setSubjects((current) => [created, ...current]);
          setOpenAddSubject(false);
        }}
      />
    </>
  );
}
