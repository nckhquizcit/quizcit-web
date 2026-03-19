import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { BookOpen, Plus } from "lucide-react";
import AddChapterModal from "../components/modals/AddChapterModal";
import AdminPageHeader from "../components/AdminPageHeader";
import SearchBar from "../components/SearchBar";

import { subjects, chapters, questions } from "../../../mock/mockData";

export default function AdminChapters() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [openAddChapter, setOpenAddChapter] = useState(false);
  // FIX
  const subject = subjects.find((s) => s.id === subjectId);

  const subjectChapters = chapters.filter((c) => c.subjectId === subjectId);

  const filteredChapters = subjectChapters.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  if (!subject) return <div>Không tìm thấy môn</div>;

  return (
    <>
      <AdminPageHeader
        breadcrumb={["Tổng quan", "Môn học", subject.name]}
        title={subject.name}
        subtitle={`Mã môn: ${subject.code} • ${subjectChapters.length} chương`}
        icon={<BookOpen size={22} />}
        onBack={() => navigate("/admin/subjects")}
        action={
          <button className="add-btn" onClick={() => setOpenAddChapter(true)}>
            <Plus size={18} />
            Thêm chương
          </button>
        }
      />

      <SearchBar placeholder="Tìm kiếm chương..." onChange={setSearch} />

      <div className="chapter-list">
        {filteredChapters.map((chapter, index) => {
          const totalQuestions = questions.filter(
            (q) => q.chapterId === chapter.id, // FIX
          ).length;

          return (
            <div
              key={chapter.id} // FIX
              className="chapter-card"
              onClick={() =>
                navigate(
                  `/admin/subjects/${subjectId}/chapters/${chapter.id}/questions`,
                )
              }
            >
              <div className="chapter-left">
                <div className="chapter-index">{index + 1}</div>

                <div>
                  <div className="chapter-title">{chapter.name}</div>
                  <div className="chapter-sub">{totalQuestions} câu hỏi</div>
                </div>
              </div>

              <div className="chapter-arrow">›</div>
            </div>
          );
        })}
      </div>
      <AddChapterModal
        open={openAddChapter}
        onClose={() => setOpenAddChapter(false)}
        subject={subject}
      />
    </>
  );
}
